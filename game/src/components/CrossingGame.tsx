import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated, Easing, Image, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native'
import { CreatureType } from '../types'
import { retro, typeTheme } from '../styles/retro'

const SPRITES: Record<CreatureType, any> = {
  ignis: require('../../assets/sprites/ignis_e1_clean.png'),
  nemo:  require('../../assets/sprites/nemo_e1_clean.png'),
  sylva: require('../../assets/sprites/sylva_e1_clean.png'),
  zapp:  require('../../assets/sprites/zapp_e1_clean.png'),
}

const ICONS: Record<CreatureType, string> = { ignis: '🔥', nemo: '💧', sylva: '🌿', zapp: '⚡' }
const ALL_TYPES: CreatureType[] = ['ignis', 'nemo', 'sylva', 'zapp']

// Cycle: ignis → nemo → zapp → sylva → ignis
const BEATS: Record<CreatureType, CreatureType> = { ignis: 'nemo', nemo: 'zapp', zapp: 'sylva', sylva: 'ignis' }

function resolveRound(player: CreatureType, opp: CreatureType): 'win' | 'draw' | 'loss' {
  if (player === opp) return 'draw'
  return BEATS[player] === opp ? 'win' : 'loss'
}

function aiPick(oppType: CreatureType): CreatureType {
  // Opponent favors their own type (4:1:1:1 weight)
  const r = Math.random() * 7
  if (r < 4) return oppType
  const others = ALL_TYPES.filter(t => t !== oppType)
  return others[Math.floor(Math.random() * others.length)]
}

type Phase = 'countdown' | 'choose' | 'reveal' | 'result'
type RoundResult = 'win' | 'draw' | 'loss'
const ROUNDS = 3
const CHOOSE_SECS = 3

interface Props {
  visible: boolean
  playerType: CreatureType
  opponentType: CreatureType
  opponentName: string
  onClose: (result: 'win' | 'draw' | 'loss') => void
}

