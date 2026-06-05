import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CrossingsScreen from './src/screens/CrossingsScreen'
import HomeScreen from './src/screens/HomeScreen'
import InventoryScreen from './src/screens/InventoryScreen'
import JournalScreen from './src/screens/JournalScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import QuestsScreen from './src/screens/QuestsScreen'
import { Creature, Crossing, CreatureType, DailyQuest, GameEvent, InventoryItem, JournalEntry, Quest } from './src/types'
import { addXP, createNewCreature, decayStats, getMood } from './src/utils/creature'
import { ITEM_CATALOG, getStarterInventory } from './src/utils/items'
import { QUEST_DEFINITIONS } from './src/utils/quests'
import { generateDailyQuests, isDailyQuestStale } from './src/utils/dailyQuests'
import {
  addItemToInventory,
  addJournalEntry,
  loadCreature,
  loadCrossings,
  loadDailyQuests,
  loadEvents,
  loadInventory,
  loadJournal,
  loadPlayer,
  loadQuests,
  loadStreak,
  saveCreature,
  saveDailyQuests,
  saveInventory,
  saveJournal,
  savePlayer,
  saveQuests,
  saveStreak,
} from './src/utils/storage'

type Tab = 'home' | 'inventory' | 'quests' | 'crossings' | 'profile'

interface GameState {
  creature: Creature
  username: string
  crossings: Crossing[]
  inventory: InventoryItem[]
  events: GameEvent[]
  quests: Quest[]
  journal: JournalEntry[]
  dailyQuests: DailyQuest[]
  coins: number
  streak: number
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState<GameState | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [questBadge, setQuestBadge] = useState(0)

  useEffect(() => {
    const init = async () => {
      const today = new Date().toISOString().slice(0, 10)

      const [
        savedCreature,
        savedPlayer,
        savedCrossings,
        savedInventory,
        savedEvents,
        savedQuests,
        savedJournal,
        savedDailyQuests,
        savedStreakData,
      ] = await Promise.all([
        loadCreature(),
        loadPlayer(),
        loadCrossings(),
        loadInventory(),
        loadEvents(),
        loadQuests(),
        loadJournal(),
        loadDailyQuests(),
        loadStreak(),
      ])

      if (savedCreature && savedPlayer) {
        const decayed = { ...savedCreature, stats: decayStats(savedCreature) }
        const withMood = { ...decayed, mood: getMood(decayed.stats) }

        // Resolve daily quests (refresh if stale)
        let dailyQuests: DailyQuest[]
        if (!savedDailyQuests || isDailyQuestStale(savedDailyQuests)) {
          dailyQuests = generateDailyQuests()
          await saveDailyQuests(dailyQuests)
        } else {
          dailyQuests = savedDailyQuests
        }

        // Resolve streak
        let streak = savedStreakData?.streak ?? 0
        const lastLoginDate = savedStreakData?.lastLoginDate ?? ''

        if (lastLoginDate !== today) {
          // Check if yesterday
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().slice(0, 10)

          if (lastLoginDate === yesterdayStr) {
            streak += 1
          } else if (lastLoginDate !== today) {
            streak = 1
          }
          await saveStreak(streak, today)
        }

        // Coins from player data or default 0
        const coins = savedPlayer.coins ?? 0

        setState({
          creature: withMood,
          username: savedPlayer.username,
          crossings: savedCrossings ?? [],
          inventory: savedInventory ?? getStarterInventory(),
          events: savedEvents ?? [],
          quests: savedQuests ?? QUEST_DEFINITIONS,
          journal: savedJournal ?? [],
          dailyQuests,
          coins,
          streak,
        })
      }
      setReady(true)
    }
    init()
  }, [])

  useEffect(() => {
    if (!state) return
    const claimable = state.quests.filter((q) => q.completed && !q.claimed).length
    const dailyClaimable = state.dailyQuests.filter((q) => q.completed && !q.claimed).length
    setQuestBadge(claimable + dailyClaimable)
  }, [state?.quests, state?.dailyQuests])

