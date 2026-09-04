import { createHmac } from 'node:crypto';

// --- copie exacte de la logique de route.ts ---
const b64url = (buf) => buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decodeB64url = (s) => {
  const p = s.replace(/-/g,'+').replace(/_/g,'/');
  return Buffer.from(p + '='.repeat((4 - (p.length % 4)) % 4), 'base64').toString('utf8');
};
const memeChaine = (a,b) => {
  if (a.length !== b.length) return false;
  let d = 0; for (let i=0;i<a.length;i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};
function verifierSignature(entete, cle, jeton, hoteAttendu = 'www.spykeapp.fr') {
  if (!entete) return { ok:false, raison:'signature absente' };
  const parts = entete.split('.');
  if (parts.length !== 3) return { ok:false, raison:'signature mal formée' };
  const [h,p,sig] = parts;
  let algo;
  try { algo = String(JSON.parse(decodeB64url(h)).alg ?? ''); }
  catch { return { ok:false, raison:'en-tête de signature illisible' }; }
  if (algo !== 'HS512') return { ok:false, raison:`algorithme inattendu : ${algo}` };
  const attendue = b64url(createHmac('sha512', cle).update(`${h}.${p}`).digest());
  if (!memeChaine(attendue, sig)) return { ok:false, raison:'signature invalide' };
  let claims;
  try { claims = JSON.parse(decodeB64url(p)); }
  catch { return { ok:false, raison:'charge de signature illisible' }; }
  const enveloppe = claims.payload && typeof claims.payload === 'object';
  const evenement = enveloppe ? claims.payload : claims;
  if (!enveloppe && !(claims.resource && claims.event))
    return { ok:false, raison:'message absent de la signature' };
  if (claims.url !== undefined) {
    try {
      const u = new URL(String(claims.url));
      if (u.host.toLowerCase() !== hoteAttendu.toLowerCase())
        return { ok:false, raison:'domaine signé étranger' };
      if (u.pathname !== `/api/prospection/telephonie/${jeton}`)
        return { ok:false, raison:'adresse signée étrangère' };
    } catch { return { ok:false, raison:'adresse signée illisible' }; }
  }
  return { ok:true, evenement };
}

// --- fabrique un JWT comme Ringover ---
const CLE = 'd2bd70845eb8a612c64e3ff812b22e5ab3325bdb';
const JETON = 'monJetonSecret123';
function forger(claims, cle = CLE, alg = 'HS512') {
  const h = b64url(Buffer.from(JSON.stringify({ typ:'JWT', alg })));
  const p = b64url(Buffer.from(JSON.stringify(claims)));
  const s = b64url(createHmac(alg === 'HS512' ? 'sha512' : 'sha256', cle).update(`${h}.${p}`).digest());
  return `${h}.${p}.${s}`;
}
const evt = { event:'hangup', resource:'call', data:{ call_id:'123', direction:'outbound', to_number:'33612345678', duration_in_seconds:83 } };
const bonneUrl = `https://www.spykeapp.fr/api/prospection/telephonie/${JETON}`;

const cas = [
  ['message authentique',            forger({ url:bonneUrl, payload:evt }), CLE, true],
  ['mauvaise clé',                   forger({ url:bonneUrl, payload:evt }, 'mauvaise-cle'), CLE, false],
  ['adresse signée étrangère',       forger({ url:'https://ailleurs.fr/api/prospection/telephonie/'+JETON, payload:evt }), CLE, false],
  ['jeton différent dans l\'adresse', forger({ url:`https://www.spykeapp.fr/api/prospection/telephonie/autre`, payload:evt }), CLE, false],
  ['algorithme rétrogradé (HS256)',  forger({ url:bonneUrl, payload:evt }, CLE, 'HS256'), CLE, false],
  ['message absent',                 forger({ url:bonneUrl }), CLE, false],
  ['signature tronquée',             forger({ url:bonneUrl, payload:evt }).slice(0,-4), CLE, false],
  ['deux parties seulement',         'aaa.bbb', CLE, false],
  ['sous-domaine voisin',            forger({ url:`https://evil.spykeapp.fr.attaquant.fr/api/prospection/telephonie/${JETON}`, payload:evt }), CLE, false],
  ['adresse sans domaine',           forger({ url:`/api/prospection/telephonie/${JETON}`, payload:evt }), CLE, false],
  ['forme à plat documentée',        forger({ ...evt, timestamp:1, attempt:1 }), CLE, true],
  ['forme à plat, mauvaise clé',     forger({ ...evt, timestamp:1 }, 'autre-cle'), CLE, false],
  ['charge vide',                    forger({ timestamp:1 }), CLE, false],
  ['en-tête absent',                 undefined, CLE, false],
];

let ok = 0;
for (const [nom, entete, cle, attendu] of cas) {
  const r = verifierSignature(entete, cle, JETON);
  const bon = r.ok === attendu;
  if (bon) ok++;
  console.log(`${bon ? 'ok  ' : 'ÉCHEC'}  ${nom.padEnd(34)} ${r.ok ? 'acceptée' : 'refusée : ' + r.raison}`);
}
// Le message signé doit bien ressortir tel quel.
const r = verifierSignature(forger({ url:bonneUrl, payload:evt }), CLE, JETON);
const memeEvt = r.ok && JSON.stringify(r.evenement) === JSON.stringify(evt);
console.log(`${memeEvt ? 'ok  ' : 'ÉCHEC'}  ${'le message signé est restitué'.padEnd(34)}`);
console.log(`\n${ok + (memeEvt?1:0)} / ${cas.length + 1} vérifications V1 passées`);
const v1Ok = ok === cas.length && memeEvt;

/* ------------------------------------------------------------------ V3 ---
   Copie exacte de verifierV3(). Le message signé est la concaténation, sans
   séparateur, de la méthode, de l'adresse, du corps brut et de l'horodatage —
   d'après l'exemple de leur documentation. */
const FRAICHEUR_MAX = 5 * 60;

function verifierV3(corpsBrut, adresse, horodatage, signature, cle) {
  const t = Number(horodatage);
  if (!Number.isFinite(t)) return { ok:false, raison:'horodatage illisible' };
  if (Math.abs(Date.now() / 1000 - t) > FRAICHEUR_MAX) return { ok:false, raison:'message trop ancien' };
  const aSigner = `POST${adresse}${corpsBrut}${horodatage}`;
  const attendue = createHmac('sha256', cle).update(aSigner).digest('base64');
  if (!memeChaine(attendue, signature.trim())) return { ok:false, raison:'signature V3 invalide' };
  let evenement;
  try { evenement = JSON.parse(corpsBrut); } catch { return { ok:false, raison:'corps illisible' }; }
  if (!evenement.resource || !evenement.event) return { ok:false, raison:'message incomplet' };
  return { ok:true, evenement };
}

console.log('\n--- signature V3 ---');
const URL_HOOK = `https://www.spykeapp.fr/api/prospection/telephonie/${JETON}`;
const CORPS = JSON.stringify({ event:'hangup', resource:'call', data:{ call_id:'9', to_number:'33612345678', duration_in_seconds:12, direction:'outbound' } });
const TS = String(Math.floor(Date.now() / 1000));
const signer = (corps, adresse, ts, cle = CLE) =>
  createHmac('sha256', cle).update(`POST${adresse}${corps}${ts}`).digest('base64');

/* D'abord : l'exemple de leur documentation, reproduit tel quel. Il ne vérifie
   pas une signature mais la construction du message — la seule chose qu'on
   pouvait se tromper. */
const exempleAttendu = 'POSThttps://api.example.com/webhooks/call{"event":"ringing","resource":"call","timestamp":1554823493.762305,"data":{...}}1554823493';
const exempleObtenu = `POST${'https://api.example.com/webhooks/call'}${'{"event":"ringing","resource":"call","timestamp":1554823493.762305,"data":{...}}'}${'1554823493'}`;
console.log((exempleObtenu === exempleAttendu ? 'ok  ' : 'ÉCHEC') + '  message construit comme dans leur exemple');

const casV3 = [
  ['message authentique',        CORPS, URL_HOOK, TS, signer(CORPS, URL_HOOK, TS), CLE, true],
  ['mauvaise clé',               CORPS, URL_HOOK, TS, signer(CORPS, URL_HOOK, TS, 'autre'), CLE, false],
  ['corps modifié après coup',   CORPS.replace('12', '999'), URL_HOOK, TS, signer(CORPS, URL_HOOK, TS), CLE, false],
  ['adresse différente',         CORPS, 'https://ailleurs.fr/x', TS, signer(CORPS, URL_HOOK, TS), CLE, false],
  ['rejeu d\'un vieux message',  CORPS, URL_HOOK, String(Number(TS) - 3600), signer(CORPS, URL_HOOK, String(Number(TS) - 3600)), CLE, false],
  ['horodatage absurde',         CORPS, URL_HOOK, 'hier', 'x', CLE, false],
];
let okV3 = exempleObtenu === exempleAttendu ? 1 : 0;
for (const [nom, corps, adresse, ts, sig, cle, attendu] of casV3) {
  const r = verifierV3(corps, adresse, ts, sig, cle);
  const bon = r.ok === attendu;
  if (bon) okV3++;
  console.log(`${bon ? 'ok  ' : 'ÉCHEC'}  ${nom.padEnd(34)} ${r.ok ? 'acceptée' : 'refusée : ' + r.raison}`);
}
console.log(`\n${okV3} / ${casV3.length + 1} vérifications V3 passées`);
process.exit(v1Ok && okV3 === casV3.length + 1 ? 0 : 1);
