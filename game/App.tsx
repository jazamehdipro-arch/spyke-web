import React, { useCallback, useEffect, useState } from 'react'
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CombatHubScreen from './src/screens/CombatHubScreen'
import CrossingsScreen from './src/screens/CrossingsScreen'
import HomeScreen from './src/screens/HomeScreen'
import InventoryScreen from './src/screens/InventoryScreen'
import JournalScreen from './src/screens/JournalScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import QuestsScreen from './src/screens/QuestsScreen'
import CombatScreen from './src/screens/CombatScreen'
import { Creature, Crossing, CreatureType, DailyQuest, GameEvent, InventoryItem, JournalEntry, Quest } from './src/types'
import { addXP, addXPWithConversion, applyOfflineCareDecay, createNewCreature, getMood } from './src/utils/creature'
import { ITEM_CATALOG, drawMysteryBox, getStarterInventory } from './src/utils/items'
import { QUEST_DEFINITIONS } from './src/utils/quests'
import { retro } from './src/styles/retro'
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
  loadTutorialDone,
  saveCreature,
  saveDailyQuests,
  saveInventory,
  saveJournal,
  savePlayer,
  saveQuests,
  saveStreak,
  saveTutorialDone,
} from './src/utils/storage'

type Tab = 'home' | 'inventory' | 'boutique' | 'combat' | 'quests' | 'crossings' | 'profile'

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

