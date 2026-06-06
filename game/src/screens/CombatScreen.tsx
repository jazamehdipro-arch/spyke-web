import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  Creature,
  CreatureType,
  PersonalityTrait,
  SpellId,
  SpellLoadout,
  StatusEffect,
  StatusType,
  TrainingStats,
} from '../types'
import { CREATURE_COLORS } from '../utils/creature'
import { hasTrait } from '../utils/traits'
import {
  SPELL_CATALOG,
  getLoadout,
  getPassiveLevel,
} from '../utils/spells'

// ─── sprites ────────────────────────────────────────────
const SPRITES: Record<string, ImageSourcePropType> = {
  ignis:    require('../../assets/sprites/ignis_f1.png'),
  nemo:     require('../../assets/sprites/nemo_f1.png'),
  sylva:    require('../../assets/sprites/sylva_f1.png'),
  zapp:     require('../../assets/sprites/zapp_f1.png'),
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
  const sfx = level >= 20 ? '_e3' : level >= 10 ? '_e2' : ''
  return `${type}${sfx}`
}

// ─── creature profiles ───────────────────────────────────
const CREATURE_PROFILES: Record<CreatureType, {
  hpMult: number
  baseDamageMult: number
  startEnergy: number
  dodgeBase: number
}> = {
  ignis: { hpMult: 0.85, baseDamageMult: 1.2,  startEnergy: 0, dodgeBase: 0.0  },
  nemo:  { hpMult: 1.15, baseDamageMult: 0.75, startEnergy: 1, dodgeBase: 0.0  },
  sylva: { hpMult: 1.0,  baseDamageMult: 0.9,  startEnergy: 0, dodgeBase: 0.25 },
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
}

const DAMAGE_FLOOR = 0.55

function computeModifiers(creature: Creature, opponentType: CreatureType): CombatModifiers {
  const { hunger, happiness, energy, isSick } = creature.stats
  const traits: PersonalityTrait[] | undefined = creature.traits
  const mood = creature.mood
  const profile = CREATURE_PROFILES[creature.type]

  let maxEnergy = 4
  if (energy < 30) maxEnergy = 2
  else if (energy < 60) maxEnergy = 3

  let damageMult: number
  if (hunger >= 60) damageMult = 1.0
  else if (hunger >= 40) damageMult = 0.80
  else if (hunger >= 20) damageMult = 0.65
  else damageMult = 0.45

  if (mood === 'excited') damageMult *= 1.1
  else if (mood === 'sad') damageMult *= 0.85

  if (hasTrait(traits, 'courageux')) damageMult *= 1.2

  damageMult = Math.max(DAMAGE_FLOOR, damageMult)

  const training: TrainingStats = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
  damageMult = Math.max(DAMAGE_FLOOR, damageMult + training.strength * 0.01)
  const trainingMaxEnergy = Math.floor(training.endurance / 5)
  maxEnergy = Math.min(6, maxEnergy + trainingMaxEnergy)
  const trainingDodge = training.defense * 0.005

  const now = new Date().toISOString()
  const activeFoodBuff = !!(creature.activeCombatBuff && creature.activeCombatBuff.expiresAt > now)
  if (activeFoodBuff) {
    damageMult = Math.max(DAMAGE_FLOOR, damageMult * creature.activeCombatBuff!.damageMult)
  }

  damageMult *= profile.baseDamageMult
  damageMult = Math.max(DAMAGE_FLOOR, damageMult)

  const timerBonus = parseFloat((training.reflexes * 0.1).toFixed(1))
  const timerReduction = happiness < 60 ? 1 : 0
  const hideOpponentEnergy = happiness < 30

  const dodgeChance = Math.min(0.55, profile.dodgeBase + (hasTrait(traits, 'chanceux') ? 0.15 : 0) + trainingDodge)
  const timideChance = hasTrait(traits, 'timide') ? 0.25 : 0
  const sickDot = isSick ? 3 : 0
  const hpMult = isSick ? 0.75 : 1.0

  const counterBonus = COUNTER_TABLE[creature.type] === opponentType ? 1.15 : 1.0

  return { maxEnergy, damageMult, timerReduction, timerBonus, activeFoodBuff, hideOpponentEnergy, dodgeChance, timideChance, sickDot, hpMult, counterBonus }
}

