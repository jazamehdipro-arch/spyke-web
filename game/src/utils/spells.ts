import { Spell, SpellId, SpellLoadout, CreatureType } from '../types'

export const SPELL_CATALOG: Record<SpellId, Spell> = {
  // Salamandre (ignis)
  frappe_ardente:    { id: 'frappe_ardente',    name: 'Frappe ardente',   emoji: '🔥',   energyCost: 1, cooldown: 0, description: 'Dégâts + 1 braise bonus' },
  explosion:         { id: 'explosion',          name: 'Explosion',        emoji: '💥',   energyCost: 3, cooldown: 0, description: 'Consomme les braises — burst massif' },
  carapace_chauffee: { id: 'carapace_chauffee',  name: 'Carapace',         emoji: '🛡️',   energyCost: 0, cooldown: 2, description: 'Défense + renvoie 30% dégâts reçus' },
  provocation:       { id: 'provocation',        name: 'Provocation',      emoji: '😤',   energyCost: 1, cooldown: 0, description: 'Ennemi : +30% dégâts reçus ce tour' },
  immolation:        { id: 'immolation',         name: 'Immolation',       emoji: '🩸',   energyCost: 2, cooldown: 0, description: '-10 PV sur soi → 20 dégâts garantis' },
  brasier:           { id: 'brasier',            name: 'Brasier',          emoji: '🌋',   energyCost: 4, cooldown: 0, description: '15 dégâts + brûlure 3 tours (4/tour)' },

  // Axolotl (nemo)
  vague:             { id: 'vague',              name: 'Vague',            emoji: '🌊',   energyCost: 1, cooldown: 0, description: 'Dégâts directs' },
  siphon:            { id: 'siphon',             name: 'Siphon',           emoji: '💧',   energyCost: 2, cooldown: 2, description: "Vole de l'énergie ennemie" },
  regeneration:      { id: 'regeneration',       name: 'Régénération',     emoji: '💚',   energyCost: 2, cooldown: 0, description: '+10 PV' },
  barriere:          { id: 'barriere',           name: 'Barrière',         emoji: '🔷',   energyCost: 0, cooldown: 3, description: '-50% dégâts reçus pendant 2 tours' },
  malediction:       { id: 'malediction',        name: 'Malédiction',      emoji: '🔮',   energyCost: 3, cooldown: 0, description: 'Bloque le sort le + coûteux ennemi 2 tours' },
  raz_de_maree:      { id: 'raz_de_maree',       name: 'Raz-de-marée',     emoji: '🌊💥', energyCost: 4, cooldown: 0, description: '15 dégâts + vol 2 énergie' },

  // Panda (sylva)
  coup_voile:        { id: 'coup_voile',         name: 'Coup voilé',       emoji: '👊',   energyCost: 1, cooldown: 0, description: 'Dégâts + 20% brouillage ennemi' },
  ecran_fumee:       { id: 'ecran_fumee',        name: 'Écran de fumée',   emoji: '💨',   energyCost: 1, cooldown: 3, description: 'Cache action+énergie ce tour' },
  volute:            { id: 'volute',             name: 'Volute',           emoji: '🌀',   energyCost: 0, cooldown: 3, description: '+15% esquive pendant 3 tours' },
  dissipation:       { id: 'dissipation',        name: 'Dissipation',      emoji: '✨',   energyCost: 0, cooldown: 2, description: 'Retire un statut négatif sur soi' },
  embuscade:         { id: 'embuscade',          name: 'Embuscade',        emoji: '🗡️',   energyCost: 2, cooldown: 0, description: '15 dégâts si ennemi a raté ce tour' },
  brouillard_total:  { id: 'brouillard_total',   name: 'Brouillard total', emoji: '🌫️',   energyCost: 3, cooldown: 0, description: 'Masque toute info ennemie 2 tours' },

  // Faon (zapp)
  decharge:          { id: 'decharge',           name: 'Décharge',         emoji: '⚡',   energyCost: 1, cooldown: 0, description: 'Dégâts rapides — priorité' },
  arc_paralysant:    { id: 'arc_paralysant',     name: 'Arc paralysant',   emoji: '🎯',   energyCost: 2, cooldown: 4, description: '40% chance de paralyser 1 tour' },
  esquive_vive:      { id: 'esquive_vive',       name: 'Esquive vive',     emoji: '💨⚡', energyCost: 0, cooldown: 3, description: 'Esquive garantie du prochain coup' },
  rafale:            { id: 'rafale',             name: 'Rafale',           emoji: '⚡⚡', energyCost: 2, cooldown: 0, description: '2×4 dégâts (3×4 à évo max)' },
  surcharge:         { id: 'surcharge',          name: 'Surcharge',        emoji: '🔋',   energyCost: 3, cooldown: 0, description: '12 dégâts — épuisement prochain tour' },
  tempete:           { id: 'tempete',            name: 'Tempête',          emoji: '⛈️',   energyCost: 4, cooldown: 0, description: '4×5 dégâts' },
}

