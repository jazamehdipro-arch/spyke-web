import React from 'react'
import {
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Creature, CreatureType } from '../types'
import { CREATURE_COLORS, CREATURE_LABELS, getMood, getMoodEmoji } from '../utils/creature'

const SPRITES_BASE: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_f0.png'),
  nemo:  require('../../assets/sprites/nemo_f0.png'),
  sylva: require('../../assets/sprites/sylva_f0.png'),
  zapp:  require('../../assets/sprites/zapp_f0.png'),
}
const SPRITES_E2: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_e2_f1.png'),
  nemo:  require('../../assets/sprites/nemo_e2_f1.png'),
  sylva: require('../../assets/sprites/sylva_e2_f1.png'),
  zapp:  require('../../assets/sprites/zapp_e2_f1.png'),
}
const SPRITES_E3: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_e3_f1.png'),
  nemo:  require('../../assets/sprites/nemo_e3_f1.png'),
  sylva: require('../../assets/sprites/sylva_e3_f1.png'),
  zapp:  require('../../assets/sprites/zapp_e3_f1.png'),
}

function getEvoSprite(type: CreatureType, level: number): ImageSourcePropType {
  if (level >= 20) return SPRITES_E3[type]
  if (level >= 10) return SPRITES_E2[type]
  return SPRITES_BASE[type]
}

interface Props {
  creature: Creature
  username: string
  crossingsCount: number
}

export default function ProfileScreen({ creature, username, crossingsCount }: Props) {
  const color = CREATURE_COLORS[creature.type]
  const mood  = getMood(creature.stats)
  const moodEmoji = getMoodEmoji(mood)
  const { name: typeName } = CREATURE_LABELS[creature.type]

  const createdAt = new Date(creature.createdAt)
  const daysTogether = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  const stats = [
    { label: 'Niveau',         value: String(creature.stats.level), icon: '⭐' },
    { label: 'Croisements',    value: String(crossingsCount),        icon: '🤝' },
    { label: 'Jours ensemble', value: String(daysTogether),          icon: '📅' },
    { label: 'XP total',       value: String(creature.stats.xp),     icon: '✨' },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profil</Text>

        <View style={[styles.creatureCard, { borderColor: color + '44' }]}>
          <View style={[styles.avatarBg, { backgroundColor: color + '22' }]}>
            <Image source={getEvoSprite(creature.type, creature.stats.level)} style={styles.avatarSprite} resizeMode="contain" />
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
            Type : {typeName}
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
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarSprite: {
    width: 88,
    height: 88,
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
