import React from 'react'
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Creature } from '../types'
import {
  CREATURE_COLORS,
  getCreatureEmoji,
  getMood,
  getMoodEmoji,
} from '../utils/creature'

interface Props {
  creature: Creature
  username: string
  crossingsCount: number
}

export default function ProfileScreen({ creature, username, crossingsCount }: Props) {
  const color = CREATURE_COLORS[creature.type]
  const emoji = getCreatureEmoji(creature.type, creature.stats.level)
  const mood = getMood(creature.stats)
  const moodEmoji = getMoodEmoji(mood)

  const createdAt = new Date(creature.createdAt)
  const daysTogether = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  const stats = [
    { label: 'Niveau',       value: String(creature.stats.level), icon: '⭐' },
    { label: 'Croisements',  value: String(crossingsCount),         icon: '🤝' },
    { label: 'Jours ensemble', value: String(daysTogether),         icon: '📅' },
    { label: 'XP total',     value: String(creature.stats.xp),      icon: '✨' },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profil</Text>

        <View style={[styles.creatureCard, { borderColor: color + '44' }]}>
          <View style={[styles.avatarBg, { backgroundColor: color + '22' }]}>
            <Text style={styles.avatarEmoji}>{emoji}</Text>
          </View>
          <Text style={styles.creatureName}>{creature.name}</Text>
          <Text style={styles.username}>@{username}</Text>
          <View style={[styles.typeBadge, { backgroundColor: color }]}>
            <Text style={styles.typeBadgeText}>
              {moodEmoji} Humeur {mood}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statBoxIcon}>{s.icon}</Text>
              <Text style={styles.statBoxValue}>{s.value}</Text>
              <Text style={styles.statBoxLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos de {creature.name}</Text>
          <Text style={styles.sectionText}>
            Créé le {createdAt.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {'\n'}
            Type : {creature.type.charAt(0).toUpperCase() + creature.type.slice(1)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -1,
  },
  creatureCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 56,
  },
  creatureName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  username: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBoxIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
})
