import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Creature } from '../types'
import {
  CREATURE_COLORS,
  getCreatureEmoji,
  getMood,
  getMoodEmoji,
} from '../utils/creature'

interface Props {
  creature: Creature
}

export default function CreatureDisplay({ creature }: Props) {
  const bounce = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current

  const mood = getMood(creature.stats)
  const color = CREATURE_COLORS[creature.type]
  const emoji = getCreatureEmoji(creature.type, creature.stats.level)
  const moodEmoji = getMoodEmoji(mood)

  useEffect(() => {
    const interval = mood === 'excited' ? 600 : mood === 'happy' ? 1200 : 2400

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -12,
          duration: interval / 2,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: interval / 2,
          useNativeDriver: true,
        }),
      ])
    )

    animation.start()
    return () => animation.stop()
  }, [mood])

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()
  }

  return (
    <View style={styles.container}>
      <View style={[styles.aura, { backgroundColor: color + '22' }]} />
      <Animated.View
        style={[
          styles.creatureWrapper,
          { transform: [{ translateY: bounce }, { scale }] },
        ]}
      >
        <Text style={styles.creatureEmoji} onPress={handlePress}>
          {emoji}
        </Text>
      </Animated.View>
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
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  creatureWrapper: {
    marginBottom: 8,
  },
  creatureEmoji: {
    fontSize: 90,
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
