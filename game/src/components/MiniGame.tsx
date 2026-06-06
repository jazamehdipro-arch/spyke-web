import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { CreatureType, TrainingStats } from '../types'

const CREATURE_IDLE: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_f2.png'),
  nemo:  require('../../assets/sprites/nemo_f2.png'),
  sylva: require('../../assets/sprites/sylva_f2.png'),
  zapp:  require('../../assets/sprites/zapp_f2.png'),
}

const { width: W, height: H } = Dimensions.get('window')

function diffTier(level: number): 0 | 1 | 2 | 3 {
  if (level >= 15) return 3
  if (level >= 10) return 2
  if (level >= 5)  return 1
  return 0
}

// ─── FORCE ──────────────────────────────────────────────────
// Tape les étoiles, évite les bombes. Cibles plus petites et plus rapides.
interface FTarget { id: number; x: number; y: number; bomb: boolean; scale: Animated.Value; opacity: Animated.Value }
interface ForceP { spawnMs: number; lifetime: number; size: number; bombPct: number; dur: number }
const FORCE_P: ForceP[] = [
  { spawnMs: 850, lifetime: 2000, size: 70, bombPct: 0,    dur: 14 },
  { spawnMs: 620, lifetime: 1500, size: 58, bombPct: 0,    dur: 14 },
  { spawnMs: 440, lifetime: 1100, size: 46, bombPct: 0.20, dur: 14 },
  { spawnMs: 300, lifetime:  800, size: 38, bombPct: 0.32, dur: 14 },
]

