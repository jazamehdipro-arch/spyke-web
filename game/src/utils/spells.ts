import { Spell, SpellId, SpellLoadout, CreatureType } from '../types'

export const SPELL_CATALOG: Record<SpellId, Spell> = {
  // ── Salamandre (ignis) ──────────────────────────────────
  frappe_ardente:    { id: 'frappe_ardente',    name: 'Frappe ardente',      emoji: '🔥',   energyCost: 1, cooldown: 0,
    description: '8 dégâts + 1 braise (max 3)',
    scaledDesc: () => `8 dégâts + 1 braise (max 3)` },

  explosion:         { id: 'explosion',          name: 'Explosion',           emoji: '💥',   energyCost: 4, cooldown: 0,
    description: '20 dégâts, 30 dégâts dès 2 braises',
    scaledDesc: () => `20 dégâts, 30 dégâts dès 2 braises` },

  carapace_chauffee: { id: 'carapace_chauffee',  name: 'Carapace',            emoji: '🛡️',   energyCost: 0, cooldown: 2,
    description: 'Bloque tout, renvoie 50% et gagne 1 braise' },

  provocation:       { id: 'provocation',        name: 'Provocation',         emoji: '😤',   energyCost: 1, cooldown: 0,
    description: 'Ennemi : +30% dégâts reçus prochain tour' },

  immolation:        { id: 'immolation',         name: 'Immolation',          emoji: '🩸',   energyCost: 2, cooldown: 0,
    description: '-5 PV sur soi → 20 dégâts garantis',
    scaledDesc: () => `-5 PV sur soi → 20 dégâts garantis` },

  brasier:           { id: 'brasier',            name: 'Brasier',             emoji: '🌋',   energyCost: 4, cooldown: 0,
    description: '27 dégâts + brûlure 3 tours (4/tour)',
    scaledDesc: (m) => `${Math.round(15*m)} dégâts + brûlure 3 tours (4/tour)` },

  fournaise:         { id: 'fournaise',          name: 'Fournaise',           emoji: '🌪️🔥', energyCost: 3, cooldown: 2,
    description: '~30 dégâts + 1 braise garantie',
    scaledDesc: (m) => `${Math.round(11.3*m)} dégâts + 1 braise` },

  // ── Axolotl (nemo) ─────────────────────────────────────
  vague:             { id: 'vague',              name: 'Vague',               emoji: '🌊',   energyCost: 1, cooldown: 0,
    description: '7 dégâts directs',
    scaledDesc: (m) => `${Math.round(7*m)} dégâts directs` },

  siphon:            { id: 'siphon',             name: 'Siphon',              emoji: '💧',   energyCost: 2, cooldown: 0,
    description: '10 dégâts + vol de vie (+2 PV)',
    scaledDesc: () => `10 dégâts + vol de vie (+2 PV)` },

  regeneration:      { id: 'regeneration',       name: 'Régénération',        emoji: '💚',   energyCost: 2, cooldown: 0,
    description: '+8 PV, +12 PV sous 25 PV' },

  barriere:          { id: 'barriere',           name: 'Barrière',            emoji: '🔷',   energyCost: 0, cooldown: 3,
    description: '-50% dégâts reçus pendant 2 tours' },

  malediction:       { id: 'malediction',        name: 'Malédiction',         emoji: '🔮',   energyCost: 3, cooldown: 0,
    description: 'Bloque le sort le + coûteux ennemi 1 tour' },

  raz_de_maree:      { id: 'raz_de_maree',       name: 'Raz-de-marée',        emoji: '🌊💥', energyCost: 3, cooldown: 0,
    description: '20 dégâts (nuke pur)',
    scaledDesc: () => `20 dégâts` },

  maree_curative:    { id: 'maree_curative',     name: 'Marée curative',      emoji: '🌊💚', energyCost: 3, cooldown: 3,
    description: '~20 dégâts + soin +8 PV',
    scaledDesc: (m) => `${Math.round(13.3*m)} dégâts + soin +8 PV` },

  abysse:            { id: 'abysse',             name: 'Abysse',              emoji: '🌑🌊', energyCost: 4, cooldown: 3,
    description: '~30 dégâts + -25% dégâts reçus 1 tour',
    scaledDesc: (m) => `${Math.round(17*m)} dégâts + -25% dégâts reçus 1 tour` },

  // ── Panda (sylva) ───────────────────────────────────────
  coup_voile:        { id: 'coup_voile',         name: 'Coup voilé',          emoji: '👊',   energyCost: 1, cooldown: 0,
    description: '7 dégâts + -15% précision ennemie 2 tours',
    scaledDesc: () => `7 dégâts + -15% précision ennemie 2 tours` },

  ecran_fumee:       { id: 'ecran_fumee',        name: 'Écran de fumée',      emoji: '💨',   energyCost: 1, cooldown: 3,
    description: 'Cache action+énergie ce tour' },

  volute:            { id: 'volute',             name: 'Volute',              emoji: '🌀',   energyCost: 0, cooldown: 2,
    description: '+20% esquive pendant 3 tours' },

  dissipation:       { id: 'dissipation',        name: 'Dissipation',         emoji: '✨',   energyCost: 0, cooldown: 2,
    description: 'Retire un statut négatif sur soi' },

  embuscade:         { id: 'embuscade',          name: 'Embuscade',           emoji: '🗡️',   energyCost: 2, cooldown: 0,
    description: '14 dégâts, 25 si ennemi a raté',
    scaledDesc: () => `14 dégâts, 25 si ennemi a raté` },

  brouillard_total:  { id: 'brouillard_total',   name: 'Brouillard total',    emoji: '🌫️',   energyCost: 3, cooldown: 3,
    description: 'Masque les infos du panda 3 tours' },

  laceration_voilee: { id: 'laceration_voilee',  name: 'Lacération voilée',   emoji: '🗡️💨', energyCost: 2, cooldown: 2,
    description: '~15 dégâts + brouillage ennemi 2 tours',
    scaledDesc: (m) => `${Math.round(8.3*m)} dégâts + brouillage ennemi 2 tours` },

  embuscade_parfaite:{ id: 'embuscade_parfaite', name: 'Embuscade parfaite',  emoji: '🎯🗡️', energyCost: 3, cooldown: 3,
    description: '~22 dégâts — ignore esquive si Volute active',
    scaledDesc: (m) => `${Math.round(10.3*m)} dégâts (ignore esquive si Volute active)` },

  // ── Faon (zapp) ─────────────────────────────────────────
  decharge:          { id: 'decharge',           name: 'Décharge',            emoji: '⚡',   energyCost: 1, cooldown: 0,
    description: '10 dégâts — priorité',
    scaledDesc: () => `10 dégâts — priorité` },

  arc_paralysant:    { id: 'arc_paralysant',     name: 'Arc paralysant',      emoji: '🎯',   energyCost: 2, cooldown: 0,
    description: '15 dégâts + 30% paralysie 1 tour',
    scaledDesc: () => `15 dégâts + 30% paralysie 1 tour` },

  boost:             { id: 'boost',              name: 'Boost',               emoji: '⬆️',   energyCost: 2, cooldown: 0,
    description: 'Le prochain dégât du faon est augmenté de 50%' },

  esquive_vive:      { id: 'esquive_vive',       name: 'Esquive vive',        emoji: '💨⚡', energyCost: 0, cooldown: 3,
    description: 'Esquive garantie du prochain coup' },

  rafale:            { id: 'rafale',             name: 'Rafale',              emoji: '⚡⚡', energyCost: 3, cooldown: 0,
    description: '2 coups rapides (3 à E3)',
    scaledDesc: (m) => `2×${Math.round(4*m)} dégâts (3× à E3)` },

  surcharge:         { id: 'surcharge',          name: 'Surcharge',           emoji: '🔋',   energyCost: 3, cooldown: 0,
    description: '22 dégâts — surfatigue prochain tour',
    scaledDesc: () => `22 dégâts — surfatigue prochain tour` },

  tempete:           { id: 'tempete',            name: 'Tempête',             emoji: '⛈️',   energyCost: 4, cooldown: 0,
    description: '4×9 dégâts',
    scaledDesc: (m) => `4×${Math.round(6*m)} dégâts` },

  fulguration:       { id: 'fulguration',        name: 'Fulguration',         emoji: '⚡🎯', energyCost: 2, cooldown: 3,
    description: '~16 dégâts — priorité + 20% paralysie',
    scaledDesc: (m) => `${Math.round(7*m)} dégâts — priorité + 20% paralysie` },
}

