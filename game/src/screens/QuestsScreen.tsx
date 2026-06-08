import React from 'react'
import {
  FlatList,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { DailyQuest, Quest } from '../types'
import { retro, retroShadow } from '../styles/retro'

interface Props {
  quests: Quest[]
  onClaimReward: (quest: Quest) => void
  dailyQuests?: DailyQuest[]
  onClaimDailyReward?: (quest: DailyQuest) => void
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

function DailyQuestCard({ quest, onClaim }: { quest: DailyQuest; onClaim: () => void }) {
  const pct = Math.min(quest.progress / quest.target, 1)
  const isDone = quest.completed && !quest.claimed
  const isClaimed = quest.claimed

  return (
    <View style={[styles.card, styles.dailyCard, isClaimed && styles.cardClaimed]}>
      <Text style={styles.questEmoji}>{quest.emoji}</Text>
      <View style={styles.questInfo}>
        <View style={styles.dailyTitleRow}>
          <Text style={[styles.questTitle, isClaimed && styles.textFaded]}>
            {quest.title}
          </Text>
          <View style={styles.dailyBadge}>
            <Text style={styles.dailyBadgeText}>Quotidien</Text>
          </View>
        </View>
        <Text style={[styles.questDesc, isClaimed && styles.textFaded]}>
          {quest.description}
        </Text>

        <View style={styles.progressRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, styles.dailyBarFill, { width: `${pct * 100}%` as any }]} />
          </View>
          <Text style={styles.progressText}>
            {quest.progress}/{quest.target}
          </Text>
        </View>

        <Text style={styles.dailyRewardText}>
          +{quest.reward.xp} XP · {quest.reward.coins} pièces
        </Text>
      </View>

      {isDone && (
        <TouchableOpacity style={[styles.claimBtn, styles.dailyClaimBtn]} onPress={onClaim}>
          <Text style={styles.claimText}>Réclamer !</Text>
        </TouchableOpacity>
      )}
      {isClaimed && (
        <Text style={styles.claimedBadge}>✓</Text>
      )}
    </View>
  )
}

export default function QuestsScreen({ quests, onClaimReward, dailyQuests, onClaimDailyReward }: Props) {
  const active = quests.filter((q) => !q.claimed)
  const done = quests.filter((q) => q.claimed)

  const hasDailyQuests = dailyQuests && dailyQuests.length > 0

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Objectifs</Text>
        <Text style={styles.subtitle}>
          {active.filter((q) => q.completed).length} à récupérer •{' '}
          {done.length} complétés
        </Text>
      </View>

      {hasDailyQuests && (
        <View style={styles.dailySection}>
          <Text style={styles.sectionLabel}>Quêtes du jour</Text>
          {dailyQuests!.map((dq) => (
            <DailyQuestCard
              key={dq.id}
              quest={dq}
              onClaim={() => onClaimDailyReward?.(dq)}
            />
          ))}
        </View>
      )}

      <Text style={styles.sectionLabel2}>Objectifs permanents</Text>
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
  safe: { flex: 1, backgroundColor: retro.paper },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: retro.ink,
    letterSpacing: 0,
    fontFamily: 'monospace',
  },
  subtitle: { fontSize: 14, color: retro.muted, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: retro.red,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLabel2: {
    fontSize: 12,
    fontWeight: '900',
    color: retro.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 4,
    marginTop: 8,
  },
  dailySection: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 10,
  },
  card: {
    backgroundColor: retro.white,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: retro.line,
    ...retroShadow,
    elevation: 2,
  },
  dailyCard: {
    borderLeftWidth: 3,
    borderLeftColor: retro.gold,
  },
  cardClaimed: { opacity: 0.5 },
  questEmoji: { fontSize: 30, width: 40 },
  questInfo: { flex: 1, gap: 3 },
  dailyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questTitle: { fontSize: 15, fontWeight: '900', color: retro.ink },
  questDesc: { fontSize: 12, color: retro.muted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  barBg: {
    flex: 1, height: 8, backgroundColor: retro.paper2,
    borderRadius: 0, overflow: 'hidden', borderWidth: 1, borderColor: retro.line,
  },
  barFill: {
    height: '100%', backgroundColor: retro.screenDark, borderRadius: 0,
  },
  dailyBarFill: {
    backgroundColor: retro.gold,
  },
  progressText: { fontSize: 11, color: retro.muted, width: 36, fontFamily: 'monospace', fontWeight: '900' },
  rewardText: { fontSize: 11, color: retro.blue, fontWeight: '900', marginTop: 2 },
  dailyRewardText: { fontSize: 11, color: retro.red, fontWeight: '900', marginTop: 2 },
  dailyBadge: {
    backgroundColor: retro.paper2,
    borderRadius: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dailyBadgeText: { fontSize: 9, fontWeight: '900', color: retro.red, fontFamily: 'monospace' },
  claimBtn: {
    backgroundColor: retro.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: retro.line,
  },
  dailyClaimBtn: {
    backgroundColor: retro.red,
  },
  claimText: { color: retro.white, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  claimedBadge: { fontSize: 20, color: retro.mint, fontWeight: '900' },
  textFaded: { color: retro.muted },
})
