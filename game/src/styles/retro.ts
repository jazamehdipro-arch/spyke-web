import { TextStyle, ViewStyle } from 'react-native'
import { CreatureType } from '../types'

// ─────────────────────────────────────────────────────────────
//  CROISIO DESIGN SYSTEM — "encre & papier" Game Boy heritage
//  Hard pixel shadows, monospace headings, cream paper, navy ink.
// ─────────────────────────────────────────────────────────────

export const retro = {
  // ink (navy) family
  ink: '#20283D',
  ink2: '#2E3650',
  ink3: '#3C4666',
  night: '#171B2E',

  // paper (cream) family
  paper: '#F4E7C4',
  paper2: '#E8D6A3',
  paper3: '#DEC98F',
  white: '#FFF8DC',

  // Game Boy screen greens
  screen: '#9BBC0F',
  screenDark: '#306230',
  screenSoft: '#C7D66D',
  screenDeep: '#0F380F',

  // accents
  red: '#C94F3D',
  redDark: '#8E3326',
  blue: '#3B6EA8',
  blueDark: '#27496F',
  gold: '#D9A441',
  goldDark: '#9C7222',
  mint: '#6BAA75',
  mintDark: '#43714B',
  purple: '#7B5EA7',
  purpleDark: '#54407A',
  orange: '#D9772E',

  line: '#20283D',
  muted: '#756F5D',
  faded: '#A89F87',
}

// Per-creature theme — main (saturated), soft (panel tint), dark (pressed/border)
export const typeTheme: Record<CreatureType, { main: string; soft: string; dark: string; glow: string }> = {
  ignis: { main: '#C94F3D', soft: '#F6DCC9', dark: '#8E3326', glow: '#E8855F' },
  nemo:  { main: '#3B6EA8', soft: '#D6E3EF', dark: '#27496F', glow: '#6FA3D4' },
  sylva: { main: '#5E9A68', soft: '#DCEAD0', dark: '#3E6B46', glow: '#8FC48A' },
  zapp:  { main: '#D9A441', soft: '#F7E9C3', dark: '#9C7222', glow: '#EFC76A' },
}

// ── Hard pixel shadows ───────────────────────────────────────
export const retroShadow = {
  shadowColor: '#20283D',
  shadowOffset: { width: 3, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
}

export const retroShadowSm = {
  shadowColor: '#20283D',
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2,
}

export const retroShadowLg = {
  shadowColor: '#20283D',
  shadowOffset: { width: 5, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
}

// ── Typography ───────────────────────────────────────────────
// Monospace = the game's voice (titles, labels, numbers).
// System font = reading text (descriptions, paragraphs).
export const font = {
  display: {
    fontFamily: 'monospace',
    fontWeight: '900' as TextStyle['fontWeight'],
    color: retro.ink,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: 'monospace',
    fontWeight: '900' as TextStyle['fontWeight'],
    color: retro.ink,
  },
  label: {
    fontFamily: 'monospace',
    fontWeight: '900' as TextStyle['fontWeight'],
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 1,
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '800' as TextStyle['fontWeight'],
  },
  body: {
    color: retro.ink2,
  },
  caption: {
    fontSize: 11,
    color: retro.muted,
  },
}

// ── Shared style fragments ───────────────────────────────────
// Cartridge panel: white card, thick ink border, hard shadow.
export const panel: ViewStyle = {
  backgroundColor: retro.white,
  borderWidth: 2,
  borderColor: retro.line,
  borderRadius: 4,
  ...retroShadow,
}

export const panelFlat: ViewStyle = {
  backgroundColor: retro.white,
  borderWidth: 2,
  borderColor: retro.line,
  borderRadius: 4,
}

// Inset slot: pressed-in area (LCD screen recess look)
export const inset: ViewStyle = {
  backgroundColor: retro.paper2,
  borderWidth: 2,
  borderColor: retro.line,
  borderRadius: 3,
}
