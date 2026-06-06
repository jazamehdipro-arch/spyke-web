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
import { Creature, CreatureType, GameEvent, InventoryItem, JournalEntry, Quest, TrainingStats } from '../types'
import { addXP, decayStats, getMood } from '../utils/creature'
import { generateRandomEvent, getRewardItem, shouldTriggerEvent } from '../utils/events'
import { getCreatureSpeech, getReactionMessage } from '../utils/speech'
import { addItemToInventory, addJournalEntry, saveCreature, saveEvents, saveInventory, saveJournal, saveQuests } from '../utils/storage'
import { updateQuestsAfterAction } from '../utils/quests'
import { getDailyWeather, WEATHER_EMOJI, WEATHER_LABEL } from '../utils/weather'

const TRAINING_CONFIG: Record<keyof TrainingStats, { label: string; emoji: string; desc: string; costEnergy: number; costHunger: number }> = {
  strength:  { label: 'Force',     emoji: '💪', desc: '+0.8% dégâts',         costEnergy: 15, costHunger: 10 },
  reflexes:  { label: 'Réflexes',  emoji: '🔰', desc: '-0.7% dégâts reçus',   costEnergy: 10, costHunger: 8  },
  endurance: { label: 'Endurance', emoji: '🛡️', desc: '+énergie & +PV max',   costEnergy: 20, costHunger: 15 },
  defense:   { label: 'Défense',   emoji: '🎯', desc: '+0.65% esquive',        costEnergy: 12, costHunger: 8  },
}

const MAX_TRAINING_POINTS = 40

const PLAY_ACTIVITIES: Record<string, {
  label: string; emoji: string; desc: string
  stat: keyof TrainingStats
  costEnergy: number; costHunger: number; happinessGain: number
}> = {
  sparring:  { label: 'Combat',    emoji: '🥊', desc: 'Entraînement de force au sac',      stat: 'strength',  costEnergy: 20, costHunger: 15, happinessGain: 15 },
  agility:   { label: 'Agilité',   emoji: '🏃', desc: 'Parcours d\'obstacles et de vitesse', stat: 'reflexes',  costEnergy: 15, costHunger: 10, happinessGain: 20 },
  endurance: { label: 'Endurance', emoji: '🧗', desc: 'Escalade et exercices cardio',       stat: 'endurance', costEnergy: 25, costHunger: 20, happinessGain: 12 },
  puzzle:    { label: 'Stratégie', emoji: '🧩', desc: 'Puzzles tactiques et réflexion',     stat: 'defense',   costEnergy: 12, costHunger: 8,  happinessGain: 25 },
}

function formatFoodEffects(item: InventoryItem): string {
  const p: string[] = []
  if (item.effect.hunger)    p.push(`🍖+${item.effect.hunger}`)
  if (item.effect.happiness) p.push(item.effect.happiness > 0 ? `😊+${item.effect.happiness}` : `😞${item.effect.happiness}`)
  if (item.effect.energy)    p.push(item.effect.energy > 0 ? `⚡+${item.effect.energy}` : `⚡${item.effect.energy}`)
  if (item.effect.combatBuff) {
    const pct = Math.round((item.effect.combatBuff.damageMult - 1) * 100)
    p.push(`⚔️+${pct}% (${item.effect.combatBuff.durationMin}min)`)
    if (item.effect.combatBuff.sickChance) p.push(`⚠️${item.effect.combatBuff.sickChance * 100}%maladie`)
  }
  return p.join(' · ')
}

function getTimeOfDay(): 'dawn' | 'day' | 'dusk' | 'night' {
  const h = new Date().getHours()
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 19) return 'day'
  if (h >= 19 && h < 22) return 'dusk'
  return 'night'
}

const TIME_BG: Record<string, string> = {
  dawn:  '#FFF3E0',
  day:   '#F8F7FF',
  dusk:  '#F3E5F5',
  night: '#1a1a2e',
}

const TIME_TEXT: Record<string, string> = {
  dawn:  '#1a1a2e',
  day:   '#1a1a2e',
  dusk:  '#1a1a2e',
  night: '#ffffff',
}

interface Props {
  creature: Creature
  inventory: InventoryItem[]
  events: GameEvent[]
  quests: Quest[]
  journal: JournalEntry[]
  streak?: number
  onUpdate: (
    creature: Creature,
    inventory?: InventoryItem[],
    events?: GameEvent[],
    quests?: Quest[],
    journal?: JournalEntry[]
  ) => void
}

