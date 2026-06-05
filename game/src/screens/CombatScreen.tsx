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
import { Creature, CreatureType, PersonalityTrait, TrainingStats } from '../types'
import { CREATURE_COLORS } from '../utils/creature'
import { hasTrait } from '../utils/traits'

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
type ActionKind = 'defend' | 'charge' | 'attack' | 'drain' | 'convert' | 'smoke' | 'chain'
type CombatPhase = 'intro' | 'choosing' | 'resolving' | 'finished'

interface Action {
  kind: ActionKind
  energy: number
}

interface Combatant {
  hp: number
  energy: number
}

interface CombatMechanics {
  embers: number
  consecutiveDefends: number
  smokeNextTurn: boolean
  paralyzed: boolean
}

const initialMechanics: CombatMechanics = {
  embers: 0,
  consecutiveDefends: 0,
  smokeNextTurn: false,
  paralyzed: false,
}

interface ResolveResult {
  playerDmg: number
  opponentDmg: number
  playerEnergyDelta: number
  opponentEnergyDelta: number
  log: string
  playerHeal: number
  opponentDrainDmg: number   // for drain: if opponent energy 0, deal 3 dmg
  opponentEnergySteal: boolean // drain: steal 1 energy
}

export interface CombatOpponent {
  username: string
  creatureName: string
  creatureType: CreatureType
  level: number
}

interface Props {
  player: Creature
  opponent: CombatOpponent
  onFinish: (won: boolean, xpGained: number) => void
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

  // maxEnergy based on energy stat
  let maxEnergy = 4
  if (energy < 30) maxEnergy = 2
  else if (energy < 60) maxEnergy = 3

  // damageMult based on hunger
  let damageMult: number
  if (hunger >= 60) damageMult = 1.0
  else if (hunger >= 40) damageMult = 0.80
  else if (hunger >= 20) damageMult = 0.65
  else damageMult = 0.45

  // mood modifier stacks multiplicatively
  if (mood === 'excited') damageMult *= 1.1
  else if (mood === 'sad') damageMult *= 0.85

  // courageux trait bonus
  if (hasTrait(traits, 'courageux')) damageMult *= 1.2

  // global floor
  damageMult = Math.max(DAMAGE_FLOOR, damageMult)

  // Training bonuses
  const training: TrainingStats = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
  damageMult = Math.max(DAMAGE_FLOOR, damageMult + training.strength * 0.01)
  const trainingMaxEnergy = Math.floor(training.endurance / 5)
  maxEnergy = Math.min(6, maxEnergy + trainingMaxEnergy)
  const trainingDodge = training.defense * 0.005

  // Active food combat buff
  const now = new Date().toISOString()
  const activeFoodBuff = !!(creature.activeCombatBuff && creature.activeCombatBuff.expiresAt > now)
  if (activeFoodBuff) {
    damageMult = Math.max(DAMAGE_FLOOR, damageMult * creature.activeCombatBuff!.damageMult)
  }

  // Apply creature type base damage mult
  damageMult *= profile.baseDamageMult
  damageMult = Math.max(DAMAGE_FLOOR, damageMult)

  const timerBonus = parseFloat((training.reflexes * 0.1).toFixed(1))

  const timerReduction = happiness < 60 ? 1 : 0
  const hideOpponentEnergy = happiness < 30

  // dodgeChance: base from profile + trait + training
  const dodgeChance = Math.min(0.55, profile.dodgeBase + (hasTrait(traits, 'chanceux') ? 0.15 : 0) + trainingDodge)

  const timideChance = hasTrait(traits, 'timide') ? 0.25 : 0

  const sickDot = isSick ? 3 : 0
  const hpMult = isSick ? 0.75 : 1.0

  // counter bonus: +15% if this creature counters opponent type
  const counterBonus = COUNTER_TABLE[creature.type] === opponentType ? 1.15 : 1.0

  return { maxEnergy, damageMult, timerReduction, timerBonus, activeFoodBuff, hideOpponentEnergy, dodgeChance, timideChance, sickDot, hpMult, counterBonus }
}

const OPPONENT_MAX_ENERGY = 4
const TIMER_SECONDS = 4
const BASE_HP = 30

function calcHP(level: number, hpMult = 1.0, creatureType?: CreatureType) {
  const typeMult = creatureType ? CREATURE_PROFILES[creatureType].hpMult : 1.0
  return Math.round((BASE_HP + (level - 1) * 2) * hpMult * typeMult)
}

// ─── defense diminishing returns ────────────────────────
function defenseMultiplier(consecutiveDefends: number): number {
  if (consecutiveDefends <= 1) return 0
  if (consecutiveDefends === 2) return 0.4
  return 0.7
}

