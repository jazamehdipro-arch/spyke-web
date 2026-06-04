import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, ImageSourcePropType, StyleSheet, TouchableWithoutFeedback, View, Text } from 'react-native'
import { Creature, CreatureMood } from '../types'
import { CREATURE_COLORS, getMood, getMoodEmoji } from '../utils/creature'

// All requires must be static in React Native bundler
const SPRITES: Record<string, ImageSourcePropType> = {
  ignis_0: require('../../assets/sprites/ignis_f0.png'),
  ignis_1: require('../../assets/sprites/ignis_f1.png'),
  ignis_2: require('../../assets/sprites/ignis_f2.png'),
  nemo_0:  require('../../assets/sprites/nemo_f0.png'),
  nemo_1:  require('../../assets/sprites/nemo_f1.png'),
  nemo_2:  require('../../assets/sprites/nemo_f2.png'),
  sylva_0: require('../../assets/sprites/sylva_f0.png'),
  sylva_1: require('../../assets/sprites/sylva_f1.png'),
  sylva_2: require('../../assets/sprites/sylva_f2.png'),
  zapp_0:  require('../../assets/sprites/zapp_f0.png'),
  zapp_1:  require('../../assets/sprites/zapp_f1.png'),
  zapp_2:  require('../../assets/sprites/zapp_f2.png'),
}

// frame sequences per mood: [f0=idle, f1=bounce, f2=happy]
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

interface Props {
  creature: Creature
}

export default function CreatureDisplay({ creature }: Props) {
  const bounce = useRef(new Animated.Value(0)).current
  const scale  = useRef(new Animated.Value(1)).current
  const [frameIdx, setFrameIdx] = useState(0)
  const [reacting, setReacting] = useState(false)

  const mood  = getMood(creature.stats)
  const color = CREATURE_COLORS[creature.type]
  const moodEmoji = getMoodEmoji(mood)
  const seq   = FRAME_SEQ[mood]

  // cycle animation frames
  useEffect(() => {
    setFrameIdx(0)
    const id = setInterval(() => {
      setFrameIdx((i) => (i + 1) % seq.length)
    }, FRAME_MS[mood])
    return () => clearInterval(id)
  }, [mood])

  // vertical bounce loop
  useEffect(() => {
    const lift = mood === 'excited' ? 14 : mood === 'happy' ? 8 : 4
    const ms   = FRAME_MS[mood] * seq.length

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -lift, duration: ms / 2, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,     duration: ms / 2, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [mood])

  const handlePress = () => {
    if (reacting) return
    setReacting(true)
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.25, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start()
    // flash the happy frame briefly
    setFrameIdx(seq.indexOf(2) >= 0 ? seq.indexOf(2) : 1)
    setTimeout(() => setReacting(false), 600)
  }

  const currentFrame = reacting ? 2 : seq[frameIdx]
  const spriteKey    = `${creature.type}_${currentFrame}`
  const sprite       = SPRITES[spriteKey]

  return (
    <View style={styles.container}>
      <View style={[styles.aura, { backgroundColor: color + '22' }]} />
      <TouchableWithoutFeedback onPress={handlePress}>
        <Animated.View style={[styles.spriteWrapper, { transform: [{ translateY: bounce }, { scale }] }]}>
          <Image source={sprite} style={styles.sprite} resizeMode="contain" />
        </Animated.View>
      </TouchableWithoutFeedback>
      <Text style={styles.moodEmoji}>{moodEmoji}</Text>
      <Text style={styles.name}>{creature.name}</Text>
      <View style={[styles.levelBadge, { backgroundColor: color }]}>
        <Text style={styles.levelText}>Niv. {creature.stats.level}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  aura: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  spriteWrapper: {
    marginBottom: 8,
  },
  sprite: {
    width: 144,
    height: 144,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  levelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  levelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
})
