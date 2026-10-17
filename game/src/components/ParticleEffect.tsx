import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

interface Particle {
  id: number
  x: number
  opacity: Animated.Value
  translateY: Animated.Value
  rotate: Animated.Value
  emoji: string
}

interface Props {
  trigger: number
  emojis?: string[]
}

export default function ParticleEffect({ trigger, emojis = ['❤️', '⭐', '✨'] }: Props) {
  const particles = useRef<Particle[]>([])
  const [, forceUpdate] = React.useState(0)

  useEffect(() => {
    if (trigger === 0) return

    const newParticles: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 200 - 100,
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }))

    particles.current = newParticles
    forceUpdate((n) => n + 1)

    newParticles.forEach((p) => {
      Animated.parallel([
        Animated.timing(p.translateY, { toValue: -100 - Math.random() * 60, duration: 1000, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(p.rotate, { toValue: Math.random() > 0.5 ? 1 : -1, duration: 1000, useNativeDriver: true }),
      ]).start(() => {
        particles.current = particles.current.filter((x) => x.id !== p.id)
        forceUpdate((n) => n + 1)
      })
    })
  }, [trigger])

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((p) => (
        <Animated.Text
          key={p.id}
          style={[
            styles.particle,
            {
              left: '50%',
              marginLeft: p.x,
              opacity: p.opacity,
              transform: [
                { translateY: p.translateY },
                {
                  rotate: p.rotate.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-30deg', '30deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    bottom: '40%',
    fontSize: 22,
  },
})
