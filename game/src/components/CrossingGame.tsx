import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated, Easing, Image, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native'
import { CreatureType, SocialEventType } from '../types'
import { retro, typeTheme } from '../styles/retro'

const SPRITES: Record<CreatureType, any> = {
  ignis: require('../../assets/sprites/ignis_e1_clean.png'),
  nemo:  require('../../assets/sprites/nemo_e1_clean.png'),
  sylva: require('../../assets/sprites/sylva_e1_clean.png'),
  zapp:  require('../../assets/sprites/zapp_e1_clean.png'),
}

export type GameResult = 'win' | 'draw' | 'loss'

// ── Which game for which interaction ────────────────────────
type GameKind = 'timing' | 'mole' | 'memory' | 'sequence'

const EVENT_GAME: Record<SocialEventType, GameKind> = {
  friendship: 'timing',
  traveler:   'timing',
  theft:      'mole',
  mood:       'mole',
  duel:       'mole',
  gift:       'memory',
  skin:       'memory',
  mentor:     'sequence',
}

const THEMES: Record<SocialEventType, { emoji: string; title: string; desc: string; target: string }> = {
  friendship: { emoji: '🤝', title: 'HIGH FIVE !',        desc: 'Tape quand le cercle doré touche le cercle blanc', target: '🤝' },
  traveler:   { emoji: '🧭', title: 'SYNCHRO !',          desc: 'Tape quand le cercle doré touche le cercle blanc', target: '🧭' },
  theft:      { emoji: '🦝', title: 'ATTRAPE LE FILOU !', desc: 'Tape sur le filou dès qu\'il apparaît',            target: '🦝' },
  mood:       { emoji: '💖', title: 'REMONTE LE MORAL !', desc: 'Tape sur les cœurs dès qu\'ils apparaissent',      target: '💖' },
  duel:       { emoji: '⚔️', title: 'RÉFLEXES !',         desc: 'Tape sur la cible dès qu\'elle apparaît',          target: '🎯' },
  gift:       { emoji: '🎁', title: 'CADEAUX CACHÉS !',   desc: 'Mémorise où sont les 2 cadeaux, puis retrouve-les', target: '🎁' },
  skin:       { emoji: '✨', title: 'ÉTOILES CACHÉES !',  desc: 'Mémorise où sont les 2 étoiles, puis retrouve-les', target: '✨' },
  mentor:     { emoji: '📘', title: 'LA LEÇON !',         desc: 'Regarde la séquence de flèches, puis répète-la',   target: '📘' },
}

