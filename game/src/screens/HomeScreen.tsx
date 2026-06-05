import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import ActionButtons from '../components/ActionButtons'
import CreatureDisplay from '../components/CreatureDisplay'
import EventModal from '../components/EventModal'
import MiniGame from '../components/MiniGame'
import ParticleEffect from '../components/ParticleEffect'
import SpeechBubble from '../components/SpeechBubble'
import StatsPanel from '../components/StatsPanel'
import { Creature, CreatureType, GameEvent, InventoryItem, JournalEntry, Quest } from '../types'
import { addXP, decayStats, getMood } from '../utils/creature'
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
  const [showEvolve, setShowEvolve] = useState(false)
  const [evolveStage, setEvolveStage] = useState(2)
  const [showAdmin, setShowAdmin] = useState(false)
  const evolveScale = useRef(new Animated.Value(0)).current
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleTapCount = useRef(0)
  const titleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTitleTap = () => {
    titleTapCount.current += 1
    if (titleTapTimer.current) clearTimeout(titleTapTimer.current)
    titleTapTimer.current = setTimeout(() => { titleTapCount.current = 0 }, 2000)
    if (titleTapCount.current >= 5) {
      titleTapCount.current = 0
      setShowAdmin(true)
    }
  }

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

  const adminAction = async (action: string) => {
    let updated = { ...creature }
    switch (action) {
      case 'xp100':   updated = addXP(updated, 100); break
      case 'xp500':   updated = addXP(updated, 500); break
      case 'xp9999':  updated = addXP(updated, 9999); break
      case 'maxstats':
        updated = { ...updated, stats: { ...updated.stats, hunger: 100, happiness: 100, energy: 100 } }
        break
      case 'heal':
        updated = { ...updated, stats: { ...updated.stats, isSick: false } }
        break
      case 'lv10':
        updated = { ...updated, stats: { ...updated.stats, level: 10, xp: 0, xpToNextLevel: 1000 } }
        break
      case 'lv20':
        updated = { ...updated, stats: { ...updated.stats, level: 20, xp: 0, xpToNextLevel: 2000 } }
        break
      case 'type_ignis': updated = { ...updated, type: 'ignis' }; break
      case 'type_nemo':  updated = { ...updated, type: 'nemo'  }; break
      case 'type_sylva': updated = { ...updated, type: 'sylva' }; break
      case 'type_zapp':  updated = { ...updated, type: 'zapp'  }; break
    }
    updated = { ...updated, mood: getMood(updated.stats) }
    await saveCreature(updated)
    onUpdate(updated)
    triggerParticles(['⚡', '✨', '🔧'])
    showSpeech('Admin cheat activé ! 👾')
  }

  const handleEvolve = useCallback(() => {
    const stage = creature.stats.level >= 20 ? 3 : 2
    setEvolveStage(stage)
    setShowEvolve(true)
    evolveScale.setValue(0)
    Animated.spring(evolveScale, { toValue: 1, bounciness: 14, useNativeDriver: true }).start()
    triggerParticles(['⭐', '✨', '💫', '🌟'])
  }, [creature.stats.level])

  return (
    <SafeAreaView style={styles.safe}>
      <ParticleEffect trigger={particleTrigger} emojis={particleEmojis} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
            <Text style={styles.title}>Croisio</Text>
          </TouchableOpacity>
          {creature.stats.isSick && (
            <View style={styles.sickTag}>
              <Text style={styles.sickTagText}>🤒 Malade</Text>
            </View>
          )}
        </View>

        <SpeechBubble message={speechMsg} visible={speechVisible} />
        <CreatureDisplay creature={creature} onEvolve={handleEvolve} />
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
        creatureType={creature.type}
      />

      <EventModal event={pendingEvent} onClose={handleEventClose} />

      <Modal visible={showAdmin} transparent animationType="slide">
        <View style={styles.adminOverlay}>
          <View style={styles.adminCard}>
            <Text style={styles.adminTitle}>👾 Panel Admin</Text>
            <Text style={styles.adminSub}>
              Lv {creature.stats.level} · {creature.stats.xp}/{creature.stats.xpToNextLevel} XP
            </Text>

            <Text style={styles.adminSection}>XP</Text>
            <View style={styles.adminRow}>
              {([['xp100', '+100 XP'], ['xp500', '+500 XP'], ['xp9999', '+9999 XP']] as const).map(([act, lbl]) => (
                <TouchableOpacity key={act} style={styles.adminBtn} onPress={() => adminAction(act)}>
                  <Text style={styles.adminBtnText}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.adminSection}>Niveau direct</Text>
            <View style={styles.adminRow}>
              {([['lv10', 'Niveau 10'], ['lv20', 'Niveau 20']] as const).map(([act, lbl]) => (
                <TouchableOpacity key={act} style={[styles.adminBtn, { backgroundColor: '#A855F7' }]} onPress={() => adminAction(act)}>
                  <Text style={styles.adminBtnText}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.adminSection}>Monstre</Text>
            <View style={styles.adminRow}>
              {([
                ['type_ignis', '🔥 Ignis', '#C41E0F'],
                ['type_nemo',  '🌊 Némo',  '#1A3A6B'],
                ['type_sylva', '🌿 Sylva', '#2D6A2D'],
                ['type_zapp',  '⚡ Zapp',  '#C47A00'],
              ] as [string, string, string][]).map(([act, lbl, col]) => {
                const t = act.replace('type_', '') as CreatureType
                return (
                  <TouchableOpacity
                    key={act}
                    style={[styles.adminBtn, { backgroundColor: col, opacity: creature.type === t ? 1 : 0.45 }]}
                    onPress={() => adminAction(act)}
                  >
                    <Text style={styles.adminBtnText}>{lbl}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={styles.adminSection}>Stats</Text>
            <View style={styles.adminRow}>
              <TouchableOpacity style={[styles.adminBtn, { backgroundColor: '#22C55E' }]} onPress={() => adminAction('maxstats')}>
                <Text style={styles.adminBtnText}>Max tout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.adminBtn, { backgroundColor: '#3B82F6' }]} onPress={() => adminAction('heal')}>
                <Text style={styles.adminBtnText}>Soigner</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.adminClose} onPress={() => setShowAdmin(false)}>
              <Text style={styles.adminCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEvolve} transparent animationType="fade">
        <View style={styles.evolveOverlay}>
          <Animated.View style={[styles.evolveCard, { transform: [{ scale: evolveScale }] }]}>
            <Text style={styles.evolveEmoji}>✨</Text>
            <Text style={styles.evolveTitle}>ÉVOLUTION !</Text>
            <Text style={styles.evolveName}>{creature.name}</Text>
            <Text style={styles.evolveDesc}>
              {evolveStage === 3
                ? 'A atteint sa forme finale !\nLes ailes se déploient...'
                : 'A grandi et est devenu plus fort !\nSes cornes ont poussé...'}
            </Text>
            <Text style={styles.evolveStage}>
              {evolveStage === 3 ? '★ FORME ULTIME' : '★ FORME ADO'}
            </Text>
            <TouchableOpacity style={styles.evolveBtn} onPress={() => setShowEvolve(false)}>
              <Text style={styles.evolveBtnText}>Incroyable !</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
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
  adminOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  adminCard: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    gap: 10,
  },
  adminTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  adminSub: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 6,
  },
  adminSection: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  adminRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  adminBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  adminBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  adminClose: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
  },
  adminCloseText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 15,
  },
  evolveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  evolveCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    gap: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  evolveEmoji: { fontSize: 52 },
  evolveTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1a1a2e',
    letterSpacing: 2,
  },
  evolveName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#555',
  },
  evolveDesc: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },
  evolveStage: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
    marginTop: 4,
  },
  evolveBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 12,
  },
  evolveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
