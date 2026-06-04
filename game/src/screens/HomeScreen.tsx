import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import ActionButtons from '../components/ActionButtons'
import CreatureDisplay from '../components/CreatureDisplay'
import EventModal from '../components/EventModal'
import MiniGame from '../components/MiniGame'
import ParticleEffect from '../components/ParticleEffect'
import SpeechBubble from '../components/SpeechBubble'
import StatsPanel from '../components/StatsPanel'
import { Creature, GameEvent, InventoryItem, JournalEntry, Quest } from '../types'
import { addXP, decayStats, getMood, getCreatureEmoji } from '../utils/creature'
import { generateRandomEvent, getRewardItem, shouldTriggerEvent } from '../utils/events'
import { getCreatureSpeech, getReactionMessage } from '../utils/speech'
import { addItemToInventory, addJournalEntry, saveCreature, saveEvents, saveInventory, saveJournal, saveQuests } from '../utils/storage'
import { updateQuestsAfterAction } from '../utils/quests'

interface Props {
  creature: Creature
  inventory: InventoryItem[]
  events: GameEvent[]
  quests: Quest[]
  journal: JournalEntry[]
  onUpdate: (
    creature: Creature,
    inventory?: InventoryItem[],
    events?: GameEvent[],
    quests?: Quest[],
    journal?: JournalEntry[]
  ) => void
}

