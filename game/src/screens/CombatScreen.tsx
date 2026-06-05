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

// ─── types ──────────────────────────────────────────────
type ActionKind = 'defend' | 'charge' | 'attack'
type CombatPhase = 'intro' | 'choosing' | 'resolving' | 'finished'

interface Action {
  kind: ActionKind
  energy: number
}

interface Combatant {
  hp: number
  energy: number
}

interface ResolveResult {
  playerDmg: number
  opponentDmg: number
  playerEnergyDelta: number
  opponentEnergyDelta: number
  log: string
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
  maxEnergy: number           // 4 normally, 3 if energy<60, 2 if energy<30
  damageMult: number          // hunger + mood + traits; floor at 0.55
  timerReduction: number      // 0 normally, 1 if happiness<60 (timer = TIMER_SECONDS - timerReduction)
  timerBonus: number          // from training.reflexes (+0.1s per point)
  activeFoodBuff: boolean     // whether a food combat buff is currently active
  hideOpponentEnergy: boolean // true if happiness<30 (can't read opponent energy)
  dodgeChance: number         // 0.15 if chanceux, else 0
  timideChance: number        // 0.25 if timide, else 0
  sickDot: number             // 3 if isSick, else 0 (every 3 turns)
  hpMult: number              // 0.75 if isSick, else 1.0
}

const DAMAGE_FLOOR = 0.55

function computeModifiers(creature: Creature): CombatModifiers {
  const { hunger, happiness, energy, isSick } = creature.stats
  const traits: PersonalityTrait[] | undefined = creature.traits
  const mood = creature.mood

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

  // global floor — a neglected creature stays competitive with good play
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

  const timerBonus = parseFloat((training.reflexes * 0.1).toFixed(1))

  // happiness → timer pressure + information penalty (replaces random confusion)
  const timerReduction = happiness < 60 ? 1 : 0
  const hideOpponentEnergy = happiness < 30

  // dodgeChance
  const dodgeChance = Math.min(0.35, (hasTrait(traits, 'chanceux') ? 0.15 : 0) + trainingDodge)

  // timideChance
  const timideChance = hasTrait(traits, 'timide') ? 0.25 : 0

  // sick effects
  const sickDot = isSick ? 3 : 0
  const hpMult = isSick ? 0.75 : 1.0

  return { maxEnergy, damageMult, timerReduction, timerBonus, activeFoodBuff, hideOpponentEnergy, dodgeChance, timideChance, sickDot, hpMult }
}

const OPPONENT_MAX_ENERGY = 4
const TIMER_SECONDS = 4
const BASE_HP = 30

function calcHP(level: number, hpMult = 1.0) {
  return Math.round((BASE_HP + (level - 1) * 2) * hpMult)
}

// ─── resolution logic ───────────────────────────────────
function resolveRound(p: Action, o: Action): ResolveResult {
  // attack vs charge
  if (p.kind === 'attack' && o.kind === 'charge') {
    return { playerDmg: 0, opponentDmg: p.energy * 4, playerEnergyDelta: -p.energy, opponentEnergyDelta: 1, log: `Attaque ×${p.energy} ! Il chargeait, il prend cher ! 💥` }
  }
  if (o.kind === 'attack' && p.kind === 'charge') {
    return { playerDmg: o.energy * 4, opponentDmg: 0, playerEnergyDelta: 1, opponentEnergyDelta: -o.energy, log: `Tu chargeais, il t'a eu ! -${o.energy * 4} HP 💥` }
  }
  // attack vs defend → energy wasted
  if (p.kind === 'attack' && o.kind === 'defend') {
    return { playerDmg: 0, opponentDmg: 0, playerEnergyDelta: -p.energy, opponentEnergyDelta: 0, log: `Bloqué ! Tu perds ${p.energy} ⚡ pour rien. 🛡️` }
  }
  if (o.kind === 'attack' && p.kind === 'defend') {
    return { playerDmg: 0, opponentDmg: 0, playerEnergyDelta: 0, opponentEnergyDelta: -o.energy, log: `Tu bloques son attaque ×${o.energy} ! 🛡️` }
  }
  // attack vs attack
  if (p.kind === 'attack' && o.kind === 'attack') {
    if (p.energy === o.energy)
      return { playerDmg: 5, opponentDmg: 5, playerEnergyDelta: -p.energy, opponentEnergyDelta: -o.energy, log: `Clash ! Attaques égales, vous vous blessez ! ⚔️` }
    if (p.energy > o.energy) {
      const dmg = (p.energy - o.energy) * 4
      return { playerDmg: 0, opponentDmg: dmg, playerEnergyDelta: -p.energy, opponentEnergyDelta: -o.energy, log: `Clash ! Ton ×${p.energy} domine ! +${dmg} dégâts ⚔️` }
    }
    const dmg = (o.energy - p.energy) * 4
    return { playerDmg: dmg, opponentDmg: 0, playerEnergyDelta: -p.energy, opponentEnergyDelta: -o.energy, log: `Clash ! Son ×${o.energy} domine ! -${dmg} HP ⚔️` }
  }
  // defend vs defend
  if (p.kind === 'defend' && o.kind === 'defend')
    return { playerDmg: 0, opponentDmg: 0, playerEnergyDelta: 0, opponentEnergyDelta: 0, log: `Vous vous observez... Rien ne se passe. 👀` }
  // charge vs defend
  if (p.kind === 'charge' && o.kind === 'defend')
    return { playerDmg: 0, opponentDmg: 0, playerEnergyDelta: 1, opponentEnergyDelta: 0, log: `Tu charges tranquillement. +1 ⚡` }
  if (o.kind === 'charge' && p.kind === 'defend')
    return { playerDmg: 0, opponentDmg: 0, playerEnergyDelta: 0, opponentEnergyDelta: 1, log: `Il charge tranquillement...` }
  // charge vs charge
  return { playerDmg: 0, opponentDmg: 0, playerEnergyDelta: 1, opponentEnergyDelta: 1, log: `Vous chargez tous les deux. +1 ⚡ chacun.` }
}