// ─── resolution logic ───────────────────────────────────
function resolveRound(p: Action, o: Action, pType: CreatureType, oType: CreatureType): ResolveResult {
  const empty: ResolveResult = { playerDmg: 0, opponentDmg: 0, playerEnergyDelta: 0, opponentEnergyDelta: 0, log: '', playerHeal: 0, opponentDrainDmg: 0, opponentEnergySteal: false }

  // ── nemo drain ──
  if (p.kind === 'drain') {
    // handled in commitAction; set flag for energy steal
    return { ...empty, opponentEnergySteal: true, log: '💧 Drain ! -1⚡ ennemi' }
  }
  // ── nemo convert ──
  if (p.kind === 'convert') {
    return { ...empty, playerEnergyDelta: -2, playerHeal: 8, log: '💧 Conversion : +8 PV !' }
  }
  // ── sylva smoke ──
  if (p.kind === 'smoke') {
    return { ...empty, log: '💨 Fumée ! Prochaine action cachée...' }
  }
  // ── zapp chain ──
  if (p.kind === 'chain') {
    if (o.kind === 'defend') {
      return { ...empty, opponentDmg: 3, playerEnergyDelta: -1, log: '⚡ Chaîne à travers la garde ! 3 dmg' }
    }
    if (o.kind === 'charge') {
      return { ...empty, opponentDmg: 6, playerEnergyDelta: -1, log: '⚡ Chaîne ! Il chargeait ! 6 dmg 💥' }
    }
    if (o.kind === 'attack') {
      // treat chain as attack with energy 1 equivalent
      if (1 === o.energy) {
        return { ...empty, playerDmg: 5, opponentDmg: 5, playerEnergyDelta: -1, opponentEnergyDelta: -o.energy, log: '⚡ Clash ! Chaîne égale, vous vous blessez ! ⚔️' }
      }
      if (1 > o.energy) {
        const dmg = (1 - o.energy) * 4
        return { ...empty, opponentDmg: dmg, playerEnergyDelta: -1, opponentEnergyDelta: -o.energy, log: `⚡ Chaîne domine ! +${dmg} dégâts ⚔️` }
      }
      const dmg = (o.energy - 1) * 4
      return { ...empty, playerDmg: dmg, playerEnergyDelta: -1, opponentEnergyDelta: -o.energy, log: `⚡ Chaîne étouffée ! -${dmg} HP ⚔️` }
    }
    return { ...empty, opponentDmg: 6, playerEnergyDelta: -1, log: '⚡ Frappe en chaîne ! 6 dmg' }
  }

  // ── opponent special actions (bot) ──
  if (o.kind === 'drain') {
    // bot drain: steal player energy
    return { ...empty, playerEnergyDelta: -1, log: '💧 Drain ennemi ! -1⚡' }
  }
  if (o.kind === 'convert') {
    return { ...empty, opponentEnergyDelta: -2, log: '💧 Conversion ennemie...' }
  }
  if (o.kind === 'smoke') {
    return { ...empty, log: '💨 Fumée ennemie !' }
  }
  if (o.kind === 'chain') {
    if (p.kind === 'defend') {
      return { ...empty, playerDmg: 3, opponentEnergyDelta: -1, log: '⚡ Chaîne ennemie à travers ta garde ! -3 HP' }
    }
    if (p.kind === 'charge') {
      return { ...empty, playerDmg: 6, opponentEnergyDelta: -1, log: '⚡ Chaîne ennemie ! Tu chargeais ! -6 HP 💥' }
    }
    if (p.kind === 'attack') {
      if (p.energy === 1) {
        return { ...empty, playerDmg: 5, opponentDmg: 5, playerEnergyDelta: -p.energy, opponentEnergyDelta: -1, log: '⚡ Clash ! Chaîne égale ! ⚔️' }
      }
      if (p.energy < 1) {
        const dmg = (1 - p.energy) * 4
        return { ...empty, playerDmg: dmg, playerEnergyDelta: -p.energy, opponentEnergyDelta: -1, log: `⚡ Chaîne ennemie domine ! -${dmg} HP ⚔️` }
      }
      const dmg = (p.energy - 1) * 4
      return { ...empty, opponentDmg: dmg, playerEnergyDelta: -p.energy, opponentEnergyDelta: -1, log: `⚡ Tu domines la chaîne ! +${dmg} dégâts ⚔️` }
    }
    return { ...empty, playerDmg: 6, opponentEnergyDelta: -1, log: '⚡ Frappe en chaîne ennemie ! -6 HP' }
  }

  // attack vs charge
  if (p.kind === 'attack' && o.kind === 'charge') {
    return { ...empty, opponentDmg: p.energy * 4, playerEnergyDelta: -p.energy, opponentEnergyDelta: 1, log: `Attaque ×${p.energy} ! Il chargeait, il prend cher ! 💥` }
  }
  if (o.kind === 'attack' && p.kind === 'charge') {
    return { ...empty, playerDmg: o.energy * 4, playerEnergyDelta: 1, opponentEnergyDelta: -o.energy, log: `Tu chargeais, il t'a eu ! -${o.energy * 4} HP 💥` }
  }
  // attack vs defend → energy wasted
  if (p.kind === 'attack' && o.kind === 'defend') {
    return { ...empty, playerEnergyDelta: -p.energy, log: `Bloqué ! Tu perds ${p.energy} ⚡ pour rien. 🛡️` }
  }
  if (o.kind === 'attack' && p.kind === 'defend') {
    return { ...empty, opponentEnergyDelta: -o.energy, log: `Tu bloques son attaque ×${o.energy} ! 🛡️` }
  }
  // attack vs attack
  if (p.kind === 'attack' && o.kind === 'attack') {
    if (p.energy === o.energy) {
      // zapp priority: if player is zapp, takes 0 damage
      if (pType === 'zapp') {
        return { ...empty, playerDmg: 0, opponentDmg: 5, playerEnergyDelta: -p.energy, opponentEnergyDelta: -o.energy, log: `Clash ! Zapp trop rapide ! ⚔️⚡` }
      }
      if (oType === 'zapp') {
        return { ...empty, playerDmg: 5, opponentDmg: 0, playerEnergyDelta: -p.energy, opponentEnergyDelta: -o.energy, log: `Clash ! L'ennemi Zapp trop rapide ! ⚔️⚡` }
      }
      return { ...empty, playerDmg: 5, opponentDmg: 5, playerEnergyDelta: -p.energy, opponentEnergyDelta: -o.energy, log: `Clash ! Attaques égales, vous vous blessez ! ⚔️` }
    }
    if (p.energy > o.energy) {
      const dmg = (p.energy - o.energy) * 4
      return { ...empty, opponentDmg: dmg, playerEnergyDelta: -p.energy, opponentEnergyDelta: -o.energy, log: `Clash ! Ton ×${p.energy} domine ! +${dmg} dégâts ⚔️` }
    }
    const dmg = (o.energy - p.energy) * 4
    return { ...empty, playerDmg: dmg, playerEnergyDelta: -p.energy, opponentEnergyDelta: -o.energy, log: `Clash ! Son ×${o.energy} domine ! -${dmg} HP ⚔️` }
  }
  // defend vs defend
  if (p.kind === 'defend' && o.kind === 'defend')
    return { ...empty, log: `Vous vous observez... Rien ne se passe. 👀` }
  // charge vs defend
  if (p.kind === 'charge' && o.kind === 'defend')
    return { ...empty, playerEnergyDelta: 1, log: `Tu charges tranquillement. +1 ⚡` }
  if (o.kind === 'charge' && p.kind === 'defend')
    return { ...empty, opponentEnergyDelta: 1, log: `Il charge tranquillement...` }
  // charge vs charge
  return { ...empty, playerEnergyDelta: 1, opponentEnergyDelta: 1, log: `Vous chargez tous les deux. +1 ⚡ chacun.` }
}

