import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CreatureStats } from '../types'
import { Panel, PixelBar, SmoothBar } from './ui'
import { font, retro } from '../styles/retro'
import { MAX_CREATURE_LEVEL } from '../utils/creature'

interface StatBarProps {
  label: string
  value: number
  color: string
  icon: string
}

function StatBar({ label, value, color, icon }: StatBarProps) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <PixelBar value={value / 100} color={color} style={styles.bar} />
      <Text style={styles.statValue}>{Math.round(value)}</Text>
    </View>
  )
}

interface Props {
  stats: CreatureStats
}

export default function StatsPanel({ stats }: Props) {
  const isMaxLevel = stats.level >= MAX_CREATURE_LEVEL
  return (
    <Panel label="Vitalité" style={styles.container}>
      <StatBar label="Faim"    value={stats.hunger}    color={retro.red}  icon="🍖" />
      <StatBar label="Bonheur" value={stats.happiness} color={retro.gold} icon="⭐" />
      <StatBar label="Énergie" value={stats.energy}    color={retro.mint} icon="⚡" />

      <View style={styles.xpRow}>
        <Text style={styles.xpLabel}>XP</Text>
        <SmoothBar
          value={isMaxLevel ? 1 : stats.xp / stats.xpToNextLevel}
          color={retro.purple}
          height={12}
          style={styles.bar}
        />
        <Text style={styles.xpValue}>
          {isMaxLevel ? 'MAX' : `${stats.xp}/${stats.xpToNextLevel}`}
        </Text>
      </View>
    </Panel>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    padding: 14,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: retro.line,
    borderStyle: 'dashed',
  },
  statIcon: {
    fontSize: 15,
    width: 22,
    textAlign: 'center',
  },
  statLabel: {
    ...font.label,
    width: 64,
    fontSize: 11,
    color: retro.ink,
  },
  xpLabel: {
    ...font.label,
    width: 22,
    fontSize: 11,
    color: retro.purple,
  },
  bar: {
    flex: 1,
  },
  statValue: {
    ...font.mono,
    width: 36,
    fontSize: 11,
    color: retro.muted,
    textAlign: 'right',
  },
  xpValue: {
    ...font.mono,
    fontSize: 11,
    color: retro.purpleDark,
    textAlign: 'right',
    minWidth: 36,
  },
})