// ─────────────────────────────────────────────────────────────
// HIGH FIVE — un cercle rétrécit, tape quand il touche la cible
// ─────────────────────────────────────────────────────────────
function TimingGame({ target, onDone }: { target: string; onDone: (r: GameResult) => void }) {
  const ROUNDS  = 3
  const DUR     = 1700
  // Ring scales linearly 2.3 → 0.4; it matches the target (scale 1) at this instant
  const PERFECT = DUR * ((2.3 - 1) / (2.3 - 0.4))
  const WINDOW  = 200

  const [round, setRound] = useState(0)
  const [hits, setHits]   = useState(0)
  const [fb, setFb]       = useState<'hit' | 'miss' | null>(null)
  const scale    = useRef(new Animated.Value(2.3)).current
  const startAt  = useRef(0)
  const locked   = useRef(true)
  const hitsRef  = useRef(0)
  const roundRef = useRef(0)
  const missT    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextT    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const finishRound = useCallback((hit: boolean) => {
    if (locked.current) return
    locked.current = true
    if (missT.current) clearTimeout(missT.current)
    scale.stopAnimation()
    if (hit) { hitsRef.current += 1; setHits(hitsRef.current) }
    setFb(hit ? 'hit' : 'miss')
    nextT.current = setTimeout(() => {
      roundRef.current += 1
      if (roundRef.current >= ROUNDS) {
        const h = hitsRef.current
        onDone(h >= 2 ? 'win' : h === 1 ? 'draw' : 'loss')
      } else {
        setRound(roundRef.current)
        startRound()
      }
    }, 800)
  }, [onDone])

  const startRound = useCallback(() => {
    setFb(null)
    scale.setValue(2.3)
    startAt.current = Date.now()
    locked.current = false
    Animated.timing(scale, { toValue: 0.4, duration: DUR, easing: Easing.linear, useNativeDriver: true }).start()
    missT.current = setTimeout(() => finishRound(false), DUR + 40)
  }, [finishRound])

  useEffect(() => {
    const t = setTimeout(startRound, 600)
    return () => {
      clearTimeout(t)
      if (missT.current) clearTimeout(missT.current)
      if (nextT.current) clearTimeout(nextT.current)
    }
  }, [])

  const tap = () => {
    const dt = Date.now() - startAt.current
    finishRound(Math.abs(dt - PERFECT) <= WINDOW)
  }

  return (
    <TouchableOpacity style={s.gameArea} activeOpacity={1} onPress={tap}>
      <View style={s.hud}>
        <Text style={s.hudTxt}>Essai {Math.min(round + 1, ROUNDS)}/{ROUNDS}</Text>
        <Text style={s.hudTxt}>✓ {hits}</Text>
      </View>
      <View style={s.timingCenter}>
        {/* Fixed target ring */}
        <View style={s.timingTarget}>
          <Text style={s.timingEmoji}>{target}</Text>
        </View>
        {/* Shrinking ring */}
        <Animated.View pointerEvents="none" style={[s.timingRing, { transform: [{ scale }] }]} />
        <Text style={[s.timingFb, fb === 'hit' ? s.fbGood : s.fbBad]}>
          {fb === 'hit' ? 'PARFAIT !' : fb === 'miss' ? 'RATÉ !' : ' '}
        </Text>
      </View>
      <Text style={s.bottomHint}>Tape n'importe où quand le cercle doré touche le blanc !</Text>
    </TouchableOpacity>
  )
}