// ─── bot AI ─────────────────────────────────────────────
function botActionForType(
  creatureType: CreatureType,
  botEnergy: number,
  playerEnergy: number,
  lastPlayerAction: Action | null,
  botHP: number,
  botMaxHP: number,
  round: number
): Action {
  const rand = Math.random()

  // Type-specific AI
  switch (creatureType) {
    case 'nemo': {
      const hpPct = botHP / botMaxHP
      // drain when opponent energy >= 3
      if (playerEnergy >= 3 && rand < 0.6) return { kind: 'drain', energy: 0 }
      // convert when HP < 40%
      if (hpPct < 0.4 && botEnergy >= 2 && rand < 0.7) return { kind: 'convert', energy: 2 }
      if (botEnergy === 0) return rand < 0.5 ? { kind: 'drain', energy: 0 } : { kind: 'charge', energy: 0 }
      if (rand < 0.35) return { kind: 'attack', energy: Math.min(botEnergy, 2) }
      if (rand < 0.6) return { kind: 'charge', energy: 0 }
      return { kind: 'drain', energy: 0 }
    }
    case 'sylva': {
      // smoke every ~3-4 turns
      if (round % 4 === 0 && rand < 0.6) return { kind: 'smoke', energy: 0 }
      if (round % 3 === 0 && rand < 0.4) return { kind: 'smoke', energy: 0 }
      // heavy dodge reliant, prefers defend
      if (botEnergy === 0) return rand < 0.5 ? { kind: 'charge', energy: 0 } : { kind: 'defend', energy: 0 }
      if (rand < 0.35) return { kind: 'defend', energy: 0 }
      if (rand < 0.6) return { kind: 'attack', energy: Math.min(botEnergy, 2) }
      return { kind: 'charge', energy: 0 }
    }
    case 'zapp': {
      // uses chain frequently (50% when energy >= 1)
      if (botEnergy >= 1 && rand < 0.5) return { kind: 'chain', energy: 1 }
      if (botEnergy === 0) return rand < 0.6 ? { kind: 'charge', energy: 0 } : { kind: 'defend', energy: 0 }
      // aggressive
      if (rand < 0.55) return { kind: 'attack', energy: Math.min(botEnergy, botEnergy) }
      return { kind: 'charge', energy: 0 }
    }
    default: {
      // ignis and fallback: aggressive
      if (lastPlayerAction?.kind === 'attack' && rand < 0.4) return { kind: 'charge', energy: 0 }
      if (lastPlayerAction?.kind === 'charge' && rand < 0.45) {
        const atk = Math.min(botEnergy, Math.max(1, botEnergy))
        if (atk > 0) return { kind: 'attack', energy: atk }
      }
      if (botEnergy === 0) return rand < 0.7 ? { kind: 'charge', energy: 0 } : { kind: 'defend', energy: 0 }
      if (playerEnergy >= 3) {
        if (rand < 0.5) return { kind: 'defend', energy: 0 }
        if (rand < 0.75) return { kind: 'charge', energy: 0 }
        return { kind: 'attack', energy: Math.min(botEnergy, 2) }
      }
      if (rand < 0.40) {
        const e = Math.ceil(Math.random() * botEnergy)
        return { kind: 'attack', energy: e }
      }
      if (rand < 0.70) return { kind: 'charge', energy: 0 }
      return { kind: 'defend', energy: 0 }
    }
  }
}

// ─── action icon helper ──────────────────────────────────
function actionKindIcon(kind: ActionKind): string {
  switch (kind) {
    case 'defend': return '🛡️'
    case 'charge': return '⚡'
    case 'attack': return '⚔️'
    case 'drain': return '💧'
    case 'convert': return '💊'
    case 'smoke': return '💨'
    case 'chain': return '⚡⚡'
  }
}

