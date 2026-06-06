import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, ImageBackground, ImageSourcePropType, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import { Creature, CreatureMood, CreatureType } from '../types'

import { CREATURE_COLORS, getMood } from '../utils/creature'

const TERRAINS: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/arena_volcano.png'),
  nemo:  require('../../assets/sprites/arena_snow.png'),
  sylva: require('../../assets/sprites/arena_forest.png'),
  zapp:  require('../../assets/sprites/arena_desert.png'),
}

// All requires must be static in React Native bundler
const SPRITES: Record<string, ImageSourcePropType> = {
  ignis_0:    require('../../assets/sprites/ignis_f0.png'),
  ignis_1:    require('../../assets/sprites/ignis_f1.png'),
  ignis_2:    require('../../assets/sprites/ignis_f2.png'),
  ignis_e2_0: require('../../assets/sprites/ignis_e2_f0.png'),
  ignis_e2_1: require('../../assets/sprites/ignis_e2_f1.png'),
  ignis_e2_2: require('../../assets/sprites/ignis_e2_f2.png'),
  ignis_e3_0: require('../../assets/sprites/ignis_e3_f0.png'),
  ignis_e3_1: require('../../assets/sprites/ignis_e3_f1.png'),
  ignis_e3_2: require('../../assets/sprites/ignis_e3_f2.png'),
  ignis_sick:  require('../../assets/sprites/ignis_sick.png'),
  ignis_eat:   require('../../assets/sprites/ignis_eat.png'),
  ignis_train: require('../../assets/sprites/ignis_train.png'),
  ignis_sleep: require('../../assets/sprites/ignis_sleep.png'),
  nemo_0:     require('../../assets/sprites/nemo_f0.png'),
  nemo_1:     require('../../assets/sprites/nemo_f1.png'),
  nemo_2:     require('../../assets/sprites/nemo_f2.png'),
  nemo_e2_0:  require('../../assets/sprites/nemo_e2_f0.png'),
  nemo_e2_1:  require('../../assets/sprites/nemo_e2_f1.png'),
  nemo_e2_2:  require('../../assets/sprites/nemo_e2_f2.png'),
  nemo_e3_0:  require('../../assets/sprites/nemo_e3_f0.png'),
  nemo_e3_1:  require('../../assets/sprites/nemo_e3_f1.png'),
  nemo_e3_2:  require('../../assets/sprites/nemo_e3_f2.png'),
  nemo_sick:   require('../../assets/sprites/nemo_sick.png'),
  nemo_eat:    require('../../assets/sprites/nemo_eat.png'),
  nemo_train:  require('../../assets/sprites/nemo_train.png'),
  nemo_sleep:  require('../../assets/sprites/nemo_sleep.png'),
  sylva_0:    require('../../assets/sprites/sylva_f0.png'),
  sylva_1:    require('../../assets/sprites/sylva_f1.png'),
  sylva_2:    require('../../assets/sprites/sylva_f2.png'),
  sylva_e2_0: require('../../assets/sprites/sylva_e2_f0.png'),
  sylva_e2_1: require('../../assets/sprites/sylva_e2_f1.png'),
  sylva_e2_2: require('../../assets/sprites/sylva_e2_f2.png'),
  sylva_e3_0: require('../../assets/sprites/sylva_e3_f0.png'),
  sylva_e3_1: require('../../assets/sprites/sylva_e3_f1.png'),
  sylva_e3_2: require('../../assets/sprites/sylva_e3_f2.png'),
  sylva_sick:  require('../../assets/sprites/sylva_sick.png'),
  sylva_eat:   require('../../assets/sprites/sylva_eat.png'),
  sylva_train: require('../../assets/sprites/sylva_train.png'),
  sylva_sleep: require('../../assets/sprites/sylva_sleep.png'),
  zapp_0:     require('../../assets/sprites/zapp_f0.png'),
  zapp_1:     require('../../assets/sprites/zapp_f1.png'),
  zapp_2:     require('../../assets/sprites/zapp_f2.png'),
  zapp_e2_0:  require('../../assets/sprites/zapp_e2_f0.png'),
  zapp_e2_1:  require('../../assets/sprites/zapp_e2_f1.png'),
  zapp_e2_2:  require('../../assets/sprites/zapp_e2_f2.png'),
  zapp_e3_0:  require('../../assets/sprites/zapp_e3_f0.png'),
  zapp_e3_1:  require('../../assets/sprites/zapp_e3_f1.png'),
  zapp_e3_2:  require('../../assets/sprites/zapp_e3_f2.png'),
  zapp_sick:   require('../../assets/sprites/zapp_sick.png'),
  zapp_eat:    require('../../assets/sprites/zapp_eat.png'),
  zapp_train:  require('../../assets/sprites/zapp_train.png'),
  zapp_sleep:  require('../../assets/sprites/zapp_sleep.png'),
  // Shiny skins
  ignis_sk_red:    require('../../assets/sprites/ignis_sk_red.png'),
  ignis_sk_blue:   require('../../assets/sprites/ignis_sk_blue.png'),
  ignis_sk_green:  require('../../assets/sprites/ignis_sk_green.png'),
  ignis_sk_gold:   require('../../assets/sprites/ignis_sk_gold.png'),
  ignis_sk_purple: require('../../assets/sprites/ignis_sk_purple.png'),
  ignis_sk_grey:   require('../../assets/sprites/ignis_sk_grey.png'),
  nemo_sk_purple:  require('../../assets/sprites/nemo_sk_purple.png'),
  nemo_sk_ice:     require('../../assets/sprites/nemo_sk_ice.png'),
  nemo_sk_green:   require('../../assets/sprites/nemo_sk_green.png'),
  nemo_sk_fire:    require('../../assets/sprites/nemo_sk_fire.png'),
  nemo_sk_dark:    require('../../assets/sprites/nemo_sk_dark.png'),
  nemo_sk_pink:    require('../../assets/sprites/nemo_sk_pink.png'),
  sylva_sk_orange: require('../../assets/sprites/sylva_sk_orange.png'),
  sylva_sk_blue:   require('../../assets/sprites/sylva_sk_blue.png'),
  sylva_sk_green:  require('../../assets/sprites/sylva_sk_green.png'),
  sylva_sk_purple: require('../../assets/sprites/sylva_sk_purple.png'),
  sylva_sk_gold:   require('../../assets/sprites/sylva_sk_gold.png'),
  sylva_sk_grey:   require('../../assets/sprites/sylva_sk_grey.png'),
  zapp_sk_orange:  require('../../assets/sprites/zapp_sk_orange.png'),
  zapp_sk_blue:    require('../../assets/sprites/zapp_sk_blue.png'),
  zapp_sk_green:   require('../../assets/sprites/zapp_sk_green.png'),
  zapp_sk_red:     require('../../assets/sprites/zapp_sk_red.png'),
  zapp_sk_white:   require('../../assets/sprites/zapp_sk_white.png'),
  zapp_sk_purple:  require('../../assets/sprites/zapp_sk_purple.png'),
}

