import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CreatureStats } from '../types'

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
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${value}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.statValue}>{Math.round(value)}</Text>
    </View>
  )
}

interface Props {
  stats: CreatureStats
}

export default function StatsPanel({ stats }: Props) {
  return (
    <View style={styles.container}>
      <StatBar label="Faim"    value={stats.hunger}    color="#FF6B6B" icon="🍖" />
      <StatBar label="Bonheur" value={stats.happiness} color="#FFD93D" icon="⭐" />
      <StatBar label="Énergie" value={stats.energy}    color="#6BCB77" icon="⚡" />

      <View style={styles.xpRow}>
        <Text style={styles.xpLabel}>XP</Text>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                width: `${(stats.xp / stats.xpToNextLevel) * 100}%` as any,
                backgroundColor: '#A855F7',
              },
            ]}
          />
        </View>
        <Text style={styles.statValue}>
          {stats.xp}/{stats.xpToNextLevel}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statIcon: {
    fontSize: 16,
    width: 22,
  },
  statLabel: {
    width: 60,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  xpLabel: {
    width: 22,
    fontSize: 13,
    color: '#A855F7',
    fontWeight: '700',
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    width: 36,
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
})
