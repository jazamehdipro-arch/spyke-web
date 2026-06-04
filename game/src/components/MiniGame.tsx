import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const { width: W, height: H } = Dimensions.get('window')
const GAME_DURATION = 12
const TARGET_SIZE = 64

interface Target {
  id: number
  x: number
  y: number
  scale: Animated.Value
  opacity: Animated.Value
  emoji: string
}

interface Props {
  visible: boolean
  onClose: (score: number) => void
  creatureEmoji: string
}

const EMOJIS = ['⭐', '🌟', '💫', '✨', '🎯']

export default function MiniGame({ visible, onClose, creatureEmoji }: Props) {
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [targets, setTargets] = useState<Target[]>([])
  const nextId = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (spawnRef.current) clearInterval(spawnRef.current)
  }, [])

  const endGame = useCallback(
    (finalScore: number) => {
      cleanup()
      setStarted(false)
      onClose(finalScore)
    },
    [cleanup, onClose]
  )

  const spawnTarget = useCallback(() => {
    const id = nextId.current++
    const x = Math.random() * (W - TARGET_SIZE - 40) + 20
    const y = Math.random() * (H * 0.5 - TARGET_SIZE) + H * 0.15
    const scale = new Animated.Value(0)
    const opacity = new Animated.Value(1)
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]

    const target: Target = { id, x, y, scale, opacity, emoji }

    setTargets((prev) => [...prev, target])

    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start()

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setTargets((prev) => prev.filter((t) => t.id !== id))
      })
    }, 1400)
  }, [])

  const startGame = () => {
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setTargets([])
    setStarted(true)
    nextId.current = 0

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setScore((s) => {
            endGame(s)
            return s
          })
          return 0
        }
        return t - 1
      })
    }, 1000)

    spawnRef.current = setInterval(spawnTarget, 700)
  }

  useEffect(() => {
    if (!visible) {
      cleanup()
      setStarted(false)
      setScore(0)
      setTimeLeft(GAME_DURATION)
      setTargets([])
    }
  }, [visible, cleanup])

  const hitTarget = (id: number) => {
    setTargets((prev) => {
      const t = prev.find((x) => x.id === id)
      if (!t) return prev
      Animated.parallel([
        Animated.timing(t.scale, { toValue: 1.5, duration: 150, useNativeDriver: true }),
        Animated.timing(t.opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start()
      return prev.filter((x) => x.id !== id)
    })
    setScore((s) => s + 1)
  }

  const getResultMessage = () => {
    if (score >= 15) return { msg: 'LÉGENDAIRE ! 🏆', color: '#A855F7' }
    if (score >= 10) return { msg: 'Excellent ! 🔥', color: '#FF6B35' }
    if (score >= 6) return { msg: 'Bien joué ! ⭐', color: '#FFD93D' }
    return { msg: 'Pas mal ! 💪', color: '#6BCB77' }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {!started ? (
            <View style={styles.intro}>
              <Text style={styles.introEmoji}>{creatureEmoji}</Text>
              <Text style={styles.introTitle}>Mini-jeu !</Text>
              <Text style={styles.introText}>
                Tape le plus d'étoiles possible en {GAME_DURATION} secondes !
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>Jouer !</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onClose(0)} style={styles.skipBtn}>
                <Text style={styles.skipText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.game}>
              <View style={styles.hud}>
                <View style={styles.hudItem}>
                  <Text style={styles.hudLabel}>Score</Text>
                  <Text style={styles.hudValue}>{score}</Text>
                </View>
                <View style={[styles.hudItem, styles.timer]}>
                  <Text style={[styles.hudValue, timeLeft <= 3 && styles.timerRed]}>
                    {timeLeft}s
                  </Text>
                </View>
              </View>

              {targets.map((t) => (
                <Animated.View
                  key={t.id}
                  style={[
                    styles.target,
                    {
                      left: t.x,
                      top: t.y,
                      opacity: t.opacity,
                      transform: [{ scale: t.scale }],
                    },
                  ]}
                >
                  <TouchableOpacity onPress={() => hitTarget(t.id)} style={styles.targetTouch}>
                    <Text style={styles.targetEmoji}>{t.emoji}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.95)',
  },
  container: {
    flex: 1,
  },
  intro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  introEmoji: {
    fontSize: 72,
  },
  introTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  introText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
  startBtn: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
  game: {
    flex: 1,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  hudItem: {
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  hudValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  timer: {
    alignItems: 'flex-end',
  },
  timerRed: {
    color: '#FF6B6B',
  },
  target: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  targetTouch: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetEmoji: {
    fontSize: 44,
  },
})
