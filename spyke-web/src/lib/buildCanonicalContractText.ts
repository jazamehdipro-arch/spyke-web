import { CANONICAL_CONTRACT_TEXT_TEMPLATE } from '@/lib/canonicalContractText'

function formatDateFr(d: string) {
  const s = String(d || '').trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return s
}

function extractNumberLike(s: string): number {
  const raw = String(s || '').trim()
  if (!raw) return 0
  // Keep digits, dot, comma, minus
  const cleaned = raw.replace(/[^0-9,.-]/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export function buildCanonicalContractText(input: {
  contractNumber?: string
  seller?: { name?: string; siret?: string; address?: string; activity?: string; email?: string }
  buyer?: { name?: string; representant?: string; address?: string }
  mission?: { startDate?: string; endDate?: string; description?: string; deliverables?: string; revisions?: string }
  pricing?: { amount?: string }
  paymentSchedule?: string // '30'|'50'|'fin'|'tiers'|'perso'
  paymentDelay?: string // '30'|'45'|'60'|...
  ipClause?: string // 'cession'|'licence'|'totale'
  confidentiality?: string // 'oui'|'non'
  termination?: string // '15'|'30'|'sans'
}): string {
  const TEMPLATE = CANONICAL_CONTRACT_TEXT_TEMPLATE

  const seller = input.seller || {}
  const buyer = input.buyer || {}
  const mission = input.mission || {}
  const pricing = input.pricing || {}

  const sellerCivility = 'Madame/Monsieur'
  const sellerFull = String(seller.name || '').trim()
  const buyerFull = String(buyer.name || '').trim()

  const deliveries = String(mission.deliverables || '')
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)

  const prestation1 = deliveries[0] || 'Description de la prestation 1'
  const prestation2 = deliveries[1] || 'Description de la prestation 2'
  const prestation3 = deliveries[2] || 'Description de la prestation 3'

  const revisions = (() => {
    const r = String(mission.revisions || '').trim()
    if (r === '2') return '2'
    if (r === '3') return '3'
    if (r === '5') return '5'
    if (r === 'illimite') return 'un nombre illimité de'
    return r || '2'
  })()

  const amountHt = (() => {
    const amt = extractNumberLike(String(pricing.amount || ''))
    return Number.isFinite(amt) ? amt.toFixed(2) : ''
  })()

  const ps = String(input.paymentSchedule || '').trim()
  const acomptePct = ps === '50' ? 50 : ps === 'fin' ? 100 : ps === '30' ? 30 : ps === 'tiers' ? 33 : 30
  const soldePct = Math.max(0, 100 - acomptePct)

  const acompteAmount = amountHt ? (Number(amountHt) * (acomptePct / 100)).toFixed(2) : ''
  const soldeAmount = amountHt ? (Number(amountHt) * (soldePct / 100)).toFixed(2) : ''

  const start = String(mission.startDate || '').trim()
  const end = String(mission.endDate || '').trim()
  const acompteDate = formatDateFr(start) || start
  const soldeDate = formatDateFr(end) || end

  const paymentDelayLabel = (() => {
    const d = String(input.paymentDelay || '').trim()
    if (d === '30') return '30 JOURS'
    if (d === '45') return '45 JOURS'
    if (d === '60') return '60 JOURS'
    return '30 JOURS'
  })()

  const ipLabel = (() => {
    const ip = String(input.ipClause || '').trim()
    if (ip === 'licence') return "LICENCE D'UTILISATION"
    if (ip === 'totale') return 'CESSION TOTALE'
    return 'CESSION APRÈS PAIEMENT'
  })()

  const confidentialityLabel = String(input.confidentiality || '').trim() === 'oui' ? 'OUI' : 'NON'

  const terminationLabel = (() => {
    const t = String(input.termination || '').trim()
    if (t === '30') return '30 JOURS'
    return '15 JOURS'
  })()

  const missionDesc = String(mission.description || '').trim()

  const replacements: Record<string, string> = {
    '[NUMÉRO DU CONTRAT]': String(input.contractNumber || '').trim(),
    '[Madame/Monsieur]': sellerCivility,
    '[PRÉNOM NOM]': sellerFull,
    '[NUMÉRO SIRET]': String(seller.siret || '').trim(),
    '[ADRESSE\nPRESTATAIRE]': String(seller.address || '').trim(),

    // Client company/legal fields are not collected yet in SEO; keep them blank to avoid inconsistencies.
    '[Forme sociale (SARL, SAS, etc.)]': '',
    'capital de [MONTANT] euros': 'capital de euros',
    '[VILLE RCS]': '',
    '[NUMÉRO RCS]': '',
    '[ADRESSE CLIENT]': String(buyer.address || '').trim(),
    '[Madame/Monsieur PRÉNOM NOM]': String(buyer.representant || buyerFull || '').trim(),
    '[FONCTION]': '',

    // Price section
    'invariablement à [MONTANT] € HT': `invariablement à ${amountHt} € HT`,
    '[PRIX EN LETTRES]': '',

    '[DÉCRIRE LE PROJET DU CLIENT]': missionDesc || 'le projet du client',
    "[DÉCRIRE L'OBJECTIF DE LA MISSION]": missionDesc || "décrire l'objectif de la mission",

    '[DATE DÉBUT]': formatDateFr(start) || start,
    '[DATE FIN]': formatDateFr(end) || end,

    '[Description de la prestation 1]': prestation1,
    '[Description de la prestation 2]': prestation2,
    '[Description de la prestation 3]': prestation3,
    '[NOMBRE]': revisions,

    // Interlocuteurs
    'Nom : [NOM]': `Nom : ${sellerFull}`,
    'Fonction : [FONCTION]': `Fonction : ${String(seller.activity || '').trim()}`,
    'Téléphone : [NUMÉRO]': 'Téléphone : ',
    'Email : [EMAIL]': `Email : ${String(seller.email || '').trim()}`,

    // Calendar (keep as-is for now)
    '[LIVRABLE 1]': deliveries[0] || 'Livrable 1',
    '[LIVRABLE 2]': deliveries[1] || 'Livrable 2',
    '[LIVRABLE 3]': deliveries[2] || 'Livrable 3',
    '[LIVRAISON FINALE]': deliveries[0] || 'Livraison finale',
    '[DATE]': formatDateFr(end) || end,
    '[Email / Drive / GitHub...]': 'Email',

    // Modalités de paiement
    'Acompte [%] [MONTANT] € [DATE]': `Acompte ${acomptePct}% ${acompteAmount} € ${acompteDate}`,
    'Solde [%] [MONTANT] € [DATE]': `Solde ${soldePct}% ${soldeAmount} € ${soldeDate}`,

    '[30\nJOURS / 45 JOURS / 60 JOURS]': paymentDelayLabel,
    "[CESSION APRÈS PAIEMENT / LICENCE D'UTILISATION / CESSION TOTALE]": ipLabel,
    '[OUI / NON]': confidentialityLabel,

    // Article 7 + 8 durations requested: set hard 8 months
    '[2 ANS / 5 ANS]': '8 mois',
    '[DURÉE]': '8 mois',

    '[15 JOURS / 30 JOURS]': terminationLabel,
    '[VILLE DU\nTRIBUNAL]': '',

    '[NOM PRESTATAIRE]': sellerFull,
    '[NOM CLIENT]': buyerFull,
  }

  let out = TEMPLATE
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(k).join(String(v ?? ''))
  }

  out = out.replace(/\[[^\]\n\r]{1,80}\]/g, '')

  const rawLines = out.split(/\n/)
  const cleanedLines: string[] = []

  for (let i = 0; i < rawLines.length; i++) {
    let line = String(rawLines[i] || '')
    line = line.replace(/\s{2,}/g, ' ')

    if (/^\s*(Téléphone\s*:|Email\s*:|Adresse de facturation\s*:)\s*$/.test(line.trim())) continue
    if (line.includes('au RCS de') && line.replace(/\s/g, '').includes('auRCSdesouslenuméro')) continue

    line = line.replace(/par\s*,/g, '')
    line = line.replace(/qualité de\s*,/g, 'qualité de ')

    line = line.replace(/\s+,/g, ',')
    line = line.replace(/,\s*\./g, '.')

    cleanedLines.push(line.trimEnd())
  }

  let finalOut = cleanedLines.join('\n')
  finalOut = finalOut.replace(/\n{3,}/g, '\n\n')
  finalOut = finalOut.replace(/tribunaux compétents de\s+/gi, 'tribunaux compétents ')

  return finalOut
}