const OPPONENT_MAX_ENERGY = 4
const TIMER_SECONDS = 10
const BASE_HP = 30

function calcHP(level: number, hpMult = 1.0, creatureType?: CreatureType) {
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
      const provoked = hasStatus(target, 'provoked')
      const baseDmg = provoked ? Math.round(6 * 1.3) : 6
      const newEmbers = Math.min(3, caster.embers + 2)
      return {
        ...empty,
        targetHpDelta: -baseDmg,
        newCasterEmbers: newEmbers,
        log: `🔥 Frappe ardente ! -${baseDmg} HP${provoked ? ' (provoqué!)' : ''}. Braises: ${newEmbers}`,
      }
    }
    case 'explosion': {
      const embers = caster.embers
      const dmgMap: Record<number, number> = { 0: 8, 1: 14, 2: 20, 3: 26 }
      const dmg = dmgMap[Math.min(3, embers)] ?? 8
      return {
        ...empty,
        targetHpDelta: -dmg,
        newCasterEmbers: 0,
        log: `💥 Explosion (${embers} braises) ! -${dmg} HP !`,
      }
    }
    case 'carapace_chauffee': {
      return {
        ...empty,
        casterStatusesToAdd: [{ type: 'barrier', turnsLeft: 1, value: 30, data: 'reflect' }],
        log: '🛡️ Carapace chauffée ! +barrière réfléchissante',
      }
    }
    case 'provocation': {
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'provoked', turnsLeft: 1, value: 30 }],
        log: '😤 Provocation ! Ennemi +30% dégâts reçus ce tour',
      }
    }
    case 'immolation': {
      return {
        ...empty,
        casterHpDelta: -10,
        targetHpDelta: -20,
        log: '🩸 Immolation ! -10 PV sur soi → -20 HP ennemi',
      }
    }
    case 'brasier': {
      return {
        ...empty,
        targetHpDelta: -15,
        targetStatusesToAdd: [{ type: 'burn', turnsLeft: 3, value: 4 }],
        log: '🌋 Brasier ! -15 HP + brûlure 3 tours',
      }
    }

    // ── nemo ──
    case 'vague': {
      const healSelf = passiveLevel >= 3 ? 2 : 0
      return {
        ...empty,
        casterHpDelta: healSelf,
        targetHpDelta: -5,
        log: `🌊 Vague ! -5 HP ennemi${healSelf ? ' +2 PV' : ''}`,
      }
    }
    case 'siphon': {
      const steal = passiveLevel >= 2 ? 2 : 1
      const healSelf = passiveLevel >= 3 ? 4 : 0
      return {
        ...empty,
        casterEnergyDelta: steal,
        casterHpDelta: healSelf,
        targetEnergyDelta: -steal,
        log: `💧 Siphon ! Vol ${steal}⚡ ennemi${healSelf ? ` +${healSelf} PV` : ''}`,
      }
    }
    case 'regeneration': {
      return {
        ...empty,
        casterHpDelta: 10,
        log: '💚 Régénération ! +10 PV',
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
      const defaultLoadout: SpellLoadout = ['vague', 'siphon', 'regeneration', 'barriere']
      const blocked = targetLoadout
        ? targetMostExpensiveSpell(target, targetLoadout)
        : 'vague'
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'cursed', turnsLeft: 2, data: blocked }],
        log: `🔮 Malédiction ! Sort ${SPELL_CATALOG[blocked as SpellId]?.name ?? blocked} bloqué 2 tours`,
      }
    }
    case 'raz_de_maree': {
      return {
        ...empty,
        targetHpDelta: -15,
        targetEnergyDelta: -2,
        casterEnergyDelta: 2,
        log: '🌊💥 Raz-de-marée ! -15 HP + vol 2⚡',
      }
    }

    // ── sylva ──
    case 'coup_voile': {
      const fogChance = Math.random() < 0.2
      const fogStatus: StatusEffect[] = fogChance ? [{ type: 'fog', turnsLeft: 1 }] : []
      return {
        ...empty,
        targetHpDelta: -5,
        targetStatusesToAdd: fogStatus,
        log: `👊 Coup voilé ! -5 HP${fogChance ? ' + brouillage !' : ''}`,
      }
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
        casterStatusesToAdd: [{ type: 'dodge_up', turnsLeft: 3, value: 15 }],
        log: '🌀 Volute ! +15% esquive 3 tours',
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
      if (opponentMissedThisTurn) {
        return {
          ...empty,
          targetHpDelta: -15,
          log: '🗡️ Embuscade ! Ennemi a raté ! -15 HP',
        }
      }
      return { ...empty, log: '🗡️ Embuscade ! Ennemi n\'a pas raté...' }
    }
    case 'brouillard_total': {
      return {
        ...empty,
        targetStatusesToAdd: [{ type: 'fog', turnsLeft: 2 }],
        log: '🌫️ Brouillard total ! Info ennemie masquée 2 tours',
      }
    }

    // ── zapp ──
    case 'decharge': {
      return {
        ...empty,
        targetHpDelta: -6,
        log: '⚡ Décharge ! -6 HP (priorité)',
      }
    }
    case 'arc_paralysant': {
      const paralyzed = Math.random() < 0.4
      const paralysisStatus: StatusEffect[] = paralyzed ? [{ type: 'paralyzed', turnsLeft: 1 }] : []
      return {
        ...empty,
        targetStatusesToAdd: paralysisStatus,
        log: `🎯 Arc paralysant !${paralyzed ? ' Ennemi paralysé !' : ' Rate la paralysie.'}`,
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
        targetHpDelta: -12,
        casterStatusesToAdd: [{ type: 'exhausted', turnsLeft: 1, value: 2 }],
        log: '🔋 Surcharge ! -12 HP + épuisement prochain tour',
      }
    }
    case 'tempete': {
      return {
        ...empty,
        targetHpDelta: -20,
        log: '⛈️ Tempête ! 4×5 = -20 HP',
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

// ─── bot AI ─────────────────────────────────────────────
function botChooseAction(
  _type: CreatureType,
  botState: Combatant,
  _playerState: Combatant,
  loadout: SpellLoadout,
  _passiveLevel: 1 | 2 | 3,
): CombatAction {
  const maxEnergy = OPPONENT_MAX_ENERGY

  // Spells that heal self
  const healSpells: SpellId[] = ['regeneration', 'barriere', 'carapace_chauffee', 'volute', 'esquive_vive', 'dissipation']
  // HP threshold for heal
  const hpPct = botState.hp / Math.max(1, botState.hp + 1) // approx - we don't know maxHP here, use absolute
  const isLowHP = botState.hp < 20

  // 1. Low HP → heal if possible
  if (isLowHP) {
    for (const spellId of loadout) {
      if (healSpells.includes(spellId) && canUseSpell(spellId, botState, maxEnergy)) {
        return { kind: 'spell', spellId }
      }
    }
  }

  // 2. High energy → use expensive spell
  if (botState.energy >= 3) {
    // Sort spells by cost descending, pick highest cost available
    const sorted = [...loadout].sort((a, b) => SPELL_CATALOG[b].energyCost - SPELL_CATALOG[a].energyCost)
    for (const spellId of sorted) {
      const spell = SPELL_CATALOG[spellId]
      if (spell.energyCost >= 3 && canUseSpell(spellId, botState, maxEnergy)) {
        return { kind: 'spell', spellId }
      }
    }
  }

  // 3. Use cheapest damage spell
  const damageSpells: SpellId[] = [
    'frappe_ardente', 'explosion', 'immolation', 'brasier', 'provocation',
    'vague', 'siphon', 'raz_de_maree', 'malediction',
    'coup_voile', 'embuscade', 'brouillard_total', 'ecran_fumee',
    'decharge', 'arc_paralysant', 'rafale', 'surcharge', 'tempete',
  ]
  const sorted = [...loadout].sort((a, b) => SPELL_CATALOG[a].energyCost - SPELL_CATALOG[b].energyCost)
  for (const spellId of sorted) {
    if (damageSpells.includes(spellId) && canUseSpell(spellId, botState, maxEnergy)) {
      return { kind: 'spell', spellId }
    }
  }

  // 4. Any usable spell
  for (const spellId of loadout) {
    if (canUseSpell(spellId, botState, maxEnergy)) {
      return { kind: 'spell', spellId }
    }
  }

  // 5. Charge
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

function ClashChip({ action, color }: { action: CombatAction | null; color: string }) {
  let label = '?'
  if (action?.kind === 'defend') label = '🛡️ DÉFENSE'
  else if (action?.kind === 'charge') label = '⚡ CHARGE'
  else if (action?.kind === 'spell') {
    const sp = SPELL_CATALOG[action.spellId]
    label = `${sp.emoji} ${sp.name.toUpperCase()}`
  }
  return (
    <View style={s.clashChip}>
      <View style={[s.clashDot, { backgroundColor: color }]} />
      <Text style={s.clashChipText} numberOfLines={1}>{label}</Text>
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
    debuffs.push({ emoji: '🍖', text: `Faim/humeur : -${pct}% dégâts (×${mods.damageMult.toFixed(2)})` })
  } else if (mods.damageMult > 1.05) {
    const pct = Math.round((mods.damageMult - 1.0) * 100)
    buffs.push({ emoji: '💪', text: `Bonus offensif : +${pct}% dégâts (×${mods.damageMult.toFixed(2)})` })
  }
  if (mods.activeFoodBuff) {
    buffs.push({ emoji: '🥩', text: 'Repas boost actif !' })
  }
  if (mods.timerBonus > 0) {
    buffs.push({ emoji: '⚡', text: `Réflexes : +${mods.timerBonus.toFixed(1)}s timer` })
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
  if (mods.maxEnergy < 4) {
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
  onPress,
}: {
  spellId: SpellId
  state: Combatant
  maxEnergy: number
  color: string
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
      <Text style={s.spellRole} numberOfLines={1}>{spell.description}</Text>
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
  debugOverride?: {
    playerType: CreatureType
    playerLevel: number
    playerLoadout: SpellLoadout
    playerEnergy: number
  }
}

// ─── main component ─────────────────────────────────────
export default function CombatScreen({ player, opponent, onFinish, debugOverride }: Props) {
  const playerMods = useRef<CombatModifiers>(computeModifiers(player, opponent.creatureType)).current

  const playerType = debugOverride?.playerType ?? player.type
  const playerLevel = debugOverride?.playerLevel ?? player.stats.level
  const playerProfile = CREATURE_PROFILES[playerType]
  const opponentProfile = CREATURE_PROFILES[opponent.creatureType]

  const playerMaxHP  = calcHP(playerLevel, playerMods.hpMult, playerType)
  const opponentMaxHP = calcHP(opponent.level, 1.0, opponent.creatureType)

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
    hp: opponentMaxHP,
    energy: opponentProfile.startEnergy,
    cooldowns: {},
    statuses: [],
    embers: 0,
  })

  const pStateRef = useRef(pState)
  const oStateRef = useRef(oState)
  useEffect(() => { pStateRef.current = pState }, [pState])
  useEffect(() => { oStateRef.current = oState }, [oState])

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
    const effectiveSeconds = Math.max(2, TIMER_SECONDS - playerMods.timerReduction + playerMods.timerBonus)
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
  }, [playerMods.timerReduction, playerMods.timerBonus, timerAnim])

  useEffect(() => {
    if (phase !== 'choosing') return
    if (timeLeft > 0) return
    if (!chose) commitAction({ kind: 'defend' })
  }, [timeLeft, phase, chose])

  const commitAction = useCallback((rawAction: CombatAction) => {
    if (chose) return
    setChose(true)
    clearInterval(timerRef.current!)

    const curP = pStateRef.current
    const curO = oStateRef.current

    // 1. Paralysie → force defend
    let pAction = rawAction
    if (hasStatus(curP, 'paralyzed')) {
      pAction = { kind: 'defend' }
    }

    // 2. Bot choisit son action
    let oAction: CombatAction
    if (hasStatus(curO, 'paralyzed')) {
      oAction = { kind: 'defend' }
    } else {
      oAction = botChooseAction(opponent.creatureType, curO, curP, opponentLoadout, oPassiveLevel)
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

    // ── Player turn ──
    if (pAction.kind === 'charge') {
      if (hasStatus(newP, 'exhausted')) {
        logParts.push('😴 Épuisé ! Pas de charge.')
      } else {
        newP = { ...newP, energy: Math.min(playerMods.maxEnergy, newP.energy + 1) }
        logParts.push('⚡ Charge !')
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
        if (finalDmg > 0) {
          const dodgeChance =
            (hasStatus(newO, 'dodge_up') ? 0.15 : 0) +
            (hasStatus(newO, 'dodge_ready') ? 1.0 : 0)
          if (Math.random() < dodgeChance) {
            finalDmg = 0
            logParts.push('Ennemi esquive ! 💨')
            newO = removeStatus(newO, 'dodge_ready')
          } else {
            finalDmg = Math.round(finalDmg * playerMods.damageMult * playerMods.counterBonus)
            if (hasStatus(newO, 'barrier')) {
              const b = getStatus(newO, 'barrier')!
              finalDmg = Math.round(finalDmg * (1 - (b.value ?? 50) / 100))
            }
          }
        }
        newO = { ...newO, hp: Math.max(0, newO.hp - finalDmg) }
        newO = { ...newO, energy: Math.max(0, Math.min(OPPONENT_MAX_ENERGY, newO.energy + result.targetEnergyDelta)) }
        for (const st of result.targetStatusesToAdd) newO = addStatus(newO, st)
        for (const t of result.targetStatusesToRemove) newO = removeStatus(newO, t)

        logParts.push(result.log)
      }
    } else {
      // defend
      logParts.push('🛡️ Défense !')
    }

    // ── Opponent turn ──
    // Track if opponent dealt damage (for embuscade)
    let opponentDmgToPlayer = 0

    if (oAction.kind === 'charge') {
      if (hasStatus(newO, 'exhausted')) {
        // exhausted, skip gain
      } else {
        newO = { ...newO, energy: Math.min(OPPONENT_MAX_ENERGY, newO.energy + 1) }
      }
      newO = removeStatus(newO, 'exhausted')
      logParts.push('Ennemi charge.')
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
        if (finalDmgToPlayer > 0) {
          const playerDodge =
            playerMods.dodgeChance +
            (hasStatus(newP, 'dodge_up') ? 0.15 : 0) +
            (hasStatus(newP, 'dodge_ready') ? 1.0 : 0)
          if (Math.random() < playerDodge) {
            finalDmgToPlayer = 0
            logParts.push('Tu esquives ! 💨')
            newP = removeStatus(newP, 'dodge_ready')
          } else {
            finalDmgToPlayer = Math.round(finalDmgToPlayer * opponentCounterBonus)
            if (hasStatus(newP, 'barrier')) {
              const b = getStatus(newP, 'barrier')!
              finalDmgToPlayer = Math.round(finalDmgToPlayer * (1 - (b.value ?? 50) / 100))
            }
            // carapace_chauffee reflect
            if (pAction.kind === 'spell' && pAction.spellId === 'carapace_chauffee') {
              const reflected = Math.round(finalDmgToPlayer * 0.30)
              newO = { ...newO, hp: Math.max(0, newO.hp - reflected) }
              logParts.push(`🛡️🔥 Réflexion : ${reflected} dmg !`)
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

        if (pAction.kind === 'defend' && finalDmgToPlayer > 0)
          finalDmgToPlayer = Math.round(finalDmgToPlayer * 0.55)
        newP = { ...newP, hp: Math.max(0, newP.hp - finalDmgToPlayer) }
        newP = { ...newP, energy: Math.max(0, Math.min(playerMods.maxEnergy, newP.energy + result.targetEnergyDelta)) }
        for (const st of result.targetStatusesToAdd) newP = addStatus(newP, st)
        for (const t of result.targetStatusesToRemove) newP = removeStatus(newP, t)

        logParts.push(result.log)
      }
    } else {
      logParts.push('Ennemi se défend.')
    }

    // Re-resolve embuscade if player used it — now we know if opponent missed
    if (pAction.kind === 'spell' && pAction.spellId === 'embuscade') {
      const opponentMissed = opponentDmgToPlayer === 0 && oAction.kind !== 'charge'
      const embResult = resolveSpell(
        'embuscade', newP, newO,
        playerType, opponent.creatureType,
        pPassiveLevel, opponentMissed,
        opponentLoadout,
      )
      if (embResult.targetHpDelta < 0) {
        let embDmg = Math.max(0, -embResult.targetHpDelta)
        embDmg = Math.round(embDmg * playerMods.damageMult * playerMods.counterBonus)
        if (hasStatus(newO, 'barrier')) {
          const b = getStatus(newO, 'barrier')!
          embDmg = Math.round(embDmg * (1 - (b.value ?? 50) / 100))
        }
        newO = { ...newO, hp: Math.max(0, newO.hp - embDmg) }
        logParts.push(embResult.log)
      }
    }

    // Burn DoT
    const pBurn = getStatus(newP, 'burn')
    if (pBurn) {
      newP = { ...newP, hp: Math.max(0, newP.hp - (pBurn.value ?? 4)) }
      logParts.push(`🔥 Brûlure -${pBurn.value ?? 4}PV`)
    }
    const oBurn = getStatus(newO, 'burn')
    if (oBurn) {
      newO = { ...newO, hp: Math.max(0, newO.hp - (oBurn.value ?? 4)) }
    }

    // Tick statuses and cooldowns
    newP = tickStatuses(newP)
    newO = tickStatuses(newO)
    newP = { ...newP, cooldowns: tickCooldowns(newP.cooldowns) }
    newO = { ...newO, cooldowns: tickCooldowns(newO.cooldowns) }

    if (newP.hp < curP.hp) shake(playerShake)
    if (newO.hp < curO.hp) shake(opponentShake)

    const logMsg = logParts.filter(Boolean).join(' ')
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
      if (newP.hp <= 0 || newO.hp <= 0 || round >= 10) {
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

  const won = pState.hp > oState.hp || (pState.hp > 0 && oState.hp <= 0)
  const xpGained = won ? 60 + opponent.level * 5 : 20

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

      {/* HEADER: round badge + draining timer + countdown */}
      <View style={s.header}>
        <View style={s.roundBadge}>
          <Text style={s.roundText}>TOUR </Text>
          <Text style={[s.roundText, s.roundNum]}>{round}</Text>
          <Text style={s.roundText}>/10</Text>
        </View>
        <View style={s.timerBarBg}>
          <Animated.View style={[s.timerBarFill, {
            width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
        <Text style={[s.timerNum, phase !== 'choosing' && s.timerDim]}>
          {phase === 'choosing' ? `${timeLeft}` : '·'}
        </Text>
      </View>

      {/* ARENA */}
      <View style={s.arena}>

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

        {/* CLASH ZONE — absolute center */}
        {phase === 'resolving' && playerAction && (
          <View style={s.clashZone} pointerEvents="none">
            <Animated.View style={{ opacity: clashOpacity, transform: [{ translateX: meChipX }] }}>
              <ClashChip action={playerAction} color={pColor} />
            </Animated.View>
            <Animated.Text style={[s.clashVs, { opacity: clashOpacity, transform: [{ scale: vsScale }] }]}>
              VS
            </Animated.Text>
            <Animated.View style={{ opacity: clashOpacity, transform: [{ translateX: enChipX }] }}>
              <ClashChip action={hasStatus(oState, 'smoke') ? null : opponentAction} color={oColor} />
            </Animated.View>
          </View>
        )}

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

      {/* HINT BAR */}
      <Text style={s.hintBar}>
        {phase === 'choosing'
          ? 'Lis l\'énergie adverse · choisis vite'
          : phase === 'resolving' ? 'Résolution…' : ''}
      </Text>

      {/* DECK — always rendered to avoid layout shift */}
      <View
        pointerEvents={phase === 'choosing' ? 'auto' : 'none'}
        style={[s.deck, phase !== 'choosing' && s.deckDisabled]}
      >
        <View style={s.baseActions}>
          <TouchableOpacity style={s.defendBtn} onPress={() => commitAction({ kind: 'defend' })}>
            <Text style={s.baseActionIcon}>🛡️</Text>
            <Text style={s.baseActionLabel}>DÉFENDRE</Text>
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
              maxEnergy={playerMods.maxEnergy} color={pColor}
              onPress={() => commitAction({ kind: 'spell', spellId: playerLoadout[i] })} />
          ))}
        </View>
        <View style={s.spellRow}>
          {([2, 3] as const).map(i => (
            <SpellCard key={playerLoadout[i]} spellId={playerLoadout[i]} state={pState}
              maxEnergy={playerMods.maxEnergy} color={pColor}
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
  root: { flex: 1, backgroundColor: '#0D0A18' },

  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 14, paddingHorizontal: 16, paddingBottom: 8,
  },
  roundBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1D1738', borderWidth: 1, borderColor: '#352A5E',
    borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6,
  },
  roundText: { fontFamily: 'monospace', fontSize: 10, color: '#9A8FC4', letterSpacing: 0.5 },
  roundNum: { color: '#FFCE3A' },
  timerBarBg: {
    flex: 1, height: 14, borderRadius: 8,
    backgroundColor: '#0C0820', borderWidth: 1, borderColor: '#352A5E', overflow: 'hidden',
  },
  timerBarFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 8,
    backgroundColor: '#FF5A2C',
  },
  timerNum: { fontFamily: 'monospace', fontSize: 22, fontWeight: '900', color: '#FFCE3A', minWidth: 28, textAlign: 'right' },
  timerDim: { color: '#2A2030' },

  // ARENA
  arena: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 6,
    justifyContent: 'space-between', position: 'relative',
  },

  fighterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fighterRowMe: { flexDirection: 'row-reverse' },
  fighterInfo: { flex: 1, gap: 5 },
  fighterInfoMe: { alignItems: 'flex-end' },

  stage: {
    width: 110, height: 110, borderRadius: 18,
    backgroundColor: '#1D1738', borderWidth: 1.5, borderColor: '#352A5E',
    alignItems: 'center', justifyContent: 'flex-end',
    overflow: 'visible', position: 'relative',
  },
  stageFloor: {
    position: 'absolute', bottom: 8, width: 72, height: 12,
    borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  stageSprite: { width: 88, height: 88, marginBottom: 4 },
  dmgFloat: {
    position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center',
    fontSize: 28, fontWeight: '900', fontFamily: 'monospace',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    zIndex: 10,
  },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  nameRowMe: { flexDirection: 'row-reverse' },
  fighterName: { color: '#F3EEFE', fontSize: 14, fontWeight: '800', flexShrink: 1 },
  lvlBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  lvlText: { fontSize: 9, fontWeight: '900', color: '#0D0A18', fontFamily: 'monospace' },
  statusEmoji: { fontSize: 12 },

  hpBarBg: {
    height: 16, backgroundColor: '#0C0820', borderRadius: 8,
    borderWidth: 1, borderColor: '#352A5E', overflow: 'hidden',
    position: 'relative', justifyContent: 'center',
  },
  hpBarFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 8 },
  hpBarText: {
    position: 'absolute', left: 0, right: 0, textAlign: 'center',
    fontSize: 9, fontWeight: '900', fontFamily: 'monospace', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subRowMe: { justifyContent: 'flex-end' },
  hiddenEnergy: { color: '#555', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },

  pipRow: { flexDirection: 'row', gap: 4 },
  pip: {
    width: 22, height: 9, borderRadius: 3,
    backgroundColor: '#0C0820', borderWidth: 1, borderColor: '#352A5E',
  },

  embersRow: { flexDirection: 'row', gap: 2 },
  emberDot: { fontSize: 12 },

  histRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  histRowMe: { justifyContent: 'flex-end' },
  histLabel: { fontFamily: 'monospace', fontSize: 7, color: '#9A8FC4', letterSpacing: 0.5 },
  histBadge: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: '#241C44', borderWidth: 1, borderColor: '#352A5E',
    alignItems: 'center', justifyContent: 'center',
  },
  histIcon: { fontSize: 13 },

  // CLASH ZONE
  clashZone: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10, zIndex: 20,
  },
  clashChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#241C44', borderWidth: 1, borderColor: '#352A5E',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, maxWidth: 135,
  },
  clashDot: { width: 8, height: 8, borderRadius: 4 },
  clashChipText: { color: '#F3EEFE', fontSize: 9, fontWeight: '800', fontFamily: 'monospace', letterSpacing: 0.3 },
  clashVs: { color: '#9A8FC4', fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },

  // HINT BAR
  hintBar: {
    textAlign: 'center', fontSize: 11, color: '#9A8FC4',
    fontWeight: '600', paddingVertical: 5,
  },

  // DECK
  deck: { paddingHorizontal: 12, paddingBottom: 16, gap: 8 },
  deckDisabled: { opacity: 0.3 },

  baseActions: { flexDirection: 'row', gap: 8 },
  defendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#1F4FD0', borderRadius: 14, paddingVertical: 12,
    shadowColor: '#2B6CFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  chargeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#C23B14', borderRadius: 14, paddingVertical: 12,
    shadowColor: '#FF5A2C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  baseActionIcon: { fontSize: 18 },
  baseActionLabel: { color: '#fff', fontWeight: '900', fontSize: 12, fontFamily: 'monospace', letterSpacing: 0.5 },
  chargeSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'monospace' },

  spellRow: { flexDirection: 'row', gap: 8 },
  spellCard: {
    flex: 1, backgroundColor: '#1D1738', borderRadius: 13,
    padding: 10, borderWidth: 1, borderColor: '#352A5E', gap: 5,
  },
  spellCardLocked: { opacity: 0.4 },
  spellCdTag: {
    position: 'absolute', top: 7, right: 8,
    fontSize: 8, color: '#FF8A3D', fontFamily: 'monospace', fontWeight: '700',
  },
  spellCardTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  spellIco: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#0C0820', borderWidth: 1, borderColor: '#352A5E',
    alignItems: 'center', justifyContent: 'center',
  },
  spellIcoText: { fontSize: 15 },
  spellCardName: { color: '#F3EEFE', fontSize: 10, fontWeight: '700', fontFamily: 'monospace', flex: 1, lineHeight: 14 },
  spellCardNameDim: { color: '#555' },
  spellCostRow: { flexDirection: 'row', gap: 3 },
  spellCostBar: {
    flex: 1, height: 7, borderRadius: 3,
    backgroundColor: '#0C0820', borderWidth: 1, borderColor: '#352A5E',
  },
  spellCostBarLow: { backgroundColor: '#1A1530', borderColor: '#2A2050' },
  spellRole: {
    fontSize: 8, color: '#9A8FC4', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // OVERLAYS
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  introTitle: { fontSize: 48, fontWeight: '900', color: '#FFCE3A', letterSpacing: 4, fontFamily: 'monospace' },
  introSub: { fontSize: 16, color: '#9A8FC4' },

  debuffPanel: {
    backgroundColor: 'rgba(255,60,60,0.1)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    marginTop: 8, gap: 4, minWidth: 220, alignItems: 'flex-start',
  },
  debuffTitle: {
    color: '#FF6B6B', fontSize: 11, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  debuffItem: { color: '#FFB3B3', fontSize: 12 },

  finishEmoji: { fontSize: 64 },
  finishTitle: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  finishXP: { fontSize: 22, color: '#FFCE3A', fontWeight: '800' },
  finishBtn: {
    backgroundColor: '#FFCE3A', paddingHorizontal: 48, paddingVertical: 16,
    borderRadius: 16, marginTop: 16,
  },
  finishBtnText: { color: '#000', fontSize: 17, fontWeight: '900' },
})
