import React, { useEffect, useState } from 'react'
import {
  FlatList,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Creature, Crossing, CreatureType } from '../types'
import { CREATURE_COLORS } from '../utils/creature'
import { loadCrossings } from '../utils/storage'
import CombatScreen, { CombatOpponent } from './CombatScreen'

const CROSSING_SPRITES: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_f0.png'),
  nemo:  require('../../assets/sprites/nemo_f0.png'),
  sylva: require('../../assets/sprites/sylva_f0.png'),
  zapp:  require('../../assets/sprites/zapp_f0.png'),
}

const BOT_OPPONENTS: CombatOpponent[] = [
  { username: 'IzunaBot',    creatureName: 'Pyra',   creatureType: 'ignis', level: 3  },
  { username: 'OcéanBot',    creatureName: 'Deeps',  creatureType: 'nemo',  level: 5  },
  { username: 'ForêtBot',    creatureName: 'Mossy',  creatureType: 'sylva', level: 4  },
  { username: 'TempêteBot',  creatureName: 'Bolt',   creatureType: 'zapp',  level: 6  },
  { username: 'IzunaMaster', creatureName: 'Vulcan', creatureType: 'ignis', level: 12 },
  { username: 'OcéanMaster', creatureName: 'Tidal',  creatureType: 'nemo',  level: 15 },
]

interface Props {
  player: Creature
  onCombatEnd: (won: boolean, xpGained: number) => void
}

function CrossingCard({ item, onChallenge }: { item: Crossing; onChallenge: () => void }) {
  const color  = CREATURE_COLORS[item.creatureType]
  const sprite = CROSSING_SPRITES[item.creatureType]

  const interactionLabel = { friendly: '🤝 Amical', battle: '⚔️ Combat', gift: '🎁 Cadeau' }[item.interactionType]

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
        <Image source={sprite} style={styles.avatarSprite} resizeMode="contain" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.username}</Text>
        <Text style={styles.cardCreature}>{item.creatureName}</Text>
        <Text style={styles.cardInteraction}>{interactionLabel}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardTime}>{timeAgo()}</Text>
        <TouchableOpacity style={[styles.challengeBtn, { backgroundColor: color }]} onPress={onChallenge}>
          <Text style={styles.challengeText}>⚔️ Défier</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function BotCard({ bot, onChallenge }: { bot: CombatOpponent; onChallenge: () => void }) {
  const color  = CREATURE_COLORS[bot.creatureType]
  const sprite = CROSSING_SPRITES[bot.creatureType]
  return (
    <View style={[styles.card, styles.botCard]}>
      <View style={[styles.avatarCircle, { backgroundColor: color + '22' }]}>
        <Image source={sprite} style={styles.avatarSprite} resizeMode="contain" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{bot.username}</Text>
        <Text style={styles.cardCreature}>{bot.creatureName}</Text>
        <Text style={styles.cardInteraction}>🤖 Bot entraînement · Lv {bot.level}</Text>
      </View>
      <TouchableOpacity style={[styles.challengeBtn, { backgroundColor: color }]} onPress={onChallenge}>
        <Text style={styles.challengeText}>⚔️ Défier</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function CrossingsScreen({ player, onCombatEnd }: Props) {
  const [crossings, setCrossings] = useState<Crossing[]>([])
  const [loading, setLoading]     = useState(true)
  const [combat, setCombat]       = useState<CombatOpponent | null>(null)

  useEffect(() => {
    loadCrossings().then((data) => {
      setCrossings(data ?? [])
      setLoading(false)
    })
  }, [])

  const startCombat = (opponent: CombatOpponent) => setCombat(opponent)

  const handleCombatEnd = (won: boolean, xpGained: number) => {
    setCombat(null)
    onCombatEnd(won, xpGained)
  }

  if (combat) {
    return (
      <CombatScreen
        player={player}
        opponent={combat}
        onFinish={handleCombatEnd}
      />
    )
  }

  if (loading) return null

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Croisements</Text>
        <Text style={styles.subtitle}>
          {crossings.length > 0
            ? `${crossings.length} rencontre${crossings.length > 1 ? 's' : ''}`
            : 'Bots d\'entraînement disponibles'}
        </Text>
      </View>

      <FlatList
        data={crossings.length > 0 ? [] : BOT_OPPONENTS}
        keyExtractor={(_, i) => `bot-${i}`}
        renderItem={({ item }) => (
          <BotCard bot={item as CombatOpponent} onChallenge={() => startCombat(item as CombatOpponent)} />
        )}
        ListHeaderComponent={
          crossings.length > 0 ? (
            <>
              {crossings.map((c) => (
                <CrossingCard
                  key={c.id}
                  item={c}
                  onChallenge={() => startCombat({
                    username: c.username,
                    creatureName: c.creatureName,
                    creatureType: c.creatureType,
                    level: Math.max(1, c.xpGained > 0 ? 5 : 1),
                  })}
                />
              ))}
            </>
          ) : (
            <View style={styles.botHeader}>
              <Text style={styles.botHeaderText}>Entraîne-toi contre des bots en attendant tes vrais croisements !</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7FF' },
  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 10, flexGrow: 1 },
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
  botCard: { borderWidth: 1, borderColor: '#f0f0f0' },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarSprite: { width: 40, height: 40 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  cardCreature: { fontSize: 13, color: '#666', marginTop: 1 },
  cardInteraction: { fontSize: 12, color: '#999', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardTime: { fontSize: 12, color: '#999' },
  challengeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  challengeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  botHeader: { paddingVertical: 12 },
  botHeaderText: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },
})
