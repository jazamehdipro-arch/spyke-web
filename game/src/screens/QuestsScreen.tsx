import React from 'react'
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { DailyQuest, Quest } from '../types'
import { font, retro } from '../styles/retro'
import { Chip, Panel, PixelButton, ScreenTitle, SectionTitle, SmoothBar } from '../components/ui'

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
    <Panel shadow="sm" style={[styles.card, ...(isClaimed ? [styles.cardClaimed] : [])]}>
      <View style={styles.emojiSlot}>
        <Text style={styles.questEmoji}>{quest.emoji}</Text>
      </View>

      <View style={styles.questInfo}>
        <Text style={[styles.questTitle, isClaimed && styles.textFaded]}>
          {quest.title}
        </Text>
        <Text style={[styles.questDesc, isClaimed && styles.textFaded]}>
          {quest.description}
        </Text>

        <View style={styles.progressRow}>
          <SmoothBar value={pct} color={retro.screenDark} height={10} style={styles.bar} />
          <Text style={styles.progressText}>
            {quest.progress}/{quest.target}
          </Text>
        </View>

        <View style={styles.rewardRow}>
          <Text style={styles.rewardLabel}>Récompense :</Text>
          <Chip text={`+${quest.reward.xp} XP`} color={retro.paper2} textColor={retro.blueDark} />
          {quest.reward.itemId ? (
            <Chip text="+ item" color={retro.paper2} textColor={retro.purpleDark} />
          ) : null}
        </View>
      </View>

      {isDone && (
        <PixelButton small title="Récupérer !" onPress={onClaim} color={retro.ink} />
      )}
      {isClaimed && (
        <Text style={styles.claimedBadge}>✓</Text>
      )}
    </Panel>
  )
}

function DailyQuestCard({ quest, onClaim }: { quest: DailyQuest; onClaim: () => void }) {
  const pct = Math.min(quest.progress / quest.target, 1)
  const isDone = quest.completed && !quest.claimed
  const isClaimed = quest.claimed

  return (
    <Panel shadow="sm" style={[styles.card, styles.dailyCard, ...(isClaimed ? [styles.cardClaimed] : [])]}>
      <View style={[styles.emojiSlot, styles.dailyEmojiSlot]}>
        <Text style={styles.questEmoji}>{quest.emoji}</Text>
      </View>

      <View style={styles.questInfo}>
        <View style={styles.dailyTitleRow}>
          <Text style={[styles.questTitle, isClaimed && styles.textFaded]}>
            {quest.title}
          </Text>
          <Chip text="Quotidien" color={retro.gold} textColor={retro.ink} />
        </View>
        <Text style={[styles.questDesc, isClaimed && styles.textFaded]}>
          {quest.description}
        </Text>

        <View style={styles.progressRow}>
          <SmoothBar value={pct} color={retro.gold} height={10} style={styles.bar} />
          <Text style={styles.progressText}>
            {quest.progress}/{quest.target}
          </Text>
        </View>

        <View style={styles.rewardRow}>
          <Chip text={`+${quest.reward.xp} XP`} color={retro.paper2} textColor={retro.goldDark} />
          <Chip text={`🪙 ${quest.reward.coins} pièces`} color={retro.paper2} textColor={retro.goldDark} />
        </View>
      </View>

      {isDone && (
        <PixelButton small title="Réclamer !" onPress={onClaim} color={retro.red} />
      )}
      {isClaimed && (
        <Text style={styles.claimedBadge}>✓</Text>
      )}
    </Panel>
  )
}

export default function QuestsScreen({ quests, onClaimReward, dailyQuests, onClaimDailyReward }: Props) {
  const active = quests.filter((q) => !q.claimed)
  const done = quests.filter((q) => q.claimed)

  const hasDailyQuests = dailyQuests && dailyQuests.length > 0

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTitle
        title="Objectifs"
        subtitle={`${active.filter((q) => q.completed).length} à récupérer • ${done.length} complétés`}
        style={styles.header}
      />

      {hasDailyQuests && (
        <View style={styles.dailySection}>
          <SectionTitle title="Quêtes du jour" color={retro.goldDark} style={styles.sectionTitle} />
          {dailyQuests!.map((dq) => (
            <DailyQuestCard
              key={dq.id}
              quest={dq}
              onClaim={() => onClaimDailyReward?.(dq)}
            />
          ))}
        </View>
      )}

      <SectionTitle title="Objectifs permanents" color={retro.muted} style={styles.permanentTitle} />
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
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  permanentTitle: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
  },
  dailySection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },

  // card
  card: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyCard: {
    borderLeftWidth: 4,
    borderLeftColor: retro.gold,
  },
  cardClaimed: { opacity: 0.45 },

  // emoji recess
  emojiSlot: {
    width: 46,
    height: 46,
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyEmojiSlot: {
    backgroundColor: retro.gold + '33',
  },
  questEmoji: { fontSize: 24 },

  questInfo: { flex: 1, gap: 3 },
  dailyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  questTitle: {
    ...font.title,
    fontSize: 14,
    flexShrink: 1,
  },
  questDesc: { fontSize: 12, color: retro.muted },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  bar: { flex: 1 },
  progressText: {
    ...font.mono,
    fontWeight: '900',
    fontSize: 11,
    color: retro.muted,
    width: 40,
    textAlign: 'right',
  },

  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  rewardLabel: {
    ...font.label,
    fontSize: 9,
    color: retro.muted,
  },

  claimedBadge: {
    ...font.display,
    fontSize: 26,
    color: retro.mintDark,
    paddingHorizontal: 4,
  },
  textFaded: { color: retro.faded },
})

