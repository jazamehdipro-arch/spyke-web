import React from 'react'
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native'
import { font, retro } from '../styles/retro'

// ─────────────────────────────────────────────────────────────
//  CROISIO UI PRIMITIVES — pixel-craft building blocks
//  Every screen composes these for a coherent cartridge look.
// ─────────────────────────────────────────────────────────────

// ── Panel: cartridge card with optional label strap ──────────
// The strap sits ON the top border, like a sticker on a cartridge.
interface PanelProps {
  children: React.ReactNode
  label?: string
  labelColor?: string
  tint?: string
  style?: StyleProp<ViewStyle>
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export function Panel({ children, label, labelColor, tint, style, shadow = 'md' }: PanelProps) {
  const shadowStyle =
    shadow === 'none' ? null :
    shadow === 'sm' ? ui.shadowSm :
    shadow === 'lg' ? ui.shadowLg : ui.shadowMd
  return (
    <View style={[ui.panel, shadowStyle, tint ? { backgroundColor: tint } : null, label ? { marginTop: 9 } : null, style]}>
      {label ? (
        <View style={[ui.strap, labelColor ? { backgroundColor: labelColor } : null]}>
          <Text style={ui.strapText}>{label}</Text>
        </View>
      ) : null}
      {children}
    </View>
  )
}

// ── PixelButton: tactile press (shadow collapses, button sinks) ──
interface PixelButtonProps {
  children?: React.ReactNode
  title?: string
  icon?: string
  onPress?: () => void
  color?: string
  textColor?: string
  disabled?: boolean
  small?: boolean
  big?: boolean
  style?: ViewStyle | ViewStyle[]
  textStyle?: TextStyle
}

export function PixelButton({
  children, title, icon, onPress, color = retro.ink, textColor = retro.white,
  disabled, small, big, style, textStyle,
}: PixelButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        ui.btn,
        small && ui.btnSmall,
        big && ui.btnBig,
        { backgroundColor: color },
        pressed && !disabled ? ui.btnPressed : ui.btnRaised,
        disabled && ui.btnDisabled,
        style as ViewStyle,
      ]}
    >
      {children ?? (
        <Text style={[ui.btnText, small && ui.btnTextSmall, big && ui.btnTextBig, { color: textColor }, textStyle]}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
      )}
    </Pressable>
  )
}

// ── PixelBar: segmented LCD meter (discrete cells) ───────────
interface PixelBarProps {
  value: number            // 0..1
  color?: string
  cells?: number
  height?: number
  style?: ViewStyle
}

export function PixelBar({ value, color = retro.screenDark, cells = 10, height = 12, style }: PixelBarProps) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * cells)
  return (
    <View style={[ui.barTrack, { height }, style]}>
      {Array.from({ length: cells }).map((_, i) => (
        <View
          key={i}
          style={[
            ui.barCell,
            i < filled
              ? { backgroundColor: color }
              : { backgroundColor: 'transparent' },
          ]}
        />
      ))}
    </View>
  )
}

// ── SmoothBar: continuous bar with ink frame (for XP/HP) ─────
interface SmoothBarProps {
  value: number            // 0..1
  color?: string
  height?: number
  style?: ViewStyle
}

export function SmoothBar({ value, color = retro.screenDark, height = 10, style }: SmoothBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <View style={[ui.smoothTrack, { height }, style]}>
      <View style={[ui.smoothFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  )
}

// ── SectionTitle: ◆ LABEL ──────── (dashed rule) ─────────────
interface SectionTitleProps {
  title: string
  color?: string
  style?: ViewStyle
}

export function SectionTitle({ title, color = retro.ink, style }: SectionTitleProps) {
  return (
    <View style={[ui.sectionRow, style]}>
      <Text style={[ui.sectionDiamond, { color }]}>◆</Text>
      <Text style={[ui.sectionText, { color }]}>{title}</Text>
      <View style={[ui.sectionRule, { borderColor: color }]} />
    </View>
  )
}

// ── Chip: small ink-bordered tag ─────────────────────────────
interface ChipProps {
  text: string
  color?: string
  textColor?: string
  style?: ViewStyle
}

export function Chip({ text, color = retro.paper2, textColor = retro.ink, style }: ChipProps) {
  return (
    <View style={[ui.chip, { backgroundColor: color }, style]}>
      <Text style={[ui.chipText, { color: textColor }]}>{text}</Text>
    </View>
  )
}

// ── ScreenTitle: big display heading with offset echo ────────
interface ScreenTitleProps {
  title: string
  subtitle?: string
  style?: ViewStyle
}

export function ScreenTitle({ title, subtitle, style }: ScreenTitleProps) {
  return (
    <View style={[ui.screenTitleWrap, style]}>
      <View>
        <Text style={ui.screenTitleEcho}>{title}</Text>
        <Text style={ui.screenTitle}>{title}</Text>
      </View>
      {subtitle ? <Text style={ui.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const ui = StyleSheet.create({
  // panel
  panel: {
    backgroundColor: retro.white,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 4,
  },
  shadowSm: {
    shadowColor: retro.line, shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  shadowMd: {
    shadowColor: retro.line, shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  shadowLg: {
    shadowColor: retro.line, shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  strap: {
    position: 'absolute',
    top: -9,
    left: 10,
    backgroundColor: retro.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: retro.line,
    borderRadius: 2,
    zIndex: 2,
  },
  strapText: {
    ...font.label,
    fontSize: 9,
    color: retro.white,
  },

  // button
  btn: {
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: { paddingVertical: 7, paddingHorizontal: 10 },
  btnBig: { paddingVertical: 16, paddingHorizontal: 20 },
  btnRaised: {
    shadowColor: retro.line, shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  btnPressed: {
    transform: [{ translateX: 3 }, { translateY: 4 }],
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0, elevation: 0,
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { ...font.mono, fontWeight: '900', fontSize: 14 },
  btnTextSmall: { fontSize: 12 },
  btnTextBig: { fontSize: 17 },

  // segmented bar
  barTrack: {
    flexDirection: 'row',
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    padding: 1.5,
    gap: 1.5,
    overflow: 'hidden',
  },
  barCell: { flex: 1, borderRadius: 1 },

  // smooth bar
  smoothTrack: {
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    overflow: 'hidden',
  },
  smoothFill: { height: '100%' },

  // section title
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionDiamond: { fontSize: 10, fontWeight: '900' },
  sectionText: {
    ...font.label,
    fontSize: 11,
  },
  sectionRule: {
    flex: 1,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.25,
    marginTop: 1,
  },

  // chip
  chip: {
    borderWidth: 1.5,
    borderColor: retro.line,
    borderRadius: 2,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  chipText: { ...font.mono, fontSize: 10, fontWeight: '900' },

  // screen title
  screenTitleWrap: { gap: 2 },
  screenTitleEcho: {
    ...font.display,
    fontSize: 30,
    position: 'absolute',
    left: 2.5,
    top: 2.5,
    color: retro.gold,
    opacity: 0.55,
  },
  screenTitle: {
    ...font.display,
    fontSize: 30,
  },
  screenSubtitle: { fontSize: 13, color: retro.muted, marginTop: 2 },
})