export type EvoStage = 'base' | 'e2' | 'e3'

export function getEvoStage(level: number): EvoStage {
  if (level >= 20) return 'e3'
  if (level >= 10) return 'e2'
  return 'base'
}

export function getPassiveLevel(level: number): 1 | 2 | 3 {
  if (level >= 20) return 3
  if (level >= 10) return 2
  return 1
}

export const DEFAULT_LOADOUTS: Record<CreatureType, Record<EvoStage, SpellLoadout>> = {
  ignis: {
    base: ['frappe_ardente', 'explosion',  'carapace_chauffee', 'provocation'],
    e2:   ['frappe_ardente', 'explosion',  'carapace_chauffee', 'immolation'],
    e3:   ['frappe_ardente', 'brasier',    'carapace_chauffee', 'immolation'],
  },
  nemo: {
    base: ['vague', 'siphon', 'regeneration', 'barriere'],
    e2:   ['vague', 'siphon', 'regeneration', 'malediction'],
    e3:   ['raz_de_maree', 'siphon', 'regeneration', 'malediction'],
  },
  sylva: {
    base: ['coup_voile', 'ecran_fumee', 'volute', 'dissipation'],
    e2:   ['coup_voile', 'ecran_fumee', 'volute', 'embuscade'],
    e3:   ['coup_voile', 'brouillard_total', 'volute', 'embuscade'],
  },
  zapp: {
    base: ['decharge', 'arc_paralysant', 'esquive_vive', 'rafale'],
    e2:   ['decharge', 'arc_paralysant', 'esquive_vive', 'surcharge'],
    e3:   ['decharge', 'arc_paralysant', 'tempete',      'surcharge'],
  },
}

export function getLoadout(type: CreatureType, level: number, override?: SpellLoadout): SpellLoadout {
  if (override) return override
  return DEFAULT_LOADOUTS[type][getEvoStage(level)]
}

// Spells available at evo stage (for swap UI later)
export const ALL_SPELLS_BY_TYPE: Record<CreatureType, Record<EvoStage, SpellId[]>> = {
  ignis: {
    base: ['frappe_ardente', 'explosion', 'carapace_chauffee', 'provocation'],
    e2:   ['frappe_ardente', 'explosion', 'carapace_chauffee', 'provocation', 'immolation'],
    e3:   ['frappe_ardente', 'explosion', 'carapace_chauffee', 'provocation', 'immolation', 'brasier'],
  },
  nemo: {
    base: ['vague', 'siphon', 'regeneration', 'barriere'],
    e2:   ['vague', 'siphon', 'regeneration', 'barriere', 'malediction'],
    e3:   ['vague', 'siphon', 'regeneration', 'barriere', 'malediction', 'raz_de_maree'],
  },
  sylva: {
    base: ['coup_voile', 'ecran_fumee', 'volute', 'dissipation'],
    e2:   ['coup_voile', 'ecran_fumee', 'volute', 'dissipation', 'embuscade'],
    e3:   ['coup_voile', 'ecran_fumee', 'volute', 'dissipation', 'embuscade', 'brouillard_total'],
  },
  zapp: {
    base: ['decharge', 'arc_paralysant', 'esquive_vive', 'rafale'],
    e2:   ['decharge', 'arc_paralysant', 'esquive_vive', 'rafale', 'surcharge'],
    e3:   ['decharge', 'arc_paralysant', 'esquive_vive', 'rafale', 'surcharge', 'tempete'],
  },
}
