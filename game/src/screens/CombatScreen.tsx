import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  Creature,
  CreatureType,
  FormeLevel,
  PersonalityTrait,
  SpellId,
  SpellLoadout,
  StatusEffect,
  StatusType,
  TrainingStats,
} from '../types'
import { CREATURE_COLORS, getFormeLevel } from '../utils/creature'
import { hasTrait } from '../utils/traits'
import {
  SPELL_CATALOG,
  getLoadout,
  getPassiveLevel,
} from '../utils/spells'
import { retro, retroShadow } from '../styles/retro'

// ─── arena backgrounds ───────────────────────────────────
// ─── sprites ────────────────────────────────────────────
const SPRITES: Record<string, ImageSourcePropType> = {
  ignis_action: require('../../assets/sprites/ignis_e1_clean.png'),
  nemo_action:  require('../../assets/sprites/nemo_e1_clean.png'),
  sylva_action: require('../../assets/sprites/sylva_e1_clean.png'),
  zapp_action:  require('../../assets/sprites/zapp_e1_clean.png'),
  ignis_e2: require('../../assets/sprites/ignis_e2_f1.png'),
  nemo_e2:  require('../../assets/sprites/nemo_e2_f1.png'),
  sylva_e2: require('../../assets/sprites/sylva_e2_f1.png'),
  zapp_e2:  require('../../assets/sprites/zapp_e2_f1.png'),
  ignis_e3: require('../../assets/sprites/ignis_e3_f1.png'),
  nemo_e3:  require('../../assets/sprites/nemo_e3_f1.png'),
  sylva_e3: require('../../assets/sprites/sylva_e3_f1.png'),
  zapp_e3:  require('../../assets/sprites/zapp_e3_f1.png'),
}

function spriteKey(type: CreatureType, level: number) {
  if (level >= 20) return `${type}_e3`
  if (level >= 10) return `${type}_e2`
  return `${type}_action`
}

// ─── creature profiles ───────────────────────────────────
const CREATURE_PROFILES: Record<CreatureType, {
  hpMult: number
  baseDamageMult: number
  startEnergy: number
  dodgeBase: number
}> = {
  ignis: { hpMult: 0.85, baseDamageMult: 1.16, startEnergy: 0, dodgeBase: 0.0  },
  nemo:  { hpMult: 1.15, baseDamageMult: 0.77, startEnergy: 0, dodgeBase: 0.0  },
  sylva: { hpMult: 1.0,  baseDamageMult: 0.93, startEnergy: 0, dodgeBase: 0.17 },
  zapp:  { hpMult: 0.9,  baseDamageMult: 1.0,  startEnergy: 0, dodgeBase: 0.0  },
}

// ─── counter triangle ────────────────────────────────────
const COUNTER_TABLE: Record<CreatureType, CreatureType> = {
  ignis: 'nemo',
  nemo:  'sylva',
  sylva: 'zapp',
  zapp:  'ignis',
}

// ─── types ──────────────────────────────────────────────
type CombatAction =
  | { kind: 'spell'; spellId: SpellId }
  | { kind: 'charge' }
  | { kind: 'defend' }

type CombatPhase = 'intro' | 'choosing' | 'resolving' | 'finished'

interface Combatant {
  hp: number
  energy: number
  cooldowns: Partial<Record<SpellId, number>>
  statuses: StatusEffect[]
  embers: number   // ignis seulement
}

interface CombatModifiers {
  maxEnergy: number
  damageMult: number
  timerReduction: number
  timerBonus: number
  activeFoodBuff: boolean
  hideOpponentEnergy: boolean
  dodgeChance: number
  timideChance: number
  sickDot: number
  hpMult: number
  counterBonus: number
  trainingDmgReduction: number
  trainingHpBonus: number
}

const DAMAGE_FLOOR = 0.55
const GLOBAL_DMG_BOOST = 1.4

function computeModifiers(creature: Creature, opponentType: CreatureType): CombatModifiers {
  const { hunger, happiness, energy, isSick } = creature.stats
  const traits: PersonalityTrait[] | undefined = creature.traits
  const profile = CREATURE_PROFILES[creature.type]

  let maxEnergy = 5
  if (energy < 30) maxEnergy = 2
  else if (energy < 60) maxEnergy = 3

  const FORME_MULT: Record<FormeLevel, number> = {
    excellente: 1.05,
    bonne:      1.0,
    correcte:   0.90,
    mauvaise:   0.55,
  }
  let damageMult = FORME_MULT[getFormeLevel(creature.stats)]

  if (hasTrait(traits, 'courageux')) damageMult *= 1.2

  damageMult = Math.max(DAMAGE_FLOOR, damageMult)

  const training: TrainingStats = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
  damageMult *= (1 + training.strength * 0.008)
  const trainingMaxEnergy = Math.floor(training.endurance / 9)
  maxEnergy = maxEnergy + trainingMaxEnergy
  const trainingDodge = training.defense * 0.0065
  const trainingDmgReduction = Math.min(0.14, training.reflexes * 0.007)
  const trainingHpBonus = Math.round(training.endurance * 0.35)

  const now = new Date().toISOString()
  const activeFoodBuff = !!(creature.activeCombatBuff && creature.activeCombatBuff.expiresAt > now)
  if (activeFoodBuff) {
    damageMult *= creature.activeCombatBuff!.damageMult
  }

  damageMult *= profile.baseDamageMult
  // Level scaling (même courbe que les PV) + boost global pour équilibrer la durée des combats
  damageMult *= GLOBAL_DMG_BOOST * (1 + 0.03 * (creature.stats.level - 1))

  const timerBonus = 0
  const timerReduction = happiness < 60 ? 1 : 0
  const hideOpponentEnergy = happiness < 30

  const dodgeChance = Math.min(0.55, profile.dodgeBase + (hasTrait(traits, 'chanceux') ? 0.15 : 0) + trainingDodge)
  const timideChance = hasTrait(traits, 'timide') ? 0.25 : 0
  const sickDot = isSick ? 3 : 0
  const hpMult = isSick ? 0.75 : 1.0

  const counterBonus = COUNTER_TABLE[creature.type] === opponentType ? 1.15 : 1.0

  return { maxEnergy, damageMult, timerReduction, timerBonus, activeFoodBuff, hideOpponentEnergy, dodgeChance, timideChance, sickDot, hpMult, counterBonus, trainingDmgReduction, trainingHpBonus }
}

function computeDisplayMult(type: CreatureType, level: number): number {
  const profile = CREATURE_PROFILES[type]
  return profile.baseDamageMult * GLOBAL_DMG_BOOST * (1 + 0.03 * (level - 1))
}

const OPPONENT_MAX_ENERGY = 5
const TIMER_SECONDS = 10
const BASE_HP = 68
const E1_BASE_HP: Record<CreatureType, number> = {
  ignis: 63,
  nemo: 75,
  sylva: 68,
  zapp: 63,
}

function calcHP(level: number, hpMult = 1.0, creatureType?: CreatureType) {
  if (creatureType && level < 10) return Math.round(E1_BASE_HP[creatureType] * hpMult)
  const typeMult = creatureType ? CREATURE_PROFILES[creatureType].hpMult : 1.0
  return Math.round((BASE_HP + (level - 1) * 2) * hpMult * typeMult)
}

// ─── status helpers ──────────────────────────────────────
function hasStatus(c: Combatant, t: StatusType): boolean {
  return c.statuses.some(s => s.type === t && s.turnsLeft > 0)
}

function getStatus(c: Combatant, t: StatusType): StatusEffect | undefined {
  return c.statuses.find(s => s.type === t && s.turnsLeft > 0)
}

function addStatus(c: Combatant, s: StatusEffect): Combatant {
  // Replace if same type exists
  const filtered = c.statuses.filter(ex => ex.type !== s.type)
  return { ...c, statuses: [...filtered, s] }
}

function removeStatus(c: Combatant, t: StatusType): Combatant {
  return { ...c, statuses: c.statuses.filter(s => s.type !== t) }
}

function tickStatuses(c: Combatant): Combatant {
  const statuses = c.statuses
    .map(s => ({ ...s, turnsLeft: s.turnsLeft - 1 }))
    .filter(s => s.turnsLeft > 0)
  return { ...c, statuses }
}

function tickCooldowns(cd: Partial<Record<SpellId, number>>): Partial<Record<SpellId, number>> {
  const result: Partial<Record<SpellId, number>> = {}
  for (const key of Object.keys(cd) as SpellId[]) {
    const v = (cd[key] ?? 0) - 1
    if (v > 0) result[key] = v
  }
  return result
}

// ─── spell resolve ───────────────────────────────────────
interface SpellResolveResult {
  casterHpDelta: number
  casterEnergyDelta: number
  casterStatusesToAdd: StatusEffect[]
  casterStatusesToRemove: StatusType[]
  newCasterEmbers?: number
  targetHpDelta: number
  targetEnergyDelta: number
  targetStatusesToAdd: StatusEffect[]
  targetStatusesToRemove: StatusType[]
  log: string
}

function targetMostExpensiveSpell(target: Combatant, loadout: SpellLoadout): string {
  let best: SpellId = loadout[0]
  let bestCost = 0
  for (const spellId of loadout) {
    const spell = SPELL_CATALOG[spellId]
    if (spell.energyCost > bestCost && !(target.cooldowns[spellId] && (target.cooldowns[spellId] ?? 0) > 0)) {
      bestCost = spell.energyCost
      best = spellId
    }
  }
  return best
}