// ─── bot AI ─────────────────────────────────────────────
function botAction(botEnergy: number, playerEnergy: number, lastPlayerAction: Action | null): Action {
  const rand = Math.random()

  // counter-predict: if player attacked last turn, they might defend or charge now
  if (lastPlayerAction?.kind === 'attack' && rand < 0.4) {
    return { kind: 'charge', energy: 0 }
  }
  if (lastPlayerAction?.kind === 'charge' && rand < 0.45) {
    const atk = Math.min(botEnergy, Math.max(1, botEnergy))
    if (atk > 0) return { kind: 'attack', energy: atk }
  }

  if (botEnergy === 0) {
    return rand < 0.7 ? { kind: 'charge', energy: 0 } : { kind: 'defend', energy: 0 }
  }
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

function ActionLabel({ action }: { action: Action | null }) {
  if (!action) return <Text style={s.actionLabel}>?</Text>
  if (action.kind === 'defend') return <Text style={s.actionLabel}>🛡️ Défend</Text>
  if (action.kind === 'charge') return <Text style={s.actionLabel}>⚡ Charge</Text>
  return <Text style={s.actionLabel}>⚔️ Attaque ×{action.energy}</Text>
}

interface DebuffItem {
  emoji: string
  text: string
}

function DebuffPanel({ mods }: { mods: CombatModifiers }) {
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
  const playerMods = useRef<CombatModifiers>(computeModifiers(player)).current

  const playerMaxHP  = calcHP(player.stats.level, playerMods.hpMult)
  const opponentMaxHP = calcHP(opponent.level)

  const [phase, setPhase]       = useState<CombatPhase>('intro')
  const [round, setRound]       = useState(1)
  const [pState, setPState]     = useState<Combatant>({ hp: playerMaxHP,  energy: 0 })
  const [oState, setOState]     = useState<Combatant>({ hp: opponentMaxHP, energy: 0 })
  const [playerAction, setPlayerAction] = useState<Action | null>(null)
  const [opponentAction, setOpponentAction] = useState<Action | null>(null)
  const [log, setLog]           = useState('Prêt pour le combat !')
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [chose, setChose]       = useState(false)

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

    const botAct = botAction(oState.energy, pState.energy, lastPlayerActionRef.current)
    lastPlayerActionRef.current = action

    setPlayerAction(action)
    setOpponentAction(botAct)
    setPhase('resolving')

    const result = resolveRound(action, botAct)

    // Apply damageMult to player-dealt damage
    let finalOpponentDmg = Math.round(result.opponentDmg * playerMods.damageMult)

    // Apply dodge: if opponent attacks and dodge triggers, player takes 0 damage
    let finalPlayerDmg = result.playerDmg
    let dodgeLog = ''
    if (result.playerDmg > 0 && playerMods.dodgeChance > 0 && Math.random() < playerMods.dodgeChance) {
      finalPlayerDmg = 0
      dodgeLog = 'Esquivé ! 💨'
    }

    // Apply sick dot every 3 turns
    let sickDotLog = ''
    if (playerMods.sickDot > 0 && round % 3 === 0) {
      finalPlayerDmg += playerMods.sickDot
      sickDotLog = ` 🤒 Empoisonné -${playerMods.sickDot} PV`
    }

    const newPHP  = Math.max(0, pState.hp - finalPlayerDmg)
    const newOHP  = Math.max(0, oState.hp - finalOpponentDmg)
    const newPEn  = Math.max(0, Math.min(playerMods.maxEnergy, pState.energy + result.playerEnergyDelta))
    const newOEn  = Math.max(0, Math.min(OPPONENT_MAX_ENERGY, oState.energy + result.opponentEnergyDelta))

    if (finalPlayerDmg > 0)  shake(playerShake)
    if (finalOpponentDmg > 0) shake(opponentShake)

    // Build log message — show damageMult when attack deals damage
    let logMsg = behaviorLog || result.log
    if (!behaviorLog && finalOpponentDmg > 0 && Math.abs(playerMods.damageMult - 1.0) > 0.04) {
      const sign = playerMods.damageMult > 1.0 ? '+' : ''
      const pct  = Math.round((playerMods.damageMult - 1.0) * 100)
      logMsg += ` (×${playerMods.damageMult.toFixed(2)}, ${sign}${pct}%)`
    }
    if (dodgeLog) logMsg += ` ${dodgeLog}`
    if (sickDotLog) logMsg += sickDotLog

    setLog(logMsg)
    setPState({ hp: newPHP, energy: newPEn })
    setOState({ hp: newOHP, energy: newOEn })

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
    }, 1800)
  }, [chose, pState, oState, round, startTimer, playerMods, playerMaxHP, player.name])

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

  return (
    <View style={s.root}>
      {/* header */}
      <View style={s.header}>
        <Text style={s.roundText}>Tour {round}/10</Text>
        {phase === 'choosing' && (
          <View style={s.timerBarBg}>
            <Animated.View style={[s.timerBarFill, { width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
        )}
      </View>

      {/* arena */}
      <View style={s.arena}>
        {/* player side */}
        <View style={s.side}>
          <Text style={s.playerName} numberOfLines={1}>{player.name}</Text>
          <HPBar hp={pState.hp} maxHp={playerMaxHP} color={pColor} />
          <Text style={s.hpText}>{pState.hp}/{playerMaxHP}</Text>
          <Animated.View style={{ transform: [{ translateX: playerShake }] }}>
            <Image source={playerSprite} style={s.sprite} resizeMode="contain" />
          </Animated.View>
          <EnergyDots energy={pState.energy} maxEnergy={playerMods.maxEnergy} color={pColor} />
        </View>

        {/* VS */}
        <View style={s.vsCol}>
          <Text style={s.vs}>VS</Text>
          {phase === 'resolving' && (
            <View style={s.resolvePanel}>
              <ActionLabel action={playerAction} />
              <Text style={s.resolveVs}>⚔️</Text>
              <ActionLabel action={opponentAction} />
            </View>
          )}
        </View>

        {/* opponent side */}
        <View style={s.side}>
          <Text style={s.playerName} numberOfLines={1}>{opponent.creatureName}</Text>
          <HPBar hp={oState.hp} maxHp={opponentMaxHP} color={oColor} />
          <Text style={s.hpText}>{oState.hp}/{opponentMaxHP}</Text>
          <Animated.View style={{ transform: [{ translateX: opponentShake }, { scaleX: -1 }] }}>
            <Image source={opponentSprite} style={s.sprite} resizeMode="contain" />
          </Animated.View>
          {playerMods.hideOpponentEnergy
            ? <Text style={s.hiddenEnergy}>⚡ ???</Text>
            : <EnergyDots energy={oState.energy} maxEnergy={OPPONENT_MAX_ENERGY} color={oColor} />
          }
        </View>
      </View>

      {/* log */}
      <View style={s.logBox}>
        <Text style={s.logText}>{log}</Text>
        {phase === 'choosing' && (
          <Text style={s.timerText}>{timeLeft}s</Text>
        )}
      </View>

      {/* actions */}
      {phase === 'choosing' && (
        <View style={s.actions}>
          <View style={s.actionsRow}>
            <TouchableOpacity style={[s.actionBtn, s.defendBtn]} onPress={() => commitAction({ kind: 'defend', energy: 0 })}>
              <Text style={s.actionIcon}>🛡️</Text>
              <Text style={s.actionLabel2}>Défendre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, s.chargeBtn]} onPress={() => commitAction({ kind: 'charge', energy: 0 })}>
              <Text style={s.actionIcon}>⚡</Text>
              <Text style={s.actionLabel2}>Charger</Text>
              <Text style={s.actionSub}>{pState.energy}/{playerMods.maxEnergy} ⚡</Text>
            </TouchableOpacity>
          </View>
          <View style={s.actionsRow}>
            {[1, 2, 3, 4].map((e) => {
              const canAttack = pState.energy >= e && e <= playerMods.maxEnergy
              const isDisabledByMax = e > playerMods.maxEnergy
              return (
                <TouchableOpacity
                  key={e}
                  style={[s.attackBtn, (!canAttack || isDisabledByMax) && s.attackBtnDisabled]}
                  onPress={() => canAttack && commitAction({ kind: 'attack', energy: e })}
                  activeOpacity={canAttack ? 0.7 : 1}
                >
                  <Text style={[s.attackBtnText, (!canAttack || isDisabledByMax) && s.attackBtnTextDisabled]}>
                    ⚔️×{e}
                  </Text>
                  <Text style={[s.attackBtnSub, (!canAttack || isDisabledByMax) && s.attackBtnTextDisabled]}>
                    {e * 4} dmg
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {phase === 'intro' && (
        <View style={s.introOverlay}>
          <Text style={s.introTitle}>COMBAT !</Text>
          <Text style={s.introSub}>{player.name} vs {opponent.creatureName}</Text>
          <DebuffPanel mods={playerMods} />
        </View>
      )}

      {phase === 'finished' && (
        <View style={s.finishOverlay}>
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
  header: { paddingTop: 16, paddingHorizontal: 20, gap: 8 },
  roundText: { color: '#888', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  timerBarBg: { height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' },
  timerBarFill: { height: 6, backgroundColor: '#FFD700', borderRadius: 3 },

  arena: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 16, alignItems: 'flex-start', flex: 1 },
  side: { flex: 1, alignItems: 'center', gap: 4 },
  vsCol: { width: 44, alignItems: 'center', paddingTop: 60, gap: 8 },
  vs: { color: '#444', fontSize: 14, fontWeight: '900' },

  playerName: { color: '#fff', fontSize: 12, fontWeight: '700', maxWidth: 110 },
  hpBarBg: { width: '85%', height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  hpBarFill: { height: 8, borderRadius: 4 },
  hpText: { color: '#666', fontSize: 11 },
  sprite: { width: 100, height: 100, marginTop: 4 },
  energyRow: { flexDirection: 'row', gap: 5, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  hiddenEnergy: { color: '#555', fontSize: 13, fontWeight: '800', marginTop: 4 },

  resolvePanel: { alignItems: 'center', gap: 2 },
  resolveVs: { fontSize: 12 },
  actionLabel: { color: '#fff', fontSize: 10, textAlign: 'center' },

  logBox: {
    marginHorizontal: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 42,
  },
  logText: { color: '#ccc', fontSize: 13, flex: 1 },
  timerText: { color: '#FFD700', fontSize: 20, fontWeight: '900', marginLeft: 8 },

  actions: { padding: 16, gap: 10 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  defendBtn: { backgroundColor: '#1E3A5F' },
  chargeBtn: { backgroundColor: '#3A2E00' },
  actionIcon: { fontSize: 24 },
  actionLabel2: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionSub: { color: '#888', fontSize: 11 },
  attackBtn: {
    flex: 1,
    backgroundColor: '#3A0A00',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  attackBtnDisabled: { backgroundColor: '#1A1A1A' },
  attackBtnText: { color: '#FF6B35', fontWeight: '800', fontSize: 13 },
  attackBtnSub: { color: '#FF6B3588', fontSize: 10 },
  attackBtnTextDisabled: { color: '#333' },

  introOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
    gap: 12,
  },
  introTitle: { fontSize: 48, fontWeight: '900', color: '#FFD700', letterSpacing: 4 },
  introSub: { fontSize: 16, color: '#aaa', marginTop: 8 },

  debuffPanel: {
    backgroundColor: 'rgba(255,60,60,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    gap: 4,
    minWidth: 220,
    alignItems: 'flex-start',
  },
  debuffTitle: { color: '#FF6B6B', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  debuffItem: { color: '#FFB3B3', fontSize: 12 },

  finishOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  finishEmoji: { fontSize: 64 },
  finishTitle: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  finishXP: { fontSize: 22, color: '#FFD700', fontWeight: '800' },
  finishBtn: {
    backgroundColor: '#FFD700', paddingHorizontal: 48, paddingVertical: 16,
    borderRadius: 16, marginTop: 16,
  },
  finishBtnText: { color: '#000', fontSize: 17, fontWeight: '900' },
})
