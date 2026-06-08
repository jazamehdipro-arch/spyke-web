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
import { retro, retroShadow } from '../styles/retro'

const SPRITES_BASE: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/D6038947-5173-4D54-85E3-4007B920C40D.png'),
  nemo:  require('../../assets/C06BC406-9648-4173-8C33-3F80A3902A64.png'),
  sylva: require('../../assets/9B470F66-3CF9-41D8-9965-E7EBB3F50C68.png'),
  zapp:  require('../../assets/883F1EC7-AEFA-412B-8E0C-72131D9D4F14.png'),
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
    backgroundColor: retro.paper,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: retro.ink,
    letterSpacing: 0,
    fontFamily: 'monospace',
  },
  creatureCard: {
    backgroundColor: retro.white,
    borderRadius: 4,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    ...retroShadow,
    elevation: 3,
  },
  avatarBg: {
    width: 110,
    height: 110,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: retro.line,
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
    fontWeight: '900',
    color: retro.ink,
    fontFamily: 'monospace',
  },
  username: {
    fontSize: 14,
    color: retro.muted,
    marginTop: 2,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: retro.line,
  },
  typeBadgeText: {
    color: retro.white,
    fontWeight: '900',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '47%',
    backgroundColor: retro.white,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: retro.line,
    ...retroShadow,
    elevation: 2,
  },
  statBoxIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '900',
    color: retro.ink,
    fontFamily: 'monospace',
  },
  statBoxLabel: {
    fontSize: 12,
    color: retro.muted,
    marginTop: 2,
  },
  section: {
    backgroundColor: retro.white,
    borderRadius: 4,
    padding: 16,
    borderWidth: 2,
    borderColor: retro.line,
    ...retroShadow,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: retro.ink,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: retro.muted,
    lineHeight: 22,
  },
})