function resolveSpell(
  spellId: SpellId,
  caster: Combatant,
  target: Combatant,
  _casterType: CreatureType,
  _targetType: CreatureType,
  passiveLevel: 1 | 2 | 3,
  opponentMissedThisTurn: boolean,
  targetLoadout?: SpellLoadout,
): SpellResolveResult {
  const empty: SpellResolveResult = {
    casterHpDelta: 0,
    casterEnergyDelta: 0,
    casterStatusesToAdd: [],
    casterStatusesToRemove: [],
    newCasterEmbers: undefined,
    targetHpDelta: 0,
    targetEnergyDelta: 0,
    targetStatusesToAdd: [],
    targetStatusesToRemove: [],
    log: '',
  }

  switch (spellId) {
    // ── ignis ──
    case 'frappe_ardente': {
      const newEmbers = Math.min(3, caster.embers + 1)
      // Passive E1: 2 braises boost Explosion; later stages keep the 3-braise rule.
      const braiseBonus = caster.embers === 3
      const base = passiveLevel === 1 ? 8 : 7
      const raw = braiseBonus ? Math.round(base * 1.5) : base
      return {
        ...empty,
        targetHpDelta: -raw,
        newCasterEmbers: braiseBonus ? 0 : newEmbers,
        log: `🔥 Frappe ardente ! -${raw} HP. Braises: ${braiseBonus ? 0 : newEmbers}${braiseBonus ? ' (×1.5 braises !)' : ''}`,
      }
    }
    case 'explosion': {
      const embers = caster.embers
      const braiseBonus = passiveLevel === 1 ? embers >= 2 : embers >= 3
      const base = passiveLevel === 1 ? 20 : 9.9
      const raw = braiseBonus ? Math.round(base * 1.5) : base
      const dmg = Math.round(raw)
      return {
        ...empty,
        targetHpDelta: -dmg,
        newCasterEmbers: 0,
        log: `💥 Explosion ! -${dmg} HP${braiseBonus ? ' (×1.5 braises !)' : ''}`,
      }
    }
    case 'carapace_chauffee': {
      const newEmbers = Math.min(3, caster.embers + 1)
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'barrier', turnsLeft: 1, value: passiveLevel === 1 ? 100 : 30, data: 'reflect' }],
        newCasterEmbers: passiveLevel === 1 ? newEmbers : undefined,
        log: '🛡️ Carapace chauffée ! +barrière réfléchissante',
      }
    }
    case 'provocation': {
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'provoked', turnsLeft: 2, value: 30 }],
        log: '😤 Provocation ! Ennemi +30% dégâts reçus prochain tour',
      }
    }
    case 'immolation': {
      // Guaranteed — dodge/barrier skipped in commitAction for this spell
      const braiseBonus = caster.embers === 3
      const base = passiveLevel === 1 ? 20 : 11
      const raw = braiseBonus ? Math.round(base * 1.5) : base
      return {
        ...empty,
        casterHpDelta: passiveLevel === 1 ? -5 : -8,
        targetHpDelta: -raw,
        newCasterEmbers: braiseBonus ? 0 : undefined,
        log: `🩸 Immolation ! -${passiveLevel === 1 ? 5 : 8} PV sur soi → -${raw} HP ennemi (garanti)${braiseBonus ? ' (×1.5 braises !)' : ''}`,
      }
    }
    case 'brasier': {
      const braiseBonus = caster.embers === 3
      const raw = braiseBonus ? Math.round(15 * 1.5) : 15
      return {
        ...empty,
        targetHpDelta: -raw,
        targetStatusesToAdd: [{ type: 'burn', turnsLeft: 3, value: 4 }],
        newCasterEmbers: braiseBonus ? 0 : undefined,
        log: `🌋 Brasier ! -${raw} HP + brûlure 3 tours${braiseBonus ? ' (×1.5 braises !)' : ''}`,
      }
    }
    case 'fournaise': {
      const braiseBonus = caster.embers === 3
      const raw = braiseBonus ? Math.round(11.3 * 1.5) : Math.round(11.3)
      const newEmbers = Math.min(3, caster.embers + 1)
      return {
        ...empty,
        targetHpDelta: -raw,
        newCasterEmbers: braiseBonus ? 0 : newEmbers,
        log: `🌪️🔥 Fournaise ! -${raw} HP + 1 braise${braiseBonus ? ' (×1.5 braises !)' : ''}`,
      }
    }

    // ── nemo ──
    case 'vague': {
      return {
        ...empty,
        targetHpDelta: -7,
        log: '🌊 Vague ! -7 HP',
      }
    }
    case 'siphon': {
      // Life steal: always heal +4, +2 bonus if low HP (sustain passive)
      const lowHp = caster.hp < 25
      const heal = passiveLevel === 1 ? 2 : (lowHp ? 6 : 4)
      const dmg = passiveLevel === 1 ? 10 : 6
      return {
        ...empty,
        casterHpDelta: heal,
        targetHpDelta: -dmg,
        log: `💧 Siphon ! -${dmg} HP + vol de vie (+${heal} PV)${lowHp && passiveLevel !== 1 ? ' (sustain !)' : ''}`,
      }
    }
    case 'regeneration': {
      const lowHp = caster.hp < 25
      const heal = passiveLevel === 1 ? (lowHp ? 12 : 8) : (lowHp ? 18 : 14)
      return {
        ...empty,
        casterHpDelta: heal,
        log: `💚 Régénération ! +${heal} PV${lowHp ? ' (sustain !)' : ''}`,
      }
    }
    case 'barriere': {
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'barrier', turnsLeft: 2, value: 50 }],
        log: '🔷 Barrière ! -50% dégâts reçus 2 tours',
      }
    }
    case 'malediction': {
      const blocked = targetLoadout
        ? targetMostExpensiveSpell(target, targetLoadout)
        : 'raz_de_maree'
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'cursed', turnsLeft: passiveLevel === 1 ? 1 : 2, data: blocked }],
        log: `🔮 Malédiction ! Sort ${SPELL_CATALOG[blocked as SpellId]?.name ?? blocked} bloqué ${passiveLevel === 1 ? 1 : 2} tour(s)`,
      }
    }
    case 'raz_de_maree': {
      return {
        ...empty,
        targetHpDelta: passiveLevel === 1 ? -20 : -16,
        log: `🌊💥 Raz-de-marée ! -${passiveLevel === 1 ? 20 : 16} HP`,
      }
    }
    case 'maree_curative': {
      const lowHp = caster.hp < 25
      const heal = lowHp ? 11 : 8
      return {
        ...empty,
        casterHpDelta: heal,
        targetHpDelta: -Math.round(13.3),
        log: `🌊💚 Marée curative ! -13 HP ennemi + soin +${heal} PV${lowHp ? ' (sustain !)' : ''}`,
      }
    }
    case 'abysse': {
      return {
        ...empty,
        targetHpDelta: -17,
        casterStatusesToAdd: [{ type: 'barrier', turnsLeft: 2, value: 25 }],
        log: '🌑🌊 Abysse ! -17 HP + -25% dégâts reçus 1 tour',
      }
    }

    // ── sylva ──
    case 'coup_voile': {
      const fogStatus: StatusEffect[] = passiveLevel === 1
        ? [{ type: 'fog', turnsLeft: 2, value: 15, data: 'accuracy_down' }]
        : (Math.random() < 0.2 ? [{ type: 'fog', turnsLeft: 2 }] : [])
      return {
        ...empty,
        targetHpDelta: passiveLevel === 1 ? -7 : -Math.round(6.2),
        targetStatusesToAdd: fogStatus,
        log: `👊 Coup voilé ! -${passiveLevel === 1 ? 7 : 6} HP${fogStatus.length ? ' + brouillage ennemi !' : ''}`,
      }
    }
    case 'laceration_voilee': {
      return {
        ...empty,
        targetHpDelta: -Math.round(8.3),
        targetStatusesToAdd: [{ type: 'fog', turnsLeft: 2 }],
        log: '🗡️💨 Lacération voilée ! -8 HP + brouillage ennemi 2 tours',
      }
    }
    case 'embuscade_parfaite': {
      // Resolved immediately; dodge is skipped in commitAction when Volute active
      return { ...empty, log: '' }
    }
    case 'ecran_fumee': {
      const smokeTurns = passiveLevel >= 3 ? 2 : 1
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'smoke', turnsLeft: smokeTurns }],
        log: `💨 Écran de fumée ! Action cachée ${smokeTurns} tour(s)`,
      }
    }
    case 'volute': {
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'dodge_up', turnsLeft: 3, value: passiveLevel === 1 ? 20 : 15 }],
        log: `🌀 Volute ! +${passiveLevel === 1 ? 20 : 15}% esquive 3 tours`,
      }
    }
    case 'dissipation': {
      const negativeOrder: StatusType[] = ['burn', 'paralyzed', 'cursed', 'exhausted']
      const toRemove = negativeOrder.find(t => hasStatus(caster, t))
      if (toRemove) {
        return {
          ...empty,
          casterStatusesToRemove: [toRemove],
          log: `✨ Dissipation ! Statut ${toRemove} retiré`,
        }
      }
      return { ...empty, log: '✨ Dissipation ! Aucun statut à retirer' }
    }
    case 'embuscade': {
      // Deferred to after opponent turn — needs opponentMissed + Volute state
      return { ...empty, log: '' }
    }
    case 'brouillard_total': {
      return {
        ...empty,
        casterStatusesToAdd: passiveLevel === 1 ? [{ type: 'smoke', turnsLeft: 3 }] : [],
        targetStatusesToAdd: passiveLevel === 1 ? [] : [{ type: 'fog', turnsLeft: 2 }],
        log: passiveLevel === 1
          ? '🌫️ Brouillard ! Infos du panda masquées 3 tours'
          : '🌫️ Brouillard total ! Info ennemie masquée 2 tours',
      }
    }

    // ── zapp ──
    case 'decharge': {
      return {
        ...empty,
        targetHpDelta: passiveLevel === 1 ? -10 : -8,
        log: `⚡ Décharge ! -${passiveLevel === 1 ? 10 : 8} HP (priorité)`,
      }
    }
    case 'arc_paralysant': {
      const paralyzed = Math.random() < 0.3
      const paralysisStatus: StatusEffect[] = paralyzed ? [{ type: 'paralyzed', turnsLeft: 2 }] : []
      return {
        ...empty,
        targetHpDelta: passiveLevel === 1 ? -15 : -5,
        targetStatusesToAdd: paralysisStatus,
        log: `🎯 Arc paralysant ! -${passiveLevel === 1 ? 15 : 5} HP${paralyzed ? ' · Ennemi paralysé !' : ' · Rate la paralysie.'}`,
      }
    }
    case 'boost': {
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'damage_boost', turnsLeft: 99, value: 50 }],
        log: '⬆️ Boost ! Prochain dégât +50%',
      }
    }
    case 'esquive_vive': {
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'dodge_ready', turnsLeft: 1 }],
        log: '💨⚡ Esquive vive ! Prochain coup esquivé',
      }
    }
    case 'rafale': {
      const hits = passiveLevel >= 3 ? 3 : 2
      const dmg = hits * 4
      return {
        ...empty,
        targetHpDelta: -dmg,
        log: `⚡⚡ Rafale ! ${hits}×4 = -${dmg} HP`,
      }
    }
    case 'surcharge': {
      return {
        ...empty,
        targetHpDelta: passiveLevel === 1 ? -22 : -16,
        casterStatusesToAdd: [{ type: 'exhausted', turnsLeft: 2, value: 2 }],
        log: `🔋 Surcharge ! -${passiveLevel === 1 ? 22 : 16} HP + épuisement prochain tour`,
      }
    }
    case 'tempete': {
      return {
        ...empty,
        targetHpDelta: -24,
        log: '⛈️ Tempête ! 4×6 = -24 HP',
      }
    }
    case 'fulguration': {
      const paralyzed = Math.random() < 0.2
      const paralysisStatus: StatusEffect[] = paralyzed ? [{ type: 'paralyzed', turnsLeft: 2 }] : []
      return {
        ...empty,
        targetHpDelta: -7,
        targetStatusesToAdd: paralysisStatus,
        log: `⚡🎯 Fulguration ! -7 HP (priorité)${paralyzed ? ' · Ennemi paralysé !' : ''}`,
      }
    }

    default:
      return { ...empty, log: `Sort inconnu: ${spellId}` }
  }
}

// ─── canUseSpell ─────────────────────────────────────────
function canUseSpell(spellId: SpellId, state: Combatant, _maxEnergy: number): boolean {
  const spell = SPELL_CATALOG[spellId]
  if (state.energy < spell.energyCost) return false
  if ((state.cooldowns[spellId] ?? 0) > 0) return false
  // Check cursed
  const cursed = getStatus(state, 'cursed')
  if (cursed && cursed.data === spellId) return false
  return true
}

function estimateSpellPressure(spellId: SpellId, caster: Combatant, passiveLevel: 1 | 2 | 3): number {
  const braise = caster.embers >= (passiveLevel === 1 ? 2 : 3) ? 1.5 : 1
  switch (spellId) {
    case 'frappe_ardente': return Math.round(7 * braise)
    case 'explosion': return Math.round(9.9 * braise)
    case 'immolation': return Math.round(11 * braise)
    case 'brasier': return Math.round(15 * braise) + 6
    case 'fournaise': return Math.round(11.3 * braise)
    case 'vague': return 7
    case 'siphon': return 10
    case 'raz_de_maree': return 16
    case 'maree_curative': return 18
    case 'abysse': return 20
    case 'coup_voile': return 6
    case 'laceration_voilee': return 10
    case 'embuscade': return hasStatus(caster, 'dodge_up') ? 18 : 9
    case 'embuscade_parfaite': return hasStatus(caster, 'dodge_up') ? 17 : 10
    case 'decharge': return 9
    case 'arc_paralysant': return 11
    case 'boost': return 0
    case 'rafale': return passiveLevel >= 3 ? 12 : 8
    case 'surcharge': return passiveLevel === 1 ? 22 : 16
    case 'tempete': return 24
    case 'fulguration': return 12
    default: return 0
  }
}