export type EvoStage = 'e1' | 'e2' | 'e3'

export function getEvoStage(level: number): EvoStage {
  if (level >= 20) return 'e3'
  if (level >= 10) return 'e2'
  return 'e1'
}

export function getPassiveLevel(level: number): 1 | 2 | 3 {
  if (level >= 20) return 3
  if (level >= 10) return 2
  return 1
}

export const DEFAULT_LOADOUTS: Record<CreatureType, Record<EvoStage, SpellLoadout>> = {
  ignis: {
    e1:   ['frappe_ardente', 'immolation',  'carapace_chauffee', 'explosion'],
    e2:   ['frappe_ardente', 'immolation',  'carapace_chauffee', 'brasier'],
    e3:   ['frappe_ardente', 'fournaise',   'carapace_chauffee', 'immolation'],
  },
  nemo: {
    e1:   ['raz_de_maree', 'siphon', 'regeneration',   'malediction'],
    e2:   ['raz_de_maree', 'siphon', 'maree_curative', 'malediction'],
    e3:   ['raz_de_maree', 'abysse', 'regeneration',   'malediction'],
  },
  sylva: {
    e1:   ['coup_voile', 'embuscade',           'volute', 'brouillard_total'],
    e2:   ['coup_voile', 'laceration_voilee',   'volute', 'brouillard_total'],
    e3:   ['coup_voile', 'embuscade_parfaite',  'volute', 'brouillard_total'],
  },
  zapp: {
    e1:   ['decharge', 'arc_paralysant', 'boost',   'surcharge'],
    e2:   ['decharge', 'arc_paralysant', 'tempete', 'surcharge'],
    e3:   ['decharge', 'fulguration',    'tempete',  'surcharge'],
  },
}