function ForceGame({ diff, onDone }: { diff: 0|1|2|3; onDone: (n: number) => void }) {
  const p = FORCE_P[diff]
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(p.dur)
  const [targets, setTargets] = useState<FTarget[]>([])
  const nextId = useRef(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const spawn = useCallback(() => {
    const id = nextId.current++
    const bomb = Math.random() < p.bombPct
    const x = Math.random() * (W - p.size - 32) + 16
    const y = Math.random() * (H * 0.52 - p.size) + H * 0.13
    const scale = new Animated.Value(0)
    const opacity = new Animated.Value(1)
    setTargets(prev => [...prev, { id, x, y, bomb, scale, opacity }])
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start()
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale,   { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
      setTargets(prev => prev.filter(t => t.id !== id))
    }, p.lifetime)
  }, [p])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (spawnRef.current) clearInterval(spawnRef.current)
          onDone(scoreRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
    spawnRef.current = setInterval(spawn, p.spawnMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (spawnRef.current) clearInterval(spawnRef.current)
    }
  }, [])

  const hit = (id: number, bomb: boolean) => {
    setTargets(prev => prev.filter(t => t.id !== id))
    setScore(s => { const n = bomb ? Math.max(0, s - 1) : s + 1; scoreRef.current = n; return n })
  }

  return (
    <View style={s.gameArea}>
      <View style={s.hud}>
        <Text style={s.hudScore}>{score}</Text>
        <Text style={[s.hudRight, timeLeft <= 3 && s.redText]}>{timeLeft}s</Text>
      </View>
      {targets.map(t => (
        <Animated.View key={t.id} style={[s.absTarget, {
          left: t.x, top: t.y, width: p.size, height: p.size,
          opacity: t.opacity, transform: [{ scale: t.scale }],
        }]}>
          <TouchableOpacity style={s.targetInner} onPress={() => hit(t.id, t.bomb)}>
            <Text style={{ fontSize: p.size * 0.62 }}>{t.bomb ? '💣' : '⭐'}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  )
}

// ─── RÉFLEXES ────────────────────────────────────────────────
// Obstacle vient d'un côté. Tape pour changer de côté. Reste opposé à l'éclair.
interface ReflexP { cycleMs: number; warnMs: number }
const REFLEX_P: ReflexP[] = [
  { cycleMs: 2400, warnMs: 1000 },
  { cycleMs: 1850, warnMs:  750 },
  { cycleMs: 1350, warnMs:  520 },
  { cycleMs:  900, warnMs:  330 },
]

function ReflexGame({ diff, onDone }: { diff: 0|1|2|3; onDone: (n: number) => void }) {
  const p = REFLEX_P[diff]
  const [side, setSide] = useState<'left'|'right'>('left')
  const [obs, setObs] = useState<'left'|'right'|null>(null)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'bad'|'ok'|null>(null)
  const sideRef  = useRef<'left'|'right'>('left')
  const livesRef = useRef(3)
  const scoreRef = useRef(0)
  const doneRef  = useRef(false)
  const cycleRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const resolveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const run = () => {
      if (doneRef.current) return
      const side: 'left'|'right' = Math.random() < 0.5 ? 'left' : 'right'
      setObs(side)
      resolveRef.current = setTimeout(() => {
        setObs(null)
        if (doneRef.current) return
        if (sideRef.current === side) {
          livesRef.current -= 1
          setLives(livesRef.current)
          setFlash('bad')
          if (livesRef.current <= 0) {
            doneRef.current = true
            clearInterval(cycleRef.current)
            setTimeout(() => onDone(scoreRef.current), 400)
          }
        } else {
          scoreRef.current += 1
          setScore(scoreRef.current)
          setFlash('ok')
        }
        setTimeout(() => setFlash(null), 280)
      }, p.warnMs)
    }
    const init = setTimeout(() => { cycleRef.current = setInterval(run, p.cycleMs) }, 900)
    return () => {
      clearTimeout(init)
      if (cycleRef.current)   clearInterval(cycleRef.current)
      if (resolveRef.current) clearTimeout(resolveRef.current)
    }
  }, [])

  const dodge = () => {
    const next: 'left'|'right' = sideRef.current === 'left' ? 'right' : 'left'
    sideRef.current = next
    setSide(next)
  }

  return (
    <TouchableOpacity style={[s.gameArea, flash === 'bad' && s.flashRed, flash === 'ok' && s.flashGreen]} onPress={dodge} activeOpacity={1}>
      <View style={s.hud}>
        <Text style={s.hudScore}>{score}</Text>
        <Text style={s.hudRight}>{'❤️'.repeat(lives)}</Text>
      </View>
      <View style={s.reflexPanels}>
        <View style={[s.reflexPanel, obs === 'left' && s.panelDanger]}>
          <Text style={s.panelIcon}>{obs === 'left' ? '⚡' : ' '}</Text>
          <Text style={s.panelLabel}>GAUCHE</Text>
        </View>
        <View style={[s.reflexPanel, obs === 'right' && s.panelDanger]}>
          <Text style={s.panelIcon}>{obs === 'right' ? '⚡' : ' '}</Text>
          <Text style={s.panelLabel}>DROITE</Text>
        </View>
      </View>
      <View style={s.reflexDots}>
        <View style={[s.dot, side === 'left'  ? s.dotActive : s.dotIdle]} />
        <View style={[s.dot, side === 'right' ? s.dotActive : s.dotIdle]} />
      </View>
      <Text style={s.bottomHint}>Tape pour changer de côté • reste opposé à l'éclair</Text>
    </TouchableOpacity>
  )
}

// ─── ENDURANCE ───────────────────────────────────────────────
// Curseur qui rebondit. Tape quand il est dans la zone verte.
interface EnduranceP { zoneW: number; rounds: number; speed: number }
const ENDURANCE_P: EnduranceP[] = [
  { zoneW: 35, rounds: 5, speed: 0.45 },
  { zoneW: 25, rounds: 5, speed: 0.75 },
  { zoneW: 16, rounds: 6, speed: 1.15 },
  { zoneW:  9, rounds: 6, speed: 1.80 },
]