// ─── bot AI ─────────────────────────────────────────────
function botChooseAction(
  type: CreatureType,
  botState: Combatant,
  playerState: Combatant,
  loadout: SpellLoadout,
  passiveLevel: 1 | 2 | 3,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
): CombatAction {
  const maxEnergy = OPPONENT_MAX_ENERGY
  // can(id): spell is in loadout AND usable this turn
  const can = (id: SpellId): boolean =>
    (loadout as readonly SpellId[]).includes(id) && canUseSpell(id, botState, maxEnergy)
  // inLoadout(id): spell exists in this creature's build (regardless of cooldown/energy)
  const inLoadout = (id: SpellId): boolean => (loadout as readonly SpellId[]).includes(id)

  // ── EASY: random pick, barely functional ─────────────────
  if (difficulty === 'easy') {
    const avail = loadout.filter(id => canUseSpell(id, botState, maxEnergy))
    if (avail.length === 0) return { kind: 'charge' }
    if (Math.random() < DIFFICULTY_RULES.easy.easyHesitation) {
      return botState.energy < 2 ? { kind: 'charge' } : { kind: 'defend' }
    }
    if (botState.hp < 10) {
      const h = avail.find(id => ['regeneration', 'maree_curative', 'barriere', 'carapace_chauffee'].includes(id))
      if (h) return { kind: 'spell', spellId: h }
    }
    return { kind: 'spell', spellId: avail[Math.floor(Math.random() * avail.length)] }
  }

  // ── HARD: type-specific combos + reading opponent state ───
  if (difficulty === 'hard') {
    const botDebuffed = botState.statuses.some(s =>
      (['burn', 'paralyzed', 'cursed', 'exhausted', 'provoked'] as string[]).includes(s.type)
    )
    const playerParalyzed = hasStatus(playerState, 'paralyzed')
    const playerDodging   = hasStatus(playerState, 'dodge_up') || hasStatus(playerState, 'dodge_ready')
    const playerLow       = playerState.hp <= 22
    const playerReadyToBurst = playerState.energy >= 3
    const botLow = botState.hp <= 34
    const usable = ([...loadout] as SpellId[]).filter(id => can(id))
    const strongest = [...usable].sort((a, b) =>
      estimateSpellPressure(b, botState, passiveLevel) - estimateSpellPressure(a, botState, passiveLevel)
    )

    // A. Clear own debuffs first
    if (botDebuffed && can('dissipation')) return { kind: 'spell', spellId: 'dissipation' }

    const finisher = strongest.find(id => estimateSpellPressure(id, botState, passiveLevel) * 1.65 >= playerState.hp)
    if (finisher) return { kind: 'spell', spellId: finisher }

    // B. Emergency heal (lower threshold than medium)
    if (botLow) {
      for (const id of ['maree_curative', 'regeneration', 'siphon', 'abysse', 'barriere', 'carapace_chauffee', 'volute', 'esquive_vive'] as SpellId[]) {
        if (can(id)) return { kind: 'spell', spellId: id }
      }
    }

    // C. Free turn — player paralyzed: land the heaviest hit
    if (playerParalyzed) {
      if (strongest[0]) return { kind: 'spell', spellId: strongest[0] }
    }

    if (playerReadyToBurst) {
      for (const id of ['barriere', 'carapace_chauffee', 'esquive_vive', 'volute', 'brouillard_total'] as SpellId[]) {
        if (can(id) && !hasStatus(botState, 'barrier') && !hasStatus(botState, 'dodge_up') && !hasStatus(botState, 'dodge_ready')) {
          return { kind: 'spell', spellId: id }
        }
      }
    }

    // D. Kill shot — player at low HP: prioritise finishing spells
    if (playerLow) {
      for (const id of ['brasier', 'tempete', 'abysse', 'raz_de_maree', 'surcharge', 'explosion',
                        'embuscade_parfaite', 'fournaise', 'immolation', 'decharge'] as SpellId[]) {
        if (can(id)) return { kind: 'spell', spellId: id }
      }
    }

    // E. Type-specific combos
    switch (type) {
      case 'ignis': {
        // Guaranteed damage vs high-dodge player (immolation ignores dodge)
        if (playerDodging && can('immolation')) return { kind: 'spell', spellId: 'immolation' }
        // Core: stack braises, then spend with explosion/brasier (×1.5 burst)
        if (botState.embers >= (passiveLevel === 1 ? 2 : 3)) {
          if (can('explosion')) return { kind: 'spell', spellId: 'explosion' }
          if (can('brasier'))   return { kind: 'spell', spellId: 'brasier' }
          if (inLoadout('explosion') || inLoadout('brasier')) return { kind: 'charge' }
        }
        // fournaise: adds 1 braise AND deals good damage (better than frappe_ardente when usable)
        if (can('fournaise')) return { kind: 'spell', spellId: 'fournaise' }
        // Stack braises with frappe_ardente (cost 1, always affordable after 1 charge)
        if (can('frappe_ardente')) return { kind: 'spell', spellId: 'frappe_ardente' }
        // Immolation as filler — guaranteed damage
        if (can('immolation')) return { kind: 'spell', spellId: 'immolation' }
        // Carapace reflect when player is about to dump high-cost spells
        if (playerState.energy >= 3 && can('carapace_chauffee')) {
          return { kind: 'spell', spellId: 'carapace_chauffee' }
        }
        if (can('explosion')) return { kind: 'spell', spellId: 'explosion' }
        if (can('brasier'))   return { kind: 'spell', spellId: 'brasier' }
        break
      }

      case 'nemo': {
        // Malediction: lock player's most-expensive spell for 2 turns (cast on every cooldown)
        if (playerReadyToBurst && !hasStatus(playerState, 'cursed') && can('malediction')) return { kind: 'spell', spellId: 'malediction' }
        // Proactive barrier when player is about to attack hard
        if (!hasStatus(botState, 'barrier') && playerState.energy >= 3 && can('barriere')) {
          return { kind: 'spell', spellId: 'barriere' }
        }
        // Abysse: highest single-spell payoff (damage + reduces own damage taken)
        if (can('abysse')) return { kind: 'spell', spellId: 'abysse' }
        // Siphon: consistent life-steal even at moderate HP
        if (can('siphon')) return { kind: 'spell', spellId: 'siphon' }
        // Marée curative: damage + solid heal
        if (can('maree_curative')) return { kind: 'spell', spellId: 'maree_curative' }
        // Raz-de-marée: pure nuke
        if (can('raz_de_maree')) return { kind: 'spell', spellId: 'raz_de_maree' }
        // Regeneration only when genuinely low
        if (botState.hp < 45 && can('regeneration')) return { kind: 'spell', spellId: 'regeneration' }
        if (can('barriere')) return { kind: 'spell', spellId: 'barriere' }
        break
      }

      case 'sylva': {
        // Brouillard when dangerously low (hides own state from player)
        if (botState.hp < 35 && can('brouillard_total')) return { kind: 'spell', spellId: 'brouillard_total' }
        // Core: volute → embuscade_parfaite (ignores dodge while volute active)
        if (!hasStatus(botState, 'dodge_up') && can('volute')) return { kind: 'spell', spellId: 'volute' }
        if (hasStatus(botState, 'dodge_up') && can('embuscade_parfaite')) {
          return { kind: 'spell', spellId: 'embuscade_parfaite' }
        }
        // embuscade ×2 damage while dodge_up is active
        if (hasStatus(botState, 'dodge_up') && can('embuscade')) return { kind: 'spell', spellId: 'embuscade' }
        // Lacération: chip damage + 2-turn brouillage on player
        if (can('laceration_voilee')) return { kind: 'spell', spellId: 'laceration_voilee' }
        // Brouillard: information denial
        if (can('brouillard_total')) return { kind: 'spell', spellId: 'brouillard_total' }
        // Écran fumée: hides own energy + action this turn
        if (can('ecran_fumee')) return { kind: 'spell', spellId: 'ecran_fumee' }
        if (can('coup_voile')) return { kind: 'spell', spellId: 'coup_voile' }
        // Embuscade without volute still deals decent damage
        if (can('embuscade')) return { kind: 'spell', spellId: 'embuscade' }
        break
      }

      case 'zapp': {
        // Tempête (4 hits) is the crown spell — save energy for it
        if (botState.energy >= 4 && can('tempete')) return { kind: 'spell', spellId: 'tempete' }
        if (inLoadout('tempete') && botState.energy < 4 && botState.hp > 28 && playerState.hp > 28) return { kind: 'charge' }
        if (!hasStatus(botState, 'damage_boost') && can('boost') && playerState.hp > 25) return { kind: 'spell', spellId: 'boost' }
        // Fulguration: priority + 20% paralysis (stronger than décharge when usable)
        if (can('fulguration')) return { kind: 'spell', spellId: 'fulguration' }
        // Arc paralysant: 30% stun chance — strong disruption
        if (can('arc_paralysant')) return { kind: 'spell', spellId: 'arc_paralysant' }
        // Rafale: multi-hit (good vs barrier)
        if (can('rafale')) return { kind: 'spell', spellId: 'rafale' }
        // Surcharge: huge damage but causes exhaustion — save for kill shots
        if (playerState.hp <= 35 && can('surcharge')) return { kind: 'spell', spellId: 'surcharge' }
        // Décharge: priority filler when nothing better is available
        if (can('decharge')) return { kind: 'spell', spellId: 'decharge' }
        // Esquive vive (cost 0) when player is about to burst and we have nothing else
        if (botState.energy === 0 && playerState.energy >= 3 && can('esquive_vive')) {
          return { kind: 'spell', spellId: 'esquive_vive' }
        }
        // Save up for Tempête if it's in the loadout
        if (inLoadout('tempete')) return { kind: 'charge' }
        if (can('surcharge')) return { kind: 'spell', spellId: 'surcharge' }
        break
      }
    }

    // F. Fallback: highest-cost usable spell
    const byCost = ([...loadout] as SpellId[]).sort((a, b) => SPELL_CATALOG[b].energyCost - SPELL_CATALOG[a].energyCost)
    for (const id of byCost) {
      if (canUseSpell(id, botState, maxEnergy)) return { kind: 'spell', spellId: id }
    }
    return { kind: 'charge' }
  }

  // ── MEDIUM: type-aware, reactive ─────────────────────────
  // Heal when low
  if (botState.hp < 20) {
    for (const id of ['regeneration', 'maree_curative', 'barriere', 'carapace_chauffee', 'siphon'] as SpellId[]) {
      if (can(id)) return { kind: 'spell', spellId: id }
    }
  }

  // Type-specific basic loop
  switch (type) {
    case 'ignis': {
      if (botState.embers >= (passiveLevel === 1 ? 2 : 3)) {
        if (can('explosion')) return { kind: 'spell', spellId: 'explosion' }
        if (can('brasier'))   return { kind: 'spell', spellId: 'brasier' }
      }
      if (botState.energy >= 3) {
        if (can('fournaise'))  return { kind: 'spell', spellId: 'fournaise' }
        if (can('immolation')) return { kind: 'spell', spellId: 'immolation' }
        if (can('explosion'))  return { kind: 'spell', spellId: 'explosion' }
        if (can('brasier'))    return { kind: 'spell', spellId: 'brasier' }
      }
      if (can('frappe_ardente')) return { kind: 'spell', spellId: 'frappe_ardente' }
      break
    }
    case 'nemo': {
      if (botState.hp < 40 && can('regeneration')) return { kind: 'spell', spellId: 'regeneration' }
      if (botState.energy >= 3) {
        if (can('raz_de_maree'))   return { kind: 'spell', spellId: 'raz_de_maree' }
        if (can('abysse'))         return { kind: 'spell', spellId: 'abysse' }
        if (can('malediction'))    return { kind: 'spell', spellId: 'malediction' }
        if (can('maree_curative')) return { kind: 'spell', spellId: 'maree_curative' }
      }
      if (can('siphon')) return { kind: 'spell', spellId: 'siphon' }
      break
    }
    case 'sylva': {
      if (!hasStatus(botState, 'dodge_up') && can('volute')) return { kind: 'spell', spellId: 'volute' }
      if (botState.energy >= 2) {
        if (can('embuscade_parfaite')) return { kind: 'spell', spellId: 'embuscade_parfaite' }
        if (can('laceration_voilee'))  return { kind: 'spell', spellId: 'laceration_voilee' }
        if (can('embuscade'))          return { kind: 'spell', spellId: 'embuscade' }
      }
      if (can('coup_voile'))      return { kind: 'spell', spellId: 'coup_voile' }
      if (can('brouillard_total')) return { kind: 'spell', spellId: 'brouillard_total' }
      break
    }
    case 'zapp': {
      if (can('decharge')) return { kind: 'spell', spellId: 'decharge' }
      if (botState.energy >= 3) {
        if (can('tempete'))    return { kind: 'spell', spellId: 'tempete' }
        if (can('surcharge'))  return { kind: 'spell', spellId: 'surcharge' }
        if (can('fulguration')) return { kind: 'spell', spellId: 'fulguration' }
      }
      if (!hasStatus(botState, 'damage_boost') && can('boost') && botState.energy >= 2) return { kind: 'spell', spellId: 'boost' }
      if (can('arc_paralysant')) return { kind: 'spell', spellId: 'arc_paralysant' }
      if (can('rafale'))         return { kind: 'spell', spellId: 'rafale' }
      break
    }
  }

  // Generic medium fallback: cheapest usable spell
  const byCheap = ([...loadout] as SpellId[]).sort((a, b) => SPELL_CATALOG[a].energyCost - SPELL_CATALOG[b].energyCost)
  for (const id of byCheap) {
    if (canUseSpell(id, botState, maxEnergy)) return { kind: 'spell', spellId: id }
  }

  return { kind: 'charge' }
}

