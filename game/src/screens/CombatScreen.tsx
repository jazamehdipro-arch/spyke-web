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
import TutorialCoach, { CoachStep } from '../components/TutorialCoach'

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
  ombra_action: require('../../assets/sprites/ombra_e1_clean.png'),
  ombra_e2:     require('../../assets/sprites/ombra_e2_f1.png'),
  ombra_e3:     require('../../assets/sprites/ombra_e3_f1.png'),
  magma_action: require('../../assets/sprites/magma_e1_clean.png'),
  magma_e2:     require('../../assets/sprites/magma_e2_f1.png'),
  magma_e3:     require('../../assets/sprites/magma_e3_f1.png'),
  abyssal_action: require('../../assets/sprites/abyssal_e1_clean.png'),
  abyssal_e2:     require('../../assets/sprites/abyssal_e2_f1.png'),
  abyssal_e3:     require('../../assets/sprites/abyssal_e3_f1.png'),
  sable_action: require('../../assets/sprites/sable_e1_clean.png'),
  sable_e2:     require('../../assets/sprites/sable_e2_f1.png'),
  sable_e3:     require('../../assets/sprites/sable_e3_f1.png'),
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
  ignis:   { hpMult: 0.85, baseDamageMult: 1.16, startEnergy: 0, dodgeBase: 0.0  },
  nemo:    { hpMult: 1.15, baseDamageMult: 0.77, startEnergy: 0, dodgeBase: 0.0  },
  sylva:   { hpMult: 1.0,  baseDamageMult: 0.93, startEnergy: 0, dodgeBase: 0.17 },
  zapp:    { hpMult: 0.9,  baseDamageMult: 1.0,  startEnergy: 0, dodgeBase: 0.0  },
  ombra:   { hpMult: 1.0,  baseDamageMult: 0.98, startEnergy: 0, dodgeBase: 0.20 },
  magma:   { hpMult: 1.15, baseDamageMult: 1.12, startEnergy: 0, dodgeBase: 0.0  },
  abyssal: { hpMult: 1.25, baseDamageMult: 0.82, startEnergy: 0, dodgeBase: 0.0  },
  sable:   { hpMult: 0.92, baseDamageMult: 1.05, startEnergy: 0, dodgeBase: 0.05 },
}

// ─── counter triangle ────────────────────────────────────
const COUNTER_TABLE: Record<CreatureType, CreatureType> = {
  ignis:   'nemo',
  nemo:    'sylva',
  sylva:   'zapp',
  zapp:    'ignis',
  ombra:   'sable',
  sable:   'abyssal',
  abyssal: 'magma',
  magma:   'ombra',
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
  damageMult *= GLOBAL_DMG_BOOST * levelMult(creature.stats.level)

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
  return profile.baseDamageMult * GLOBAL_DMG_BOOST * levelMult(level)
}

const OPPONENT_MAX_ENERGY = 5
const TIMER_SECONDS = 10
const BASE_HP = 68
const E1_BASE_HP: Record<CreatureType, number> = {
  ignis:   63,
  nemo:    75,
  sylva:   68,
  zapp:    63,
  ombra:   70,
  magma:   80,
  abyssal: 85,
  sable:   64,
}

function calcHP(level: number, hpMult = 1.0, creatureType?: CreatureType) {
  if (creatureType) return Math.round(E1_BASE_HP[creatureType] * levelMult(level) * hpMult)
  return Math.round(BASE_HP * levelMult(level) * hpMult)
}

function levelMult(level: number): number {
  return 1 + 0.03 * (Math.max(1, level) - 1)
}

function scaleE1Value(base: number, _passiveLevel: 1 | 2 | 3, level: number): number {
  return Math.round(base * levelMult(level))
}

function scaleLevelValue(base: number, level: number): number {
  return Math.round(base * levelMult(level))
}

function scaleFromLevel10(base: number, level: number): number {
  return Math.round(base * (1 + 0.03 * (Math.max(10, level) - 10)))
}

const DIRECT_LEVEL_SCALED_SPELLS = new Set<SpellId>([
  'frappe_ardente',
  'explosion',
  'immolation',
  'siphon',
  'regeneration',
  'raz_de_maree',
  'coup_voile',
  'embuscade',
  'decharge',
  'arc_paralysant',
  'surcharge',
  'supernova',
  'foudroiement',
  'maree_regeneratrice',
  'danse_des_ombres',
])

function usesDirectLevelScaling(spellId: SpellId): boolean {
  return DIRECT_LEVEL_SCALED_SPELLS.has(spellId)
}

function getStartingEmbers(type: CreatureType, passiveLevel: 1 | 2 | 3): number {
  return type === 'ignis' && passiveLevel >= 3 ? 1 : 0
}

function e1SpellDescription(spellId: SpellId, level: number): string | null {
  const s = (base: number) => scaleE1Value(base, 1, level)
  switch (spellId) {
    case 'frappe_ardente': return `${s(8)} dégâts + 1 braise (max 3)`
    case 'immolation': return `-5 PV sur soi → ${s(20)} dégâts garantis`
    case 'explosion': return `${s(20)} dégâts, ${s(30)} dégâts dès 2 braises`
    case 'siphon': return `${s(10)} dégâts + vol de vie (+${s(2)} PV)`
    case 'regeneration': return `+${s(8)} PV, +${s(12)} PV sous 33% PV`
    case 'raz_de_maree': return `${s(20)} dégâts`
    case 'coup_voile': return `${s(7)} dégâts + -15% précision ennemie 2 tours`
    case 'embuscade': return `${s(14)} dégâts, ${s(25)} si Volute active ou ennemi raté`
    case 'decharge': return `${s(10)} dégâts — priorité`
    case 'arc_paralysant': return `${s(15)} dégâts + 30% paralysie 1 tour`
    case 'surcharge': return `${s(22)} dégâts — surfatigue prochain tour`
    default: return null
  }
}

