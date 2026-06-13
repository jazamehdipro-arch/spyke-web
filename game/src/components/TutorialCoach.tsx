import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { font, retro, retroShadow } from '../styles/retro'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

interface Rect { x: number; y: number; width: number; height: number }

export interface CoachStep {
  id: string
  title?: string
  text: string
  /** A ref to a View to spotlight. Use collapsable={false} on the target on Android. */
  target?: React.RefObject<View | null>
  /** A fixed spotlight rectangle (window coords). Overrides target. */
  spotlightRect?: Rect
  /** Force bubble placement. Default: auto (below if target is in top half). */
  placement?: 'above' | 'below' | 'center'
  /** Label of the advance button. Default "Suivant ›" / "Terminé" on last step. */
  ctaLabel?: string
}

interface Props {
  steps: CoachStep[]
  onDone: () => void
  /** Optional skip — if omitted, skip jumps straight to onDone. */
  onSkip?: () => void
  /** Hide the "Passer" skip link entirely (e.g. mandatory combat intro). */
  hideSkip?: boolean
}

const DIM = 'rgba(14,17,28,0.60)'
const PAD = 8   // spotlight padding around the target

export default function TutorialCoach({ steps, onDone, onSkip, hideSkip }: Props) {
  const [index, setIndex] = useState(0)
  const [rect, setRect]   = useState<Rect | null>(null)
  const glow  = useRef(new Animated.Value(0)).current
  const enter = useRef(new Animated.Value(0)).current

  const step   = steps[index]
  const isLast = index === steps.length - 1

  // Measure the current target (with a few retries while layout settles)
  useEffect(() => {
    let cancelled = false
    setRect(null)
    enter.setValue(0)

    if (step.spotlightRect) {
      setRect(step.spotlightRect)
    } else if (step.target?.current) {
      const measure = (attempt = 0) => {
        step.target?.current?.measureInWindow((x, y, w, h) => {
          if (cancelled) return
          if ((w === 0 || h === 0) && attempt < 6) {
            setTimeout(() => measure(attempt + 1), 70)
            return
          }
          setRect({ x, y, width: w, height: h })
        })
      }
      measure()
    }

    Animated.timing(enter, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()

    return () => { cancelled = true }
  }, [index])

  // Pulsing spotlight glow
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 760, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 760, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  const advance = () => {
    if (isLast) onDone()
    else setIndex((i) => i + 1)
  }

  const skip = () => { onSkip ? onSkip() : onDone() }

  // ── Spotlight geometry ──────────────────────────────────
  const hole = rect
    ? {
        x: Math.max(0, rect.x - PAD),
        y: Math.max(0, rect.y - PAD),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  // ── Bubble placement ────────────────────────────────────
  const placement: 'above' | 'below' | 'center' =
    step.placement ?? (!hole ? 'center' : hole.y + hole.height / 2 < SCREEN_H * 0.46 ? 'below' : 'above')

  const bubblePos =
    placement === 'center'
      ? { top: SCREEN_H * 0.34 }
      : placement === 'below' && hole
        ? { top: hole.y + hole.height + 14 }
        : hole
          ? { bottom: SCREEN_H - hole.y + 14 }
          : { top: SCREEN_H * 0.34 }

  const borderGlow = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] })
  const enterTranslate = enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] })

  return (
    <View style={styles.fill} pointerEvents="box-none">
      {/* Dim backdrop — 4 panels around the hole (or full screen if centered) */}
      <TouchableWithoutFeedback onPress={advance}>
        <View style={styles.fill}>
          {hole ? (
            <>
              <View style={[styles.dim, { left: 0, top: 0, right: 0, height: hole.y }]} />
              <View style={[styles.dim, { left: 0, top: hole.y + hole.height, right: 0, bottom: 0 }]} />
              <View style={[styles.dim, { left: 0, top: hole.y, width: hole.x, height: hole.height }]} />
              <View style={[styles.dim, { left: hole.x + hole.width, top: hole.y, right: 0, height: hole.height }]} />
            </>
          ) : (
            <View style={[styles.dim, StyleSheet.absoluteFillObject]} />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Glowing spotlight border */}
      {hole && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.spotlight,
            {
              left: hole.x,
              top: hole.y,
              width: hole.width,
              height: hole.height,
              opacity: borderGlow,
            },
          ]}
        />
      )}

      {/* Speech bubble */}
      <Animated.View
        style={[
          styles.bubbleWrap,
          bubblePos,
          { opacity: enter, transform: [{ translateY: enterTranslate }] },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.bubble}>
          <View style={styles.bubbleHeaderRow}>
            <Text style={styles.coachTag}>👾 GUIDE</Text>
            <Text style={styles.stepCount}>{index + 1}/{steps.length}</Text>
          </View>
          {!!step.title && <Text style={styles.bubbleTitle}>{step.title}</Text>}
          <Text style={styles.bubbleText}>{step.text}</Text>

          <View style={styles.footerRow}>
            {!hideSkip ? (
              <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.skipTxt}>Passer le tuto</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity style={styles.nextBtn} onPress={advance} activeOpacity={0.85}>
              <Text style={styles.nextTxt}>
                {step.ctaLabel ?? (isLast ? 'Terminé ✓' : 'Suivant ›')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000 },
  dim: { position: 'absolute', backgroundColor: DIM },

  spotlight: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: retro.gold,
    backgroundColor: 'transparent',
    shadowColor: retro.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },

  bubbleWrap: {
    position: 'absolute',
    left: 18,
    width: SCREEN_W - 36,
    alignItems: 'center',
  },
  bubble: {
    width: '100%',
    backgroundColor: retro.white,
    borderWidth: 3,
    borderColor: retro.line,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    ...retroShadow,
  },
  bubbleHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  coachTag: { fontSize: 10, fontWeight: '900', color: retro.gold, fontFamily: 'monospace', letterSpacing: 1 },
  stepCount: { fontSize: 11, fontWeight: '900', color: retro.faded, fontFamily: 'monospace' },
  bubbleTitle: { ...font.title, fontSize: 17, marginBottom: 4 },
  bubbleText: { fontSize: 14, color: retro.ink, lineHeight: 20, fontFamily: 'monospace' },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  skipTxt: { fontSize: 12, color: retro.faded, fontFamily: 'monospace', fontWeight: '700', textDecorationLine: 'underline' },
  nextBtn: {
    backgroundColor: retro.ink,
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: retro.line,
  },
  nextTxt: { fontSize: 14, color: retro.white, fontWeight: '900', fontFamily: 'monospace' },
})