function applyXPReward(creature: Creature, amount: number): { creature: Creature; coins: number } {
  const result = addXPWithConversion(creature, amount)
  return {
    creature: { ...result.creature, mood: getMood(result.creature.stats) },
    coins: result.convertedCoins,
  }
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState<GameState | null>(null)
  // Tutorial flow: null = loading, 'home' = menu coach-marks, 'combat' = tutorial fight, 'done' = normal play
  const [tutorialPhase, setTutorialPhase] = useState<'home' | 'combat' | 'done' | null>(null)
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
        savedTutorialDone,
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
        loadTutorialDone(),
      ])

      if (savedCreature && savedPlayer) {
        const withMood = addXP(applyOfflineCareDecay(savedCreature), 0)

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

        await saveCreature(withMood)

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
        // Existing users who never saw tutorial flag default to done
        setTutorialPhase((savedTutorialDone ?? true) ? 'done' : 'home')
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
        if (coins !== undefined) {
          void savePlayer({ id: prev.username, username: prev.username, coins })
        }
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

  const handleOnboarding = useCallback(async (username: string, type: CreatureType, creatureName: string) => {
    const baseCreature = createNewCreature(type)
    const creature = { ...baseCreature, name: creatureName }
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
      saveTutorialDone(false),
    ])

    setActiveTab('home')
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
    setTutorialPhase('home')
  }, [])

  const handleUseItem = useCallback(async (item: InventoryItem) => {
    if (!state) return
    let { creature, inventory, quests, journal, coins } = state

    // mystery box: draw random reward
    if (item.id === 'mystery_box') {
      const reward = drawMysteryBox(creature.type, creature.ownedSkins ?? [])
      let newInventory = inventory
        .map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter((i) => i.quantity > 0)
      if (reward.itemId) {
        const rewardDef = ITEM_CATALOG[reward.itemId]
        if (rewardDef) newInventory = addItemToInventory(newInventory, { ...rewardDef, quantity: 1 })
      }
      let convertedCoins = 0
      let updatedCreature = creature
      if (reward.xp) {
        const xpReward = applyXPReward(creature, reward.xp)
        updatedCreature = xpReward.creature
        convertedCoins = xpReward.coins
      }
      if (reward.skin) {
        const ownedSkins = [...(updatedCreature.ownedSkins ?? []), reward.skin]
        updatedCreature = { ...updatedCreature, ownedSkins }
      }
      updatedCreature = { ...updatedCreature, mood: getMood(updatedCreature.stats) }
      const newCoins = coins + reward.coins + convertedCoins
      const prize    = reward.itemId ? ITEM_CATALOG[reward.itemId] : null
      let msg: string
      if (reward.skin) {
        msg = `📦 Boîte Mystère : ✨ Skin "${reward.skin}" débloqué !${reward.coins > 0 ? ` + 💰${reward.coins}` : ''}`
      } else if (prize) {
        msg = `📦 Boîte Mystère : ${prize.emoji} ${prize.name}${reward.coins > 0 ? ` + 💰${reward.coins}` : ''}${reward.xp > 0 ? ` + ✨${reward.xp} XP` : ''} !`
      } else {
        msg = `📦 Boîte Mystère : 💰 ${reward.coins} pièces !`
      }
      const newJournal = addJournalEntry(journal, msg, '📦')
      await Promise.all([saveCreature(updatedCreature), saveInventory(newInventory), saveJournal(newJournal), savePlayer({ id: state.username, username: state.username, coins: newCoins })])
      handleUpdate(updatedCreature, newInventory, state.events, quests, newJournal, undefined, newCoins)
      return
    }

    const hungerBonus = creature.stats.hunger < 30 && (item.effect.hunger ?? 0) > 0 ? 5 : 0
    const now = new Date().toISOString()
    let updatedCreature: Creature = {
      ...creature,
      lastFed: (item.effect.hunger ?? 0) > 0 ? now : creature.lastFed,
      stats: {
        ...creature.stats,
        hunger:    Math.min(100, creature.stats.hunger    + (item.effect.hunger    ?? 0)),
        happiness: Math.min(100, creature.stats.happiness + (item.effect.happiness ?? 0) + hungerBonus),
        energy:    Math.min(100, creature.stats.energy    + (item.effect.energy    ?? 0)),
        isSick:    item.effect.healsSickness ? false : creature.stats.isSick,
      },
    }
    let convertedCoins = 0
    if (item.effect.xp) {
      const xpReward = applyXPReward(updatedCreature, item.effect.xp)
      updatedCreature = xpReward.creature
      convertedCoins = xpReward.coins
    }
    updatedCreature = { ...updatedCreature, mood: getMood(updatedCreature.stats) }

    const newInventory = inventory
      .map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
      .filter((i) => i.quantity > 0)

    const newJournal = addJournalEntry(journal, `${creature.name} a utilisé ${item.emoji} ${item.name}.`, item.emoji)

    const finalCoins = coins + convertedCoins
    await Promise.all([saveCreature(updatedCreature), saveInventory(newInventory), saveJournal(newJournal), savePlayer({ id: state.username, username: state.username, coins: finalCoins })])
    handleUpdate(updatedCreature, newInventory, state.events, quests, newJournal, undefined, finalCoins)
  }, [state, handleUpdate])

  const handleSkinChange = useCallback(async (skin: string | null) => {
    if (!state) return
    const updated = { ...state.creature, skin: skin ?? undefined }
    await saveCreature(updated)
    handleUpdate(updated)
  }, [state, handleUpdate])

  const handleBuyItem = useCallback(async (itemId: string, price: number) => {
    if (!state) return
    if (state.coins < price) return
    const def = ITEM_CATALOG[itemId]
    if (!def) return
    const newCoins    = state.coins - price
    const newInventory = addItemToInventory(state.inventory, { ...def, quantity: 1 })
    const newJournal  = addJournalEntry(state.journal, `Acheté ${def.emoji} ${def.name} pour 💰${price}.`, '🛍️')
    await Promise.all([saveInventory(newInventory), saveJournal(newJournal), savePlayer({ id: state.username, username: state.username, coins: newCoins })])
    handleUpdate(state.creature, newInventory, state.events, state.quests, newJournal, undefined, newCoins)
  }, [state, handleUpdate])

  const handleClaimReward = useCallback(async (quest: Quest) => {
    if (!state) return
    let { creature, inventory, quests, journal } = state

    const updatedQuests = quests.map((q) => q.id === quest.id ? { ...q, claimed: true } : q)
    const xpReward = applyXPReward(creature, quest.reward.xp)
    let updatedCreature = xpReward.creature

    let newInventory = inventory
    if (quest.reward.itemId) {
      const item = ITEM_CATALOG[quest.reward.itemId]
      if (item) newInventory = addItemToInventory(inventory, { ...item, quantity: 1 })
    }

    const newCoins = state.coins + xpReward.coins
    const newJournal = addJournalEntry(journal, `Objectif "${quest.title}" complete ! +${quest.reward.xp} XP${xpReward.coins > 0 ? ` -> ${xpReward.coins} pieces` : ''}`, '🏆')

    await Promise.all([saveCreature(updatedCreature), saveInventory(newInventory), saveQuests(updatedQuests), saveJournal(newJournal), savePlayer({ id: state.username, username: state.username, coins: newCoins })])
    handleUpdate(updatedCreature, newInventory, state.events, updatedQuests, newJournal, undefined, newCoins)
  }, [state, handleUpdate])

  const handleClaimDailyReward = useCallback(async (quest: DailyQuest) => {
    if (!state) return
    const { creature, dailyQuests, journal } = state

    const updatedDailyQuests = dailyQuests.map((q) =>
      q.id === quest.id ? { ...q, claimed: true } : q
    )

    const xpReward = applyXPReward(creature, quest.reward.xp)
    let updatedCreature = xpReward.creature

    const newCoins = state.coins + quest.reward.coins + xpReward.coins
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

  // Tutorial combat — full-screen training fight with in-combat coach bubbles
  if (tutorialPhase === 'combat') {
    return (
      <CombatScreen
        player={state.creature}
        tutorialMode
        opponent={{
          username: 'DresseurRival',
          creatureName: 'Flick',
          creatureType: 'nemo',
          level: Math.max(1, state.creature.stats.level),
        }}
        onFinish={async () => {
          await saveTutorialDone(true)
          setTutorialPhase('done')
        }}
      />
    )
  }

  const tabs: { key: Tab; icon: string; label: string; badge?: number }[] = [
    { key: 'home',      icon: '🏠', label: 'Accueil' },
    { key: 'combat',    icon: '⚔️', label: 'Combat'  },
    { key: 'quests',    icon: '📋', label: 'Quêtes', badge: questBadge },
    { key: 'crossings', icon: '🤝', label: 'Croises' },
    { key: 'profile',   icon: '👤', label: 'Profil'  },
  ]

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            creature={state.creature}
            inventory={state.inventory}
            events={state.events}
            quests={state.quests}
            journal={state.journal}
            streak={state.streak}
            coins={state.coins}
            onUpdate={handleUpdate}
            onSkinChange={handleSkinChange}
            onOpenInventory={() => setActiveTab('inventory')}
            onOpenBoutique={() => setActiveTab('boutique')}
            onOpenCrossings={() => setActiveTab('crossings')}
            tutorialActive={tutorialPhase === 'home'}
            onTutorialDone={() => setTutorialPhase('combat')}
            onResetTutorial={async () => {
              await saveTutorialDone(false)
              setActiveTab('home')
              setTutorialPhase('home')
            }}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryScreen
            inventory={state.inventory}
            creature={state.creature}
            coins={state.coins}
            onUseItem={handleUseItem}
            onBuyItem={handleBuyItem}
            mode="inventory"
          />
        )}
        {activeTab === 'boutique' && (
          <InventoryScreen
            inventory={state.inventory}
            creature={state.creature}
            coins={state.coins}
            onUseItem={handleUseItem}
            onBuyItem={handleBuyItem}
            mode="shop"
          />
        )}
        {activeTab === 'combat' && (
          <CombatHubScreen
            player={state.creature}
            username={state.username}
            onCombatEnd={async (won, xpGained, coinsGained) => {
              const xpReward = applyXPReward(state.creature, xpGained)
              let updated = xpReward.creature
              updated = {
                ...updated,
                lastPlayed: new Date().toISOString(),
                stats: {
                  ...updated.stats,
                  energy: Math.max(0, updated.stats.energy - 18),
                  happiness: Math.min(100, updated.stats.happiness + (won ? 10 : 0)),
                },
              }
              updated = { ...updated, mood: getMood(updated.stats) }
              await saveCreature(updated)
              let newInventory = state.inventory
              const coinsEarned = coinsGained !== undefined
                ? coinsGained
                : won ? 15 + Math.floor(Math.random() * 11) : 3 + Math.floor(Math.random() * 4)
              const newCoins = state.coins + coinsEarned + xpReward.coins
              if (won && coinsGained === undefined) {
                newInventory = addItemToInventory(state.inventory, { ...ITEM_CATALOG.croquettes, quantity: 2 })
                if (Math.random() < 0.25) {
                  newInventory = addItemToInventory(newInventory, { ...ITEM_CATALOG.steak, quantity: 1 })
                }
                await saveInventory(newInventory)
              }
              await savePlayer({ id: state.username, username: state.username, coins: newCoins })
              handleUpdate(updated, newInventory, undefined, undefined, undefined, undefined, newCoins)
            }}
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
            username={state.username}
            onCombatEnd={async (won, xpGained, coinsGained) => {
              const xpReward = applyXPReward(state.creature, xpGained)
              let updated = xpReward.creature
              updated = {
                ...updated,
                lastPlayed: new Date().toISOString(),
                stats: {
                  ...updated.stats,
                  energy: Math.max(0, updated.stats.energy - 18),
                  happiness: Math.min(100, updated.stats.happiness + (won ? 10 : 0)),
                },
              }
              updated = { ...updated, mood: getMood(updated.stats) }
              await saveCreature(updated)
              let newInventory = state.inventory
              // adventure mode passes explicit coinsGained; regular combat uses random
              const coinsEarned = coinsGained !== undefined
                ? coinsGained
                : won
                  ? 15 + Math.floor(Math.random() * 11)
                  : 3 + Math.floor(Math.random() * 4)
              const newCoins = state.coins + coinsEarned + xpReward.coins
              if (won && coinsGained === undefined) {
                // item drops only for non-adventure combat
                newInventory = addItemToInventory(state.inventory, { ...ITEM_CATALOG.croquettes, quantity: 2 })
                if (Math.random() < 0.25) {
                  newInventory = addItemToInventory(newInventory, { ...ITEM_CATALOG.steak, quantity: 1 })
                }
                await saveInventory(newInventory)
              }
              await savePlayer({ id: state.username, username: state.username, coins: newCoins })
              handleUpdate(updated, newInventory, undefined, undefined, undefined, undefined, newCoins)
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
        {tabs.map((tab) => {
          const active = activeTab === tab.key
          const locked = tutorialPhase === 'home'
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, locked && { opacity: 0.4 }]}
              onPress={() => { if (!locked) setActiveTab(tab.key) }}
              activeOpacity={0.7}
            >
              <View style={[styles.tabKey, active && styles.tabKeyActive]}>
                <Text style={[styles.tabIcon, !active && styles.tabIconIdle]}>{tab.icon}</Text>
                {!!tab.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: retro.paper },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: retro.night,
    paddingBottom: 26,
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopWidth: 3,
    borderTopColor: retro.line,
    gap: 4,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  tabKey: {
    width: 44,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabKeyActive: {
    backgroundColor: retro.screenSoft,
    borderColor: retro.line,
    shadowColor: retro.screenDeep,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  tabIcon: { fontSize: 20 },
  tabIconIdle: { opacity: 0.55 },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: retro.red,
    borderRadius: 2,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: retro.night,
  },
  badgeText: { color: retro.white, fontSize: 10, fontWeight: '900', fontFamily: 'monospace' },
  tabLabel: { fontSize: 9, color: retro.faded, fontWeight: '800', fontFamily: 'monospace', letterSpacing: 0.5 },
  tabLabelActive: { color: retro.screenSoft, fontWeight: '900' },
})