export default function CrossingGame({ visible, playerType, opponentType, opponentName, onClose }: Props) {
  const [phase, setPhase]         = useState<Phase>('countdown')
  const [countNum, setCountNum]   = useState(3)
  const [timeLeft, setTimeLeft]   = useState(CHOOSE_SECS)
  const [round, setRound]         = useState(0)
  const [pChoice, setPChoice]     = useState<CreatureType | null>(null)
  const [oChoice, setOChoice]     = useState<CreatureType | null>(null)
  const [roundRes, setRoundRes]   = useState<RoundResult | null>(null)
  const [roundHist, setRoundHist] = useState<RoundResult[]>([])
  const [scores, setScores]       = useState({ p: 0, o: 0 })
  const [finalRes, setFinalRes]   = useState<'win' | 'draw' | 'loss'>('draw')

  const timerW     = useRef(new Animated.Value(1)).current
  const pChipScale = useRef(new Animated.Value(0)).current
  const oChipScale = useRef(new Animated.Value(0)).current
  const cntScale   = useRef(new Animated.Value(1)).current
  const pBounce    = useRef(new Animated.Value(0)).current
  const oBounce    = useRef(new Animated.Value(0)).current

  const scoresRef = useRef({ p: 0, o: 0 })
  const histRef   = useRef<RoundResult[]>([])
  const roundRef  = useRef(0)
  const phaseRef  = useRef<Phase>('countdown')

  const goPhase = useCallback((p: Phase) => { phaseRef.current = p; setPhase(p) }, [])

  // Reset when game opens
  useEffect(() => {
    if (!visible) return
    scoresRef.current = { p: 0, o: 0 }
    histRef.current   = []
    roundRef.current  = 0
    setScores({ p: 0, o: 0 })
    setRoundHist([])
    setRound(0)
    setCountNum(3)
    goPhase('countdown')
  }, [visible])

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown' || !visible) return
    let n = 3
    setCountNum(n)
    cntScale.setValue(1.6)
    Animated.spring(cntScale, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start()
    const iv = setInterval(() => {
      n--
      if (n <= 0) {
        clearInterval(iv)
        goPhase('choose')
      } else {
        setCountNum(n)
        cntScale.setValue(1.6)
        Animated.spring(cntScale, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start()
      }
    }, 800)
    return () => clearInterval(iv)
  }, [phase, round, visible])

  const doReveal = useCallback((pPick: CreatureType) => {
    if (phaseRef.current !== 'choose') return
    timerW.stopAnimation()

    const oPick     = aiPick(opponentType)
    const res       = resolveRound(pPick, oPick)
    const newScores = {
      p: scoresRef.current.p + (res === 'win' ? 1 : 0),
      o: scoresRef.current.o + (res === 'loss' ? 1 : 0),
    }
    scoresRef.current = newScores
    const newHist = [...histRef.current, res]
    histRef.current  = newHist
    const nextRound  = roundRef.current + 1
    roundRef.current = nextRound

    setPChoice(pPick)
    setOChoice(oPick)
    setRoundRes(res)
    setScores(newScores)
    setRoundHist(newHist)
    pChipScale.setValue(0)
    oChipScale.setValue(0)
    goPhase('reveal')

    Animated.parallel([
      Animated.spring(oChipScale, { toValue: 1, useNativeDriver: true, bounciness: 16 }),
      Animated.spring(pChipScale, { toValue: 1, useNativeDriver: true, bounciness: 16, speed: 7 }),
    ]).start()

    const bounceTarget = res === 'win' ? pBounce : res === 'loss' ? oBounce : null
    if (bounceTarget) {
      Animated.sequence([
        Animated.timing(bounceTarget, { toValue: -18, duration: 160, useNativeDriver: true }),
        Animated.spring(bounceTarget, { toValue: 0, useNativeDriver: true }),
      ]).start()
    }

    setTimeout(() => {
      setRound(nextRound)
      if (nextRound >= ROUNDS) {
        const final: 'win' | 'draw' | 'loss' =
          newScores.p > newScores.o ? 'win' :
          newScores.p < newScores.o ? 'loss' : 'draw'
        setFinalRes(final)
        goPhase('result')
      } else {
        goPhase('countdown')
      }
    }, 1500)
  }, [opponentType, goPhase])

  // Choose phase
  useEffect(() => {
    if (phase !== 'choose' || !visible) return
    setPChoice(null)
    setOChoice(null)
    setRoundRes(null)
    setTimeLeft(CHOOSE_SECS)
    timerW.setValue(1)
    Animated.timing(timerW, {
      toValue: 0, duration: CHOOSE_SECS * 1000, easing: Easing.linear, useNativeDriver: false,
    }).start()
    const iv = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    const to = setTimeout(() => doReveal(playerType), CHOOSE_SECS * 1000)
    return () => { clearInterval(iv); clearTimeout(to); timerW.stopAnimation() }
  }, [phase, round, visible, doReveal, playerType])

  const pick = (t: CreatureType) => {
    if (phaseRef.current !== 'choose') return
    doReveal(t)
  }

  const pTheme = typeTheme[playerType]
  const oTheme = typeTheme[opponentType]

  if (!visible) return null

  return (
    <View style={s.overlay}>
      {/* Top bar: title + round pips */}
      <View style={s.topBar}>
        <Text style={s.gameTitle}>⚔ DUEL AMICAL</Text>
        <View style={s.pips}>
          {Array.from({ length: ROUNDS }).map((_, i) => {
            const r = roundHist[i]
            return (
              <View key={i} style={[
                s.pip,
                r === 'win'  ? s.pipW :
                r === 'loss' ? s.pipL :
                r === 'draw' ? s.pipD : s.pipE,
              ]} />
            )
          })}
        </View>
      </View>

      {/* Score */}
      <View style={s.scoreBand}>
        <Text style={[s.scoreN, { color: oTheme.main }]}>{scores.o}</Text>
        <Text style={s.scoreSep}>—</Text>
        <Text style={[s.scoreN, { color: pTheme.main }]}>{scores.p}</Text>
      </View>

      {/* Arena */}
      <View style={s.arena}>
        {/* Opponent fighter */}
        <View style={s.fighter}>
          <Animated.View style={{ transform: [{ translateY: oBounce }] }}>
            <Image source={SPRITES[opponentType]} style={[s.sprite, s.spriteFlip]} resizeMode="contain" />
          </Animated.View>
          <Text style={[s.fighterName, { color: oTheme.main }]} numberOfLines={1}>{opponentName}</Text>
        </View>

        {/* Center zone */}
        <View style={s.center}>
          {phase === 'countdown' && (
            <Animated.Text style={[s.countdownBig, { transform: [{ scale: cntScale }] }]}>
              {countNum}
            </Animated.Text>
          )}
          {phase === 'choose' && <Text style={s.swordsIcon}>⚔️</Text>}
          {phase === 'reveal' && pChoice && oChoice && (
            <View style={s.revealStack}>
              <Animated.View style={[s.chip, { backgroundColor: oTheme.dark, borderColor: oTheme.main }, { transform: [{ scale: oChipScale }] }]}>
                <Text style={s.chipIcon}>{ICONS[oChoice]}</Text>
              </Animated.View>
              <Text style={s.chipVs}>VS</Text>
              <Animated.View style={[s.chip, { backgroundColor: pTheme.dark, borderColor: pTheme.main }, { transform: [{ scale: pChipScale }] }]}>
                <Text style={s.chipIcon}>{ICONS[pChoice]}</Text>
              </Animated.View>
            </View>
          )}
          {phase === 'result' && (
            <Text style={s.resultTrophy}>
              {finalRes === 'win' ? '🏆' : finalRes === 'loss' ? '💀' : '🤝'}
            </Text>
          )}
        </View>

        {/* Player fighter */}
        <View style={s.fighter}>
          <Animated.View style={{ transform: [{ translateY: pBounce }] }}>
            <Image source={SPRITES[playerType]} style={s.sprite} resizeMode="contain" />
          </Animated.View>
          <Text style={[s.fighterName, { color: pTheme.main }]}>TOI</Text>
        </View>
      </View>

      {/* Round result label — always rendered to avoid layout shift */}
      <Text style={[
        s.roundLabel,
        roundRes === 'win'  ? s.roundLblW :
        roundRes === 'loss' ? s.roundLblL : s.roundLblD,
      ]}>
        {phase === 'reveal' && roundRes
          ? roundRes === 'win' ? '✦ VICTOIRE ✦' : roundRes === 'loss' ? '✦ DÉFAITE ✦' : '✦ ÉGALITÉ ✦'
          : ''}
      </Text>

      {/* Bottom zone — fixed minHeight to avoid layout shifts */}
      <View style={s.bottomZone}>
        {phase === 'choose' && (
          <View style={s.chooseArea}>
            <View style={s.timerTrack}>
              <Animated.View style={[s.timerFill, {
                width: timerW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: timeLeft <= 1 ? retro.red : retro.gold,
              }]} />
            </View>
            <Text style={s.chooseHint}>CHOISIS TON ATTAQUE</Text>
            <View style={s.typeGrid}>
              {ALL_TYPES.map(t => {
                const th = typeTheme[t]
                return (
                  <TouchableOpacity
                    key={t}
                    style={[s.typeBtn, { backgroundColor: th.dark, borderColor: th.main }]}
                    onPress={() => pick(t)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.typeBtnIcon}>{ICONS[t]}</Text>
                    <Text style={[s.typeBtnName, { color: th.main }]}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {phase === 'result' && (
          <View style={s.resultArea}>
            <Text style={[
              s.finalTitle,
              finalRes === 'win'  ? s.finalTitleW :
              finalRes === 'loss' ? s.finalTitleL : s.finalTitleD,
            ]}>
              {finalRes === 'win' ? 'TU GAGNES !' : finalRes === 'loss' ? 'DÉFAITE...' : 'ÉGALITÉ !'}
            </Text>
            <Text style={s.finalSub}>
              {finalRes === 'win'
                ? '🤝 Lien d\'amitié renforcé !'
                : finalRes === 'loss'
                ? '💪 La revanche sera pour la prochaine fois !'
                : '🌟 Un vrai match nul, bien joué !'}
            </Text>
            <Text style={s.finalScore}>{scores.p} – {scores.o}</Text>
            <TouchableOpacity
              style={[s.continueBtn, {
                backgroundColor:
                  finalRes === 'win'  ? retro.gold :
                  finalRes === 'loss' ? retro.red   : retro.mint,
              }]}
              onPress={() => onClose(finalRes)}
              activeOpacity={0.8}
            >
              <Text style={[s.continueBtnTxt, {
                color: finalRes === 'win' ? retro.ink : retro.paper,
              }]}>CONTINUER</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: retro.night,
    paddingTop: 52,
    zIndex: 20,
  },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 4,
  },
  gameTitle: { fontSize: 14, fontWeight: '900', color: retro.paper, fontFamily: 'monospace', letterSpacing: 2 },
  pips:  { flexDirection: 'row', gap: 8 },
  pip:   { width: 14, height: 14, borderRadius: 2, borderWidth: 2 },
  pipE:  { backgroundColor: 'transparent', borderColor: retro.faded },
  pipW:  { backgroundColor: retro.mint,    borderColor: retro.mint },
  pipL:  { backgroundColor: retro.red,     borderColor: retro.red },
  pipD:  { backgroundColor: retro.gold,    borderColor: retro.gold },

  scoreBand: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18, paddingVertical: 4 },
  scoreN:    { fontSize: 44, fontWeight: '900', fontFamily: 'monospace' },
  scoreSep:  { fontSize: 22, color: retro.faded, fontFamily: 'monospace' },

  arena: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  fighter:     { alignItems: 'center', gap: 6, width: 92 },
  sprite:      { width: 88, height: 96 },
  spriteFlip:  { transform: [{ scaleX: -1 }] },
  fighterName: { fontSize: 11, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1, textAlign: 'center' },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdownBig: { fontSize: 80, fontWeight: '900', color: retro.paper, fontFamily: 'monospace' },
  swordsIcon:   { fontSize: 42 },

  revealStack: { alignItems: 'center', gap: 6 },
  chip:        { width: 58, height: 58, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  chipIcon:    { fontSize: 32 },
  chipVs:      { fontSize: 10, fontWeight: '900', color: retro.faded, fontFamily: 'monospace', letterSpacing: 1 },

  resultTrophy: { fontSize: 56 },

  roundLabel: {
    textAlign: 'center', fontSize: 15, fontWeight: '900',
    fontFamily: 'monospace', letterSpacing: 3, height: 26,
  },
  roundLblW: { color: retro.mint },
  roundLblL: { color: retro.red },
  roundLblD: { color: retro.gold },

  bottomZone: { minHeight: 220, paddingBottom: 16 },

  chooseArea: { paddingHorizontal: 16, gap: 10, paddingTop: 4 },
  timerTrack: { height: 8, backgroundColor: retro.ink2, borderRadius: 2, overflow: 'hidden' },
  timerFill:  { height: '100%', borderRadius: 2 },
  chooseHint: {
    textAlign: 'center', fontSize: 11, fontWeight: '900',
    color: retro.faded, fontFamily: 'monospace', letterSpacing: 3,
  },
  typeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  typeBtn:     { width: '46%', borderRadius: 4, borderWidth: 2, paddingVertical: 12, alignItems: 'center', gap: 4 },
  typeBtnIcon: { fontSize: 28 },
  typeBtnName: { fontSize: 12, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },

  resultArea:  { paddingHorizontal: 24, paddingTop: 4, alignItems: 'center', gap: 10 },
  finalTitle:  { fontSize: 26, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 2 },
  finalTitleW: { color: retro.gold },
  finalTitleL: { color: retro.red },
  finalTitleD: { color: retro.mint },
  finalSub:    { fontSize: 13, color: retro.faded, textAlign: 'center', lineHeight: 20 },
  finalScore:  { fontSize: 38, fontWeight: '900', color: retro.paper, fontFamily: 'monospace' },
  continueBtn: { paddingHorizontal: 44, paddingVertical: 15, borderRadius: 4, marginTop: 4 },
  continueBtnTxt: { fontSize: 15, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 2 },
})