export default function HomeScreen({ creature, inventory, events, quests, journal, onUpdate }: Props) {
  const [refreshing, setRefreshing] = useState(false)
  const [particleTrigger, setParticleTrigger] = useState(0)
  const [particleEmojis, setParticleEmojis] = useState(['❤️', '⭐', '✨'])
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null)
  const [speechMsg, setSpeechMsg] = useState('')
  const [speechVisible, setSpeechVisible] = useState(false)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showSpeech = useCallback((msg: string) => {
    setSpeechMsg(msg)
    setSpeechVisible(true)
    if (speechTimer.current) clearTimeout(speechTimer.current)
    speechTimer.current = setTimeout(() => setSpeechVisible(false), 2500)
  }, [])

  useEffect(() => {
    showSpeech(getCreatureSpeech(creature))
    const interval = setInterval(() => {
      showSpeech(getCreatureSpeech(creature))
    }, 12000)
    return () => clearInterval(interval)
  }, [creature.stats.hunger, creature.stats.happiness, creature.stats.energy, creature.stats.isSick])

  const triggerParticles = (emojis: string[]) => {
    setParticleEmojis(emojis)
    setParticleTrigger((n) => n + 1)
  }

  const maybeSpawnEvent = useCallback(
    (updatedCreature: Creature, updatedEvents: GameEvent[], updatedQuests: Quest[], updatedJournal: JournalEntry[]) => {
      if (!shouldTriggerEvent()) return { updatedEvents, updatedQuests, updatedJournal }

      const event = generateRandomEvent(updatedCreature)
      const newEvents = [event, ...updatedEvents].slice(0, 30)

      let newJournal = addJournalEntry(updatedJournal, event.message, event.emoji)
      let newQuests = updateQuestsAfterAction(updatedQuests, 'events')

      setPendingEvent(event)
      return { updatedEvents: newEvents, updatedQuests: newQuests, updatedJournal: newJournal }
    },
    []
  )

  const handleFeed = async () => {
    if (creature.stats.hunger >= 95) { showSpeech('Je suis rassasié ! 🙅'); return }
    let updated: Creature = {
      ...creature,
      lastFed: new Date().toISOString(),
      totalFed: creature.totalFed + 1,
      stats: { ...creature.stats, hunger: Math.min(100, creature.stats.hunger + 30), happiness: Math.min(100, creature.stats.happiness + 5) },
    }
    updated = { ...addXP(updated, 10), mood: getMood(updated.stats) }
    let newQuests = updateQuestsAfterAction(quests, 'feed')
    newQuests = updateQuestsAfterAction(newQuests, 'level', updated.stats.level)
    let newJournal = addJournalEntry(journal, `${creature.name} a mangé avec appétit.`, '🍖')
    const { updatedEvents, updatedQuests: q2, updatedJournal: j2 } = maybeSpawnEvent(updated, events, newQuests, newJournal)
    showSpeech(getReactionMessage('feed'))
    triggerParticles(['🍖', '❤️', '✨'])
    await Promise.all([saveCreature(updated), saveEvents(updatedEvents), saveQuests(q2), saveJournal(j2)])
    onUpdate(updated, inventory, updatedEvents, q2, j2)
  }

  const handlePlay = () => {
    if (creature.stats.energy < 20) { showSpeech('Trop fatigué pour jouer... 😴'); return }
    setShowMiniGame(true)
  }

  const handleMiniGameEnd = async (score: number) => {
    setShowMiniGame(false)
    const xpGained = score * 3 + 10
    const happinessGain = Math.min(40, score * 2 + 10)
    let updated: Creature = {
      ...creature,
      lastPlayed: new Date().toISOString(),
      totalPlayed: creature.totalPlayed + 1,
      stats: { ...creature.stats, happiness: Math.min(100, creature.stats.happiness + happinessGain), energy: Math.max(0, creature.stats.energy - 15), hunger: Math.max(0, creature.stats.hunger - 10) },
    }
    updated = { ...addXP(updated, xpGained), mood: getMood(updated.stats) }
    let newQuests = updateQuestsAfterAction(quests, 'play')
    newQuests = updateQuestsAfterAction(newQuests, 'level', updated.stats.level)
    let newJournal = addJournalEntry(journal, `${creature.name} a joué et gagné ${xpGained} XP ! (score: ${score})`, '🎮')
    const { updatedEvents, updatedQuests: q2, updatedJournal: j2 } = maybeSpawnEvent(updated, events, newQuests, newJournal)
    showSpeech(getReactionMessage('play'))
    triggerParticles(['🎮', '⭐', '🎉'])
    await Promise.all([saveCreature(updated), saveEvents(updatedEvents), saveQuests(q2), saveJournal(j2)])
    onUpdate(updated, inventory, updatedEvents, q2, j2)
  }

  const handleSleep = async () => {
    if (creature.stats.energy >= 95) { showSpeech('Je suis en pleine forme ! ⚡'); return }
    let updated: Creature = {
      ...creature,
      totalSlept: creature.totalSlept + 1,
      stats: { ...creature.stats, energy: Math.min(100, creature.stats.energy + 40), hunger: Math.max(0, creature.stats.hunger - 5) },
    }
    updated = { ...updated, mood: getMood(updated.stats) }
    let newQuests = updateQuestsAfterAction(quests, 'sleep')
    let newJournal = addJournalEntry(journal, `${creature.name} a fait une bonne sieste.`, '💤')
    showSpeech(getReactionMessage('sleep'))
    triggerParticles(['💤', '🌙', '⭐'])
    await Promise.all([saveCreature(updated), saveQuests(newQuests), saveJournal(newJournal)])
    onUpdate(updated, inventory, events, newQuests, newJournal)
  }

  const handleEventClose = async () => {
    if (!pendingEvent) return
    let updatedCreature = creature
    let newInventory = inventory

    if (pendingEvent.type === 'sick') {
      updatedCreature = { ...creature, stats: { ...creature.stats, isSick: true } }
    }
    if (pendingEvent.type === 'dream' && pendingEvent.reward?.xp) {
      updatedCreature = { ...addXP(creature, pendingEvent.reward.xp), mood: getMood(creature.stats) }
    }
    if (pendingEvent.type === 'training' && pendingEvent.reward?.xp) {
      updatedCreature = { ...addXP(creature, pendingEvent.reward.xp), mood: getMood(creature.stats) }
    }
    if (pendingEvent.reward?.itemId) {
      const item = getRewardItem(pendingEvent.reward.itemId)
      if (item) newInventory = addItemToInventory(inventory, item)
    }

    const newEvents = events.map((e) => e.id === pendingEvent.id ? { ...e, resolved: true } : e)
    setPendingEvent(null)
    await Promise.all([saveCreature(updatedCreature), saveInventory(newInventory), saveEvents(newEvents)])
    onUpdate(updatedCreature, newInventory, newEvents, quests, journal)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    const decayed = { ...creature, stats: decayStats(creature) }
    const withMood = { ...decayed, mood: getMood(decayed.stats) }
    await saveCreature(withMood)
    onUpdate(withMood)
    setRefreshing(false)
  }, [creature])

  const creatureEmoji = getCreatureEmoji(creature.type, creature.stats.level)

  return (
    <SafeAreaView style={styles.safe}>
      <ParticleEffect trigger={particleTrigger} emojis={particleEmojis} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Croisio</Text>
          {creature.stats.isSick && (
            <View style={styles.sickTag}>
              <Text style={styles.sickTagText}>🤒 Malade</Text>
            </View>
          )}
        </View>

        <SpeechBubble message={speechMsg} visible={speechVisible} />
        <CreatureDisplay creature={creature} />
        <StatsPanel stats={creature.stats} />
        <View style={styles.spacer} />
        <ActionButtons
          onFeed={handleFeed}
          onPlay={handlePlay}
          onSleep={handleSleep}
          hungerFull={creature.stats.hunger >= 95}
          energyFull={creature.stats.energy >= 95}
        />
      </ScrollView>

      <MiniGame
        visible={showMiniGame}
        onClose={handleMiniGameEnd}
        creatureEmoji={creatureEmoji}
      />

      <EventModal event={pendingEvent} onClose={handleEventClose} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7FF' },
  scroll: { paddingBottom: 30, gap: 16 },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', letterSpacing: -1 },
  sickTag: {
    backgroundColor: '#FFF3CD',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sickTagText: { fontSize: 12, fontWeight: '700', color: '#856404' },
  spacer: { height: 4 },
})