export default function HomeScreen({ creature, inventory, events, quests, journal, streak, onUpdate }: Props) {
  const timeOfDay = getTimeOfDay()
  const bgColor = TIME_BG[timeOfDay]
  const textColor = TIME_TEXT[timeOfDay]
  const weather = getDailyWeather()
  const [refreshing, setRefreshing] = useState(false)
  const [showFoodPicker, setShowFoodPicker] = useState(false)
  const [particleTrigger, setParticleTrigger] = useState(0)
  const [particleEmojis, setParticleEmojis] = useState(['❤️', '⭐', '✨'])
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null)
  const [speechMsg, setSpeechMsg] = useState('')
  const [speechVisible, setSpeechVisible] = useState(false)
  const [showEvolve, setShowEvolve] = useState(false)
  const [evolveStage, setEvolveStage] = useState(2)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showActivityPicker, setShowActivityPicker] = useState(false)
  const [pendingActivity, setPendingActivity] = useState<keyof typeof PLAY_ACTIVITIES | null>(null)
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

  const foodItems = inventory.filter((i) => i.effect.hunger !== undefined && i.effect.hunger > 0)

  const handleFeed = () => {
    if (creature.stats.hunger >= 95) { showSpeech('Je suis rassasié ! 🙅'); return }
    setShowFoodPicker(true)
  }

  const handleFeedWith = async (item: InventoryItem) => {
    setShowFoodPicker(false)
    let isSick = creature.stats.isSick
    if (item.effect.combatBuff?.sickChance && Math.random() < item.effect.combatBuff.sickChance) {
      isSick = true
    }
    let activeCombatBuff = creature.activeCombatBuff
    if (item.effect.combatBuff) {
      const expiresAt = new Date(Date.now() + item.effect.combatBuff.durationMin * 60 * 1000).toISOString()
      activeCombatBuff = { damageMult: item.effect.combatBuff.damageMult, expiresAt }
    }
    let updated: Creature = {
      ...creature,
      lastFed: new Date().toISOString(),
      totalFed: creature.totalFed + 1,
      activeCombatBuff,
      stats: {
        ...creature.stats,
        hunger:    Math.min(100, creature.stats.hunger    + (item.effect.hunger    ?? 0)),
        happiness: Math.min(100, Math.max(0, creature.stats.happiness + (item.effect.happiness ?? 0))),
        energy:    Math.min(100, Math.max(0, creature.stats.energy    + (item.effect.energy    ?? 0))),
        isSick,
      },
    }
    updated = { ...addXP(updated, 8), mood: getMood(updated.stats) }
    const newInventory = inventory
      .map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
      .filter((i) => i.quantity > 0)
    let newQuests = updateQuestsAfterAction(quests, 'feed')
    newQuests = updateQuestsAfterAction(newQuests, 'level', updated.stats.level)
    let newJournal = addJournalEntry(journal, `${creature.name} a mangé ${item.emoji} ${item.name}.`, item.emoji)
    const { updatedEvents, updatedQuests: q2, updatedJournal: j2 } = maybeSpawnEvent(updated, events, newQuests, newJournal)
    showSpeech(getReactionMessage('feed'))
    triggerParticles([item.emoji, '❤️', '✨'])
    await Promise.all([saveCreature(updated), saveInventory(newInventory), saveEvents(updatedEvents), saveQuests(q2), saveJournal(j2)])
    onUpdate(updated, newInventory, updatedEvents, q2, j2)
  }

  const handleTrain = async (type: keyof TrainingStats) => {
    const cfg = TRAINING_CONFIG[type]
    const training = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
    const current = training[type]
    if (current >= 20) { showSpeech(`${cfg.emoji} Stat maximale !`); return }
    const totalPts = Object.values(training).reduce((a, b) => a + b, 0)
    if (totalPts >= MAX_TRAINING_POINTS) { showSpeech(`Points d'entraînement épuisés ! (${MAX_TRAINING_POINTS}/${MAX_TRAINING_POINTS})`); return }
    if (creature.stats.energy < cfg.costEnergy) { showSpeech(`Trop fatigué pour s'entraîner ! ⚡`); return }
    if (creature.stats.hunger < cfg.costHunger) { showSpeech(`Trop affamé pour s'entraîner ! 🍖`); return }
    const newTraining: TrainingStats = { ...training, [type]: current + 1 }
    let updated: Creature = {
      ...creature,
      training: newTraining,
      stats: {
        ...creature.stats,
        energy: creature.stats.energy - cfg.costEnergy,
        hunger: Math.max(0, creature.stats.hunger - cfg.costHunger),
      },
    }
    updated = { ...addXP(updated, 5), mood: getMood(updated.stats) }
    const newJournal = addJournalEntry(journal, `${creature.name} s'est entraîné : ${cfg.label} Lv ${current + 1} !`, cfg.emoji)
    showSpeech(`${cfg.emoji} ${cfg.label} Lv ${current + 1} !`)
    triggerParticles([cfg.emoji, '⭐', '💪'])
    await Promise.all([saveCreature(updated), saveJournal(newJournal)])
    onUpdate(updated, inventory, events, quests, newJournal)
  }

  const handlePlay = () => {
    if (creature.stats.energy < 10) { showSpeech('Trop fatigué pour jouer... 😴'); return }
    setShowActivityPicker(true)
  }

  const handleSelectActivity = (actKey: keyof typeof PLAY_ACTIVITIES) => {
    const act = PLAY_ACTIVITIES[actKey]
    const training = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
    const totalPts = Object.values(training).reduce((a, b) => a + b, 0)
    if (totalPts >= MAX_TRAINING_POINTS) { showSpeech(`Points d'entraînement épuisés ! (${MAX_TRAINING_POINTS}/${MAX_TRAINING_POINTS})`); return }
    if (creature.stats.energy < act.costEnergy) { showSpeech("Pas assez d'énergie ! ⚡"); return }
    if (creature.stats.hunger < act.costHunger) { showSpeech('Trop affamé pour ça ! 🍖'); return }
    setPendingActivity(actKey)
    setShowActivityPicker(false)
    setShowMiniGame(true)
  }

  const handleMiniGameEnd = async (score: number) => {
    setShowMiniGame(false)
    const act = pendingActivity ? PLAY_ACTIVITIES[pendingActivity] : null
    const xpGained = score * 3 + 10
    const happinessGain = Math.min(40, act ? act.happinessGain + score : score * 2 + 10)
    const costEnergy = act ? act.costEnergy : 15
    const costHunger = act ? act.costHunger : 10

    const training = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
    const totalPts = Object.values(training).reduce((a, b) => a + b, 0)
    const newTraining = act && training[act.stat] < 20 && totalPts < MAX_TRAINING_POINTS
      ? { ...training, [act.stat]: training[act.stat] + 1 }
      : training
    const statLeveled = act && newTraining[act.stat] > training[act.stat]

    let updated: Creature = {
      ...creature,
      lastPlayed: new Date().toISOString(),
      totalPlayed: creature.totalPlayed + 1,
      training: newTraining,
      stats: {
        ...creature.stats,
        happiness: Math.min(100, creature.stats.happiness + happinessGain),
        energy:    Math.max(0, creature.stats.energy - costEnergy),
        hunger:    Math.max(0, creature.stats.hunger - costHunger),
      },
    }
    updated = { ...addXP(updated, xpGained), mood: getMood(updated.stats) }
    let newQuests = updateQuestsAfterAction(quests, 'play')
    newQuests = updateQuestsAfterAction(newQuests, 'level', updated.stats.level)
    const actLabel = act ? `${act.emoji} ${act.label}` : '🎮 Jeu'
    const statNote = statLeveled ? ` · ${TRAINING_CONFIG[act!.stat].label} Lv ${newTraining[act!.stat]}` : ''
    let newJournal = addJournalEntry(journal, `${creature.name} a joué (${actLabel})${statNote} ! +${xpGained} XP`, act?.emoji ?? '🎮')
    const { updatedEvents, updatedQuests: q2, updatedJournal: j2 } = maybeSpawnEvent(updated, events, newQuests, newJournal)
    showSpeech(statLeveled
      ? `${act!.emoji} ${TRAINING_CONFIG[act!.stat].label} Lv ${newTraining[act!.stat]} !`
      : getReactionMessage('play'))
    triggerParticles([act?.emoji ?? '🎮', '⭐', '🎉'])
    setPendingActivity(null)
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
      case 'lv1':
        updated = { ...updated, stats: { ...updated.stats, level: 1, xp: 0, xpToNextLevel: 100 } }
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
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ParticleEffect trigger={particleTrigger} emojis={particleEmojis} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
            <Text style={[styles.title, { color: textColor }]}>Croisio</Text>
          </TouchableOpacity>
          {creature.stats.isSick && (
            <View style={styles.sickTag}>
              <Text style={styles.sickTagText}>🤒 Malade</Text>
            </View>
          )}
        </View>

        <View style={styles.weatherRow}>
          <Text style={[styles.weatherText, { color: textColor === '#ffffff' ? '#ccc' : '#555' }]}>
            {WEATHER_EMOJI[weather]} {WEATHER_LABEL[weather]}
          </Text>
          {streak != null && streak > 0 && (
            <Text style={[styles.weatherText, { color: textColor === '#ffffff' ? '#ccc' : '#555' }]}>
              {'  ·  '}🔥 {streak} jour{streak > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <SpeechBubble message={speechMsg} visible={speechVisible} />
        <CreatureDisplay creature={creature} onEvolve={handleEvolve} />
        <StatsPanel stats={creature.stats} />
        {creature.activeCombatBuff && creature.activeCombatBuff.expiresAt > new Date().toISOString() && (
          <View style={styles.buffBadge}>
            <Text style={styles.buffText}>
              ⚔️ +{Math.round((creature.activeCombatBuff.damageMult - 1) * 100)}% dégâts actif
            </Text>
          </View>
        )}
        <View style={styles.spacer} />
        <ActionButtons
          onFeed={handleFeed}
          onPlay={handlePlay}
          onSleep={handleSleep}
          hungerFull={creature.stats.hunger >= 95}
          energyFull={creature.stats.energy >= 95}
        />
        <View style={styles.trainSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.trainTitle, { color: textColor }]}>⚔️ Entraînement</Text>
            {(() => {
              const tr = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
              const used = Object.values(tr).reduce((a, b) => a + b, 0)
              return (
                <Text style={[styles.trainTitle, { color: used >= MAX_TRAINING_POINTS ? '#FF6B6B' : textColor, fontSize: 12 }]}>
                  {used}/{MAX_TRAINING_POINTS} pts
                </Text>
              )
            })()}
          </View>
          <View style={styles.trainGrid}>
            {(Object.keys(TRAINING_CONFIG) as (keyof TrainingStats)[]).map((type) => {
              const cfg = TRAINING_CONFIG[type]
              const training = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
              const current = training[type]
              const totalUsed = Object.values(training).reduce((a, b) => a + b, 0)
              const canTrain = current < 20
                && totalUsed < MAX_TRAINING_POINTS
                && creature.stats.energy >= cfg.costEnergy
                && creature.stats.hunger >= cfg.costHunger
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.trainCard, !canTrain && styles.trainCardDisabled]}
                  onPress={() => handleTrain(type)}
                  activeOpacity={canTrain ? 0.7 : 1}
                >
                  <Text style={styles.trainEmoji}>{cfg.emoji}</Text>
                  <Text style={styles.trainLabel}>{cfg.label}</Text>
                  <Text style={styles.trainDesc}>{cfg.desc}</Text>
                  <View style={styles.trainBarBg}>
                    <View style={[styles.trainBarFill, { width: `${(current / 20) * 100}%` as any }]} />
                  </View>
                  <Text style={styles.trainLevel}>Lv {current}/20</Text>
                  <Text style={styles.trainCost}>-{cfg.costEnergy}⚡ -{cfg.costHunger}🍖</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ScrollView>

      <MiniGame
        visible={showMiniGame}
        onClose={handleMiniGameEnd}
        creatureType={creature.type}
      />

      <EventModal event={pendingEvent} onClose={handleEventClose} />

      <Modal visible={showActivityPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.foodOverlay} onPress={() => setShowActivityPicker(false)} activeOpacity={1}>
          <View style={styles.foodCard}>
            <Text style={styles.foodTitle}>🎮 Choisir une activité</Text>
            {(Object.entries(PLAY_ACTIVITIES) as [string, typeof PLAY_ACTIVITIES[string]][]).map(([key, act]) => {
              const training = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
              const currentLv = training[act.stat]
              const maxed = currentLv >= 20
              const canPlay = !maxed && creature.stats.energy >= act.costEnergy && creature.stats.hunger >= act.costHunger
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.activityRow, !canPlay && styles.activityRowDisabled]}
                  onPress={() => canPlay && handleSelectActivity(key)}
                  activeOpacity={canPlay ? 0.7 : 1}
                >
                  <Text style={styles.activityEmoji}>{act.emoji}</Text>
                  <View style={styles.activityInfo}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityName}>{act.label}</Text>
                      <Text style={styles.activityStatBadge}>
                        {maxed ? '✅ Max' : `${TRAINING_CONFIG[act.stat].label} Lv ${currentLv}/20`}
                      </Text>
                    </View>
                    <Text style={styles.activityDesc}>{act.desc}</Text>
                    <View style={styles.activityBarBg}>
                      <View style={[styles.activityBarFill, { width: `${(currentLv / 20) * 100}%` as any }]} />
                    </View>
                    <Text style={styles.activityCost}>-{act.costEnergy}⚡ -{act.costHunger}🍖</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showFoodPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.foodOverlay} onPress={() => setShowFoodPicker(false)} activeOpacity={1}>
          <View style={styles.foodCard}>
            <Text style={styles.foodTitle}>🍽️ Que donner à manger ?</Text>
            {foodItems.length === 0 ? (
              <View style={styles.foodEmpty}>
                <Text style={styles.foodEmptyText}>Aucune nourriture disponible</Text>
                <Text style={styles.foodEmptyHint}>Gagne des combats pour obtenir des croquettes ! ⚔️</Text>
              </View>
            ) : (
              foodItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.foodItemRow} onPress={() => handleFeedWith(item)}>
                  <Text style={styles.foodItemEmoji}>{item.emoji}</Text>
                  <View style={styles.foodItemInfo}>
                    <View style={styles.foodItemHeader}>
                      <Text style={styles.foodItemName}>{item.name}</Text>
                      <View style={[styles.foodQtyBadge, { backgroundColor: item.rarity === 'rare' ? '#FF8C00' : item.rarity === 'epic' ? '#9B59B6' : '#666' }]}>
                        <Text style={styles.foodQtyText}>×{item.quantity}</Text>
                      </View>
                    </View>
                    <Text style={styles.foodItemEffects}>{formatFoodEffects(item)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>

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
              {([['lv1', 'Niveau 1'], ['lv10', 'Niveau 10'], ['lv20', 'Niveau 20']] as const).map(([act, lbl]) => (
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
  weatherRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  weatherText: { fontSize: 13, fontWeight: '500' },
  sickTag: {
    backgroundColor: '#FFF3CD',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sickTagText: { fontSize: 12, fontWeight: '700', color: '#856404' },
  spacer: { height: 4 },
  buffBadge: {
    marginHorizontal: 20,
    backgroundColor: '#FFD70022',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFD70066',
  },
  buffText: { fontSize: 12, fontWeight: '700', color: '#C47A00' },
  trainSection: { paddingHorizontal: 16, gap: 10 },
  trainTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  trainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trainCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  trainCardDisabled: { opacity: 0.4 },
  trainEmoji: { fontSize: 20 },
  trainLabel: { fontSize: 13, fontWeight: '800', color: '#1a1a2e' },
  trainDesc: { fontSize: 10, color: '#888', marginBottom: 4 },
  trainBarBg: { height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
  trainBarFill: { height: 4, backgroundColor: '#7C3AED', borderRadius: 2 },
  trainLevel: { fontSize: 11, fontWeight: '700', color: '#555', marginTop: 2 },
  trainCost: { fontSize: 10, color: '#FF6B35' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8F7FF',
    borderRadius: 14,
    padding: 12,
  },
  activityRowDisabled: { opacity: 0.4 },
  activityEmoji: { fontSize: 28 },
  activityInfo: { flex: 1, gap: 3 },
  activityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityName: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  activityStatBadge: { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  activityDesc: { fontSize: 11, color: '#888' },
  activityBarBg: { height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  activityBarFill: { height: 4, backgroundColor: '#7C3AED', borderRadius: 2 },
  activityCost: { fontSize: 10, color: '#FF6B35', marginTop: 2 },
  foodOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  foodCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  foodTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 4 },
  foodEmpty: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  foodEmptyText: { fontSize: 15, color: '#888', fontWeight: '600' },
  foodEmptyHint: { fontSize: 13, color: '#bbb', textAlign: 'center' },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8F7FF',
    borderRadius: 14,
    padding: 12,
  },
  foodItemEmoji: { fontSize: 28 },
  foodItemInfo: { flex: 1, gap: 3 },
  foodItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodItemName: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  foodQtyBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  foodQtyText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  foodItemEffects: { fontSize: 11, color: '#888', lineHeight: 16 },
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