export function getLoadout(type: CreatureType, level: number, override?: SpellLoadout): SpellLoadout {
  if (override) return override
  return DEFAULT_LOADOUTS[type][getEvoStage(level)]
}

export const ALL_SPELLS_BY_TYPE: Record<CreatureType, Record<EvoStage, SpellId[]>> = {
  ignis: {
    e1:   ['frappe_ardente', 'immolation', 'carapace_chauffee', 'explosion'],
    e2:   ['frappe_ardente', 'immolation', 'carapace_chauffee', 'explosion', 'brasier'],
    e3:   ['frappe_ardente', 'immolation', 'carapace_chauffee', 'explosion', 'brasier', 'fournaise'],
  },
  nemo: {
    e1:   ['raz_de_maree', 'siphon', 'regeneration', 'malediction'],
    e2:   ['raz_de_maree', 'siphon', 'regeneration', 'malediction', 'maree_curative'],
    e3:   ['raz_de_maree', 'siphon', 'regeneration', 'malediction', 'maree_curative', 'abysse'],
  },
  sylva: {
    e1:   ['coup_voile', 'embuscade', 'volute', 'brouillard_total'],
    e2:   ['coup_voile', 'embuscade', 'volute', 'brouillard_total', 'laceration_voilee'],
    e3:   ['coup_voile', 'embuscade', 'volute', 'brouillard_total', 'laceration_voilee', 'embuscade_parfaite'],
  },
  zapp: {
    e1:   ['decharge', 'arc_paralysant', 'boost', 'surcharge'],
    e2:   ['decharge', 'arc_paralysant', 'boost', 'rafale', 'surcharge', 'tempete'],
    e3:   ['decharge', 'arc_paralysant', 'boost', 'rafale', 'surcharge', 'tempete', 'fulguration'],
  },
}
