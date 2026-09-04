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
console.log(`\n${ok + (memeEvt?1:0)} / ${cas.length + 1} vérifications passées`);
process.exit(ok === cas.length && memeEvt ? 0 : 1);