  const handleUpdate = useCallback(
    (
      creature: Creature,
      inventory?: InventoryItem[],
      events?: GameEvent[],
      quests?: Quest[],
      journal?: JournalEntry[],
      dailyQuests?: DailyQuest[],
      coins?: number
    ) => {
      setState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          creature,
          inventory: inventory ?? prev.inventory,
          events: events ?? prev.events,
          quests: quests ?? prev.quests,
          journal: journal ?? prev.journal,
          dailyQuests: dailyQuests ?? prev.dailyQuests,
          coins: coins ?? prev.coins,
        }
      })
    },
    []
  )

  const handleOnboarding = useCallback(async (username: string, type: CreatureType) => {
    const creature = createNewCreature(type)
    const inv = getStarterInventory()
    const j = addJournalEntry([], `${creature.name} est né ! Bienvenue dans le monde !`, '🎉')
    const today = new Date().toISOString().slice(0, 10)
    const dailyQuests = generateDailyQuests()

    await Promise.all([
      saveCreature(creature),
      savePlayer({ id: username, username }),
      saveInventory(inv),
      saveJournal(j),
      saveQuests(QUEST_DEFINITIONS),
      saveDailyQuests(dailyQuests),
      saveStreak(1, today),
    ])

    setState({
      creature,
      username,
      crossings: [],
      inventory: inv,
      events: [],
      quests: QUEST_DEFINITIONS,
      journal: j,
      dailyQuests,
      coins: 0,
      streak: 1,
    })
  }, [])

  const handleUseItem = useCallback(async (item: InventoryItem) => {
    if (!state) return
    let { creature, inventory, quests, journal } = state

    let updatedCreature: Creature = {
      ...creature,
      stats: {
        ...creature.stats,
        hunger:    Math.min(100, creature.stats.hunger    + (item.effect.hunger    ?? 0)),
        happiness: Math.min(100, creature.stats.happiness + (item.effect.happiness ?? 0)),
        energy:    Math.min(100, creature.stats.energy    + (item.effect.energy    ?? 0)),
        isSick:    item.effect.healsSickness ? false : creature.stats.isSick,
      },
    }
    if (item.effect.xp) {
      updatedCreature = addXP(updatedCreature, item.effect.xp)
    }
    updatedCreature = { ...updatedCreature, mood: getMood(updatedCreature.stats) }

    const newInventory = inventory
      .map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
      .filter((i) => i.quantity > 0)

    const newJournal = addJournalEntry(journal, `${creature.name} a utilisé ${item.emoji} ${item.name}.`, item.emoji)

    await Promise.all([saveCreature(updatedCreature), saveInventory(newInventory), saveJournal(newJournal)])
    handleUpdate(updatedCreature, newInventory, state.events, quests, newJournal)
  }, [state, handleUpdate])

  const handleClaimReward = useCallback(async (quest: Quest) => {
    if (!state) return
    let { creature, inventory, quests, journal } = state

    const updatedQuests = quests.map((q) => q.id === quest.id ? { ...q, claimed: true } : q)
    let updatedCreature = addXP(creature, quest.reward.xp)
    updatedCreature = { ...updatedCreature, mood: getMood(updatedCreature.stats) }

    let newInventory = inventory
    if (quest.reward.itemId) {
      const item = ITEM_CATALOG[quest.reward.itemId]
      if (item) newInventory = addItemToInventory(inventory, { ...item, quantity: 1 })
    }

    const newJournal = addJournalEntry(journal, `Objectif "${quest.title}" complété ! +${quest.reward.xp} XP`, '🏆')

    await Promise.all([saveCreature(updatedCreature), saveInventory(newInventory), saveQuests(updatedQuests), saveJournal(newJournal)])
    handleUpdate(updatedCreature, newInventory, state.events, updatedQuests, newJournal)
  }, [state, handleUpdate])

  const handleClaimDailyReward = useCallback(async (quest: DailyQuest) => {
    if (!state) return
    const { creature, dailyQuests, journal } = state

    const updatedDailyQuests = dailyQuests.map((q) =>
      q.id === quest.id ? { ...q, claimed: true } : q
    )

    let updatedCreature = addXP(creature, quest.reward.xp)
    updatedCreature = { ...updatedCreature, mood: getMood(updatedCreature.stats) }

    const newCoins = state.coins + quest.reward.coins
    const newJournal = addJournalEntry(
      journal,
      `Quête du jour "${quest.title}" complétée ! +${quest.reward.xp} XP +${quest.reward.coins} pièces`,
      quest.emoji
    )

    await Promise.all([
      saveCreature(updatedCreature),
      saveDailyQuests(updatedDailyQuests),
      saveJournal(newJournal),
      savePlayer({ id: state.username, username: state.username, coins: newCoins }),
    ])

    handleUpdate(updatedCreature, state.inventory, state.events, state.quests, newJournal, updatedDailyQuests, newCoins)
  }, [state, handleUpdate])

  if (!ready) return null
  if (!state) return <OnboardingScreen onComplete={handleOnboarding} />

  const tabs: { key: Tab; icon: string; label: string; badge?: number }[] = [
    { key: 'home',      icon: '🏠', label: 'Accueil' },
    { key: 'inventory', icon: '🎒', label: 'Sac' },
    { key: 'quests',    icon: '📋', label: 'Quêtes', badge: questBadge },
    { key: 'crossings', icon: '🤝', label: 'Croises' },
    { key: 'profile',   icon: '👤', label: 'Profil' },
  ]

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            creature={state.creature}
            inventory={state.inventory}
            events={state.events}
            quests={state.quests}
            journal={state.journal}
            streak={state.streak}
            onUpdate={handleUpdate}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryScreen
            inventory={state.inventory}
            creature={state.creature}
            onUseItem={handleUseItem}
          />
        )}
        {activeTab === 'quests' && (
          <QuestsScreen
            quests={state.quests}
            onClaimReward={handleClaimReward}
            dailyQuests={state.dailyQuests}
            onClaimDailyReward={handleClaimDailyReward}
          />
        )}
        {activeTab === 'crossings' && (
          <CrossingsScreen
            player={state.creature}
            onCombatEnd={async (won, xpGained) => {
              let updated = addXP(state.creature, xpGained)
              updated = { ...updated, mood: getMood(updated.stats) }
              await saveCreature(updated)
              handleUpdate(updated)
            }}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            creature={state.creature}
            username={state.username}
            crossingsCount={state.crossings.length}
          />
        )}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              {!!tab.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F7FF' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrapper: { position: 'relative' },
  tabIcon: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  tabLabel: { fontSize: 10, color: '#bbb', fontWeight: '500' },
  tabLabelActive: { color: '#1a1a2e', fontWeight: '700' },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1a1a2e' },
})
