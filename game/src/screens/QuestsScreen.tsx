import React from 'react'
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Quest } from '../types'

interface Props {
  quests: Quest[]
  onClaimReward: (quest: Quest) => void
}

function QuestCard({ quest, onClaim }: { quest: Quest; onClaim: () => void }) {
  const pct = Math.min(quest.progress / quest.target, 1)
  const isDone = quest.completed && !quest.claimed
  const isClaimed = quest.claimed

  return (
    <View style={[styles.card, isClaimed && styles.cardClaimed]}>
      <Text style={styles.questEmoji}>{quest.emoji}</Text>
      <View style={styles.questInfo}>
        <Text style={[styles.questTitle, isClaimed && styles.textFaded]}>
          {quest.title}
        </Text>
        <Text style={[styles.questDesc, isClaimed && styles.textFaded]}>
          {quest.description}
        </Text>

        <View style={styles.progressRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct * 100}%` as any }]} />
          </View>
          <Text style={styles.progressText}>
            {quest.progress}/{quest.target}
          </Text>
        </View>

        <Text style={styles.rewardText}>
          Récompense : +{quest.reward.xp} XP
          {quest.reward.itemId ? ' + item' : ''}
        </Text>
      </View>

      {isDone && (
        <TouchableOpacity style={styles.claimBtn} onPress={onClaim}>
          <Text style={styles.claimText}>Récupérer !</Text>
        </TouchableOpacity>
      )}
      {isClaimed && (
        <Text style={styles.claimedBadge}>✓</Text>
      )}
    </View>
  )
}

export default function QuestsScreen({ quests, onClaimReward }: Props) {
  const active = quests.filter((q) => !q.claimed)
  const done = quests.filter((q) => q.claimed)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Objectifs</Text>
        <Text style={styles.subtitle}>
          {active.filter((q) => q.completed).length} à récupérer •{' '}
          {done.length} complétés
        </Text>
      </View>

      <FlatList
        data={[...active, ...done]}
        keyExtractor={(q) => q.id}
        renderItem={({ item }) => (
          <QuestCard quest={item} onClaim={() => onClaimReward(item)} />
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7FF' },
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
  subtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 10,
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
  cardClaimed: { opacity: 0.5 },
  questEmoji: { fontSize: 30, width: 40 },
  questInfo: { flex: 1, gap: 3 },
  questTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  questDesc: { fontSize: 12, color: '#777' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  barBg: {
    flex: 1, height: 7, backgroundColor: '#f0f0f0',
    borderRadius: 4, overflow: 'hidden',
  },
  barFill: {
    height: '100%', backgroundColor: '#A855F7', borderRadius: 4,
  },
  progressText: { fontSize: 11, color: '#999', width: 36 },
  rewardText: { fontSize: 11, color: '#A855F7', fontWeight: '600', marginTop: 2 },
  claimBtn: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  claimText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  claimedBadge: { fontSize: 20, color: '#6BCB77', fontWeight: '700' },
  textFaded: { color: '#aaa' },
})