// ─── sub-components ─────────────────────────────────────
function EnergyDots({ energy, maxEnergy, color }: { energy: number; maxEnergy: number; color: string }) {
  return (
    <View style={s.energyRow}>
      {Array.from({ length: maxEnergy }, (_, i) => (
        <View key={i} style={[s.dot, { backgroundColor: i < energy ? color : '#333' }]} />
      ))}
    </View>
  )
}

function HPBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  const pct = Math.max(0, hp / maxHp)
  const barColor = pct > 0.5 ? color : pct > 0.25 ? '#FFB300' : '#FF3333'
  return (
    <View style={s.hpBarBg}>
      <View style={[s.hpBarFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
    </View>
  )
}

function ActionLabel({ action, masked }: { action: Action | null; masked?: boolean }) {
  if (!action) return <Text style={s.actionLabel}>?</Text>
  if (masked) return <Text style={s.actionLabel}>💨 ???</Text>
  if (action.kind === 'defend') return <Text style={s.actionLabel}>🛡️ Défend</Text>
  if (action.kind === 'charge') return <Text style={s.actionLabel}>⚡ Charge</Text>
  if (action.kind === 'drain') return <Text style={s.actionLabel}>💧 Drain</Text>
  if (action.kind === 'convert') return <Text style={s.actionLabel}>💊 Convertit</Text>
  if (action.kind === 'smoke') return <Text style={s.actionLabel}>💨 Fumée</Text>
  if (action.kind === 'chain') return <Text style={s.actionLabel}>⚡⚡ Chaîne</Text>
  return <Text style={s.actionLabel}>⚔️ Attaque ×{action.energy}</Text>
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

  // Counter advantage/disadvantage
  if (COUNTER_TABLE[playerType] === opponentType) {
    buffs.push({ emoji: '⚔️', text: 'Avantage de type : +15% dégâts' })
  } else if (COUNTER_TABLE[opponentType] === playerType) {
    debuffs.push({ emoji: '⚠️', text: 'Désavantage de type : ennemi +15%' })
  }

  // Creature type specialty
  switch (playerType) {
    case 'ignis': buffs.push({ emoji: '🔥', text: 'Braises disponibles (passif)' }); break
    case 'nemo':  buffs.push({ emoji: '💧', text: 'Drain & Conversion disponibles' }); break
    case 'sylva': buffs.push({ emoji: '💨', text: 'Fumée & Esquive (25%) disponibles' }); break
    case 'zapp':  buffs.push({ emoji: '⚡', text: 'Chaîne & Vitesse disponibles' }); break
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

// ─── main component ─────────────────────────────────────
export default function CombatScreen({ player, opponent, onFinish }: Props) {
  // Compute player modifiers once at component init
  const playerMods = useRef<CombatModifiers>(computeModifiers(player, opponent.creatureType)).current

  const playerProfile  = CREATURE_PROFILES[player.type]
  const opponentProfile = CREATURE_PROFILES[opponent.creatureType]

  const playerMaxHP  = calcHP(player.stats.level, playerMods.hpMult, player.type)
  const opponentMaxHP = calcHP(opponent.level, 1.0, opponent.creatureType)

  // opponent counter bonus (does opponent counter player?)
  const opponentCounterBonus = COUNTER_TABLE[opponent.creatureType] === player.type ? 1.15 : 1.0

  const [phase, setPhase]       = useState<CombatPhase>('intro')
  const [round, setRound]       = useState(1)
  const [pState, setPState]     = useState<Combatant>({ hp: playerMaxHP,  energy: playerProfile.startEnergy })
  const [oState, setOState]     = useState<Combatant>({ hp: opponentMaxHP, energy: opponentProfile.startEnergy })
  const [playerAction, setPlayerAction] = useState<Action | null>(null)
  const [opponentAction, setOpponentAction] = useState<Action | null>(null)
  const [log, setLog]           = useState('Prêt pour le combat !')
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [chose, setChose]       = useState(false)

  // Signature mechanic states
  const [pMech, setPMech] = useState<CombatMechanics>(initialMechanics)
  const [oMech, setOMech] = useState<CombatMechanics>(initialMechanics)

  // Action history (last 3 opponent actions)
  const [opponentHistory, setOpponentHistory] = useState<ActionKind[]>([])

  const lastPlayerActionRef = useRef<Action | null>(null)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerAnim = useRef(new Animated.Value(1)).current
  const playerShake = useRef(new Animated.Value(0)).current
  const opponentShake = useRef(new Animated.Value(0)).current

  const pColor = CREATURE_COLORS[player.type]
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
  }, [])

  // auto-defend if timer runs out
  useEffect(() => {
    if (phase !== 'choosing') return
    if (timeLeft > 0) return
    if (!chose) commitAction({ kind: 'defend', energy: 0 })
  }, [timeLeft, phase, chose])

  const commitAction = useCallback((rawAction: Action) => {
    if (chose) return
    setChose(true)
    clearInterval(timerRef.current!)

    // Apply timide: 25% chance to defend if HP < 50%
    let action = rawAction
    let behaviorLog = ''
    if (playerMods.timideChance > 0) {
      const hpPct = pState.hp / playerMaxHP
      if (hpPct < 0.5 && Math.random() < playerMods.timideChance) {
        action = { kind: 'defend', energy: 0 }
        behaviorLog = `🐣 Timide ! ${player.name} préfère se défendre...`
      }
    }

    // Check player paralysis — force defend
    let paralyzedLog = ''
    if (pMech.paralyzed) {
      action = { kind: 'defend', energy: 0 }
      paralyzedLog = `⚡ Paralysé ! ${player.name} ne peut que se défendre !`
      setPMech(prev => ({ ...prev, paralyzed: false }))
    }

    // Check opponent paralysis — force defend
    let botAct: Action
    if (oMech.paralyzed) {
      botAct = { kind: 'defend', energy: 0 }
      setOMech(prev => ({ ...prev, paralyzed: false }))
    } else {
      botAct = botActionForType(
        opponent.creatureType,
        oState.energy,
        pState.energy,
        lastPlayerActionRef.current,
        oState.hp,
        opponentMaxHP,
        round
      )
    }
    lastPlayerActionRef.current = action

    setPlayerAction(action)
    setOpponentAction(botAct)
    setPhase('resolving')

    const result = resolveRound(action, botAct, player.type, opponent.creatureType)

    // ── Apply damageMult + counter bonuses to player-dealt damage ──
    let finalOpponentDmg = Math.round(result.opponentDmg * playerMods.damageMult * playerMods.counterBonus)

    // Opponent counter bonus on player damage
    let finalPlayerDmg = Math.round(result.playerDmg * opponentCounterBonus)

    // ── Ignis ember mechanic ──
    let emberLog = ''
    let newPEmbers = pMech.embers
    if (player.type === 'ignis') {
      // If embers full (3), multiply outgoing damage
      if (pMech.embers === 3 && finalOpponentDmg > 0) {
        finalOpponentDmg = Math.round(finalOpponentDmg * 1.5)
        newPEmbers = 0
        emberLog = ' 🔥🔥🔥 BRAISES !'
      } else if (finalOpponentDmg > 0 && pMech.embers < 3) {
        // Increment embers if hit landed
        newPEmbers = Math.min(3, pMech.embers + 1)
      }
      // Reset embers if player takes damage
      if (finalPlayerDmg > 0) {
        newPEmbers = 0
      }
    }

    // ── Nemo drain special handling ──
    let drainLog = ''
    let opponentEnergyStealDmg = 0
    if (action.kind === 'drain') {
      if (oState.energy === 0) {
        opponentEnergyStealDmg = 3
        drainLog = ' 💧 Drain ! Ennemi vide ! -3 HP !'
      }
      // energy change is handled below
    }

    // ── Apply dodge: if opponent attacks and dodge triggers, player takes 0 damage ──
    let dodgeLog = ''
    if (result.playerDmg > 0 && playerMods.dodgeChance > 0 && Math.random() < playerMods.dodgeChance) {
      finalPlayerDmg = 0
      dodgeLog = 'Esquivé ! 💨'
    }

    // ── Apply sick dot every 3 turns ──
    let sickDotLog = ''
    if (playerMods.sickDot > 0 && round % 3 === 0) {
      finalPlayerDmg += playerMods.sickDot
      sickDotLog = ` 🤒 Empoisonné -${playerMods.sickDot} PV`
    }

    // ── Defense diminishing returns ──
    let defWeakenedPlayerLog = ''
    let defWeakenedOpponentLog = ''
    let newPConsecDef = pMech.consecutiveDefends
    let newOConsecDef = oMech.consecutiveDefends

    // Player defending (opponent attacking or using chain)
    const opponentDealtDamage = result.playerDmg > 0 || (botAct.kind === 'chain')
    if (action.kind === 'defend') {
      newPConsecDef = pMech.consecutiveDefends + 1
      if (opponentDealtDamage) {
        const mult = defenseMultiplier(newPConsecDef)
        finalPlayerDmg = Math.round(finalPlayerDmg * mult)
        if (newPConsecDef >= 2) defWeakenedPlayerLog = ' (défense affaiblie !)'
      }
    } else {
      newPConsecDef = 0
    }

    // Opponent defending (player attacking or using chain)
    const playerDealtDamage = result.opponentDmg > 0 || action.kind === 'chain'
    if (botAct.kind === 'defend') {
      newOConsecDef = oMech.consecutiveDefends + 1
      if (playerDealtDamage) {
        const mult = defenseMultiplier(newOConsecDef)
        finalOpponentDmg = Math.round(finalOpponentDmg * mult)
        if (newOConsecDef >= 2) defWeakenedOpponentLog = ' (défense ennemie affaiblie !)'
      }
    } else {
      newOConsecDef = 0
    }

    // ── Compute new HP ──
    const playerHeal = result.playerHeal
    const newPHP = Math.max(0, Math.min(playerMaxHP, pState.hp - finalPlayerDmg + playerHeal))
    const newOHP = Math.max(0, oState.hp - finalOpponentDmg - opponentEnergyStealDmg)

    // ── Compute new energy ──
    let newPEnDelta = result.playerEnergyDelta
    let newOEnDelta = result.opponentEnergyDelta

    // Drain: steal opponent energy
    if (action.kind === 'drain' && oState.energy > 0) {
      newOEnDelta = -1
    }
    // Opponent drain: steal player energy
    if (botAct.kind === 'drain' && pState.energy > 0) {
      newPEnDelta = -1
    }

    const newPEn = Math.max(0, Math.min(playerMods.maxEnergy, pState.energy + newPEnDelta))
    const newOEn = Math.max(0, Math.min(OPPONENT_MAX_ENERGY, oState.energy + newOEnDelta))

    // ── Zapp chain paralysis ──
    let paralysisLog = ''
    let newOParalyzed = oMech.paralyzed
    if (action.kind === 'chain' && Math.random() < 0.25) {
      newOParalyzed = true
      paralysisLog = ' ⚡ Paralysie !'
    }
    // Opponent chain paralysis
    let newPParalyzed = pMech.paralyzed
    if (botAct.kind === 'chain' && Math.random() < 0.25) {
      newPParalyzed = true
    }

    // ── Sylva smoke: update smokeNextTurn flag ──
    let smokeLog = ''
    let newPSmoke = pMech.smokeNextTurn
    if (action.kind === 'smoke') {
      newPSmoke = true
    } else if (pMech.smokeNextTurn) {
      // Smoke resolves this turn
      newPSmoke = false
      smokeLog = ' 💨 Fumée se dissipe.'
    }

    if (finalPlayerDmg > 0)  shake(playerShake)
    if (finalOpponentDmg > 0) shake(opponentShake)

    // ── Build log message ──
    let logMsg = paralyzedLog || behaviorLog || result.log
    if (!behaviorLog && !paralyzedLog && finalOpponentDmg > 0 && Math.abs(playerMods.damageMult - 1.0) > 0.04) {
      const sign = playerMods.damageMult > 1.0 ? '+' : ''
      const pct  = Math.round((playerMods.damageMult - 1.0) * 100)
      logMsg += ` (×${playerMods.damageMult.toFixed(2)}, ${sign}${pct}%)`
    }
    if (emberLog) logMsg += emberLog
    if (drainLog) logMsg += drainLog
    if (dodgeLog) logMsg += ` ${dodgeLog}`
    if (sickDotLog) logMsg += sickDotLog
    if (defWeakenedPlayerLog) logMsg += defWeakenedPlayerLog
    if (defWeakenedOpponentLog) logMsg += defWeakenedOpponentLog
    if (paralysisLog) logMsg += paralysisLog
    if (smokeLog) logMsg += smokeLog

    setLog(logMsg)
    setPState({ hp: newPHP, energy: newPEn })
    setOState({ hp: newOHP, energy: newOEn })
    setPMech({
      embers: newPEmbers,
      consecutiveDefends: newPConsecDef,
      smokeNextTurn: newPSmoke,
      paralyzed: newPParalyzed,
    })
    setOMech({
      embers: oMech.embers,
      consecutiveDefends: newOConsecDef,
      smokeNextTurn: false,
      paralyzed: newOParalyzed,
    })
    setOpponentHistory(prev => [botAct.kind, ...prev].slice(0, 3))

    setTimeout(() => {
      if (newPHP <= 0 || newOHP <= 0 || round >= 10) {
        setPhase('finished')
      } else {
        setPlayerAction(null)
        setOpponentAction(null)
        setRound((r) => r + 1)
        setPhase('choosing')
        startTimer()
      }
    }, 3200)
  }, [chose, pState, oState, round, startTimer, playerMods, playerMaxHP, player.name, player.type, opponent.creatureType, pMech, oMech, opponentCounterBonus, opponentMaxHP])

  // start game
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('choosing')
      startTimer()
    }, 1600)
    return () => clearTimeout(t)
  }, [])

  const won = pState.hp > oState.hp || (pState.hp > 0 && oState.hp <= 0)
  const xpGained = won ? 60 + opponent.level * 5 : 20

  const playerSprite  = SPRITES[spriteKey(player.type, player.stats.level)]
  const opponentSprite = SPRITES[spriteKey(opponent.creatureType, opponent.level)]

  // Smoke mask: hide player action during resolving if smokeNextTurn was active last choose phase
  // Actually smokeNextTurn means the action chosen NEXT turn is hidden from opponent
  // In single-device: when pMech.smokeNextTurn during choosing, show player energy as 💨
  const showSmokeEnergy = pMech.smokeNextTurn && phase === 'choosing'

  return (
    <View style={s.root}>

      {/* ── HEADER: round + timer ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.roundText}>Tour {round} / 10</Text>
          {phase === 'choosing' && (
            <Text style={s.timerCountdown}>{timeLeft}s</Text>
          )}
        </View>
        <View style={s.timerBarBg}>
          {phase === 'choosing' && (
            <Animated.View
              style={[s.timerBarFill, {
                width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]}
            />
          )}
        </View>
      </View>

      {/* ── ARENA ── */}
      <View style={s.arena}>

        {/* Opponent card */}
        <View style={s.fighterCard}>
          <View style={s.fighterRow}>
            <View style={s.fighterInfo}>
              <View style={s.nameRow}>
                <Text style={s.fighterName} numberOfLines={1}>{opponent.creatureName}</Text>
                <View style={[s.levelPill, { backgroundColor: oColor + '33' }]}>
                  <Text style={[s.levelText, { color: oColor }]}>Lv {opponent.level}</Text>
                </View>
              </View>
              <HPBar hp={oState.hp} maxHp={opponentMaxHP} color={oColor} />
              <Text style={s.hpText}>{oState.hp} / {opponentMaxHP} HP</Text>
              <View style={s.statusRow}>
                {playerMods.hideOpponentEnergy
                  ? <Text style={s.hiddenEnergy}>⚡ ???</Text>
                  : <EnergyDots energy={oState.energy} maxEnergy={OPPONENT_MAX_ENERGY} color={oColor} />
                }
                {oMech.paralyzed && <Text style={s.paralyzedBadge}>⚡ Paralysé</Text>}
              </View>
              {opponentHistory.length > 0 && (
                <View style={s.historyRow}>
                  <Text style={s.historyLabel}>Hist :</Text>
                  {opponentHistory.map((k, i) => (
                    <Text key={i} style={s.historyIcon}>{actionKindIcon(k)}</Text>
                  ))}
                </View>
              )}
            </View>
            <Animated.View style={{ transform: [{ translateX: opponentShake }, { scaleX: -1 }] }}>
              <Image source={opponentSprite} style={s.sprite} resizeMode="contain" />
            </Animated.View>
          </View>
        </View>

        {/* Resolve strip — always rendered to prevent layout jump */}
        <View style={s.resolveStrip}>
          {phase === 'resolving' && (
            <>
              <ActionLabel action={playerAction} />
              <Text style={s.resolveVs}>⚔️</Text>
              <ActionLabel action={opponentAction} masked={oMech.smokeNextTurn} />
            </>
          )}
        </View>

        {/* Player card */}
        <View style={s.fighterCard}>
          <View style={s.fighterRow}>
            <Animated.View style={{ transform: [{ translateX: playerShake }] }}>
              <Image source={playerSprite} style={s.sprite} resizeMode="contain" />
            </Animated.View>
            <View style={s.fighterInfo}>
              <View style={s.nameRow}>
                <Text style={s.fighterName} numberOfLines={1}>{player.name}</Text>
                <View style={[s.levelPill, { backgroundColor: pColor + '33' }]}>
                  <Text style={[s.levelText, { color: pColor }]}>Lv {player.stats.level}</Text>
                </View>
              </View>
              <HPBar hp={pState.hp} maxHp={playerMaxHP} color={pColor} />
              <Text style={s.hpText}>{pState.hp} / {playerMaxHP} HP</Text>
              <View style={s.statusRow}>
                {showSmokeEnergy
                  ? <Text style={s.smokeEnergy}>💨</Text>
                  : <EnergyDots energy={pState.energy} maxEnergy={playerMods.maxEnergy} color={pColor} />
                }
                {player.type === 'ignis' && (
                  <View style={s.embersRow}>
                    {[0, 1, 2].map(i => (
                      <Text key={i} style={[s.emberDot, { opacity: i < pMech.embers ? 1 : 0.2 }]}>🔥</Text>
                    ))}
                  </View>
                )}
                {pMech.paralyzed && <Text style={s.paralyzedBadge}>⚡ Paralysé</Text>}
              </View>
            </View>
          </View>
        </View>

      </View>

      {/* ── LOG ── */}
      <View style={s.logBox}>
        <Text style={s.logText} numberOfLines={2}>{log}</Text>
      </View>

      {/* ── ACTIONS ── */}
      {phase === 'choosing' && (
        <View style={s.actions}>

          {/* Row 1: Défendre + Charger */}
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.mainBtn, s.defendBtn]}
              onPress={() => commitAction({ kind: 'defend', energy: 0 })}
            >
              <Text style={s.mainBtnIcon}>🛡️</Text>
              <Text style={s.mainBtnLabel}>Défendre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.mainBtn, s.chargeBtn]}
              onPress={() => commitAction({ kind: 'charge', energy: 0 })}
            >
              <Text style={s.mainBtnIcon}>⚡</Text>
              <Text style={s.mainBtnLabel}>Charger</Text>
              <Text style={s.mainBtnSub}>{pState.energy} / {playerMods.maxEnergy} ⚡</Text>
            </TouchableOpacity>
          </View>

          {/* Nemo specials */}
          {player.type === 'nemo' && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.mainBtn, { backgroundColor: '#001E44' }]}
                onPress={() => commitAction({ kind: 'drain', energy: 0 })}
              >
                <Text style={s.mainBtnIcon}>💧</Text>
                <Text style={s.mainBtnLabel}>Drain</Text>
                <Text style={s.mainBtnSub}>Gratuit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.mainBtn, { backgroundColor: pState.energy >= 2 ? '#002E66' : '#111' }]}
                onPress={() => pState.energy >= 2 && commitAction({ kind: 'convert', energy: 2 })}
                activeOpacity={pState.energy >= 2 ? 0.7 : 1}
              >
                <Text style={s.mainBtnIcon}>💊</Text>
                <Text style={[s.mainBtnLabel, pState.energy < 2 && { color: '#444' }]}>Convertir</Text>
                <Text style={[s.mainBtnSub, pState.energy < 2 && { color: '#333' }]}>×2⚡ → +8 PV</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sylva special */}
          {player.type === 'sylva' && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.mainBtn, { backgroundColor: '#001A00', flex: 0.5 }]}
                onPress={() => commitAction({ kind: 'smoke', energy: 0 })}
              >
                <Text style={s.mainBtnIcon}>💨</Text>
                <Text style={s.mainBtnLabel}>Fumée</Text>
                <Text style={s.mainBtnSub}>Gratuit</Text>
              </TouchableOpacity>
              <View style={{ flex: 0.5 }} />
            </View>
          )}

          {/* Attack row */}
          <View style={s.attackRow}>
            {player.type === 'zapp' && (
              <TouchableOpacity
                style={[s.attackBtn, s.chainBtn, pState.energy < 1 && s.btnDisabled]}
                onPress={() => pState.energy >= 1 && commitAction({ kind: 'chain', energy: 1 })}
                activeOpacity={pState.energy >= 1 ? 0.7 : 1}
              >
                <Text style={[s.attackIcon, { color: '#FFE066' }, pState.energy < 1 && { color: '#333' }]}>⚡⚡</Text>
                <Text style={[s.attackLabel, pState.energy < 1 && { color: '#333' }]}>Chaîne</Text>
                <Text style={[s.attackSub, pState.energy < 1 && { color: '#222' }]}>6 dmg</Text>
              </TouchableOpacity>
            )}
            {[1, 2, 3, 4].map((e) => {
              const can = pState.energy >= e && e <= playerMods.maxEnergy
              return (
                <TouchableOpacity
                  key={e}
                  style={[s.attackBtn, !can && s.btnDisabled]}
                  onPress={() => can && commitAction({ kind: 'attack', energy: e })}
                  activeOpacity={can ? 0.7 : 1}
                >
                  <Text style={[s.attackIcon, !can && { color: '#333' }]}>⚔️</Text>
                  <Text style={[s.attackLabel, !can && { color: '#333' }]}>×{e}</Text>
                  <Text style={[s.attackSub, !can && { color: '#222' }]}>{e * 4} dmg</Text>
                </TouchableOpacity>
              )
            })}
          </View>

        </View>
      )}

      {/* ── INTRO OVERLAY ── */}
      {phase === 'intro' && (
        <View style={s.overlay}>
          <Text style={s.introTitle}>COMBAT !</Text>
          <Text style={s.introSub}>{player.name} vs {opponent.creatureName}</Text>
          <DebuffPanel mods={playerMods} playerType={player.type} opponentType={opponent.creatureType} />
        </View>
      )}

      {/* ── FINISH OVERLAY ── */}
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
  root: { flex: 1, backgroundColor: '#0D0D1A' },

  // header
  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 8, gap: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundText: { color: '#aaa', fontSize: 14, fontWeight: '700' },
  timerCountdown: { color: '#FFD700', fontSize: 24, fontWeight: '900' },
  timerBarBg: { height: 5, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' },
  timerBarFill: { height: 5, backgroundColor: '#FFD700', borderRadius: 3 },

  // arena — vertical layout, space-between keeps cards at top/bottom
  arena: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },

  fighterCard: {
    backgroundColor: '#13132A',
    borderRadius: 18,
    padding: 14,
  },
  fighterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fighterInfo: { flex: 1, gap: 5 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fighterName: { color: '#fff', fontSize: 15, fontWeight: '800', flexShrink: 1 },
  levelPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  levelText: { fontSize: 11, fontWeight: '800' },

  hpBarBg: { height: 10, backgroundColor: '#222', borderRadius: 5, overflow: 'hidden' },
  hpBarFill: { height: 10, borderRadius: 5 },
  hpText: { color: '#666', fontSize: 11, marginTop: 2 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  energyRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 11, height: 11, borderRadius: 6 },
  hiddenEnergy: { color: '#555', fontSize: 12, fontWeight: '800' },
  smokeEnergy: { fontSize: 16 },
  embersRow: { flexDirection: 'row', gap: 2 },
  emberDot: { fontSize: 13 },
  paralyzedBadge: { color: '#FFE066', fontSize: 11, fontWeight: '800' },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  historyLabel: { color: '#444', fontSize: 10, fontWeight: '600' },
  historyIcon: { fontSize: 14 },

  sprite: { width: 100, height: 100 },

  // resolve strip — fixed height so layout doesn't jump between phases
  resolveStrip: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: '#ffffff06',
    borderRadius: 12,
  },
  resolveVs: { color: '#555', fontSize: 16, fontWeight: '900' },
  actionLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // log
  logBox: {
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#13132A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 46,
  },
  logText: { color: '#ccc', fontSize: 13, lineHeight: 19 },

  // actions
  actions: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  mainBtn: {
    flex: 1, borderRadius: 14,
    paddingVertical: 13, alignItems: 'center', gap: 2,
  },
  defendBtn: { backgroundColor: '#162D56' },
  chargeBtn: { backgroundColor: '#302600' },
  mainBtnIcon: { fontSize: 22 },
  mainBtnLabel: { color: '#fff', fontWeight: '800', fontSize: 13 },
  mainBtnSub: { color: '#888', fontSize: 11 },

  attackRow: { flexDirection: 'row', gap: 6 },
  attackBtn: {
    flex: 1, backgroundColor: '#280600',
    borderRadius: 11, paddingVertical: 9, alignItems: 'center', gap: 1,
  },
  chainBtn: {
    backgroundColor: '#221500',
    borderWidth: 1, borderColor: '#FFE06655',
  },
  btnDisabled: { backgroundColor: '#0F0F0F' },
  attackIcon: { color: '#FF6B35', fontSize: 16 },
  attackLabel: { color: '#FF6B35', fontWeight: '800', fontSize: 12 },
  attackSub: { color: '#FF6B3555', fontSize: 10 },

  // overlays
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  introTitle: { fontSize: 48, fontWeight: '900', color: '#FFD700', letterSpacing: 4 },
  introSub: { fontSize: 16, color: '#aaa' },

  debuffPanel: {
    backgroundColor: 'rgba(255,60,60,0.1)',
    borderRadius: 12,
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
  finishXP: { fontSize: 22, color: '#FFD700', fontWeight: '800' },
  finishBtn: {
    backgroundColor: '#FFD700', paddingHorizontal: 48, paddingVertical: 16,
    borderRadius: 16, marginTop: 16,
  },
  finishBtnText: { color: '#000', fontSize: 17, fontWeight: '900' },
})