function e2SpellDescription(spellId: SpellId, level: number): string | null {
  const s = (base: number) => scaleFromLevel10(base, level)
  switch (spellId) {
    case 'supernova': return `Necessite 2 braises. ${s(28)} degats +${s(4)}/braise, soigne 40%`
    case 'foudroiement': return `${s(16)} degats priorite, ${s(32)} si cible paralysee`
    case 'maree_regeneratrice': return `2 tours : +${s(7)} PV/tour et -25% degats subis`
    case 'danse_des_ombres': return `2 tours : +40% esquive, renvoie ${s(14)} degats/esquive`
    default: return null
  }
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

function targetLeastExpensiveSpell(target: Combatant, loadout: SpellLoadout): string {
  let worst: SpellId = loadout[0]
  let worstCost = Infinity
  for (const spellId of loadout) {
    const spell = SPELL_CATALOG[spellId]
    if (spell.energyCost < worstCost && !(target.cooldowns[spellId] && (target.cooldowns[spellId] ?? 0) > 0)) {
      worstCost = spell.energyCost
      worst = spellId
    }
  }
  return worst
}

function resolveSpell(
  spellId: SpellId,
  caster: Combatant,
  target: Combatant,
  _casterType: CreatureType,
  _targetType: CreatureType,
  passiveLevel: 1 | 2 | 3,
  casterLevel: number,
  casterMaxHp: number,
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
      const dmg = scaleLevelValue(8, casterLevel)
      return {
        ...empty,
        targetHpDelta: -dmg,
        newCasterEmbers: newEmbers,
        log: `Frappe ardente ! -${dmg} HP. Braises: ${newEmbers}`,
      }
    }
    case 'explosion': {
      const embers = caster.embers
      const braiseBonus = embers >= 2
      const base = scaleLevelValue(20, casterLevel)
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
        casterStatusesToAdd: [{ type: 'barrier', turnsLeft: 1, value: 100, data: 'reflect' }],
        newCasterEmbers: newEmbers,
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
      const dmg = scaleLevelValue(20, casterLevel)
      return {
        ...empty,
        casterHpDelta: -5,
        targetHpDelta: -dmg,
        log: `Immolation ! -5 PV sur soi -> -${dmg} HP ennemi (garanti)`,
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
    case 'supernova': {
      const embers = caster.embers
      if (embers < 2) {
        return { ...empty, log: 'Supernova echoue : il faut au moins 2 braises.' }
      }
      const dmg = scaleFromLevel10(28, casterLevel) + scaleFromLevel10(4, casterLevel) * embers
      const heal = Math.round(dmg * 0.4)
      return {
        ...empty,
        casterHpDelta: heal,
        targetHpDelta: -dmg,
        newCasterEmbers: 0,
        log: `Supernova ! -${dmg} HP, +${heal} PV (${embers} braises consumees)`,
      }
    }
    case 'vague': {
      return {
        ...empty,
        targetHpDelta: -7,
        log: '🌊 Vague ! -7 HP',
      }
    }
    case 'siphon': {
      const heal = scaleLevelValue(2, casterLevel)
      const dmg = scaleLevelValue(10, casterLevel)
      return {
        ...empty,
        casterHpDelta: heal,
        targetHpDelta: -dmg,
        log: `Siphon ! -${dmg} HP + vol de vie (+${heal} PV)`,
      }
    }
    case 'regeneration': {
      const lowHp = caster.hp < casterMaxHp * 0.33
      const heal = scaleLevelValue(lowHp ? 12 : 8, casterLevel)
      return {
        ...empty,
        casterHpDelta: heal,
        log: `Regeneration ! +${heal} PV${lowHp ? ' (bas PV !)' : ''}`,
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
        targetStatusesToAdd: [{ type: 'cursed', turnsLeft: 1, data: blocked }],
        log: `Malediction ! Sort ${SPELL_CATALOG[blocked as SpellId]?.name ?? blocked} bloque 1 tour`,
      }
    }
    case 'raz_de_maree': {
      const dmg = scaleLevelValue(20, casterLevel)
      return {
        ...empty,
        targetHpDelta: -dmg,
        log: `Raz-de-maree ! -${dmg} HP`,
      }
    }
    case 'maree_curative': {
      const lowHp = caster.hp < 25
      const heal = scaleLevelValue(lowHp ? 11 : 8, casterLevel)
      return {
        ...empty,
        casterHpDelta: heal,
        targetHpDelta: -Math.round(13.3),
        log: `🌊💚 Marée curative ! -13 HP ennemi + soin +${heal} PV${lowHp ? ' (sustain !)' : ''}`,
      }
    }
    case 'maree_regeneratrice': {
      const healPerTurn = scaleFromLevel10(7, casterLevel)
      return {
        ...empty,
        casterStatusesToAdd: [
          { type: 'regen_tide', turnsLeft: 2, value: healPerTurn },
          { type: 'barrier', turnsLeft: 2, value: 25, data: 'regen_tide' },
        ],
        log: `Maree regeneratrice ! +${healPerTurn} PV/tour et -25% degats subis pendant 2 tours`,
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
      const dmg = scaleLevelValue(7, casterLevel)
      const fogStatus: StatusEffect[] = [{ type: 'fog', turnsLeft: 2, value: 15, data: 'accuracy_down' }]
      return {
        ...empty,
        targetHpDelta: -dmg,
        targetStatusesToAdd: fogStatus,
        log: `Coup voile ! -${dmg} HP + brouillage ennemi !`,
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
        casterStatusesToAdd: [{ type: 'dodge_up', turnsLeft: 3, value: 20 }],
        log: 'Volute ! +20% esquive 3 tours',
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
    case 'danse_des_ombres': {
      const reflected = scaleFromLevel10(14, casterLevel)
      return {
        ...empty,
        casterStatusesToAdd: [
          { type: 'dodge_up', turnsLeft: 2, value: 40, data: 'shadow_dance' },
          { type: 'shadow_dance', turnsLeft: 2, value: reflected },
        ],
        log: `Danse des ombres ! +40% esquive, chaque esquive renvoie ${reflected} PV pendant 2 tours`,
      }
    }
    case 'decharge': {
      const dmg = scaleLevelValue(10, casterLevel)
      return {
        ...empty,
        targetHpDelta: -dmg,
        log: `Decharge ! -${dmg} HP (priorite)`,
      }
    }
    case 'arc_paralysant': {
      const paralyzed = Math.random() < 0.3
      const paralysisStatus: StatusEffect[] = paralyzed ? [{ type: 'paralyzed', turnsLeft: 2 }] : []
      const dmg = scaleLevelValue(15, casterLevel)
      return {
        ...empty,
        targetHpDelta: -dmg,
        targetStatusesToAdd: paralysisStatus,
        log: `Arc paralysant ! -${dmg} HP${paralyzed ? ' - Ennemi paralyse !' : ' - Rate la paralysie.'}`,
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
      const dmg = scaleLevelValue(22, casterLevel)
      return {
        ...empty,
        targetHpDelta: -dmg,
        casterStatusesToAdd: [{ type: 'exhausted', turnsLeft: 2, value: 2 }],
        log: `Surcharge ! -${dmg} HP + epuisement prochain tour`,
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

    // ── ombra ──
    case 'foudroiement': {
      const paralyzed = hasStatus(target, 'paralyzed')
      const dmg = scaleFromLevel10(paralyzed ? 32 : 16, casterLevel)
      return {
        ...empty,
        targetHpDelta: -dmg,
        log: `Foudroiement ! -${dmg} HP (priorite)${paralyzed ? ' cible paralysee !' : ''}`,
      }
    }
    case 'griffe_d_ombre': {
      return {
        ...empty,
        targetHpDelta: -10,
        casterStatusesToAdd: [{ type: 'dodge_up', turnsLeft: 1, value: 15 }],
        log: '🌑 Griffe d\'ombre ! -10 HP + esquive +15%',
      }
    }
    case 'venin_sylvestre': {
      return {
        ...empty,
        targetHpDelta: -5,
        targetStatusesToAdd: [{ type: 'burn', turnsLeft: 3, value: 3 }],
        log: '🌿🐍 Venin sylvestre ! -5 HP + brûlure 3 tours (3/tour)',
      }
    }
    case 'bond_furtif': {
      return {
        ...empty,
        targetHpDelta: -14,
        casterStatusesToAdd: [{ type: 'smoke', turnsLeft: 1 }],
        log: '🦊 Bond furtif ! -14 HP + entre dans l\'ombre',
      }
    }
    case 'embuscade_sauvage': {
      const inShadow = hasStatus(caster, 'smoke')
      const dmg = inShadow ? 24 : 8
      return {
        ...empty,
        targetHpDelta: -dmg,
        casterStatusesToRemove: inShadow ? ['smoke'] : [],
        log: inShadow
          ? `🗡️🌑 Embuscade sauvage ! -${dmg} HP depuis l'ombre !`
          : `🗡️ Embuscade sauvage ! -${dmg} HP`,
      }
    }
    case 'hurlement_bete': {
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'provoked', turnsLeft: 2 }],
        casterStatusesToAdd: [{ type: 'dodge_up', turnsLeft: 2, value: 15 }],
        log: '🐺 Hurlement bête ! Ennemi provoqué 2 tours + esquive +15%',
      }
    }
    case 'forme_fantome': {
      return {
        ...empty,
        casterStatusesToAdd: [
          { type: 'dodge_ready', turnsLeft: 1 },
          { type: 'barrier', turnsLeft: 2, value: 30 },
        ],
        log: '👻 Forme fantôme ! Prochain coup esquivé + -30% dégâts 2 tours',
      }
    }

    // ── magma ──
    case 'frappe_terrestre': {
      return {
        ...empty,
        targetHpDelta: -11,
        log: '🪨 Frappe terrestre ! -11 HP',
      }
    }
    case 'eruption': {
      return {
        ...empty,
        targetHpDelta: -16,
        targetStatusesToAdd: [{ type: 'provoked', turnsLeft: 1 }],
        log: '🌋 Éruption ! -16 HP + ennemi provoqué !',
      }
    }
    case 'carapace_magma': {
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'barrier', turnsLeft: 2, value: 40 }],
        log: '🛡️🔥 Carapace magma ! -40% dégâts reçus 2 tours',
      }
    }
    case 'fracas_sismique': {
      return {
        ...empty,
        targetHpDelta: -20,
        targetStatusesToAdd: [{ type: 'exhausted', turnsLeft: 1, value: 1 }],
        log: '💥🪨 Fracas sismique ! -20 HP + ennemi épuisé !',
      }
    }
    case 'fusion_volcanique': {
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'damage_boost', turnsLeft: 99, value: 60 }],
        log: '🌋🔥 Fusion volcanique ! Prochain dégât +60%',
      }
    }
    case 'magma_supreme': {
      return {
        ...empty,
        targetHpDelta: -28,
        log: '☄️ Magma suprême ! -28 HP',
      }
    }

    // ── abyssal ──
    case 'tentacule': {
      const paralyzed = Math.random() < 0.3
      return {
        ...empty,
        targetHpDelta: -8,
        targetStatusesToAdd: paralyzed ? [{ type: 'paralyzed', turnsLeft: 1 }] : [],
        log: `🐙 Tentacule ! -8 HP${paralyzed ? ' · Ennemi paralysé !' : ''}`,
      }
    }
    case 'succion_vitale': {
      return {
        ...empty,
        targetHpDelta: -12,
        casterHpDelta: scaleLevelValue(6, casterLevel),
        log: '🌊💚 Succion vitale ! -12 HP + soin +6 PV',
      }
    }
    case 'encre_noire': {
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'fog', turnsLeft: 2, value: 20, data: 'accuracy_down' }],
        log: '🦑 Encre noire ! Brouillage ennemi : 20% miss 2 tours',
      }
    }
    case 'vortex_abyssal': {
      return {
        ...empty,
        targetHpDelta: -18,
        log: '🌀🌊 Vortex abyssal ! -18 HP',
      }
    }
    case 'malediction_profonde': {
      if (!targetLoadout) return { ...empty, log: '🔮🌊 Malédiction profonde !' }
      const cursedId = targetMostExpensiveSpell(target, targetLoadout)
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'cursed', turnsLeft: 2, data: cursedId }],
        log: `🔮🌊 Malédiction profonde ! ${cursedId} bloqué 2 tours`,
      }
    }
    case 'dissolution': {
      return {
        ...empty,
        targetHpDelta: -22,
        targetStatusesToAdd: [{ type: 'exhausted', turnsLeft: 2, value: 2 }],
        log: '🌑🌊 Dissolution ! -22 HP + épuisement 2 tours',
      }
    }

    // ── sable ──
    case 'frappe_des_sables': {
      return {
        ...empty,
        targetHpDelta: -9,
        targetStatusesToAdd: [{ type: 'exhausted', turnsLeft: 1, value: 1 }],
        log: '🏜️ Frappe des sables ! -9 HP + ennemi épuisé',
      }
    }
    case 'tourbillon_sableux': {
      return {
        ...empty,
        targetHpDelta: -12,
        targetStatusesToAdd: [{ type: 'burn', turnsLeft: 2, value: 8 }],
        log: '🌪️🏜️ Tourbillon sableux ! -12 HP + brûlure 2 tours (8/tour)',
      }
    }
    case 'eclair_ancien': {
      const paralyzed = Math.random() < 0.25
      return {
        ...empty,
        targetHpDelta: -15,
        targetStatusesToAdd: paralyzed ? [{ type: 'paralyzed', turnsLeft: 1 }] : [],
        log: `⚡🏺 Éclair ancien ! -15 HP${paralyzed ? ' · Ennemi paralysé !' : ''}`,
      }
    }
    case 'mirage_sable': {
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'dodge_up', turnsLeft: 2, value: 30 }],
        log: '🌅 Mirage des sables ! +30% esquive 2 tours',
      }
    }
    case 'malefice_antique': {
      if (!targetLoadout) return { ...empty, log: '🪄 Maléfice antique !' }
      const cursedId = targetLeastExpensiveSpell(target, targetLoadout)
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'cursed', turnsLeft: 2, data: cursedId }],
        log: `🪄 Maléfice antique ! ${cursedId} bloqué 2 tours`,
      }
    }
    case 'tempete_de_sable': {
      return {
        ...empty,
        targetHpDelta: -24,
        log: '🌪️⚡ Tempête de sable ! 3×8 = -24 HP',
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
  if (spellId === 'supernova' && state.embers < 2) return false
  // Check cursed
  const cursed = getStatus(state, 'cursed')
  if (cursed && cursed.data === spellId) return false
  return true
}

function estimateSpellPressure(spellId: SpellId, caster: Combatant, passiveLevel: 1 | 2 | 3, level: number): number {
  const braise = caster.embers >= 2 ? 1.5 : 1
  switch (spellId) {
    case 'frappe_ardente': return scaleLevelValue(8, level)
    case 'explosion': return Math.round(scaleLevelValue(20, level) * braise)
    case 'immolation': return scaleLevelValue(20, level)
    case 'brasier': return Math.round(15 * braise) + 6
    case 'fournaise': return Math.round(11.3 * braise)
    case 'supernova': return caster.embers >= 2 ? scaleFromLevel10(28, level) + scaleFromLevel10(4, level) * caster.embers : 0
    case 'vague': return 7
    case 'siphon': return scaleLevelValue(10, level)
    case 'raz_de_maree': return scaleLevelValue(20, level)
    case 'maree_curative': return 18
    case 'maree_regeneratrice': return 0
    case 'abysse': return 20
    case 'coup_voile': return scaleLevelValue(7, level)
    case 'laceration_voilee': return 10
    case 'embuscade': return scaleLevelValue(hasStatus(caster, 'dodge_up') ? 25 : 14, level)
    case 'embuscade_parfaite': return hasStatus(caster, 'dodge_up') ? 17 : 10
    case 'danse_des_ombres': return 0
    case 'decharge': return scaleLevelValue(10, level)
    case 'arc_paralysant': return scaleLevelValue(15, level)
    case 'boost': return 0
    case 'rafale': return passiveLevel >= 3 ? 12 : 8
    case 'surcharge': return scaleLevelValue(22, level)
    case 'tempete': return 24
    case 'fulguration': return 12
    case 'foudroiement': return scaleFromLevel10(16, level)
    // ombra
    case 'griffe_d_ombre': return 10
    case 'venin_sylvestre': return 14
    case 'bond_furtif': return 14
    case 'embuscade_sauvage': return hasStatus(caster, 'smoke') ? 24 : 8
    case 'hurlement_bete': return 8
    case 'forme_fantome': return 0
    // magma
    case 'frappe_terrestre': return 11
    case 'eruption': return 18
    case 'carapace_magma': return 0
    case 'fracas_sismique': return 22
    case 'fusion_volcanique': return 0
    case 'magma_supreme': return 28
    // abyssal
    case 'tentacule': return 10
    case 'succion_vitale': return 18
    case 'encre_noire': return 0
    case 'vortex_abyssal': return 18
    case 'malediction_profonde': return 12
    case 'dissolution': return 28
    // sable
    case 'frappe_des_sables': return 11
    case 'tourbillon_sableux': return 20
    case 'eclair_ancien': return 16
    case 'mirage_sable': return 0
    case 'malefice_antique': return 8
    case 'tempete_de_sable': return 24
    default: return 0
  }
}

// ─── bot AI ─────────────────────────────────────────────
function chooseHardE1IgnisAction(
  botState: Combatant,
  playerState: Combatant,
  can: (id: SpellId) => boolean,
  defendLocked: boolean,
): CombatAction {
  const maxHp = E1_BASE_HP.ignis
  const underHalf = botState.hp <= maxHp / 2
  const explosionDamage = botState.embers >= 2 ? 30 : 20
  const immolationSelfDamage = 5
  const playerDodging = hasStatus(playerState, 'dodge_up') || hasStatus(playerState, 'dodge_ready')

  if (can('explosion') && playerState.hp <= explosionDamage) return { kind: 'spell', spellId: 'explosion' }
  if (can('immolation') && playerState.hp <= 20) {
    const selfKo = botState.hp <= immolationSelfDamage
    if (!selfKo || playerState.energy <= 0) return { kind: 'spell', spellId: 'immolation' }
  }
  if (can('frappe_ardente') && playerState.hp <= 8) return { kind: 'spell', spellId: 'frappe_ardente' }

  if (botState.embers >= 2 && can('explosion')) return { kind: 'spell', spellId: 'explosion' }

  if (can('carapace_chauffee')) {
    const carapaceChanceByEnergy = [0, 0.25, 0.4, 0.5, 0.6, 0.6]
    const baseChance = carapaceChanceByEnergy[Math.min(5, Math.max(0, playerState.energy))] ?? 0
    const chance = Math.min(0.9, baseChance + (underHalf ? 0.15 : 0))
    if (Math.random() < chance) return { kind: 'spell', spellId: 'carapace_chauffee' }
  } else if (underHalf && playerState.energy >= 3 && !defendLocked && Math.random() < 0.4) {
    return { kind: 'defend' }
  }

  if (botState.embers >= 2 && botState.energy < 4) {
    const safeToImmolate = can('immolation') && !underHalf
    if (safeToImmolate && Math.random() >= 0.8) return { kind: 'spell', spellId: 'immolation' }
    return { kind: 'charge' }
  }

  const attackChance =
    botState.energy <= 0 ? 0 :
    botState.energy === 1 ? 0.55 :
    botState.energy === 2 ? 0.7 :
    botState.energy === 3 ? 0.75 :
    0.95
  if (Math.random() >= attackChance) return { kind: 'charge' }

  let frappeWeight = underHalf ? 70 : 45
  let immolationWeight = underHalf ? 10 : 45
  let explosionWeight = underHalf ? 20 : 10

  if (botState.hp <= 12) {
    frappeWeight += immolationWeight
    immolationWeight = 0
  } else if (playerDodging) {
    frappeWeight = 70
    immolationWeight = 15
    explosionWeight = 15
  }

  const total = frappeWeight + immolationWeight + explosionWeight
  const roll = Math.random() * total
  let picked: SpellId = 'frappe_ardente'
  if (roll < frappeWeight) picked = 'frappe_ardente'
  else if (roll < frappeWeight + immolationWeight) picked = 'immolation'
  else picked = 'explosion'

  if (picked === 'frappe_ardente' && can('frappe_ardente')) return { kind: 'spell', spellId: 'frappe_ardente' }
  if (picked === 'immolation' && can('immolation')) return { kind: 'spell', spellId: 'immolation' }
  if (picked === 'explosion' && can('explosion')) return { kind: 'spell', spellId: 'explosion' }
  return { kind: 'charge' }
}

function chooseHardE1NemoAction(
  botState: Combatant,
  playerState: Combatant,
  can: (id: SpellId) => boolean,
  defendLocked: boolean,
): CombatAction {
  const maxHp = E1_BASE_HP.nemo
  const underHalf = botState.hp <= maxHp / 2

  if (can('raz_de_maree') && playerState.hp <= 20) return { kind: 'spell', spellId: 'raz_de_maree' }
  if (can('siphon') && playerState.hp <= 10) return { kind: 'spell', spellId: 'siphon' }

  if (can('regeneration')) {
    if (botState.hp < 25 && Math.random() < 0.8) return { kind: 'spell', spellId: 'regeneration' }
    if (botState.hp >= 25 && underHalf && Math.random() < 0.45) return { kind: 'spell', spellId: 'regeneration' }
  }

  if (can('malediction') && !hasStatus(playerState, 'cursed') && playerState.energy >= 3 && Math.random() < 0.6) {
    return { kind: 'spell', spellId: 'malediction' }
  }

  if (underHalf && !can('regeneration') && playerState.energy >= 3 && !defendLocked && Math.random() < 0.4) {
    return { kind: 'defend' }
  }

  if (botState.energy <= 1) return { kind: 'charge' }

  const attackChance = botState.energy === 2 ? 0.7 : botState.energy === 3 ? 0.8 : 0.95
  if (Math.random() >= attackChance) return { kind: 'charge' }

  const preferRaz = underHalf ? Math.random() < 0.3 : Math.random() < 0.55
  if (preferRaz && can('raz_de_maree')) return { kind: 'spell', spellId: 'raz_de_maree' }
  if (can('siphon')) return { kind: 'spell', spellId: 'siphon' }
  if (can('raz_de_maree')) return { kind: 'spell', spellId: 'raz_de_maree' }
  return { kind: 'charge' }
}

function chooseHardE1ZappAction(
  botState: Combatant,
  playerState: Combatant,
  can: (id: SpellId) => boolean,
  defendLocked: boolean,
): CombatAction {
  if (!defendLocked) {
    const defendChanceByEnergy = [0, 0.15, 0.3, 0.45, 0.6, 0.6]
    const defendChance = defendChanceByEnergy[Math.min(5, Math.max(0, playerState.energy))] ?? 0
    if (Math.random() < defendChance) return { kind: 'defend' }
  }

  const attackChance =
    botState.energy <= 0 ? 0 :
    botState.energy === 1 ? 0.35 :
    botState.energy === 2 ? 0.6 :
    botState.energy === 3 ? 0.8 :
    1
  if (Math.random() >= attackChance) return { kind: 'charge' }

  const aboveHalf = botState.hp > E1_BASE_HP.zapp / 2
  const dechargeWeight = aboveHalf ? 15 : 40
  const arcWeight = aboveHalf ? 15 : 35
  const boostWeight = 20
  const surchargeWeight = aboveHalf ? 50 : 5
  const roll = Math.random() * (dechargeWeight + arcWeight + boostWeight + surchargeWeight)

  let picked: SpellId = 'decharge'
  if (roll < dechargeWeight) picked = 'decharge'
  else if (roll < dechargeWeight + arcWeight) picked = 'arc_paralysant'
  else if (roll < dechargeWeight + arcWeight + boostWeight) picked = 'boost'
  else picked = 'surcharge'

  if (picked === 'decharge' && can('decharge')) return { kind: 'spell', spellId: 'decharge' }
  if (picked === 'arc_paralysant' && can('arc_paralysant')) return { kind: 'spell', spellId: 'arc_paralysant' }
  if (picked === 'boost' && can('boost')) return { kind: 'spell', spellId: 'boost' }
  if (picked === 'surcharge' && can('surcharge')) return { kind: 'spell', spellId: 'surcharge' }
  return { kind: 'charge' }
}

function chooseHardE1SylvaAction(
  botState: Combatant,
  playerState: Combatant,
  can: (id: SpellId) => boolean,
  defendLocked: boolean,
): CombatAction {
  const volute = getStatus(botState, 'dodge_up')
  const voluteActive = !!volute
  const voluteStable = (volute?.turnsLeft ?? 0) >= 2
  const enemyBlurred = getStatus(playerState, 'fog')?.data === 'accuracy_down'
  const smokeActive = hasStatus(botState, 'smoke')
  const embuscadeHigh = voluteActive || enemyBlurred
  const embuscadeDamage = embuscadeHigh ? 25 : 14

  if (can('embuscade') && playerState.hp <= embuscadeDamage) return { kind: 'spell', spellId: 'embuscade' }
  if (can('coup_voile') && playerState.hp <= 7) return { kind: 'spell', spellId: 'coup_voile' }

  if (!voluteStable && can('volute')) {
    const voluteChance = playerState.energy >= 1 ? 0.8 : 0.4
    if (Math.random() < voluteChance) return { kind: 'spell', spellId: 'volute' }
  }

  const voluteOnCooldown = (botState.cooldowns.volute ?? 0) > 0
  if (!voluteActive && voluteOnCooldown && playerState.energy >= 3 && !defendLocked && Math.random() < 0.4) {
    return { kind: 'defend' }
  }

  if (botState.energy <= 0) return { kind: 'charge' }
  const attackChance = botState.energy === 1 ? 0.6 : botState.energy === 2 ? 0.8 : botState.energy === 3 ? 0.9 : 1
  if (Math.random() >= attackChance) return { kind: 'charge' }

  const canSmoke = can('brouillard_total') && !smokeActive
  let coupWeight = enemyBlurred ? 20 : 50
  let embWeight = enemyBlurred ? 65 : 40
  let smokeWeight = enemyBlurred ? 15 : 10

  if (voluteActive) {
    coupWeight = Math.max(0, coupWeight - 15)
    embWeight += 15
  }

  if (!canSmoke) {
    embWeight += Math.round(smokeWeight * 0.65)
    coupWeight += smokeWeight - Math.round(smokeWeight * 0.65)
    smokeWeight = 0
  }

  const total = coupWeight + embWeight + smokeWeight
  const roll = Math.random() * total
  let picked: SpellId = 'coup_voile'
  if (roll < embWeight) picked = 'embuscade'
  else if (roll < embWeight + coupWeight) picked = 'coup_voile'
  else picked = 'brouillard_total'

  if (picked === 'brouillard_total' && canSmoke) return { kind: 'spell', spellId: 'brouillard_total' }
  if (picked === 'embuscade' && can('embuscade')) return { kind: 'spell', spellId: 'embuscade' }
  if (can('coup_voile')) return { kind: 'spell', spellId: 'coup_voile' }
  if (can('embuscade')) return { kind: 'spell', spellId: 'embuscade' }
  return { kind: 'charge' }
}

function chooseDumbE1Action(
  botState: Combatant,
  loadout: SpellLoadout,
  passiveLevel: 1 | 2 | 3,
  botLevel: number,
  can: (id: SpellId) => boolean,
): CombatAction {
  if (Math.random() >= 0.7) return { kind: 'charge' }

  const attacks = ([...loadout] as SpellId[]).filter(id =>
    can(id) && estimateSpellPressure(id, botState, passiveLevel, botLevel) > 0
  )
  if (attacks.length === 0) return { kind: 'charge' }
  return { kind: 'spell', spellId: attacks[Math.floor(Math.random() * attacks.length)] }
}

function botChooseAction(
  type: CreatureType,
  botState: Combatant,
  playerState: Combatant,
  loadout: SpellLoadout,
  passiveLevel: 1 | 2 | 3,
  botLevel: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  defendLocked = false,
): CombatAction {
  const maxEnergy = OPPONENT_MAX_ENERGY
  // can(id): spell is in loadout AND usable this turn
  const can = (id: SpellId): boolean =>
    (loadout as readonly SpellId[]).includes(id) && canUseSpell(id, botState, maxEnergy)
  // inLoadout(id): spell exists in this creature's build (regardless of cooldown/energy)
  const inLoadout = (id: SpellId): boolean => (loadout as readonly SpellId[]).includes(id)

  if (passiveLevel === 1 && (difficulty === 'easy' || difficulty === 'medium')) {
    const errorRate = difficulty === 'easy' ? 0.7 : 0.3
    if (Math.random() < errorRate) {
      return chooseDumbE1Action(botState, loadout, passiveLevel, botLevel, can)
    }
    return botChooseAction(type, botState, playerState, loadout, passiveLevel, botLevel, 'hard', defendLocked)
  }

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
    if (type === 'ignis' && passiveLevel === 1) {
      return chooseHardE1IgnisAction(botState, playerState, can, defendLocked)
    }
    if (type === 'nemo' && passiveLevel === 1) {
      return chooseHardE1NemoAction(botState, playerState, can, defendLocked)
    }
    if (type === 'zapp' && passiveLevel === 1) {
      return chooseHardE1ZappAction(botState, playerState, can, defendLocked)
    }
    if (type === 'sylva' && passiveLevel === 1) {
      return chooseHardE1SylvaAction(botState, playerState, can, defendLocked)
    }

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
      estimateSpellPressure(b, botState, passiveLevel, botLevel) - estimateSpellPressure(a, botState, passiveLevel, botLevel)
    )

    // A. Clear own debuffs first
    if (botDebuffed && can('dissipation')) return { kind: 'spell', spellId: 'dissipation' }

    const finisher = strongest.find(id => estimateSpellPressure(id, botState, passiveLevel, botLevel) * 1.65 >= playerState.hp)
    if (finisher) return { kind: 'spell', spellId: finisher }

    // B. Emergency heal (lower threshold than medium)
    if (botLow) {
      for (const id of ['maree_regeneratrice', 'maree_curative', 'regeneration', 'siphon', 'abysse', 'barriere', 'carapace_chauffee', 'danse_des_ombres', 'volute', 'esquive_vive'] as SpellId[]) {
        if (can(id)) return { kind: 'spell', spellId: id }
      }
    }

    // C. Free turn — player paralyzed: land the heaviest hit
    if (playerParalyzed) {
      if (strongest[0]) return { kind: 'spell', spellId: strongest[0] }
    }

    if (playerReadyToBurst) {
      for (const id of ['barriere', 'carapace_chauffee', 'danse_des_ombres', 'esquive_vive', 'volute', 'brouillard_total'] as SpellId[]) {
        if (can(id) && !hasStatus(botState, 'barrier') && !hasStatus(botState, 'dodge_up') && !hasStatus(botState, 'dodge_ready')) {
          return { kind: 'spell', spellId: id }
        }
      }
    }

    // D. Kill shot — player at low HP: prioritise finishing spells
    if (playerLow) {
      for (const id of ['supernova', 'foudroiement', 'brasier', 'tempete', 'abysse', 'raz_de_maree', 'surcharge', 'explosion',
                        'embuscade_parfaite', 'fournaise', 'immolation', 'decharge',
                        'magma_supreme', 'dissolution', 'tempete_de_sable', 'embuscade_sauvage'] as SpellId[]) {
        if (can(id)) return { kind: 'spell', spellId: id }
      }
    }

    // E. Type-specific combos
    switch (type) {
      case 'ignis': {
        // Guaranteed damage vs high-dodge player (immolation ignores dodge)
        if (playerDodging && can('immolation')) return { kind: 'spell', spellId: 'immolation' }
        if (botState.embers >= 2 && can('supernova')) return { kind: 'spell', spellId: 'supernova' }
        if (inLoadout('supernova') && botState.embers >= 2 && botState.energy < 4) return { kind: 'charge' }
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
        if (botState.hp < 45 && !hasStatus(botState, 'regen_tide') && can('maree_regeneratrice')) {
          return { kind: 'spell', spellId: 'maree_regeneratrice' }
        }
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
        if (!hasStatus(botState, 'shadow_dance') && playerState.energy >= 2 && can('danse_des_ombres')) {
          return { kind: 'spell', spellId: 'danse_des_ombres' }
        }
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
        if (hasStatus(playerState, 'paralyzed') && can('foudroiement')) {
          return { kind: 'spell', spellId: 'foudroiement' }
        }
        if (inLoadout('tempete') && botState.energy < 4 && botState.hp > 28 && playerState.hp > 28) return { kind: 'charge' }
        if (!hasStatus(botState, 'damage_boost') && can('boost') && playerState.hp > 25) return { kind: 'spell', spellId: 'boost' }
        // Fulguration: priority + 20% paralysis (stronger than décharge when usable)
        if (can('fulguration')) return { kind: 'spell', spellId: 'fulguration' }
        // Arc paralysant: 30% stun chance — strong disruption
        if (can('arc_paralysant')) return { kind: 'spell', spellId: 'arc_paralysant' }
        if (can('foudroiement')) return { kind: 'spell', spellId: 'foudroiement' }
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

      case 'ombra': {
        // Core: bond_furtif → embuscade_sauvage (3× damage from shadow)
        if (!hasStatus(botState, 'smoke') && can('bond_furtif')) return { kind: 'spell', spellId: 'bond_furtif' }
        if (hasStatus(botState, 'smoke') && can('embuscade_sauvage')) return { kind: 'spell', spellId: 'embuscade_sauvage' }
        // Defensive: forme_fantome when player is about to burst
        if (!hasStatus(botState, 'barrier') && !hasStatus(botState, 'dodge_ready') && playerState.energy >= 3 && can('forme_fantome')) {
          return { kind: 'spell', spellId: 'forme_fantome' }
        }
        // Hurlement: provoke + dodge when player is mid-range HP
        if (!hasStatus(playerState, 'provoked') && can('hurlement_bete')) return { kind: 'spell', spellId: 'hurlement_bete' }
        // DoT: venin_sylvestre stacks burn
        if (!hasStatus(playerState, 'burn') && can('venin_sylvestre')) return { kind: 'spell', spellId: 'venin_sylvestre' }
        // Filler: griffe_d_ombre
        if (can('griffe_d_ombre')) return { kind: 'spell', spellId: 'griffe_d_ombre' }
        break
      }

      case 'magma': {
        // Core: fusion_volcanique → magma_supreme for a huge burst
        if (!hasStatus(botState, 'damage_boost') && can('fusion_volcanique') && botState.energy >= 2 && inLoadout('magma_supreme')) {
          return { kind: 'spell', spellId: 'fusion_volcanique' }
        }
        if (hasStatus(botState, 'damage_boost') && can('magma_supreme')) return { kind: 'spell', spellId: 'magma_supreme' }
        // Carapace: reactive defense
        if (!hasStatus(botState, 'barrier') && playerState.energy >= 3 && can('carapace_magma')) {
          return { kind: 'spell', spellId: 'carapace_magma' }
        }
        // Fracas: best damage + exhaustion combo
        if (can('fracas_sismique')) return { kind: 'spell', spellId: 'fracas_sismique' }
        // Eruption: provokes + deals damage
        if (can('eruption')) return { kind: 'spell', spellId: 'eruption' }
        // Filler: frappe_terrestre
        if (can('frappe_terrestre')) return { kind: 'spell', spellId: 'frappe_terrestre' }
        break
      }

      case 'abyssal': {
        // Malediction profonde: lock enemy's best spell
        if (!hasStatus(playerState, 'cursed') && can('malediction_profonde')) return { kind: 'spell', spellId: 'malediction_profonde' }
        // Dissolution: big damage + exhaustion when ready
        if (botState.energy >= 4 && can('dissolution')) return { kind: 'spell', spellId: 'dissolution' }
        // Succion: sustain + damage
        if (botState.hp < 60 && can('succion_vitale')) return { kind: 'spell', spellId: 'succion_vitale' }
        // Encre noire: accuracy denial
        if (!hasStatus(playerState, 'fog') && can('encre_noire')) return { kind: 'spell', spellId: 'encre_noire' }
        // Vortex: consistent damage
        if (can('vortex_abyssal')) return { kind: 'spell', spellId: 'vortex_abyssal' }
        // Succion filler
        if (can('succion_vitale')) return { kind: 'spell', spellId: 'succion_vitale' }
        // Tentacule: stun chance
        if (can('tentacule')) return { kind: 'spell', spellId: 'tentacule' }
        break
      }

      case 'sable': {
        // Core: tempete_de_sable as finisher
        if (botState.energy >= 4 && can('tempete_de_sable')) return { kind: 'spell', spellId: 'tempete_de_sable' }
        if (inLoadout('tempete_de_sable') && botState.energy < 4 && botState.hp > 30 && playerState.hp > 30) return { kind: 'charge' }
        // Malefice: lock enemy's cheapest spam spell
        if (!hasStatus(playerState, 'cursed') && can('malefice_antique')) return { kind: 'spell', spellId: 'malefice_antique' }
        // Mirage: dodge before enemy burst
        if (!hasStatus(botState, 'dodge_up') && playerState.energy >= 3 && can('mirage_sable')) {
          return { kind: 'spell', spellId: 'mirage_sable' }
        }
        // Tourbillon: burn combo
        if (can('tourbillon_sableux')) return { kind: 'spell', spellId: 'tourbillon_sableux' }
        // Eclair: damage + stun
        if (can('eclair_ancien')) return { kind: 'spell', spellId: 'eclair_ancien' }
        // Filler
        if (can('frappe_des_sables')) return { kind: 'spell', spellId: 'frappe_des_sables' }
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
    for (const id of ['maree_regeneratrice', 'regeneration', 'maree_curative', 'barriere', 'carapace_chauffee', 'danse_des_ombres', 'siphon',
                      'carapace_magma', 'succion_vitale', 'forme_fantome'] as SpellId[]) {
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
      if (botState.hp < 45 && can('maree_regeneratrice')) return { kind: 'spell', spellId: 'maree_regeneratrice' }
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
    case 'ombra': {
      if (!hasStatus(botState, 'smoke') && can('bond_furtif')) return { kind: 'spell', spellId: 'bond_furtif' }
      if (hasStatus(botState, 'smoke') && can('embuscade_sauvage')) return { kind: 'spell', spellId: 'embuscade_sauvage' }
      if (botState.energy >= 2) {
        if (can('hurlement_bete')) return { kind: 'spell', spellId: 'hurlement_bete' }
        if (can('venin_sylvestre')) return { kind: 'spell', spellId: 'venin_sylvestre' }
      }
      if (can('griffe_d_ombre')) return { kind: 'spell', spellId: 'griffe_d_ombre' }
      break
    }
    case 'magma': {
      if (botState.energy >= 3) {
        if (can('fracas_sismique')) return { kind: 'spell', spellId: 'fracas_sismique' }
        if (can('eruption'))        return { kind: 'spell', spellId: 'eruption' }
        if (can('magma_supreme'))   return { kind: 'spell', spellId: 'magma_supreme' }
      }
      if (!hasStatus(botState, 'damage_boost') && can('fusion_volcanique') && botState.energy >= 2) {
        return { kind: 'spell', spellId: 'fusion_volcanique' }
      }
      if (can('frappe_terrestre')) return { kind: 'spell', spellId: 'frappe_terrestre' }
      break
    }
    case 'abyssal': {
      if (botState.hp < 50 && can('succion_vitale')) return { kind: 'spell', spellId: 'succion_vitale' }
      if (botState.energy >= 3) {
        if (can('dissolution'))         return { kind: 'spell', spellId: 'dissolution' }
        if (can('vortex_abyssal'))       return { kind: 'spell', spellId: 'vortex_abyssal' }
        if (can('malediction_profonde')) return { kind: 'spell', spellId: 'malediction_profonde' }
      }
      if (can('succion_vitale')) return { kind: 'spell', spellId: 'succion_vitale' }
      if (can('tentacule'))      return { kind: 'spell', spellId: 'tentacule' }
      break
    }
    case 'sable': {
      if (botState.energy >= 3) {
        if (can('tempete_de_sable'))   return { kind: 'spell', spellId: 'tempete_de_sable' }
        if (can('tourbillon_sableux')) return { kind: 'spell', spellId: 'tourbillon_sableux' }
        if (can('eclair_ancien'))      return { kind: 'spell', spellId: 'eclair_ancien' }
      }
      if (can('frappe_des_sables'))  return { kind: 'spell', spellId: 'frappe_des_sables' }
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
  regen_tide: 'RT',
  shadow_dance: 'SD',
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
    case 'ignis':   buffs.push({ emoji: '🔥', text: 'Sorts ignis disponibles' });   break
    case 'nemo':    buffs.push({ emoji: '💧', text: 'Sorts nemo disponibles' });    break
    case 'sylva':   buffs.push({ emoji: '💨', text: 'Sorts sylva disponibles' });   break
    case 'zapp':    buffs.push({ emoji: '⚡', text: 'Sorts zapp disponibles' });    break
    case 'ombra':   buffs.push({ emoji: '🌑', text: 'Sorts ombra disponibles' });   break
    case 'magma':   buffs.push({ emoji: '🌋', text: 'Sorts magma disponibles' });   break
    case 'abyssal': buffs.push({ emoji: '🌀', text: 'Sorts abyssal disponibles' }); break
    case 'sable':   buffs.push({ emoji: '🏜️', text: 'Sorts sable disponibles' });   break
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
  level,
  onPress,
}: {
  spellId: SpellId
  state: Combatant
  maxEnergy: number
  color: string
  displayMult: number
  level: number
  onPress: () => void
}) {
  const spell = SPELL_CATALOG[spellId]
  const usable = canUseSpell(spellId, state, maxEnergy)
  const cd = state.cooldowns[spellId] ?? 0
  const description = e2SpellDescription(spellId, level)
    ?? e1SpellDescription(spellId, level)
    ?? (spell.scaledDesc ? spell.scaledDesc(displayMult) : spell.description)

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
      <Text style={s.spellRole} numberOfLines={2}>{description}</Text>
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
  tutorialMode?: boolean
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
export default function CombatScreen({ player, opponent, onFinish, isAdventure, tutorialMode, debugOverride }: Props) {
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

  // Tutorial mode: auto-select easy difficulty (must use effect to avoid calling setState during render)
  useEffect(() => {
    if (tutorialMode) handleSelectDifficulty('easy')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialMode])

  const [phase, setPhase]       = useState<CombatPhase>('intro')
  const [round, setRound]       = useState(1)
  const [pState, setPState]     = useState<Combatant>({
    hp: playerMaxHP,
    energy: startEnergy,
    cooldowns: {},
    statuses: [],
    embers: getStartingEmbers(playerType, pPassiveLevel),
  })
  const [oState, setOState]     = useState<Combatant>({
    hp: 0, // set when difficulty is selected
    energy: opponentProfile.startEnergy,
    cooldowns: {},
    statuses: [],
    embers: getStartingEmbers(opponent.creatureType, oPassiveLevel),
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
      embers: getStartingEmbers(playerType, pPassiveLevel),
    }))
    setOState({
      hp: calcHP(opponent.level, rules.hpMult, opponent.creatureType),
      energy: Math.max(0, Math.min(OPPONENT_MAX_ENERGY, opponentProfile.startEnergy + rules.opponentEnergyBonus)),
      cooldowns: {},
      statuses: [],
      embers: getStartingEmbers(opponent.creatureType, oPassiveLevel),
    })
    setDifficulty(d)
    setLog(d === 'easy'
      ? 'Mode facile: tu commences avec plus d energie, l ennemi hesite.'
      : d === 'hard'
        ? 'Mode difficile: l IA joue son kit et punit les tours mal prepares.'
        : 'Mode moyen: combat standard.')
  }, [opponent.level, opponent.creatureType, opponentProfile.startEnergy, oPassiveLevel, playerMaxHP, playerMods.maxEnergy, playerType, pPassiveLevel, startEnergy])

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

  // ── Tutorial coach (in-combat) ──
  const tutEnemyRef  = useRef<View | null>(null)
  const tutMeRef     = useRef<View | null>(null)
  const tutBaseRef   = useRef<View | null>(null)
  const tutSpellsRef = useRef<View | null>(null)
  const [tutIntroActive, setTutIntroActive] = useState(false)
  const [tutIntroReady,  setTutIntroReady]  = useState(false)
  // 0 = free, 1 = must CHARGE, 2 = must DEFEND (bot forced to attack), 3 = use a SPELL (guided)
  const [tutStep, setTutStep] = useState<0 | 1 | 2 | 3>(0)
  const tutStepRef = useRef<0 | 1 | 2 | 3>(0)
  useEffect(() => { tutStepRef.current = tutStep }, [tutStep])

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
    if (!chose) {
      if (tutorialMode && tutStepRef.current === 1) commitAction({ kind: 'charge' })
      else if (tutorialMode && tutStepRef.current === 2) commitAction({ kind: 'defend' })
      else commitAction(playerDefendLockedRef.current ? { kind: 'charge' } : { kind: 'defend' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, chose, tutorialMode])

  const commitAction = useCallback((rawAction: CombatAction) => {
    if (chose) return

    // Tutorial: enforce correct action for guided steps
    const ts = tutStepRef.current
    if (tutorialMode && ts === 1 && rawAction.kind !== 'charge') return
    if (tutorialMode && ts === 2 && rawAction.kind !== 'defend') return

    setChose(true)
    clearInterval(timerRef.current!)

    // Advance tutorial step
    if (tutorialMode && ts >= 1) {
      setTutStep(ts < 3 ? (ts + 1) as 1 | 2 | 3 : 0)
    }

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
      oAction = botChooseAction(opponent.creatureType, curO, curP, opponentLoadout, oPassiveLevel, opponent.level, difficulty ?? 'medium', opponentDefendLockedRef.current)
    }
    if (oAction.kind === 'defend' && opponentDefendLockedRef.current && !hasStatus(curO, 'paralyzed')) {
      oAction = { kind: 'charge' }
    }

    // Tutorial step 2: force bot to use cheapest attacking spell to demonstrate defending
    let tutForcedSpellId: SpellId | null = null
    if (tutorialMode && ts === 2) {
      const cheapSpell = [...opponentLoadout]
        .sort((a, b) => (SPELL_CATALOG[a]?.energyCost ?? 99) - (SPELL_CATALOG[b]?.energyCost ?? 99))
        .find(id => (SPELL_CATALOG[id]?.energyCost ?? 0) >= 1) as SpellId | undefined
      if (cheapSpell) {
        oAction = { kind: 'spell', spellId: cheapSpell }
        tutForcedSpellId = cheapSpell
      }
    }

    setPlayerAction(pAction)
    setOpponentAction(oAction)
    setPhase('resolving')

    let newP: Combatant = { ...curP }
    let newO: Combatant = { ...curO }

    // Give bot enough energy to cast the forced tutorial spell
    if (tutForcedSpellId !== null) {
      const neededEnergy = SPELL_CATALOG[tutForcedSpellId]?.energyCost ?? 1
      newO = { ...newO, energy: Math.max(newO.energy, neededEnergy) }
    }

    // Remove paralyzed if forced defend
    if (hasStatus(curP, 'paralyzed')) newP = removeStatus(newP, 'paralyzed')
    if (hasStatus(curO, 'paralyzed')) newO = removeStatus(newO, 'paralyzed')

    const logParts: string[] = []

    if (playerType === 'nemo' && pPassiveLevel >= 3 && newP.hp > 0 && newP.hp < playerMaxHP) {
      newP = { ...newP, hp: Math.min(playerMaxHP, newP.hp + 2) }
      logParts.push('Maree vivante : +2 PV')
    }
    if (opponent.creatureType === 'nemo' && oPassiveLevel >= 3 && newO.hp > 0 && newO.hp < opponentMaxHP) {
      newO = { ...newO, hp: Math.min(opponentMaxHP, newO.hp + 2) }
      logParts.push('Maree vivante ennemie : +2 PV')
    }

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
          pPassiveLevel, playerLevel, playerMaxHP, false,
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
        const playerGuaranteedHit = pAction.spellId === 'immolation'
        const playerDirectScaling = usesDirectLevelScaling(pAction.spellId)
        if (!playerGuaranteedHit && finalDmg > 0) {
          if (oAction.kind === 'defend' || (oAction.kind === 'spell' && oAction.spellId === 'carapace_chauffee')) {
            blockedDmg = finalDmg
            finalDmg = 0
            logParts.push('Ennemi bloque tous les degats !')
          }
        }
        if (!playerGuaranteedHit && finalDmg > 0) {
          const accuracyDown = getStatus(newP, 'fog')
          if (accuracyDown?.data === 'accuracy_down' && Math.random() < (accuracyDown.value ?? 15) / 100) {
            finalDmg = 0
            logParts.push('Ton attaque rate dans le brouillage !')
          }
        }
        if (!playerGuaranteedHit && finalDmg > 0) {
          const dodgeUp = getStatus(newO, 'dodge_up')
          const dodgeChance =
            (opponent.creatureType === 'sylva' ? CREATURE_PROFILES.sylva.dodgeBase : 0) +
            (opponent.creatureType === 'sylva' && oPassiveLevel >= 3 ? 0.10 : 0) +
            ((dodgeUp?.value ?? 0) / 100) +
            (hasStatus(newO, 'dodge_ready') ? 1.0 : 0)
          if (Math.random() < dodgeChance) {
            finalDmg = 0
            logParts.push('Ennemi esquive ! 💨')
            newO = removeStatus(newO, 'dodge_ready')
            if (opponent.creatureType === 'sylva' && oPassiveLevel >= 3) {
              newO = { ...newO, energy: Math.min(OPPONENT_MAX_ENERGY, newO.energy + 1) }
              logParts.push('Insaisissable ennemi : +1 energie')
            }
            const shadowDance = getStatus(newO, 'shadow_dance')
            if (shadowDance) {
              const reflected = shadowDance.value ?? 14
              newP = { ...newP, hp: Math.max(0, newP.hp - reflected) }
              logParts.push(`Danse des ombres ennemie renvoie ${reflected} PV !`)
            }
          } else {
            if (pPassiveLevel !== 1 && !playerDirectScaling) {
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
        } else if (playerGuaranteedHit && finalDmg > 0) {
          const boost = getStatus(newP, 'damage_boost')
          if (boost) {
            finalDmg = Math.round(finalDmg * (1 + (boost.value ?? 50) / 100))
            newP = removeStatus(newP, 'damage_boost')
            logParts.push('Boost consomme : degats +50% !')
          }
        }
        if (blockedDmg > 0 && oAction.kind === 'spell' && oAction.spellId === 'carapace_chauffee') {
          const reflected = Math.round(blockedDmg * 0.5)
          newP = { ...newP, hp: Math.max(0, newP.hp - reflected) }
          logParts.push(`Carapace ennemie renvoie ${reflected} PV !`)
        }
        playerDmgToOpponent = finalDmg
        newO = { ...newO, hp: Math.max(0, newO.hp - finalDmg) }
        newO = { ...newO, energy: Math.max(0, Math.min(OPPONENT_MAX_ENERGY, newO.energy + result.targetEnergyDelta)) }
        for (const st of result.targetStatusesToAdd) newO = addStatus(newO, st)
        for (const t of result.targetStatusesToRemove) newO = removeStatus(newO, t)
        if (playerType === 'zapp' && pPassiveLevel >= 3 && result.targetStatusesToAdd.some(st => st.type === 'paralyzed')) {
          newP = { ...newP, energy: Math.min(playerMods.maxEnergy, newP.energy + 1) }
          logParts.push('Conducteur : +1 energie')
        }

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
          oPassiveLevel, opponent.level, opponentMaxHP, false,
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
        const opponentGuaranteedHit = oAction.spellId === 'immolation'
        const opponentDirectScaling = usesDirectLevelScaling(oAction.spellId)
        if (!opponentGuaranteedHit && finalDmgToPlayer > 0) {
          if (pAction.kind === 'defend' || (pAction.kind === 'spell' && pAction.spellId === 'carapace_chauffee')) {
            blockedDmgToPlayer = finalDmgToPlayer
            finalDmgToPlayer = 0
            logParts.push('Tu bloques tous les degats !')
          }
        }
        if (!opponentGuaranteedHit && finalDmgToPlayer > 0) {
          const accuracyDown = getStatus(newO, 'fog')
          if (accuracyDown?.data === 'accuracy_down' && Math.random() < (accuracyDown.value ?? 15) / 100) {
            finalDmgToPlayer = 0
            logParts.push('L attaque ennemie rate dans le brouillage !')
          }
        }
        if (!opponentGuaranteedHit && finalDmgToPlayer > 0) {
          const playerDodgeUp = getStatus(newP, 'dodge_up')
          const playerDodge =
            playerMods.dodgeChance +
            (playerType === 'sylva' && pPassiveLevel >= 3 ? 0.10 : 0) +
            ((playerDodgeUp?.value ?? 0) / 100) +
            (hasStatus(newP, 'dodge_ready') ? 1.0 : 0)
          if (Math.random() < playerDodge) {
            finalDmgToPlayer = 0
            logParts.push('Tu esquives ! 💨')
            newP = removeStatus(newP, 'dodge_ready')
            const shadowDance = getStatus(newP, 'shadow_dance')
            if (shadowDance) {
              const reflected = shadowDance.value ?? 14
              newO = { ...newO, hp: Math.max(0, newO.hp - reflected) }
              logParts.push(`Danse des ombres renvoie ${reflected} PV a l'ennemi !`)
            }
            // Sylva passif : chaque esquive recharge +1 énergie
            if (playerType === 'sylva' && pPassiveLevel >= 3) {
              newP = { ...newP, energy: Math.min(playerMods.maxEnergy, newP.energy + 1) }
              logParts.push('Insaisissable : +1 energie')
            }
          } else {
            if (oPassiveLevel !== 1 && !opponentDirectScaling) {
              finalDmgToPlayer = Math.round(
                finalDmgToPlayer
                * opponentCounterBonus
                * opponentProfile.baseDamageMult
                * GLOBAL_DMG_BOOST
                * levelMult(opponent.level)
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
              const reflected = Math.round(finalDmgToPlayer * 0.5)
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
        } else if (opponentGuaranteedHit && finalDmgToPlayer > 0) {
          const boost = getStatus(newO, 'damage_boost')
          if (boost) {
            finalDmgToPlayer = Math.round(finalDmgToPlayer * (1 + (boost.value ?? 50) / 100))
            newO = removeStatus(newO, 'damage_boost')
            logParts.push('Boost ennemi consomme : degats +50% !')
          }
          opponentDmgToPlayer = finalDmgToPlayer
        }
        if (blockedDmgToPlayer > 0 && pAction.kind === 'spell' && pAction.spellId === 'carapace_chauffee') {
          const reflected = Math.round(blockedDmgToPlayer * 0.5)
          newO = { ...newO, hp: Math.max(0, newO.hp - reflected) }
          logParts.push(`Carapace reflechit ${reflected} PV a l'ennemi !`)
        }

        newP = { ...newP, hp: Math.max(0, newP.hp - finalDmgToPlayer) }
        newP = { ...newP, energy: Math.max(0, Math.min(playerMods.maxEnergy, newP.energy + result.targetEnergyDelta)) }
        for (const st of result.targetStatusesToAdd) newP = addStatus(newP, st)
        for (const t of result.targetStatusesToRemove) newP = removeStatus(newP, t)
        if (opponent.creatureType === 'zapp' && oPassiveLevel >= 3 && result.targetStatusesToAdd.some(st => st.type === 'paralyzed')) {
          newO = { ...newO, energy: Math.min(OPPONENT_MAX_ENERGY, newO.energy + 1) }
          logParts.push('Conducteur ennemi : +1 energie')
        }

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

      const rawBase = isParfaite ? 10.3 : 8.9
      const rawDmg = pAction.spellId === 'embuscade'
        ? scaleLevelValue(bonusCondition ? 25 : 14, playerLevel)
        : (isParfaite ? Math.round(rawBase) : Math.round(bonusCondition ? rawBase * 2 : rawBase))

      let embDmg = pAction.spellId === 'embuscade'
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

      const rawBase = isParfaite ? 10.3 : 8.9
      const rawDmg = oAction.spellId === 'embuscade'
        ? scaleLevelValue(bonusCondition ? 25 : 14, opponent.level)
        : (isParfaite ? Math.round(rawBase) : Math.round(bonusCondition ? rawBase * 2 : rawBase))

      let embDmg = oAction.spellId === 'embuscade'
        ? rawDmg
        : Math.round(
            rawDmg
            * opponentCounterBonus
            * opponentProfile.baseDamageMult
            * GLOBAL_DMG_BOOST
            * levelMult(opponent.level)
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

    // Regen tide
    const pRegenTide = getStatus(newP, 'regen_tide')
    if (pRegenTide) {
      const heal = pRegenTide.value ?? 7
      newP = { ...newP, hp: Math.min(playerMaxHP, newP.hp + heal) }
      logParts.push(`Maree regeneratrice : +${heal} PV`)
    }
    const oRegenTide = getStatus(newO, 'regen_tide')
    if (oRegenTide) {
      const heal = oRegenTide.value ?? 7
      newO = { ...newO, hp: Math.min(opponentMaxHP, newO.hp + heal) }
      logParts.push(`Maree regeneratrice ennemie : +${heal} PV`)
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
      if (tutorialMode) {
        // Freeze the first turn and walk the player through the combat UI
        setTutIntroActive(true)
        setTimeout(() => setTutIntroReady(true), 350)
      } else {
        startTimer()
      }
    }, 1600)
    return () => clearTimeout(t)
  }, [])

  const finishCombatIntro = useCallback(() => {
    setTutIntroActive(false)
    if (tutorialMode) setTutStep(1)
    startTimer()
  }, [startTimer, tutorialMode])

  const combatTutorialSteps: CoachStep[] = [
    {
      id: 'c-intro',
      title: 'Premier combat !',
      text: "Les combats sont au tour par tour. À chaque tour tu choisis une action avant la fin du chrono. Je t'explique l'écran.",
      placement: 'center',
    },
    {
      id: 'c-enemy',
      title: 'Ton adversaire',
      text: "Surveille sa barre de vie (PV) et son énergie ⚡. Plus il a d'énergie, plus il peut lancer de gros sorts — anticipe !",
      target: tutEnemyRef,
      placement: 'below',
    },
    {
      id: 'c-me',
      title: 'Toi',
      text: "Voici tes PV et ton énergie ⚡. L'énergie se dépense pour lancer des sorts. À zéro PV, c'est perdu.",
      target: tutMeRef,
      placement: 'above',
    },
    {
      id: 'c-base',
      title: 'Charger & Défendre',
      text: '🔋 CHARGER regagne de l\'énergie. 🛡️ DÉFENDRE réduit fortement les dégâts du prochain coup. Utilise-les quand tu es à court d\'énergie.',
      target: tutBaseRef,
      placement: 'above',
    },
    {
      id: 'c-spells',
      title: 'Tes sorts',
      text: "Chaque sort coûte de l'énergie ⚡. Touche-en un pour attaquer. À toi de jouer — bonne chance !",
      target: tutSpellsRef,
      placement: 'above',
      ctaLabel: 'Commencer ! ⚔️',
    },
  ]

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
    // Tutorial mode: handled via useEffect above; show nothing while initializing
    if (tutorialMode) return null
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
          <View ref={tutEnemyRef} collapsable={false} style={s.fighterInfo}>
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
          <View ref={tutMeRef} collapsable={false} style={[s.fighterInfo, s.fighterInfoMe]}>
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

      {/* Tutorial guided-step banner */}
      {tutorialMode && tutStep > 0 && phase === 'choosing' && (
        <View style={s.tutGuide}>
          <Text style={s.tutGuideTxt}>
            {tutStep === 1
              ? '🔋 Appuie sur CHARGER pour gagner de l\'énergie !'
              : tutStep === 2
                ? '🛡️ L\'adversaire attaque — appuie sur DÉFENDRE !'
                : '✨ Tu as de l\'énergie — utilise un SORT pour attaquer !'}
          </Text>
        </View>
      )}

      {/* DECK — always rendered to avoid layout shift */}
      <View
        pointerEvents={phase === 'choosing' ? 'auto' : 'none'}
        style={[s.deck, phase !== 'choosing' && s.deckDisabled]}
      >
        <View ref={tutBaseRef} collapsable={false} style={s.baseActions}>
          <TouchableOpacity
            style={[s.defendBtn, playerDefendLocked && s.defendBtnLocked, tutorialMode && tutStep === 1 && { opacity: 0.3 }]}
            disabled={playerDefendLocked || (tutorialMode && tutStep === 1)}
            onPress={() => commitAction({ kind: 'defend' })}
          >
            <Text style={s.baseActionIcon}>🛡️</Text>
            <Text style={s.baseActionLabel}>{playerDefendLocked ? 'RECHARGE' : 'DÉFENDRE'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.chargeBtn, tutorialMode && tutStep === 2 && { opacity: 0.3 }]}
            disabled={tutorialMode && tutStep === 2}
            onPress={() => commitAction({ kind: 'charge' })}
          >
            <Text style={s.baseActionIcon}>🔋</Text>
            <Text style={s.baseActionLabel}>CHARGER</Text>
            <Text style={s.chargeSubText}>{pState.energy}/{playerMods.maxEnergy}</Text>
          </TouchableOpacity>
        </View>
        <View
          ref={tutSpellsRef}
          collapsable={false}
          pointerEvents={tutorialMode && tutStep <= 2 ? 'none' : 'auto'}
          style={tutorialMode && tutStep <= 2 ? { opacity: 0.3 } : undefined}
        >
          <View style={s.spellRow}>
            {([0, 1] as const).map(i => (
              <SpellCard key={playerLoadout[i]} spellId={playerLoadout[i]} state={pState}
                maxEnergy={playerMods.maxEnergy} color={pColor} displayMult={playerDisplayMult}
                level={playerLevel}
                onPress={() => commitAction({ kind: 'spell', spellId: playerLoadout[i] })} />
            ))}
          </View>
          <View style={s.spellRow}>
            {([2, 3] as const).map(i => (
              <SpellCard key={playerLoadout[i]} spellId={playerLoadout[i]} state={pState}
                maxEnergy={playerMods.maxEnergy} color={pColor} displayMult={playerDisplayMult}
                level={playerLevel}
                onPress={() => commitAction({ kind: 'spell', spellId: playerLoadout[i] })} />
            ))}
          </View>
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

      {/* In-combat tutorial coach */}
      {tutorialMode && tutIntroActive && tutIntroReady && (
        <TutorialCoach
          steps={combatTutorialSteps}
          onDone={finishCombatIntro}
          hideSkip
        />
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

  tutGuide: {
    backgroundColor: retro.gold,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: retro.goldDark,
    alignItems: 'center',
  },
  tutGuideTxt: { color: retro.ink, fontWeight: '900', fontFamily: 'monospace', fontSize: 13, textAlign: 'center' },
})