function EnduranceGame({ diff, onDone }: { diff: 0|1|2|3; onDone: (n: number) => void }) {
  const p = ENDURANCE_P[diff]
  const [round, setRound]       = useState(0)
  const [score, setScore]       = useState(0)
  const [barPos, setBarPos]     = useState(0)
  const [zoneStart, setZone]    = useState(30)
  const [waiting, setWaiting]   = useState(false)
  const [result, setResult]     = useState<'ok'|'miss'|null>(null)
  const posRef   = useRef(0)
  const dirRef   = useRef(1)
  const zoneRef  = useRef(30)
  const scoreRef = useRef(0)
  const roundRef = useRef(0)
  const locked   = useRef(false)
  const tick     = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRound = useCallback(() => {
    locked.current  = false
    posRef.current  = 0
    dirRef.current  = 1
    const z = Math.random() * (100 - p.zoneW - 10) + 5
    zoneRef.current = z
    setZone(z); setBarPos(0); setResult(null); setWaiting(false)
    if (tick.current) clearInterval(tick.current)
    tick.current = setInterval(() => {
      posRef.current += dirRef.current * p.speed
      if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1 }
      if (posRef.current <= 0)   { posRef.current = 0;   dirRef.current =  1 }
      setBarPos(Math.round(posRef.current * 10) / 10)
    }, 16)
  }, [p.speed, p.zoneW])

  useEffect(() => { startRound(); return () => { if (tick.current) clearInterval(tick.current) } }, [])

  const tap = () => {
    if (locked.current) return
    locked.current = true
    clearInterval(tick.current)
    const inZone = posRef.current >= zoneRef.current && posRef.current <= zoneRef.current + p.zoneW
    const ns = scoreRef.current + (inZone ? 1 : 0)
    scoreRef.current = ns
    setScore(ns); setResult(inZone ? 'ok' : 'miss'); setWaiting(true)
    setTimeout(() => {
      const nr = roundRef.current + 1
      roundRef.current = nr
      if (nr >= p.rounds) { onDone(ns); return }
      setRound(nr); startRound()
    }, 750)
  }

  return (
    <View style={s.gameArea}>
      <View style={s.hud}>
        <Text style={s.hudScore}>{score}/{p.rounds}</Text>
        <Text style={s.hudRight}>Tour {round + 1}/{p.rounds}</Text>
      </View>
      <View style={s.enduranceBody}>
        <Text style={s.enduranceHint}>Tape quand le curseur est dans la zone verte !</Text>
        <View style={s.barTrack}>
          <View style={[s.barZone, { left: `${zoneStart}%` as any, width: `${p.zoneW}%` as any }]} />
          <View style={[s.barCursor, { left: `${Math.min(97, barPos)}%` as any }]} />
        </View>
        <Text style={s.resultLine}>{result === 'ok' ? '✅ Dans la zone !' : result === 'miss' ? '❌ Raté !' : ' '}</Text>
      </View>
      <TouchableOpacity style={[s.bigTap, waiting && s.bigTapOff]} onPress={tap} disabled={waiting} activeOpacity={0.8}>
        <Text style={s.bigTapText}>TAP !</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── STRATÉGIE ───────────────────────────────────────────────
// Simon says. Mémorise et reproduis la séquence de couleurs.
const SIMON_COLORS = ['#FF5A5A', '#5AFF7E', '#5A8FFF', '#FFD93D']
interface StratP { flashMs: number; startLen: number }
const STRAT_P: StratP[] = [
  { flashMs: 600, startLen: 3 },
  { flashMs: 420, startLen: 3 },
  { flashMs: 260, startLen: 4 },
  { flashMs: 160, startLen: 6 },
]

function StrategyGame({ diff, onDone }: { diff: 0|1|2|3; onDone: (n: number) => void }) {
  const p = STRAT_P[diff]
  type Phase = 'showing'|'input'|'correct'|'wrong'
  const [seq, setSeq]         = useState<number[]>([])
  const [phase, setPhase]     = useState<Phase>('showing')
  const [lit, setLit]         = useState<number|null>(null)
  const [progress, setProgress] = useState(0)
  const [round, setRound]     = useState(0)
  const seqRef   = useRef<number[]>([])
  const inputRef = useRef<number[]>([])
  const roundRef = useRef(0)

  const play = useCallback((sequence: number[]) => {
    setPhase('showing'); setProgress(0); inputRef.current = []
    let i = 0
    const step = () => {
      if (i >= sequence.length) { setLit(null); setTimeout(() => setPhase('input'), 350); return }
      setLit(sequence[i])
      setTimeout(() => { setLit(null); setTimeout(() => { i++; step() }, 90) }, p.flashMs)
    }
    setTimeout(step, 500)
  }, [p.flashMs])

  useEffect(() => {
    const init = Array.from({ length: p.startLen }, () => Math.floor(Math.random() * 4))
    seqRef.current = init; setSeq(init); play(init)
  }, [])

  const tap = (idx: number) => {
    if (phase !== 'input') return
    const expected = seqRef.current[inputRef.current.length]
    if (idx !== expected) {
      setPhase('wrong')
      setTimeout(() => onDone(roundRef.current), 700)
      return
    }
    inputRef.current = [...inputRef.current, idx]
    setProgress(inputRef.current.length)
    if (inputRef.current.length === seqRef.current.length) {
      setPhase('correct')
      const nr = roundRef.current + 1; roundRef.current = nr; setRound(nr)
      const next = [...seqRef.current, Math.floor(Math.random() * 4)]
      seqRef.current = next; setSeq(next)
      setTimeout(() => play(next), 650)
    }
  }

  const phaseLabel =
    phase === 'showing'  ? 'Regarde...' :
    phase === 'input'    ? `À toi ! (${progress}/${seq.length})` :
    phase === 'correct'  ? '✅ Correct !' : '❌ Raté !'

  return (
    <View style={s.gameArea}>
      <View style={s.hud}>
        <Text style={s.hudScore}>{round}</Text>
        <Text style={s.hudRight}>{phaseLabel}</Text>
      </View>
      <View style={s.simonGrid}>
        {SIMON_COLORS.map((color, idx) => (
          <TouchableOpacity
            key={idx}
            style={[s.simonTile, { backgroundColor: lit === idx ? '#ffffff' : color }, phase !== 'input' && s.simonOff]}
            onPress={() => tap(idx)}
            disabled={phase !== 'input'}
            activeOpacity={0.72}
          />
        ))}
      </View>
      <Text style={s.bottomHint}>Reproduis la séquence dans le même ordre</Text>
    </View>
  )
}

// ─── CONFIG ───────────────────────────────────────────────────
const GAME_INFO: Record<keyof TrainingStats, { title: string; desc: string; emoji: string; color: string }> = {
  strength:  { title: 'Frappe vite !', desc: 'Tape les étoiles · évite les bombes 💣',      emoji: '💪', color: '#FF6B35' },
  reflexes:  { title: 'Esquive !',      desc: 'Reste du côté opposé à l\'éclair ⚡',          emoji: '⚡', color: '#7DF9FF' },
  endurance: { title: 'Tiens bon !',    desc: 'Tape quand le curseur entre dans la zone verte', emoji: '🛡️', color: '#6BFF8B' },
  defense:   { title: 'Mémorise !',     desc: 'Reproduis la séquence de couleurs exacte',     emoji: '🧩', color: '#A855F7' },
}
const DIFF_LABELS = ['Facile', 'Intermédiaire', 'Difficile', 'Extrême']
const DIFF_COLORS = ['#6BFF8B',     '#FFD93D',    '#FF8C5A',  '#FF4444']

// ─── MAIN ─────────────────────────────────────────────────────
interface Props {
  visible: boolean
  onClose: (score: number) => void
  creatureType: CreatureType
  activityStat?: keyof TrainingStats
  trainingLevel?: number
}

export default function MiniGame({ visible, onClose, creatureType, activityStat, trainingLevel }: Props) {
  const [started, setStarted] = useState(false)
  const stat = activityStat ?? 'strength'
  const diff = diffTier(trainingLevel ?? 0)
  const info = GAME_INFO[stat]

  useEffect(() => { if (!visible) setStarted(false) }, [visible])

  const done = (score: number) => { setStarted(false); onClose(score) }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        {!started ? (
          <View style={s.intro}>
            <Image source={CREATURE_IDLE[creatureType]} style={s.introSprite} resizeMode="contain" />
            <Text style={s.bigEmoji}>{info.emoji}</Text>
            <Text style={s.introTitle}>{info.title}</Text>
            <Text style={s.introDesc}>{info.desc}</Text>
            <View style={[s.diffBadge, { backgroundColor: DIFF_COLORS[diff] + '2A', borderColor: DIFF_COLORS[diff] }]}>
              <Text style={[s.diffLabel, { color: DIFF_COLORS[diff] }]}>{DIFF_LABELS[diff]}</Text>
            </View>
            <TouchableOpacity style={[s.startBtn, { backgroundColor: info.color }]} onPress={() => setStarted(true)}>
              <Text style={s.startBtnText}>Jouer !</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onClose(0)} style={s.skipBtn}>
              <Text style={s.skipText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : (
          stat === 'strength'  ? <ForceGame    diff={diff} onDone={done} /> :
          stat === 'reflexes'  ? <ReflexGame   diff={diff} onDone={done} /> :
          stat === 'endurance' ? <EnduranceGame diff={diff} onDone={done} /> :
                                 <StrategyGame  diff={diff} onDone={done} />
        )}
      </View>
    </Modal>
  )
}

// ─── STYLES ───────────────────────────────────────────────────
const TILE = (W - 80) / 2

const s = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(13,10,24,0.97)' },
  gameArea: { flex: 1 },

  // Intro
  intro:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  introSprite: { width: 92, height: 92 },
  bigEmoji:    { fontSize: 42 },
  introTitle:  { fontSize: 30, fontWeight: '900', color: '#fff', fontFamily: 'monospace' },
  introDesc:   { fontSize: 14, color: '#9A8FC4', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
  diffBadge:   { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 6 },
  diffLabel:   { fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },
  startBtn:    { paddingHorizontal: 52, paddingVertical: 16, borderRadius: 18, marginTop: 4 },
  startBtnText:{ color: '#0D0A18', fontSize: 19, fontWeight: '900', fontFamily: 'monospace' },
  skipBtn:     { paddingVertical: 8 },
  skipText:    { color: '#555', fontSize: 14 },

  // HUD
  hud:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 58, paddingBottom: 10 },
  hudScore: { fontSize: 38, fontWeight: '900', color: '#fff', fontFamily: 'monospace' },
  hudRight: { fontSize: 18, fontWeight: '800', color: '#9A8FC4', fontFamily: 'monospace', textAlign: 'right' },
  redText:  { color: '#FF4444' },

  // Feedback flash
  flashRed:   { backgroundColor: 'rgba(255,60,60,0.13)' },
  flashGreen: { backgroundColor: 'rgba(80,255,130,0.10)' },

  // Force
  absTarget:   { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  targetInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  // Reflex
  reflexPanels: { flex: 1, flexDirection: 'row', gap: 16, paddingHorizontal: 20, alignItems: 'center' },
  reflexPanel:  { flex: 1, borderRadius: 20, height: '70%', backgroundColor: '#1D1738', borderWidth: 2, borderColor: '#352A5E', alignItems: 'center', justifyContent: 'center', gap: 8 },
  panelDanger:  { backgroundColor: '#2A1A08', borderColor: '#FFD93D' },
  panelIcon:    { fontSize: 56 },
  panelLabel:   { fontSize: 11, fontWeight: '800', color: '#9A8FC4', fontFamily: 'monospace', letterSpacing: 1 },
  reflexDots:   { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40, paddingBottom: 20 },
  dot:          { width: 52, height: 52, borderRadius: 26 },
  dotActive:    { backgroundColor: '#7DF9FF', borderWidth: 3, borderColor: '#fff' },
  dotIdle:      { backgroundColor: '#1D1738', borderWidth: 2, borderColor: '#352A5E' },
  bottomHint:   { textAlign: 'center', color: '#444', fontSize: 11, paddingBottom: 18, paddingHorizontal: 16 },

  // Endurance
  enduranceBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 20 },
  enduranceHint: { color: '#9A8FC4', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  barTrack:      { width: '100%', height: 52, backgroundColor: '#1D1738', borderRadius: 14, borderWidth: 1, borderColor: '#352A5E', overflow: 'hidden', position: 'relative' },
  barZone:       { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(107,255,142,0.35)' },
  barCursor:     { position: 'absolute', top: 6, bottom: 6, width: 10, borderRadius: 5, backgroundColor: '#FFCE3A' },
  resultLine:    { fontSize: 22, height: 36, textAlign: 'center', fontWeight: '800' },
  bigTap:        { margin: 24, backgroundColor: '#6BFF8B', borderRadius: 20, paddingVertical: 24, alignItems: 'center' },
  bigTapOff:     { opacity: 0.3 },
  bigTapText:    { color: '#0D0A18', fontSize: 24, fontWeight: '900', fontFamily: 'monospace' },

  // Strategy / Simon
  simonGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 16, alignContent: 'center', justifyContent: 'center' },
  simonTile: { width: TILE, height: TILE, borderRadius: 22 },
  simonOff:  { opacity: 0.45 },
})
