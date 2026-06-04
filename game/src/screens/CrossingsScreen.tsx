import React, { useEffect, useState } from 'react'
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Crossing } from '../types'
import { CREATURE_COLORS, CREATURE_EMOJIS } from '../utils/creature'
import { loadCrossings } from '../utils/storage'

function CrossingCard({ item }: { item: Crossing }) {
  const color = CREATURE_COLORS[item.creatureType]
  const emoji = CREATURE_EMOJIS[item.creatureType][0]

  const interactionLabel = {
    friendly: '🤝 Amical',
    battle:   '⚔️ Combat',
    gift:     '🎁 Cadeau',
  }[item.interactionType]

  const timeAgo = () => {
    const diff = Date.now() - new Date(item.crossedAt).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `il y a ${days}j`
    if (hours > 0) return `il y a ${hours}h`
    return `il y a ${mins}min`
  }

  return (
    <View style={styles.card}>
      <View style={[styles.avatarCircle, { backgroundColor: color + '22' }]}>
        <Text style={styles.avatarEmoji}>{emoji}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.username}</Text>
        <Text style={styles.cardCreature}>{item.creatureName}</Text>
        <Text style={styles.cardInteraction}>{interactionLabel}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardTime}>{timeAgo()}</Text>
        <Text style={styles.cardXP}>+{item.xpGained} XP</Text>
      </View>
    </View>
  )
}

function EmptyCrossings() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🚶</Text>
      <Text style={styles.emptyTitle}>Aucun croisement</Text>
      <Text style={styles.emptyText}>
        Sors et croise d'autres joueurs pour voir leurs créatures apparaître ici !
      </Text>
    </View>
  )
}

export default function CrossingsScreen() {
  const [crossings, setCrossings] = useState<Crossing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCrossings().then((data) => {
      setCrossings(data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return null

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Croisements</Text>
        <Text style={styles.subtitle}>
          {crossings.length > 0
            ? `${crossings.length} rencontre${crossings.length > 1 ? 's' : ''}`
            : 'Personne croisé pour l\'instant'}
        </Text>
      </View>

      <FlatList
        data={crossings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CrossingCard item={item} />}
        ListEmptyComponent={EmptyCrossings}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 10,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  cardCreature: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  cardInteraction: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardTime: {
    fontSize: 12,
    color: '#999',
  },
  cardXP: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A855F7',
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
})