// ─── status icon mapping ─────────────────────────────────
const STATUS_ICONS: Record<StatusType, string> = {
  burn: '🔥',
  paralyzed: '⚡',
  cursed: '🔮',
  barrier: '🔷',
  dodge_up: '🌀',
  smoke: '💨',
  fog: '🌫️',
  exhausted: '😴',
  provoked: '😤',
  dodge_ready: '💨⚡',
  damage_boost: '⬆️',
}

// ─── sub-components ─────────────────────────────────────
function EnergyPips({ energy, maxEnergy, color }: { energy: number; maxEnergy: number; color: string }) {
  return (
    <View style={s.pipRow}>
      {Array.from({ length: maxEnergy }, (_, i) => (
        <View key={i} style={[s.pip, i < energy && { backgroundColor: color, borderColor: 'transparent' }]} />
      ))}
    </View>
  )
}

function HPBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  const pct = Math.max(0, hp / maxHp)
  const barColor = pct > 0.5 ? color : pct > 0.25 ? '#FFB300' : '#FF4444'
  return (
    <View style={s.hpBarBg}>
      <View style={[s.hpBarFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      <Text style={s.hpBarText}>{hp}/{maxHp}</Text>
    </View>
  )
}

function ClashChip({ action, textColor }: { action: CombatAction | null; textColor: string }) {
  let label = '?'
  if (action?.kind === 'defend') label = '🛡️ DÉFENSE'
  else if (action?.kind === 'charge') label = '⚡ CHARGE'
  else if (action?.kind === 'spell') {
    const sp = SPELL_CATALOG[action.spellId]
    label = `${sp.emoji} ${sp.name.toUpperCase()}`
  }
  return (
    <View style={s.clashChip}>
      <Text style={[s.clashChipText, { color: textColor }]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

interface DebuffItem {
  emoji: string
  text: string
}

function DebuffPanel({ mods, playerType, opponentType }: { mods: CombatModifiers; playerType: CreatureType; opponentType: CreatureType }) {
  const debuffs: DebuffItem[] = []
  const buffs: DebuffItem[] = []

  if (mods.damageMult < 0.95) {
    const pct = Math.round((1 - mods.damageMult) * 100)
    debuffs.push({ emoji: '😓', text: `Forme : -${pct}% dégâts (×${mods.damageMult.toFixed(2)})` })
  } else if (mods.damageMult > 1.05) {
    const pct = Math.round((mods.damageMult - 1.0) * 100)
    buffs.push({ emoji: '💪', text: `Forme excellente : +${pct}% dégâts (×${mods.damageMult.toFixed(2)})` })
  }
  if (mods.activeFoodBuff) {
    buffs.push({ emoji: '🥩', text: 'Repas boost actif !' })
  }
  if (mods.trainingDmgReduction > 0) {
    const pct = Math.round(mods.trainingDmgReduction * 100)
    buffs.push({ emoji: '🔰', text: `Réflexes : -${pct}% dégâts reçus` })
  }
  if (mods.timerReduction > 0) {
    debuffs.push({ emoji: '😟', text: `Malheureux : timer réduit (-${mods.timerReduction}s)` })
  }
  if (mods.hideOpponentEnergy) {
    debuffs.push({ emoji: '🙈', text: 'Triste : énergie ennemie masquée' })
  }
  if (mods.sickDot > 0) {
    debuffs.push({ emoji: '🤒', text: 'Malade : -25% PV + 3 dégâts/3 tours' })
  }
  if (mods.maxEnergy < 5) {
    debuffs.push({ emoji: '⚡', text: `Fatigué : énergie max ${mods.maxEnergy}` })
  }

  if (COUNTER_TABLE[playerType] === opponentType) {
    buffs.push({ emoji: '⚔️', text: 'Avantage de type : +15% dégâts' })
  } else if (COUNTER_TABLE[opponentType] === playerType) {
    debuffs.push({ emoji: '⚠️', text: 'Désavantage de type : ennemi +15%' })
  }

  switch (playerType) {
    case 'ignis': buffs.push({ emoji: '🔥', text: 'Sorts ignis disponibles' }); break
    case 'nemo':  buffs.push({ emoji: '💧', text: 'Sorts nemo disponibles' }); break
    case 'sylva': buffs.push({ emoji: '💨', text: 'Sorts sylva disponibles' }); break
    case 'zapp':  buffs.push({ emoji: '⚡', text: 'Sorts zapp disponibles' }); break
  }

  if (debuffs.length === 0 && buffs.length === 0) return null

  return (
    <View style={s.debuffPanel}>
      {debuffs.length > 0 && <Text style={s.debuffTitle}>Malus actifs</Text>}
      {debuffs.map((d, i) => (
        <Text key={i} style={s.debuffItem}>{d.emoji} {d.text}</Text>
      ))}
      {buffs.length > 0 && (
        <Text style={[s.debuffTitle, { color: '#6BFF8B', marginTop: debuffs.length > 0 ? 8 : 0 }]}>Bonus actifs</Text>
      )}
      {buffs.map((b, i) => (
        <Text key={`b${i}`} style={[s.debuffItem, { color: '#B3FFB3' }]}>{b.emoji} {b.text}</Text>
      ))}
    </View>
  )
}

// ─── SpellCard ─────────────────────────────────────────
function SpellCard({
  spellId,
  state,
  maxEnergy,
  color,
  displayMult,
  onPress,
}: {
  spellId: SpellId
  state: Combatant
  maxEnergy: number
  color: string
  displayMult: number
  onPress: () => void
}) {
  const spell = SPELL_CATALOG[spellId]
  const usable = canUseSpell(spellId, state, maxEnergy)
  const cd = state.cooldowns[spellId] ?? 0

  return (
    <TouchableOpacity
      style={[s.spellCard, usable && { borderColor: color + '88' }, !usable && s.spellCardLocked]}
      onPress={onPress}
      disabled={!usable}
      activeOpacity={0.75}
    >
      {cd > 0 && <Text style={s.spellCdTag}>⏳ {cd}t</Text>}
      <View style={s.spellCardTop}>
        <View style={s.spellIco}><Text style={s.spellIcoText}>{spell.emoji}</Text></View>
        <Text style={[s.spellCardName, !usable && s.spellCardNameDim]} numberOfLines={2}>{spell.name}</Text>
      </View>
      <View style={s.spellCostRow}>
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} style={[
            s.spellCostBar,
            i < spell.energyCost && (state.energy > i
              ? { backgroundColor: color, borderColor: 'transparent' }
              : s.spellCostBarLow),
          ]} />
        ))}
      </View>
      <Text style={s.spellRole} numberOfLines={2}>{spell.scaledDesc ? spell.scaledDesc(displayMult) : spell.description}</Text>
    </TouchableOpacity>
  )
}

// ─── exported types ──────────────────────────────────────
export interface CombatOpponent {
  username: string
  creatureName: string
  creatureType: CreatureType
  level: number
  loadout?: SpellLoadout
}

interface Props {
  player: Creature
  opponent: CombatOpponent
  onFinish: (won: boolean, xpGained: number) => void
  isAdventure?: boolean
  debugOverride?: {
    playerType: CreatureType
    playerLevel: number
    playerLoadout: SpellLoadout
    playerEnergy: number
  }
}

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_RULES: Record<Difficulty, {
  hpMult: number
  dmgMult: number
  playerEnergyBonus: number
  opponentEnergyBonus: number
  timerBonus: number
  easyHesitation: number
  winXP: number
  adventureWinXP: number
  lossXP: number
}> = {
  easy: {
    hpMult: 0.75,
    dmgMult: 0.75,
    playerEnergyBonus: 1,
    opponentEnergyBonus: -1,
    timerBonus: 4,
    easyHesitation: 0.34,
    winXP: 24,
    adventureWinXP: 16,
    lossXP: 8,
  },
  medium: {
    hpMult: 1,
    dmgMult: 1,
    playerEnergyBonus: 0,
    opponentEnergyBonus: 0,
    timerBonus: 0,
    easyHesitation: 0,
    winXP: 40,
    adventureWinXP: 25,
    lossXP: 12,
  },
  hard: {
    hpMult: 1.05,
    dmgMult: 1.06,
    playerEnergyBonus: 0,
    opponentEnergyBonus: 0,
    timerBonus: -1,
    easyHesitation: 0,
    winXP: 70,
    adventureWinXP: 45,
    lossXP: 18,
  },
}

