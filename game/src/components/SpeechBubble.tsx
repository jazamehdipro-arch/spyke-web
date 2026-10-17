import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

interface Props {
  message: string
  visible: boolean
}

export default function SpeechBubble({ message, visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(10)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 10, duration: 300, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, message])

  return (
    <Animated.View style={[styles.bubble, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{message}</Text>
      <View style={styles.tail} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: 'center',
    maxWidth: 260,
    position: 'relative',
  },
  text: {
    fontSize: 14,
    color: '#1a1a2e',
    textAlign: 'center',
    fontWeight: '500',
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
})