function getStageKey(level: number): string {
  if (level >= 20) return '_e3'
  if (level >= 10) return '_e2'
  return ''
}

// Particle colors per type
const PARTICLE_COLORS: Record<CreatureType, string[]> = {
  ignis: ['#FF6600', '#FF9900', '#FF3300', '#FFCC00'],
  nemo:  ['#00BBDD', '#00DDFF', '#0099BB', '#88EEFF'],
  sylva: ['#8BC34A', '#CDDC39', '#66BB6A', '#A5D6A7'],
  zapp:  ['#FFD700', '#FFEE00', '#FFB300', '#FFFFFF'],
}

function FloatingParticles({ color, type }: { color: string; type: CreatureType }) {
  const colors = PARTICLE_COLORS[type]
  const particles = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      x: 20 + i * 28,
      y: useRef(new Animated.Value(60 + Math.random() * 40)).current,
      opacity: useRef(new Animated.Value(0)).current,
      size: 4 + (i % 3) * 2,
      color: colors[i % colors.length],
      delay: i * 300,
    }))
  ).current

  useEffect(() => {
    particles.forEach((p) => {
      const loop = () => {
        p.y.setValue(80 + Math.random() * 40)
        p.opacity.setValue(0)
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.opacity, { toValue: 0.7, duration: 400, useNativeDriver: true }),
            Animated.timing(p.y, { toValue: -20, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(loop)
      }
      loop()
    })
  }, [])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [{ translateY: p.y }],
          }}
        />
      ))}
    </View>
  )
}

const FRAME_SEQ: Record<CreatureMood, number[]> = {
  excited: [0, 1, 2, 1, 0, 2],
  happy:   [0, 1, 0, 1],
  neutral: [0, 0, 1, 0],
  sad:     [0, 0, 0, 1],
}

const FRAME_MS: Record<CreatureMood, number> = {
  excited: 200,
  happy:   400,
  neutral: 800,
  sad:     1200,
}

export type CreaturePose = 'eat' | 'train' | 'sleep' | null

interface Props {
  creature: Creature
  pose?: CreaturePose
  onEvolve?: () => void
}