// ─── main component ─────────────────────────────────────
export default function CombatScreen({ player, opponent, onFinish, isAdventure, debugOverride }: Props) {
  const playerMods = useRef<CombatModifiers>(computeModifiers(player, opponent.creatureType)).current

  const playerType = debugOverride?.playerType ?? player.type
  const playerLevel = debugOverride?.playerLevel ?? player.stats.level
  const playerDisplayMult = useRef(computeDisplayMult(playerType, playerLevel)).current
  const playerProfile = CREATURE_PROFILES[playerType]
  const opponentProfile = CREATURE_PROFILES[opponent.creatureType]

  // ── Difficulty ──────────────────────────────────────────
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const difficultyRules = DIFFICULTY_RULES[difficulty ?? 'medium']
  const diffHPMult = difficultyRules.hpMult
  const diffDmgMult = difficultyRules.dmgMult

  const playerMaxHP  = calcHP(playerLevel, playerMods.hpMult, playerType) + playerMods.trainingHpBonus
  const opponentMaxHP = calcHP(opponent.level, diffHPMult, opponent.creatureType)

  const opponentCounterBonus = COUNTER_TABLE[opponent.creatureType] === playerType ? 1.15 : 1.0

  const pPassiveLevel = getPassiveLevel(playerLevel)
  const oPassiveLevel = getPassiveLevel(opponent.level)

  const playerLoadout: SpellLoadout = debugOverride?.playerLoadout
    ?? getLoadout(playerType, playerLevel, player.spellLoadout)
  const opponentLoadout: SpellLoadout = getLoadout(opponent.creatureType, opponent.level, opponent.loadout)

  const startEnergy = debugOverride?.playerEnergy ?? playerProfile.startEnergy

  const [phase, setPhase]       = useState<CombatPhase>('intro')
  const [round, setRound]       = useState(1)
  const [pState, setPState]     = useState<Combatant>({
    hp: playerMaxHP,
    energy: startEnergy,
    cooldowns: {},
    statuses: [],
    embers: 0,
  })
  const [oState, setOState]     = useState<Combatant>({
    hp: 0, // set when difficulty is selected
    energy: opponentProfile.startEnergy,
    cooldowns: {},
    statuses: [],
    embers: 0,
  })
  const [playerDefendLocked, setPlayerDefendLocked] = useState(false)

  const handleSelectDifficulty = useCallback((d: Difficulty) => {
    const rules = DIFFICULTY_RULES[d]
    setPState((cur) => ({
      ...cur,
      hp: playerMaxHP,
      energy: Math.max(0, Math.min(playerMods.maxEnergy, startEnergy + rules.playerEnergyBonus)),
      cooldowns: {},
      statuses: [],
      embers: 0,
    }))
    setOState({
      hp: calcHP(opponent.level, rules.hpMult, opponent.creatureType),
      energy: Math.max(0, Math.min(OPPONENT_MAX_ENERGY, opponentProfile.startEnergy + rules.opponentEnergyBonus)),
      cooldowns: {},
      statuses: [],
      embers: 0,
    })
    setDifficulty(d)
    setLog(d === 'easy'
      ? 'Mode facile: tu commences avec plus d energie, l ennemi hesite.'
      : d === 'hard'
        ? 'Mode difficile: l IA joue son kit et punit les tours mal prepares.'
        : 'Mode moyen: combat standard.')
  }, [opponent.level, opponent.creatureType, opponentProfile.startEnergy, playerMaxHP, playerMods.maxEnergy, startEnergy])

  const pStateRef = useRef(pState)
  const oStateRef = useRef(oState)
  const playerDefendLockedRef = useRef(false)
  const opponentDefendLockedRef = useRef(false)
  useEffect(() => { pStateRef.current = pState }, [pState])
  useEffect(() => { oStateRef.current = oState }, [oState])
  useEffect(() => { playerDefendLockedRef.current = playerDefendLocked }, [playerDefendLocked])

  const [playerAction, setPlayerAction]   = useState<CombatAction | null>(null)
  const [opponentAction, setOpponentAction] = useState<CombatAction | null>(null)
  const [log, setLog]           = useState('Prêt pour le combat !')
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [chose, setChose]       = useState(false)
  const [opponentHistory, setOpponentHistory] = useState<string[]>([])
  const [playerHistory, setPlayerHistory]     = useState<string[]>([])
  const [pDelta, setPDelta]                   = useState<string>('')
  const [oDelta, setODelta]                   = useState<string>('')

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerAnim = useRef(new Animated.Value(1)).current
  const playerShake = useRef(new Animated.Value(0)).current
  const opponentShake = useRef(new Animated.Value(0)).current
  const clashAnim = useRef(new Animated.Value(0)).current
  const pDmgOpacity = useRef(new Animated.Value(0)).current
  const pDmgY = useRef(new Animated.Value(0)).current
  const oDmgOpacity = useRef(new Animated.Value(0)).current
  const oDmgY = useRef(new Animated.Value(0)).current

  const pColor = CREATURE_COLORS[playerType]
  const oColor = CREATURE_COLORS[opponent.creatureType]

  const shake = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 4,  duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start()
  }

  const startTimer = useCallback(() => {
    const rules = DIFFICULTY_RULES[difficulty ?? 'medium']
    const effectiveSeconds = Math.max(2, TIMER_SECONDS - playerMods.timerReduction + playerMods.timerBonus + rules.timerBonus)
    setTimeLeft(effectiveSeconds)
    setChose(false)
    timerAnim.setValue(1)
    Animated.timing(timerAnim, { toValue: 0, duration: effectiveSeconds * 1000, useNativeDriver: false }).start()
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [difficulty, playerMods.timerReduction, playerMods.timerBonus, timerAnim])

  useEffect(() => {
    if (phase !== 'choosing') return
    if (timeLeft > 0) return
    if (!chose) commitAction(playerDefendLockedRef.current ? { kind: 'charge' } : { kind: 'defend' })
  }, [timeLeft, phase, chose])

  const commitAction = useCallback((rawAction: CombatAction) => {
    if (chose) return
    setChose(true)
    clearInterval(timerRef.current!)

    const curP = pStateRef.current
    const curO = oStateRef.current

    // 1. Paralysie → force defend
    let pAction: CombatAction = rawAction.kind === 'defend' && playerDefendLockedRef.current
      ? { kind: 'charge' }
      : rawAction
    if (hasStatus(curP, 'paralyzed')) {
      pAction = { kind: 'defend' }
    }
    if (hasStatus(curP, 'exhausted')) {
      pAction = { kind: 'charge' }
    }

    // 2. Bot choisit son action
    let oAction: CombatAction
    if (hasStatus(curO, 'exhausted')) {
      oAction = { kind: 'charge' }
    } else if (hasStatus(curO, 'paralyzed')) {
      oAction = { kind: 'defend' }
    } else {
      oAction = botChooseAction(opponent.creatureType, curO, curP, opponentLoadout, oPassiveLevel, difficulty ?? 'medium')
    }
    if (oAction.kind === 'defend' && opponentDefendLockedRef.current && !hasStatus(curO, 'paralyzed')) {
      oAction = { kind: 'charge' }
    }

    setPlayerAction(pAction)
    setOpponentAction(oAction)
    setPhase('resolving')

    let newP: Combatant = { ...curP }
    let newO: Combatant = { ...curO }

    // Remove paralyzed if forced defend
    if (hasStatus(curP, 'paralyzed')) newP = removeStatus(newP, 'paralyzed')
    if (hasStatus(curO, 'paralyzed')) newO = removeStatus(newO, 'paralyzed')

    const logParts: string[] = []

    if (hasStatus(curP, 'paralyzed')) logParts.push('⚡ Paralysé ! Ta défense est forcée.')
    if (hasStatus(curO, 'paralyzed')) logParts.push('⚡ Ennemi paralysé ! Sa défense est forcée.')

    // ── Player turn ──
    let playerDmgToOpponent = 0
    if (pAction.kind === 'charge') {
      if (hasStatus(newP, 'exhausted')) {
        logParts.push('>😴 Épuisé ! Tu ne peux pas charger.')
      } else {
        newP = { ...newP, energy: Math.min(playerMods.maxEnergy, newP.energy + 1) }
        logParts.push('>⚡ Tu charges !')
      }
      newP = removeStatus(newP, 'exhausted')
    } else if (pAction.kind === 'spell') {
      const spell = SPELL_CATALOG[pAction.spellId]
      if (newP.energy >= spell.energyCost) {
        newP = { ...newP, energy: newP.energy - spell.energyCost }
        if (spell.cooldown > 0) {
          newP = { ...newP, cooldowns: { ...newP.cooldowns, [spell.id]: spell.cooldown } }
        }

        const result = resolveSpell(
          pAction.spellId, newP, newO,
          playerType, opponent.creatureType,
          pPassiveLevel, false,
          opponentLoadout,
        )

        // Apply caster deltas to newP
        newP = {
          ...newP,
          hp: Math.min(playerMaxHP, Math.max(0, newP.hp + result.casterHpDelta)),
          energy: Math.max(0, Math.min(playerMods.maxEnergy, newP.energy + result.casterEnergyDelta)),
          embers: result.newCasterEmbers !== undefined ? result.newCasterEmbers : newP.embers,
        }
        for (const st of result.casterStatusesToAdd) newP = addStatus(newP, st)
        for (const t of result.casterStatusesToRemove) newP = removeStatus(newP, t)

        // Apply target deltas to newO with dodge + barrier checks
        let finalDmg = Math.max(0, -result.targetHpDelta)
        let blockedDmg = 0
        if (finalDmg > 0) {
          if (oAction.kind === 'defend' || (oAction.kind === 'spell' && oAction.spellId === 'carapace_chauffee')) {
            blockedDmg = finalDmg
            finalDmg = 0
            logParts.push('Ennemi bloque tous les degats !')
          }
        }
        if (finalDmg > 0) {
          const accuracyDown = getStatus(newP, 'fog')
          if (accuracyDown?.data === 'accuracy_down' && Math.random() < (accuracyDown.value ?? 15) / 100) {
            finalDmg = 0
            logParts.push('Ton attaque rate dans le brouillage !')
          }
        }
        if (finalDmg > 0) {
          const dodgeUp = getStatus(newO, 'dodge_up')
          const dodgeChance =
            (opponent.creatureType === 'sylva' ? CREATURE_PROFILES.sylva.dodgeBase : 0) +
            ((dodgeUp?.value ?? 0) / 100) +
            (hasStatus(newO, 'dodge_ready') ? 1.0 : 0)
          if (Math.random() < dodgeChance) {
            finalDmg = 0
            logParts.push('Ennemi esquive ! 💨')
            newO = removeStatus(newO, 'dodge_ready')
          } else {
            if (pPassiveLevel !== 1) {
              finalDmg = Math.round(finalDmg * playerMods.damageMult * playerMods.counterBonus)
            }
            const boost = getStatus(newP, 'damage_boost')
            if (boost) {
              finalDmg = Math.round(finalDmg * (1 + (boost.value ?? 50) / 100))
              newP = removeStatus(newP, 'damage_boost')
              logParts.push('Boost consomme : degats +50% !')
            }
            if (hasStatus(newO, 'barrier')) {
              const b = getStatus(newO, 'barrier')!
              finalDmg = Math.round(finalDmg * (1 - (b.value ?? 50) / 100))
            }
          }
        }
        if (blockedDmg > 0 && oAction.kind === 'spell' && oAction.spellId === 'carapace_chauffee') {
          const reflected = Math.round(blockedDmg * (oPassiveLevel === 1 ? 0.5 : 0.3))
          newP = { ...newP, hp: Math.max(0, newP.hp - reflected) }
          logParts.push(`Carapace ennemie renvoie ${reflected} PV !`)
        }
        playerDmgToOpponent = finalDmg
        newO = { ...newO, hp: Math.max(0, newO.hp - finalDmg) }
        newO = { ...newO, energy: Math.max(0, Math.min(OPPONENT_MAX_ENERGY, newO.energy + result.targetEnergyDelta)) }
        for (const st of result.targetStatusesToAdd) newO = addStatus(newO, st)
        for (const t of result.targetStatusesToRemove) newO = removeStatus(newO, t)

        // embuscade log is deferred to after we know if opponent missed
        if (pAction.spellId !== 'embuscade' && pAction.spellId !== 'embuscade_parfaite') logParts.push('>' + result.log)
      }
    } else {
      // defend
      logParts.push('>🛡️ Tu te défends !')
    }

    // ── Opponent turn ──
    // Track if opponent dealt damage (for embuscade)
    let opponentDmgToPlayer = 0

    if (oAction.kind === 'charge') {
      if (hasStatus(newO, 'exhausted')) {
        logParts.push('<😴 Ennemi épuisé ! Pas de charge.')
      } else {
        newO = { ...newO, energy: Math.min(OPPONENT_MAX_ENERGY, newO.energy + 1) }
        logParts.push('<⚡ Ennemi charge.')
      }
      newO = removeStatus(newO, 'exhausted')
    } else if (oAction.kind === 'spell') {
      const spell = SPELL_CATALOG[oAction.spellId]
      if (newO.energy >= spell.energyCost) {
        newO = { ...newO, energy: Math.max(0, newO.energy - spell.energyCost) }
        if (spell.cooldown > 0) {
          newO = { ...newO, cooldowns: { ...newO.cooldowns, [spell.id]: spell.cooldown } }
        }

        const result = resolveSpell(
          oAction.spellId, newO, newP,
          opponent.creatureType, playerType,
          oPassiveLevel, false,
          playerLoadout,
        )

        // Apply caster (opponent) deltas
        newO = {
          ...newO,
          hp: Math.min(opponentMaxHP, Math.max(0, newO.hp + result.casterHpDelta)),
          energy: Math.max(0, Math.min(OPPONENT_MAX_ENERGY, newO.energy + result.casterEnergyDelta)),
          embers: result.newCasterEmbers !== undefined ? result.newCasterEmbers : newO.embers,
        }
        for (const st of result.casterStatusesToAdd) newO = addStatus(newO, st)
        for (const t of result.casterStatusesToRemove) newO = removeStatus(newO, t)

        // Apply target (player) deltas
        let finalDmgToPlayer = Math.max(0, -result.targetHpDelta)
        let blockedDmgToPlayer = 0
        if (finalDmgToPlayer > 0) {
          if (pAction.kind === 'defend' || (pAction.kind === 'spell' && pAction.spellId === 'carapace_chauffee')) {
            blockedDmgToPlayer = finalDmgToPlayer
            finalDmgToPlayer = 0
            logParts.push('Tu bloques tous les degats !')
          }
        }
        if (finalDmgToPlayer > 0) {
          const accuracyDown = getStatus(newO, 'fog')
          if (accuracyDown?.data === 'accuracy_down' && Math.random() < (accuracyDown.value ?? 15) / 100) {
            finalDmgToPlayer = 0
            logParts.push('L attaque ennemie rate dans le brouillage !')
          }
        }
        if (finalDmgToPlayer > 0) {
          const playerDodgeUp = getStatus(newP, 'dodge_up')
          const playerDodge =
            playerMods.dodgeChance +
            ((playerDodgeUp?.value ?? 0) / 100) +
            (hasStatus(newP, 'dodge_ready') ? 1.0 : 0)
          if (Math.random() < playerDodge) {
            finalDmgToPlayer = 0
            logParts.push('Tu esquives ! 💨')
            newP = removeStatus(newP, 'dodge_ready')
            // Sylva passif : chaque esquive recharge +1 énergie
            if (playerType === 'sylva') {
              newP = { ...newP, energy: Math.min(playerMods.maxEnergy, newP.energy + 1) }
              logParts.push('🌀 Sylva +1⚡ (esquive)')
            }
          } else {
            if (oPassiveLevel !== 1) {
              finalDmgToPlayer = Math.round(
                finalDmgToPlayer
                * opponentCounterBonus
                * opponentProfile.baseDamageMult
                * GLOBAL_DMG_BOOST
                * (1 + 0.03 * (opponent.level - 1))
                * diffDmgMult
              )
            }
            const boost = getStatus(newO, 'damage_boost')
            if (boost) {
              finalDmgToPlayer = Math.round(finalDmgToPlayer * (1 + (boost.value ?? 50) / 100))
              newO = removeStatus(newO, 'damage_boost')
              logParts.push('Boost ennemi consomme : degats +50% !')
            }
            if (hasStatus(newP, 'barrier')) {
              const b = getStatus(newP, 'barrier')!
              finalDmgToPlayer = Math.round(finalDmgToPlayer * (1 - (b.value ?? 50) / 100))
            }
            if (playerMods.trainingDmgReduction > 0)
              finalDmgToPlayer = Math.round(finalDmgToPlayer * (1 - playerMods.trainingDmgReduction))
            // carapace_chauffee reflect
            if (pAction.kind === 'spell' && pAction.spellId === 'carapace_chauffee') {
              const reflected = Math.round(finalDmgToPlayer * 0.30)
              newO = { ...newO, hp: Math.max(0, newO.hp - reflected) }
              logParts.push(`🛡️🔥 Carapace réfléchit ${reflected} PV à l'ennemi !`)
            }
            // ignis embers reset on damage received
            if (playerType === 'ignis' && finalDmgToPlayer > 0) {
              if (pPassiveLevel >= 3) {
                newP = { ...newP, embers: Math.floor(newP.embers / 2) }
              } else {
                newP = { ...newP, embers: 0 }
              }
              logParts.push('💨 Braises perdues !')
            }
          }
          opponentDmgToPlayer = finalDmgToPlayer
        }
        if (blockedDmgToPlayer > 0 && pAction.kind === 'spell' && pAction.spellId === 'carapace_chauffee') {
          const reflected = Math.round(blockedDmgToPlayer * (pPassiveLevel === 1 ? 0.5 : 0.3))
          newO = { ...newO, hp: Math.max(0, newO.hp - reflected) }
          logParts.push(`Carapace reflechit ${reflected} PV a l'ennemi !`)
        }

        newP = { ...newP, hp: Math.max(0, newP.hp - finalDmgToPlayer) }
        newP = { ...newP, energy: Math.max(0, Math.min(playerMods.maxEnergy, newP.energy + result.targetEnergyDelta)) }
        for (const st of result.targetStatusesToAdd) newP = addStatus(newP, st)
        for (const t of result.targetStatusesToRemove) newP = removeStatus(newP, t)

        logParts.push('<' + result.log)
      }
    } else {
      logParts.push('<🛡️ Ennemi se défend.')
    }

    // Resolve embuscade / embuscade_parfaite — deferred to know opponent outcome + Volute state
    if (pAction.kind === 'spell' && (pAction.spellId === 'embuscade' || pAction.spellId === 'embuscade_parfaite')) {
      const isParfaite = pAction.spellId === 'embuscade_parfaite'
      const opponentMissed = opponentDmgToPlayer === 0 && oAction.kind !== 'charge'
      const hasVoluteActive = hasStatus(newP, 'dodge_up')
      const bonusCondition = opponentMissed || hasVoluteActive

      const rawBase = pPassiveLevel === 1 ? 14 : (isParfaite ? 10.3 : 8.9)
      const rawDmg = pPassiveLevel === 1
        ? (bonusCondition ? 25 : 14)
        : (isParfaite ? Math.round(rawBase) : Math.round(bonusCondition ? rawBase * 2 : rawBase))

      let embDmg = pPassiveLevel === 1
        ? rawDmg
        : Math.round(rawDmg * playerMods.damageMult * playerMods.counterBonus)

      // Embuscade parfaite ignores dodge/barrier if Volute active
      if (!(isParfaite && hasVoluteActive)) {
        if (hasStatus(newO, 'barrier')) {
          const b = getStatus(newO, 'barrier')!
          embDmg = Math.round(embDmg * (1 - (b.value ?? 50) / 100))
        }
      }

      newO = { ...newO, hp: Math.max(0, newO.hp - embDmg) }
      playerDmgToOpponent = embDmg
      const condStr = bonusCondition
        ? (opponentMissed ? ' 🎯 Ambush !' : ' 🌀 Volute !')
        : ''
      const spellName = isParfaite ? 'Embuscade parfaite' : 'Embuscade'
      logParts.push(`>🗡️ ${spellName} ! -${embDmg} HP${condStr}`)
    }

    if (oAction.kind === 'spell' && (oAction.spellId === 'embuscade' || oAction.spellId === 'embuscade_parfaite')) {
      const isParfaite = oAction.spellId === 'embuscade_parfaite'
      const playerMissed = playerDmgToOpponent === 0 && pAction.kind !== 'charge'
      const hasVoluteActive = hasStatus(newO, 'dodge_up')
      const bonusCondition = playerMissed || hasVoluteActive

      const rawBase = oPassiveLevel === 1 ? 14 : (isParfaite ? 10.3 : 8.9)
      const rawDmg = oPassiveLevel === 1
        ? (bonusCondition ? 25 : 14)
        : (isParfaite ? Math.round(rawBase) : Math.round(bonusCondition ? rawBase * 2 : rawBase))

      let embDmg = oPassiveLevel === 1
        ? rawDmg
        : Math.round(
            rawDmg
            * opponentCounterBonus
            * opponentProfile.baseDamageMult
            * GLOBAL_DMG_BOOST
            * (1 + 0.03 * (opponent.level - 1))
            * diffDmgMult
          )

      if (!(isParfaite && hasVoluteActive) && hasStatus(newP, 'barrier')) {
        const b = getStatus(newP, 'barrier')!
        embDmg = Math.round(embDmg * (1 - (b.value ?? 50) / 100))
      }

      newP = { ...newP, hp: Math.max(0, newP.hp - embDmg) }
      opponentDmgToPlayer = embDmg
      const condStr = bonusCondition
        ? (playerMissed ? ' Ambush !' : ' Volute !')
        : ''
      const spellName = isParfaite ? 'Embuscade parfaite' : 'Embuscade'
      logParts.push(`<${spellName} ennemi ! -${embDmg} HP${condStr}`)
    }

    // Burn DoT
    const pBurn = getStatus(newP, 'burn')
    if (pBurn) {
      newP = { ...newP, hp: Math.max(0, newP.hp - (pBurn.value ?? 4)) }
      logParts.push(`🔥 Brûlure : -${pBurn.value ?? 4} PV`)
    }
    const oBurn = getStatus(newO, 'burn')
    if (oBurn) {
      newO = { ...newO, hp: Math.max(0, newO.hp - (oBurn.value ?? 4)) }
      logParts.push(`🔥 Ennemi brûle : -${oBurn.value ?? 4} PV`)
    }

    // Sick DoT on player
    if (playerMods.sickDot > 0) {
      newP = { ...newP, hp: Math.max(0, newP.hp - playerMods.sickDot) }
      logParts.push(`🤒 Fièvre : -${playerMods.sickDot} PV`)
    }

    // Tick statuses and cooldowns
    newP = tickStatuses(newP)
    newO = tickStatuses(newO)
    newP = { ...newP, cooldowns: tickCooldowns(newP.cooldowns) }
    newO = { ...newO, cooldowns: tickCooldowns(newO.cooldowns) }

    if (newP.hp < curP.hp) shake(playerShake)
    if (newO.hp < curO.hp) shake(opponentShake)

    const logMsg = logParts.filter(Boolean).join('\n')
    setLog(logMsg || '...')
    setPState(newP)
    setOState(newO)

    const histEntry = oAction.kind === 'spell'
      ? SPELL_CATALOG[oAction.spellId].emoji
      : oAction.kind === 'charge' ? '⚡' : '🛡️'
    setOpponentHistory(prev => [histEntry, ...prev].slice(0, 3))

    const pHistEntry = pAction.kind === 'spell'
      ? SPELL_CATALOG[pAction.spellId].emoji
      : pAction.kind === 'charge' ? '⚡' : '🛡️'
    setPlayerHistory(prev => [pHistEntry, ...prev].slice(0, 3))
    setPlayerDefendLocked(pAction.kind === 'defend')
    playerDefendLockedRef.current = pAction.kind === 'defend'
    opponentDefendLockedRef.current = oAction.kind === 'defend'

    const pHpChange = newP.hp - curP.hp
    const oHpChange = newO.hp - curO.hp
    setPDelta(pHpChange < 0 ? `${pHpChange}` : pHpChange > 0 ? `+${pHpChange}` : '')
    setODelta(oHpChange < 0 ? `${oHpChange}` : oHpChange > 0 ? `+${oHpChange}` : '')
    if (oHpChange < 0) {
      setTimeout(() => {
        oDmgOpacity.setValue(0); oDmgY.setValue(0)
        Animated.parallel([
          Animated.sequence([
            Animated.timing(oDmgOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
            Animated.delay(550),
            Animated.timing(oDmgOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.timing(oDmgY, { toValue: -50, duration: 1020, useNativeDriver: true }),
        ]).start()
      }, 380)
    }
    if (pHpChange < 0) {
      setTimeout(() => {
        pDmgOpacity.setValue(0); pDmgY.setValue(0)
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pDmgOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
            Animated.delay(550),
            Animated.timing(pDmgOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.timing(pDmgY, { toValue: -50, duration: 1020, useNativeDriver: true }),
        ]).start()
      }, 380)
    }

    setTimeout(() => {
      setPDelta('')
      setODelta('')
      if (newP.hp <= 0 || newO.hp <= 0) {
        setPhase('finished')
      } else {
        setPlayerAction(null)
        setOpponentAction(null)
        setRound(r => r + 1)
        setPhase('choosing')
        startTimer()
      }
    }, 3200)
  }, [chose, startTimer, playerMods, playerMaxHP, playerType, playerLevel, opponent.creatureType,
      opponent.level, opponentCounterBonus, opponentMaxHP, playerLoadout, opponentLoadout, round,
      pPassiveLevel, oPassiveLevel, playerShake, opponentShake])

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('choosing')
      startTimer()
    }, 1600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase === 'resolving') {
      clashAnim.setValue(0)
      Animated.timing(clashAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start()
    } else {
      clashAnim.setValue(0)
    }
  }, [phase, clashAnim])

  // ── Difficulty picker (shown before combat starts) ──────
  if (difficulty === null) {
    const DIFF_OPTIONS: { key: Difficulty; label: string; sub: string; color: string; emoji: string }[] = [
      { key: 'easy',   label: 'Facile',    sub: '+1 énergie au départ · timer long · IA qui hésite · XP réduite', color: '#22C55E', emoji: '😊' },
      { key: 'medium', label: 'Moyen',     sub: 'Règles normales · IA réactive · XP standard',                    color: '#F59E0B', emoji: '⚔️' },
      { key: 'hard',   label: 'Difficile', sub: 'IA tactique · combos de monstre · timer un peu court · grosse XP', color: '#EF4444', emoji: '💀' },
    ]
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: retro.gold, fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, marginBottom: 4, fontWeight: '900' }}>COMBAT vs {opponent.creatureName}</Text>
        <Text style={{ color: retro.white, fontSize: 22, fontWeight: '900', fontFamily: 'monospace', marginBottom: 28 }}>Choisir la difficulté</Text>
        {DIFF_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={{
              width: '100%',
              backgroundColor: opt.key === 'hard' ? retro.night : retro.ink2,
              borderWidth: 3,
              borderColor: opt.color,
              borderRadius: 4,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              shadowColor: opt.color,
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 5,
            }}
            onPress={() => handleSelectDifficulty(opt.key)}
            activeOpacity={0.8}
          >
            <View style={{ width: 44, height: 44, backgroundColor: retro.ink, borderWidth: 2, borderColor: opt.color, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: opt.color, fontSize: 17, fontWeight: '900', fontFamily: 'monospace' }}>{opt.label}</Text>
              <Text style={{ color: retro.faded, fontSize: 12, marginTop: 3, fontFamily: 'monospace' }}>{opt.sub}</Text>
            </View>
            <Text style={{ color: opt.color, fontSize: 20, fontWeight: '900', fontFamily: 'monospace' }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const won = pState.hp > 0 && oState.hp <= 0
  const xpGained = won
    ? (isAdventure ? difficultyRules.adventureWinXP : difficultyRules.winXP)
    : difficultyRules.lossXP

  const playerSprite  = SPRITES[spriteKey(playerType, playerLevel)]
  const opponentSprite = SPRITES[spriteKey(opponent.creatureType, opponent.level)]

  const opponentFogged = hasStatus(oState, 'fog')

  // Clash animation interpolations
  const clashOpacity = clashAnim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] })
  const meChipX = clashAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] })
  const enChipX = clashAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] })
  const vsScale = clashAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1.3, 1] })

  return (
    <View style={s.root}>

      {/* HEADER: round badge only */}
      <View style={s.header}>
        <View style={s.roundBadge}>
          <Text style={s.roundText}>TOUR </Text>
          <Text style={[s.roundText, s.roundNum]}>{round}</Text>
        </View>
      </View>

      {/* ARENA */}
      <View style={s.arena}>
        <View style={s.arenaPixelGrid} pointerEvents="none" />
        <View style={s.arenaCenterLine} pointerEvents="none" />

        {/* ENEMY */}
        <View style={s.fighterRow}>
          <Animated.View style={{ transform: [{ translateX: opponentShake }] }}>
            <View style={[s.stage, { borderColor: oColor + '66' }]}>
              <View style={s.stageFloor} />
              <Image source={opponentSprite} style={[s.stageSprite, { transform: [{ scaleX: -1 }] }]} resizeMode="contain" />
              {oDelta !== '' && (
                <Animated.Text style={[s.dmgFloat, {
                  color: oDelta.startsWith('-') ? '#FF4444' : '#6BFF8B',
                  opacity: oDmgOpacity,
                  transform: [{ translateY: oDmgY }],
                }]}>
                  {oDelta}
                </Animated.Text>
              )}
            </View>
          </Animated.View>
          <View style={s.fighterInfo}>
            <View style={s.nameRow}>
              <Text style={s.fighterName} numberOfLines={1}>{opponent.creatureName}</Text>
              <View style={[s.lvlBadge, { backgroundColor: oColor }]}>
                <Text style={s.lvlText}>Nv {opponent.level}</Text>
              </View>
              {oState.statuses.filter(st => st.turnsLeft > 0).map((st, i) => (
                <Text key={i} style={s.statusEmoji}>{STATUS_ICONS[st.type]}</Text>
              ))}
            </View>
            <HPBar hp={oState.hp} maxHp={opponentMaxHP} color={oColor} />
            <View style={s.subRow}>
              {playerMods.hideOpponentEnergy || opponentFogged
                ? <Text style={s.hiddenEnergy}>⚡ ???</Text>
                : <EnergyPips energy={oState.energy} maxEnergy={OPPONENT_MAX_ENERGY} color={oColor} />
              }
            </View>
            {opponentHistory.length > 0 && (
              <View style={s.histRow}>
                <Text style={s.histLabel}>JOUÉ</Text>
                {opponentHistory.map((icon, i) => (
                  <View key={i} style={s.histBadge}><Text style={s.histIcon}>{icon}</Text></View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* CENTER ZONE: timer bar during choosing, clash chips during resolving */}
        <View style={s.centerZone}>
          {phase === 'resolving' && playerAction ? (
            <>
              <Animated.View style={{ opacity: clashOpacity, transform: [{ translateX: meChipX }] }}>
                <ClashChip action={playerAction} textColor="#F3EEFE" />
              </Animated.View>
              <Animated.Text style={[s.clashVs, { opacity: clashOpacity, transform: [{ scale: vsScale }] }]}>
                VS
              </Animated.Text>
              <Animated.View style={{ opacity: clashOpacity, transform: [{ translateX: enChipX }] }}>
                <ClashChip action={hasStatus(oState, 'smoke') ? null : opponentAction} textColor="#FF4444" />
              </Animated.View>
            </>
          ) : (
            <>
              <View style={s.timerBarBg}>
                <Animated.View style={[s.timerBarFill, {
                  width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }]} />
              </View>
              <Text style={[s.timerNum, phase !== 'choosing' && s.timerDim]}>
                {phase === 'choosing' ? `${timeLeft}s` : ''}
              </Text>
            </>
          )}
        </View>

        {/* PLAYER */}
        <View style={[s.fighterRow, s.fighterRowMe]}>
          <View style={[s.fighterInfo, s.fighterInfoMe]}>
            <View style={[s.nameRow, s.nameRowMe]}>
              <Text style={s.fighterName} numberOfLines={1}>{player.name}</Text>
              <View style={[s.lvlBadge, { backgroundColor: pColor }]}>
                <Text style={s.lvlText}>Nv {playerLevel}</Text>
              </View>
              {pState.statuses.filter(st => st.turnsLeft > 0).map((st, i) => (
                <Text key={i} style={s.statusEmoji}>{STATUS_ICONS[st.type]}</Text>
              ))}
            </View>
            <HPBar hp={pState.hp} maxHp={playerMaxHP} color={pColor} />
            <View style={[s.subRow, s.subRowMe]}>
              <EnergyPips energy={pState.energy} maxEnergy={playerMods.maxEnergy} color={pColor} />
              {playerType === 'ignis' && (
                <View style={s.embersRow}>
                  {[0, 1, 2].map(i => (
                    <Text key={i} style={[s.emberDot, { opacity: i < pState.embers ? 1 : 0.2 }]}>🔥</Text>
                  ))}
                </View>
              )}
            </View>
            {playerHistory.length > 0 && (
              <View style={[s.histRow, s.histRowMe]}>
                <Text style={s.histLabel}>JOUÉ</Text>
                {playerHistory.map((icon, i) => (
                  <View key={i} style={s.histBadge}><Text style={s.histIcon}>{icon}</Text></View>
                ))}
              </View>
            )}
          </View>
          <Animated.View style={{ transform: [{ translateX: playerShake }] }}>
            <View style={[s.stage, { borderColor: pColor + '66' }]}>
              <View style={s.stageFloor} />
              <Image source={playerSprite} style={s.stageSprite} resizeMode="contain" />
              {pDelta !== '' && (
                <Animated.Text style={[s.dmgFloat, {
                  color: pDelta.startsWith('-') ? '#FF4444' : '#6BFF8B',
                  opacity: pDmgOpacity,
                  transform: [{ translateY: pDmgY }],
                }]}>
                  {pDelta}
                </Animated.Text>
              )}
            </View>
          </Animated.View>
        </View>

      </View>

      {/* HINT BAR / COMBAT LOG */}
      <View style={[s.hintBar, phase === 'resolving' && s.hintBarLog]}>
        {phase === 'resolving' ? (
          log.split('\n').filter(Boolean).map((line, i) => {
            const isP = line.startsWith('>')
            const isE = line.startsWith('<')
            const text = (isP || isE) ? line.slice(1) : line
            return (
              <Text key={i} style={[s.logLine, isP ? s.logPlayer : isE ? s.logEnemy : s.logSystem]}>
                {isP ? '▸ ' : isE ? '◂ ' : '  '}{text}
              </Text>
            )
          })
        ) : (
          <Text style={s.hintText}>
            {phase === 'choosing' ? "Lis l'énergie adverse · choisis vite" : ''}
          </Text>
        )}
      </View>

      {/* DECK — always rendered to avoid layout shift */}
      <View
        pointerEvents={phase === 'choosing' ? 'auto' : 'none'}
        style={[s.deck, phase !== 'choosing' && s.deckDisabled]}
      >
        <View style={s.baseActions}>
          <TouchableOpacity
            style={[s.defendBtn, playerDefendLocked && s.defendBtnLocked]}
            disabled={playerDefendLocked}
            onPress={() => commitAction({ kind: 'defend' })}
          >
            <Text style={s.baseActionIcon}>🛡️</Text>
            <Text style={s.baseActionLabel}>{playerDefendLocked ? 'RECHARGE' : 'DÉFENDRE'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.chargeBtn} onPress={() => commitAction({ kind: 'charge' })}>
            <Text style={s.baseActionIcon}>🔋</Text>
            <Text style={s.baseActionLabel}>CHARGER</Text>
            <Text style={s.chargeSubText}>{pState.energy}/{playerMods.maxEnergy}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.spellRow}>
          {([0, 1] as const).map(i => (
            <SpellCard key={playerLoadout[i]} spellId={playerLoadout[i]} state={pState}
              maxEnergy={playerMods.maxEnergy} color={pColor} displayMult={playerDisplayMult}
              onPress={() => commitAction({ kind: 'spell', spellId: playerLoadout[i] })} />
          ))}
        </View>
        <View style={s.spellRow}>
          {([2, 3] as const).map(i => (
            <SpellCard key={playerLoadout[i]} spellId={playerLoadout[i]} state={pState}
              maxEnergy={playerMods.maxEnergy} color={pColor} displayMult={playerDisplayMult}
              onPress={() => commitAction({ kind: 'spell', spellId: playerLoadout[i] })} />
          ))}
        </View>
      </View>

      {/* INTRO overlay */}
      {phase === 'intro' && (
        <View style={s.overlay}>
          <Text style={s.introTitle}>COMBAT !</Text>
          <Text style={s.introSub}>{player.name} vs {opponent.creatureName}</Text>
          <DebuffPanel mods={playerMods} playerType={playerType} opponentType={opponent.creatureType} />
        </View>
      )}

      {/* FINISH overlay */}
      {phase === 'finished' && (
        <View style={s.overlay}>
          <Text style={s.finishEmoji}>{won ? '🏆' : '💀'}</Text>
          <Text style={s.finishTitle}>{won ? 'VICTOIRE !' : 'DÉFAITE...'}</Text>
          <Text style={s.finishXP}>+{xpGained} XP</Text>
          <TouchableOpacity style={s.finishBtn} onPress={() => onFinish(won, xpGained)}>
            <Text style={s.finishBtnText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: retro.ink },

  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 6 : 54,
    paddingHorizontal: 16, paddingBottom: 6,
  },
  roundBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: retro.paper2, borderWidth: 2, borderColor: retro.line,
    borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6,
  },
  roundText: { fontFamily: 'monospace', fontSize: 10, color: retro.ink, letterSpacing: 0.5, fontWeight: '900' },
  roundNum: { color: retro.red },

  // ARENA
  arena: {
    flex: 1, paddingHorizontal: 14, paddingBottom: 4,
    justifyContent: 'space-between',
    backgroundColor: retro.paper,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: retro.line,
  },
  arenaPixelGrid: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 18,
    bottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(32,40,61,0.18)',
  },
  arenaCenterLine: {
    position: 'absolute',
    left: 36,
    right: 36,
    top: '50%',
    height: 4,
    backgroundColor: 'rgba(48,98,48,0.22)',
  },

  // CENTER ZONE (timer + clash)
  centerZone: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  timerBarBg: {
    flex: 1, height: 14, borderRadius: 0,
    backgroundColor: retro.paper2, borderWidth: 2, borderColor: retro.line, overflow: 'hidden',
  },
  timerBarFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 0,
    backgroundColor: retro.red,
  },
  timerNum: { fontFamily: 'monospace', fontSize: 20, fontWeight: '900', color: retro.gold, minWidth: 36, textAlign: 'right' },
  timerDim: { color: retro.muted },

  fighterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fighterRowMe: { flexDirection: 'row-reverse' },
  fighterInfo: { flex: 1, gap: 5 },
  fighterInfoMe: {},

  stage: {
    width: 96, height: 96, borderRadius: 4,
    backgroundColor: retro.screenSoft, borderWidth: 3, borderColor: retro.line,
    alignItems: 'center', justifyContent: 'flex-end',
    overflow: 'visible', position: 'relative',
    ...retroShadow,
  },
  stageFloor: {
    position: 'absolute', bottom: 10, width: 62, height: 10,
    borderRadius: 0, backgroundColor: 'rgba(32,40,61,0.32)',
  },
  stageSprite: { width: 70, height: 74, marginBottom: 8 },
  dmgFloat: {
    position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center',
    fontSize: 28, fontWeight: '900', fontFamily: 'monospace',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    zIndex: 10,
  },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  nameRowMe: { flexDirection: 'row-reverse' },
  fighterName: { color: retro.ink, fontSize: 14, fontWeight: '900', flexShrink: 1, fontFamily: 'monospace' },
  lvlBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 0, borderWidth: 1, borderColor: retro.line },
  lvlText: { fontSize: 9, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  statusEmoji: { fontSize: 12 },

  hpBarBg: {
    height: 16, backgroundColor: retro.paper2, borderRadius: 0,
    borderWidth: 2, borderColor: retro.line, overflow: 'hidden',
    position: 'relative', justifyContent: 'center',
  },
  hpBarFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 0 },
  hpBarText: {
    position: 'absolute', left: 0, right: 0, textAlign: 'center',
    fontSize: 9, fontWeight: '900', fontFamily: 'monospace', color: retro.white,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subRowMe: { justifyContent: 'flex-end' },
  hiddenEnergy: { color: retro.paper2, fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },

  pipRow: { flexDirection: 'row', gap: 4 },
  pip: {
    width: 22, height: 9, borderRadius: 0,
    backgroundColor: retro.paper2, borderWidth: 1, borderColor: retro.line,
  },

  embersRow: { flexDirection: 'row', gap: 2 },
  emberDot: { fontSize: 12 },

  histRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  histRowMe: { justifyContent: 'flex-end' },
  histLabel: { fontFamily: 'monospace', fontSize: 7, color: retro.paper2, letterSpacing: 0.5 },
  histBadge: {
    width: 24, height: 24, borderRadius: 0,
    backgroundColor: retro.paper2, borderWidth: 1, borderColor: retro.line,
    alignItems: 'center', justifyContent: 'center',
  },
  histIcon: { fontSize: 13 },

  // CLASH CHIPS (reuse centerZone for layout)
  clashChip: {
    backgroundColor: retro.paper2, borderWidth: 2, borderColor: retro.line,
    borderRadius: 4, paddingHorizontal: 10, paddingVertical: 7, maxWidth: 135,
  },
  clashChipText: { fontSize: 9, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 0.3 },
  clashVs: { color: retro.gold, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },

  // HINT BAR / LOG
  hintBar: {
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  hintBarLog: {
    minHeight: 80,
    backgroundColor: retro.ink,
    borderTopWidth: 3,
    borderTopColor: retro.line,
    paddingVertical: 8,
  },
  hintText: {
    textAlign: 'center', fontSize: 11, color: retro.paper2, fontWeight: '900', fontFamily: 'monospace',
  },
  logLine:   { fontSize: 10, fontWeight: '900', lineHeight: 16, fontFamily: 'monospace' },
  logPlayer: { color: retro.screenSoft },
  logEnemy:  { color: retro.orange },
  logSystem: { color: retro.paper2 },

  // DECK
  deck: { paddingHorizontal: 12, paddingBottom: 16, gap: 8 },
  deckDisabled: { opacity: 0.3 },

  baseActions: { flexDirection: 'row', gap: 8 },
  defendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: retro.blue, borderRadius: 4, paddingVertical: 12,
    borderWidth: 3, borderColor: retro.line, ...retroShadow,
  },
  defendBtnLocked: {
    backgroundColor: retro.muted,
    opacity: 0.65,
  },
  chargeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: retro.red, borderRadius: 4, paddingVertical: 12,
    borderWidth: 3, borderColor: retro.line, ...retroShadow,
  },
  baseActionIcon: { fontSize: 18 },
  baseActionLabel: { color: retro.white, fontWeight: '900', fontSize: 12, fontFamily: 'monospace', letterSpacing: 0.5 },
  chargeSubText: { color: retro.paper2, fontSize: 10, fontFamily: 'monospace' },

  spellRow: { flexDirection: 'row', gap: 8 },
  spellCard: {
    flex: 1, backgroundColor: retro.white, borderRadius: 4,
    padding: 10, borderWidth: 3, borderColor: retro.line, gap: 5,
    ...retroShadow,
  },
  spellCardLocked: { opacity: 0.4 },
  spellCdTag: {
    position: 'absolute', top: 7, right: 8,
    fontSize: 8, color: retro.red, fontFamily: 'monospace', fontWeight: '900',
  },
  spellCardTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  spellIco: {
    width: 28, height: 28, borderRadius: 0,
    backgroundColor: retro.paper2, borderWidth: 1, borderColor: retro.line,
    alignItems: 'center', justifyContent: 'center',
  },
  spellIcoText: { fontSize: 15 },
  spellCardName: { color: retro.ink, fontSize: 10, fontWeight: '900', fontFamily: 'monospace', flex: 1, lineHeight: 14 },
  spellCardNameDim: { color: retro.muted },
  spellCostRow: { flexDirection: 'row', gap: 3 },
  spellCostBar: {
    flex: 1, height: 7, borderRadius: 0,
    backgroundColor: retro.paper2, borderWidth: 1, borderColor: retro.line,
  },
  spellCostBarLow: { backgroundColor: retro.paper, borderColor: retro.muted },
  spellRole: {
    fontSize: 9, color: retro.muted, fontWeight: '800',
    lineHeight: 13,
  },

  // OVERLAYS
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  introTitle: { fontSize: 48, fontWeight: '900', color: retro.gold, letterSpacing: 4, fontFamily: 'monospace' },
  introSub: { fontSize: 16, color: retro.paper2, fontWeight: '800' },

  debuffPanel: {
    backgroundColor: retro.white, borderRadius: 4,
    paddingHorizontal: 16, paddingVertical: 10,
    marginTop: 8, gap: 4, minWidth: 220, alignItems: 'flex-start',
    borderWidth: 3, borderColor: retro.line,
  },
  debuffTitle: {
    color: retro.red, fontSize: 11, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  debuffItem: { color: retro.ink, fontSize: 12, fontWeight: '800' },

  finishEmoji: { fontSize: 64 },
  finishTitle: { fontSize: 40, fontWeight: '900', color: retro.white, letterSpacing: 2, fontFamily: 'monospace' },
  finishXP: { fontSize: 22, color: retro.gold, fontWeight: '900', fontFamily: 'monospace' },
  finishBtn: {
    backgroundColor: retro.gold, paddingHorizontal: 48, paddingVertical: 16,
    borderRadius: 4, marginTop: 16, borderWidth: 3, borderColor: retro.line,
  },
  finishBtnText: { color: retro.ink, fontSize: 17, fontWeight: '900', fontFamily: 'monospace' },
})