// ─────────────────────────────────────────────────────────────
// ATTRAPE — la cible surgit dans une grille 3×3, tape vite
// ─────────────────────────────────────────────────────────────
function MoleGame({ target, onDone }: { target: string; onDone: (r: GameResult) => void }) {
  const SPAWNS = 6
  const SHOW   = 800
  const GAP    = 380

  const [active, setActive] = useState<number | null>(null)
  const [hits, setHits]     = useState(0)
  const [spawnN, setSpawnN] = useState(0)
  const activeRef = useRef<number | null>(null)
  const hitsRef   = useRef(0)
  const spawnRef  = useRef(0)
  const timers    = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    let cancelled = false
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { if (!cancelled) fn() }, ms)
      timers.current.push(t)
    }
    const doSpawn = () => {
      if (spawnRef.current >= SPAWNS) {
        const h = hitsRef.current
        onDone(h >= 4 ? 'win' : h >= 2 ? 'draw' : 'loss')
        return
      }
      spawnRef.current += 1
      setSpawnN(spawnRef.current)
      const cell = Math.floor(Math.random() * 9)
      activeRef.current = cell
      setActive(cell)
      later(() => {
        activeRef.current = null
        setActive(null)
        later(doSpawn, GAP)
      }, SHOW)
    }
    later(doSpawn, 800)
    return () => { cancelled = true; timers.current.forEach(clearTimeout) }
  }, [])

  const tapCell = (i: number) => {
    if (activeRef.current !== i) return
    activeRef.current = null
    setActive(null)
    hitsRef.current += 1
    setHits(hitsRef.current)
  }

  return (
    <View style={s.gameArea}>
      <View style={s.hud}>
        <Text style={s.hudTxt}>{Math.min(spawnN, SPAWNS)}/{SPAWNS}</Text>
        <Text style={s.hudTxt}>✓ {hits}</Text>
      </View>
      <View style={s.moleGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <TouchableOpacity
            key={i}
            style={[s.moleCell, active === i && s.moleCellActive]}
            onPress={() => tapCell(i)}
            activeOpacity={0.7}
          >
            <Text style={s.moleEmoji}>{active === i ? target : ''}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.bottomHint}>Tape sur {target} dès qu'il apparaît !</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
// MÉMOIRE — 2 cibles montrées 1,5 s parmi 6 boîtes, retrouve-les
// ─────────────────────────────────────────────────────────────
function MemoryGame({ target, onDone }: { target: string; onDone: (r: GameResult) => void }) {
  const [targets] = useState<number[]>(() => {
    const a = Math.floor(Math.random() * 6)
    let b = Math.floor(Math.random() * 6)
    while (b === a) b = Math.floor(Math.random() * 6)
    return [a, b]
  })
  const [phase, setPhase] = useState<'show' | 'pick' | 'done'>('show')
  const [picks, setPicks] = useState<number[]>([])

  useEffect(() => {
    const t = setTimeout(() => setPhase('pick'), 1600)
    return () => clearTimeout(t)
  }, [])

  const tap = (i: number) => {
    if (phase !== 'pick' || picks.includes(i)) return
    const np = [...picks, i]
    setPicks(np)
    if (np.length === 2) {
      setPhase('done')
      const found = np.filter(p => targets.includes(p)).length
      setTimeout(() => onDone(found === 2 ? 'win' : found === 1 ? 'draw' : 'loss'), 1200)
    }
  }

  const boxContent = (i: number): string => {
    const isTarget = targets.includes(i)
    if (phase === 'show') return isTarget ? target : ''
    if (phase === 'done') return isTarget ? target : picks.includes(i) ? '✖' : ''
    if (picks.includes(i)) return isTarget ? target : '✖'
    return '?'
  }

  return (
    <View style={s.gameArea}>
      <View style={s.hud}>
        <Text style={s.hudTxt}>
          {phase === 'show' ? '👀 MÉMORISE...' : phase === 'pick' ? `Choisis ${2 - picks.length} boîte${2 - picks.length > 1 ? 's' : ''}` : ' '}
        </Text>
        <Text style={s.hudTxt}>✓ {picks.filter(p => targets.includes(p)).length}</Text>
      </View>
      <View style={s.memGrid}>
        {Array.from({ length: 6 }).map((_, i) => {
          const revealed = phase === 'show' || picks.includes(i) || phase === 'done'
          const good = revealed && targets.includes(i)
          const bad  = phase !== 'show' && picks.includes(i) && !targets.includes(i)
          return (
            <TouchableOpacity
              key={i}
              style={[s.memBox, good && s.memBoxGood, bad && s.memBoxBad]}
              onPress={() => tap(i)}
              activeOpacity={0.7}
              disabled={phase !== 'pick'}
            >
              <Text style={s.memEmoji}>{boxContent(i)}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
      <Text style={s.bottomHint}>Retrouve les 2 {target} cachés !</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
// LA LEÇON — répète la séquence de flèches
// ─────────────────────────────────────────────────────────────
const ARROWS = ['⬆️', '➡️', '⬇️', '⬅️']
const SEQ_LENGTHS = [3, 4, 5]

function SequenceGame({ onDone }: { onDone: (r: GameResult) => void }) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [shown, setShown]       = useState<number | null>(null)
  const [phase, setPhase]       = useState<'show' | 'input' | 'good' | 'bad'>('show')
  const [inputN, setInputN]     = useState(0)
  const seqRef    = useRef<number[]>([])
  const inputRef  = useRef(0)
  const roundRef  = useRef(0)
  const timers    = useRef<ReturnType<typeof setTimeout>[]>([])

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
  }

  const startRound = useCallback(() => {
    const len = SEQ_LENGTHS[roundRef.current]
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4))
    seqRef.current = seq
    inputRef.current = 0
    setInputN(0)
    setPhase('show')
    seq.forEach((arrow, i) => {
      later(() => setShown(arrow), 500 + i * 700)
      later(() => setShown(null),  500 + i * 700 + 550)
    })
    later(() => setPhase('input'), 500 + len * 700)
  }, [])

  useEffect(() => {
    startRound()
    return () => timers.current.forEach(clearTimeout)
  }, [])

  const finish = (completed: number) => {
    onDone(completed >= 3 ? 'win' : completed === 2 ? 'draw' : 'loss')
  }

  const tap = (a: number) => {
    if (phase !== 'input') return
    if (a !== seqRef.current[inputRef.current]) {
      setPhase('bad')
      later(() => finish(roundRef.current), 900)
      return
    }
    inputRef.current += 1
    setInputN(inputRef.current)
    if (inputRef.current === seqRef.current.length) {
      setPhase('good')
      roundRef.current += 1
      if (roundRef.current >= SEQ_LENGTHS.length) {
        later(() => finish(3), 900)
      } else {
        later(() => { setRoundIdx(roundRef.current); startRound() }, 900)
      }
    }
  }

  const statusTxt =
    phase === 'show'  ? '👀 Regarde bien...' :
    phase === 'input' ? `À toi ! (${inputN}/${seqRef.current.length})` :
    phase === 'good'  ? '✅ Bravo !' : '❌ Raté !'

  return (
    <View style={s.gameArea}>
      <View style={s.hud}>
        <Text style={s.hudTxt}>Leçon {Math.min(roundIdx + 1, 3)}/3</Text>
        <Text style={s.hudTxt}>{statusTxt}</Text>
      </View>
      <View style={s.seqDisplay}>
        <Text style={s.seqArrowBig}>{shown !== null ? ARROWS[shown] : phase === 'input' ? '❔' : ' '}</Text>
      </View>
      <View style={s.seqBtnRow}>
        {ARROWS.map((a, i) => (
          <TouchableOpacity
            key={a}
            style={[s.seqBtn, phase !== 'input' && s.seqBtnOff]}
            onPress={() => tap(i)}
            disabled={phase !== 'input'}
            activeOpacity={0.7}
          >
            <Text style={s.seqBtnTxt}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.bottomHint}>Reproduis la séquence dans l'ordre !</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
interface Props {
  visible: boolean
  eventType: SocialEventType
  playerType: CreatureType
  opponentType: CreatureType
  opponentName: string
  onClose: (result: GameResult | 'skip') => void
}

export default function CrossingGame({ visible, eventType, playerType, opponentType, opponentName, onClose }: Props) {
  const [started, setStarted] = useState(false)

  useEffect(() => { if (visible) setStarted(false) }, [visible])

  if (!visible) return null

  const theme = THEMES[eventType]
  const kind  = EVENT_GAME[eventType]
  const pTheme = typeTheme[playerType]
  const oTheme = typeTheme[opponentType]
  const done = (r: GameResult) => onClose(r)

  return (
    <View style={s.overlay}>
      {!started ? (
        <View style={s.intro}>
          <View style={s.introVs}>
            <View style={s.introFighter}>
              <Image source={SPRITES[playerType]} style={s.introSprite} resizeMode="contain" />
              <Text style={[s.introFighterName, { color: pTheme.main }]}>TOI</Text>
            </View>
            <Text style={s.introVsTxt}>VS</Text>
            <View style={s.introFighter}>
              <Image source={SPRITES[opponentType]} style={[s.introSprite, s.introSpriteFlip]} resizeMode="contain" />
              <Text style={[s.introFighterName, { color: oTheme.main }]} numberOfLines={1}>{opponentName}</Text>
            </View>
          </View>
          <Text style={s.introEmoji}>{theme.emoji}</Text>
          <Text style={s.introTitle}>{theme.title}</Text>
          <View style={s.introDescBox}>
            <Text style={s.introDesc}>{theme.desc}</Text>
          </View>
          <TouchableOpacity style={s.playBtn} onPress={() => setStarted(true)} activeOpacity={0.8}>
            <Text style={s.playBtnTxt}>JOUER !</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onClose('skip')} style={s.skipBtn}>
            <Text style={s.skipTxt}>Passer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        kind === 'timing'   ? <TimingGame   target={theme.target} onDone={done} /> :
        kind === 'mole'     ? <MoleGame     target={theme.target} onDone={done} /> :
        kind === 'memory'   ? <MemoryGame   target={theme.target} onDone={done} /> :
                              <SequenceGame onDone={done} />
      )}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
const CELL = 88

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: retro.night,
    paddingTop: 52,
    zIndex: 20,
  },
  gameArea: { flex: 1 },

  // HUD
  hud: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 8,
  },
  hudTxt: { fontSize: 15, fontWeight: '900', color: retro.paper, fontFamily: 'monospace' },

  bottomHint: {
    textAlign: 'center', color: retro.faded, fontSize: 12,
    paddingBottom: 26, paddingHorizontal: 24, fontFamily: 'monospace',
  },

  // Intro
  intro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  introVs: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 6 },
  introFighter: { alignItems: 'center', gap: 4, width: 96 },
  introSprite: { width: 72, height: 80 },
  introSpriteFlip: { transform: [{ scaleX: -1 }] },
  introFighterName: { fontSize: 10, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1, textAlign: 'center' },
  introVsTxt: { fontSize: 16, fontWeight: '900', color: retro.faded, fontFamily: 'monospace' },
  introEmoji: { fontSize: 46 },
  introTitle: { fontSize: 24, fontWeight: '900', color: retro.paper, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 1 },
  introDescBox: {
    backgroundColor: retro.ink2, borderRadius: 4, borderWidth: 1, borderColor: retro.ink3,
    paddingVertical: 12, paddingHorizontal: 18, alignSelf: 'stretch',
  },
  introDesc: { fontSize: 14, color: retro.paper, textAlign: 'center', lineHeight: 21 },
  playBtn: {
    backgroundColor: retro.gold, paddingHorizontal: 52, paddingVertical: 16,
    borderRadius: 4, marginTop: 6,
  },
  playBtnTxt: { color: retro.ink, fontSize: 17, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 2 },
  skipBtn: { paddingVertical: 8 },
  skipTxt: { color: retro.faded, fontSize: 13, fontFamily: 'monospace' },

  // Timing
  timingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timingTarget: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: retro.paper,
    alignItems: 'center', justifyContent: 'center',
  },
  timingEmoji: { fontSize: 44 },
  timingRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 4, borderColor: retro.gold,
  },
  timingFb: { position: 'absolute', bottom: 40, fontSize: 20, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 2 },
  fbGood: { color: retro.mint },
  fbBad:  { color: retro.red },

  // Mole
  moleGrid: {
    flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    alignContent: 'center', justifyContent: 'center', paddingHorizontal: 16,
  },
  moleCell: {
    width: CELL, height: CELL, borderRadius: 4,
    backgroundColor: retro.ink2, borderWidth: 2, borderColor: retro.ink3,
    alignItems: 'center', justifyContent: 'center',
  },
  moleCellActive: { backgroundColor: retro.goldDark, borderColor: retro.gold },
  moleEmoji: { fontSize: 40 },

  // Memory
  memGrid: {
    flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    alignContent: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  memBox: {
    width: 96, height: 96, borderRadius: 4,
    backgroundColor: retro.ink2, borderWidth: 2, borderColor: retro.ink3,
    alignItems: 'center', justifyContent: 'center',
  },
  memBoxGood: { backgroundColor: retro.mintDark, borderColor: retro.mint },
  memBoxBad:  { backgroundColor: retro.redDark,  borderColor: retro.red },
  memEmoji: { fontSize: 38, color: retro.paper, fontWeight: '900' },

  // Sequence
  seqDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  seqArrowBig: { fontSize: 88 },
  seqBtnRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', paddingBottom: 16 },
  seqBtn: {
    width: 72, height: 72, borderRadius: 4,
    backgroundColor: retro.ink2, borderWidth: 2, borderColor: retro.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  seqBtnOff: { opacity: 0.35, borderColor: retro.ink3 },
  seqBtnTxt: { fontSize: 34 },
})