export default function CreatureDisplay({ creature, pose, onEvolve }: Props) {
  const bounce = useRef(new Animated.Value(0)).current
  const scale  = useRef(new Animated.Value(1)).current
  const [frameIdx, setFrameIdx] = useState(0)
  const [reacting, setReacting] = useState(false)
  const prevLevelRef = useRef(creature.stats.level)

  const mood  = getMood(creature.stats)
  const color = CREATURE_COLORS[creature.type]
  const seq   = FRAME_SEQ[mood]
  const stage = getStageKey(creature.stats.level)

  // detect evolution (level crossed 10 or 20)
  useEffect(() => {
    const prev = prevLevelRef.current
    const curr = creature.stats.level
    prevLevelRef.current = curr
    if ((prev < 10 && curr >= 10) || (prev < 20 && curr >= 20)) {
      onEvolve?.()
    }
  }, [creature.stats.level])

  // cycle frames
  useEffect(() => {
    setFrameIdx(0)
    const id = setInterval(() => setFrameIdx((i) => (i + 1) % seq.length), FRAME_MS[mood])
    return () => clearInterval(id)
  }, [mood])

  // vertical bounce — still during poses, tiny when sick
  useEffect(() => {
    const isSick = creature.stats.isSick
    if (pose) { bounce.setValue(0); return }
    const lift = isSick ? 1 : (mood === 'excited' ? 14 : mood === 'happy' ? 8 : 4)
    const ms   = isSick ? 3000 : FRAME_MS[mood] * seq.length
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -lift, duration: ms / 2, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,     duration: ms / 2, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [mood, creature.stats.isSick, pose])

  const handlePress = () => {
    if (reacting) return
    setReacting(true)
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.25, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start()
    setFrameIdx(seq.indexOf(2) >= 0 ? seq.indexOf(2) : 1)
    setTimeout(() => setReacting(false), 600)
  }

  const currentFrame = reacting ? 2 : seq[frameIdx]
  const isSick    = creature.stats.isSick
  const activePose = isSick ? 'sick' : pose ?? null
  let spriteKey: string
  if (activePose) {
    spriteKey = `${creature.type}_${activePose}`
  } else if (creature.skin) {
    spriteKey = `${creature.type}_sk_${creature.skin}`
  } else {
    spriteKey = `${creature.type}${stage}_${currentFrame}`
  }
  const sprite = SPRITES[spriteKey] ?? SPRITES[`${creature.type}${stage}_0`]

  return (
    <View style={styles.container}>
      {/* Game Boy-style screen frame */}
      <View style={styles.gbFrame}>
        {/* Top notch bar */}
        <View style={styles.gbTopBar}>
          <View style={[styles.gbDot, { backgroundColor: color }]} />
          <View style={[styles.gbDot, { backgroundColor: color, opacity: 0.5 }]} />
          <View style={[styles.gbDot, { backgroundColor: color, opacity: 0.25 }]} />
        </View>

        {/* Screen */}
        <ImageBackground
          source={TERRAINS[creature.type]}
          style={[styles.gbScreen, { backgroundColor: isSick ? '#2a2a2a' : color + '22' }]}
          imageStyle={{ opacity: isSick ? 0.08 : 0.45, borderRadius: 8 }}
          resizeMode="cover"
        >
          {!isSick && <FloatingParticles color={color} type={creature.type} />}
          {/* Screen glare */}
          <View style={styles.gbGlare} pointerEvents="none" />
          <TouchableWithoutFeedback onPress={handlePress}>
            <Animated.View style={{ transform: [{ translateY: bounce }, { scale }], opacity: isSick ? 0.75 : 1 }}>
              <Image source={sprite} style={styles.sprite} resizeMode="contain" />
            </Animated.View>
          </TouchableWithoutFeedback>
          {isSick && !pose && (
            <View style={styles.sickOverlay} pointerEvents="none">
              <Text style={styles.sickEmoji}>🤒</Text>
            </View>
          )}
        </ImageBackground>

        {/* Bottom bar with badges */}
        <View style={styles.gbBottomBar}>
          <View style={[styles.levelBadge, { backgroundColor: color }]}>
            <Text style={styles.levelText}>Niv. {creature.stats.level}</Text>
          </View>
          {creature.stats.level >= 20 && (
            <View style={[styles.stageBadge, { backgroundColor: '#FFD700' }]}>
              <Text style={styles.stageText}>★ MAX</Text>
            </View>
          )}
          {creature.stats.level >= 10 && creature.stats.level < 20 && (
            <View style={[styles.stageBadge, { backgroundColor: color + 'BB' }]}>
              <Text style={styles.stageText}>★ ADO</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  // ── Game Boy frame ──────────────────────────────────────
  gbFrame: {
    width: 230,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
    borderWidth: 2,
    borderColor: '#333',
  },
  gbTopBar: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  gbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gbScreen: {
    height: 196,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#0a0a0a',
  },
  gbGlare: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 28,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ rotate: '-30deg' }],
  },
  gbBottomBar: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 2,
  },
  sprite: {
    width: 160,
    height: 160,
  },
  sickOverlay: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  sickEmoji: {
    fontSize: 22,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
  },
  levelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  stageBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  stageText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 10,
  },
})
