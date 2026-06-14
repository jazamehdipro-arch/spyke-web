import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { retro } from '../styles/retro'

const { width: W, height: H } = Dimensions.get('window')
const CHAR_DELAY = 38 // ms per character

interface Props {
  text: string
  image: ImageSourcePropType
  onProceed: () => void
}

export default function BossIntro({ text, image, onProceed }: Props) {
  const [displayed, setDisplayed] = useState('')
  const done = useRef(false)
  const bgFade = useRef(new Animated.Value(0)).current
  const imgSlide = useRef(new Animated.Value(40)).current

  useEffect(() => {
    done.current = false
    setDisplayed('')

    Animated.parallel([
      Animated.timing(bgFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(imgSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start()

    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        done.current = true
      }
    }, CHAR_DELAY)

    return () => clearInterval(timer)
  }, [text])

  const handleTap = () => {
    if (!done.current) {
      setDisplayed(text)
      done.current = true
    } else {
      onProceed()
    }
  }

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View style={[styles.root, { opacity: bgFade }]}>
        <Animated.View style={[styles.imgWrap, { transform: [{ translateY: imgSlide }] }]}>
          <Image source={image} style={styles.img} resizeMode="contain" />
        </Animated.View>

        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            {displayed}
            <Text style={styles.cursor}>{done.current ? '' : '▌'}</Text>
          </Text>
          {done.current && (
            <Text style={styles.hint}>Appuyer pour continuer ›</Text>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#06080F',
    zIndex: 2000,
    elevation: 2000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  img: {
    width: W * 0.7,
    height: H * 0.42,
  },
  bubble: {
    width: W - 40,
    marginBottom: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: retro.gold,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: retro.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
  },
  bubbleText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'monospace',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  cursor: {
    color: retro.gold,
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    color: retro.gold,
    fontFamily: 'monospace',
    fontWeight: '700',
    textAlign: 'right',
  },
})
