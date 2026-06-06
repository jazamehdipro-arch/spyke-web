import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  ImageBackground,
  ImageSourcePropType,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import CreatureDisplay, { CreaturePose } from '../components/CreatureDisplay'
import EventModal from '../components/EventModal'
import MiniGame from '../components/MiniGame'
import ParticleEffect from '../components/ParticleEffect'
import { Creature, CreatureType, GameEvent, InventoryItem, JournalEntry, Quest, TrainingStats } from '../types'
import { addXP, decayStats, getMood } from '../utils/creature'
import { generateRandomEvent, getRewardItem, shouldTriggerEvent } from '../utils/events'
import { getCreatureSpeech, getReactionMessage } from '../utils/speech'
import { addItemToInventory, addJournalEntry, saveCreature, saveEvents, saveInventory, saveJournal, saveQuests } from '../utils/storage'
import { updateQuestsAfterAction } from '../utils/quests'
import { getDailyWeather, WEATHER_EMOJI, WEATHER_LABEL } from '../utils/weather'

const { height: SCREEN_H } = Dimensions.get('window')
const HERO_H = Math.round(SCREEN_H * 0.42)

const TERRAIN: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/arena_volcano.png'),
  nemo:  require('../../assets/sprites/arena_snow.png'),
  sylva: require('../../assets/sprites/arena_forest.png'),
  zapp:  require('../../assets/sprites/arena_desert.png'),
}

const TRAINING_CONFIG: Record<keyof TrainingStats, { label: string; emoji: string; desc: string; costEnergy: number; costHunger: number }> = {
  strength:  { label: 'Force',     emoji: '💪', desc: '+0.8% dégâts',       costEnergy: 15, costHunger: 10 },
  reflexes:  { label: 'Réflexes',  emoji: '🔰', desc: '-0.7% dégâts reçus', costEnergy: 10, costHunger: 8  },
  endurance: { label: 'Endurance', emoji: '🛡️', desc: '+énergie & +PV max', costEnergy: 20, costHunger: 15 },
  defense:   { label: 'Défense',   emoji: '🎯', desc: '+0.65% esquive',      costEnergy: 12, costHunger: 8  },
}

const MAX_TRAINING_POINTS = 40

const PLAY_ACTIVITIES: Record<string, {
  label: string; emoji: string; desc: string
  stat: keyof TrainingStats
  costEnergy: number; costHunger: number; happinessGain: number
}> = {
  sparring:  { label: 'Combat',    emoji: '🥊', desc: 'Entraînement de force au sac',       stat: 'strength',  costEnergy: 20, costHunger: 15, happinessGain: 15 },
  agility:   { label: 'Agilité',   emoji: '🏃', desc: "Parcours d'obstacles et de vitesse", stat: 'reflexes',  costEnergy: 15, costHunger: 10, happinessGain: 20 },
  endurance: { label: 'Endurance', emoji: '🧗', desc: 'Escalade et exercices cardio',        stat: 'endurance', costEnergy: 25, costHunger: 20, happinessGain: 12 },
  puzzle:    { label: 'Stratégie', emoji: '🧩', desc: 'Puzzles tactiques et réflexion',      stat: 'defense',   costEnergy: 12, costHunger: 8,  happinessGain: 25 },
}

function formatFoodEffects(item: InventoryItem): string {
  const p: string[] = []
  if (item.effect.hunger)    p.push(`🍖+${item.effect.hunger}`)
  if (item.effect.happiness) p.push(item.effect.happiness > 0 ? `😊+${item.effect.happiness}` : `😞${item.effect.happiness}`)
  if (item.effect.energy)    p.push(item.effect.energy > 0 ? `⚡+${item.effect.energy}` : `⚡${item.effect.energy}`)
  if (item.effect.combatBuff) {
    const pct = Math.round((item.effect.combatBuff.damageMult - 1) * 100)
    p.push(`⚔️+${pct}%`)
  }
  return p.join(' · ')
}

interface Props {
  creature: Creature
  inventory: InventoryItem[]
  events: GameEvent[]
  quests: Quest[]
  journal: JournalEntry[]
  streak?: number
  coins?: number
  onUpdate: (
    creature: Creature,
    inventory?: InventoryItem[],
    events?: GameEvent[],
    quests?: Quest[],
    journal?: JournalEntry[]
  ) => void
  onSkinChange: (skin: string | null) => void
  onOpenInventory: () => void
  onOpenCrossings: () => void
}

export default function HomeScreen({
  creature, inventory, events, quests, journal,
  streak, coins, onUpdate, onSkinChange, onOpenInventory, onOpenCrossings,
}: Props) {
  const weather = getDailyWeather()
  const [refreshing, setRefreshing] = useState(false)
  const [showFoodPicker, setShowFoodPicker] = useState(false)
  const [particleTrigger, setParticleTrigger] = useState(0)
  const [particleEmojis, setParticleEmojis] = useState(['❤️', '⭐', '✨'])
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [currentPose, setCurrentPose] = useState<CreaturePose>(null)
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null)
  const [speechMsg, setSpeechMsg] = useState('')
  const [speechVisible, setSpeechVisible] = useState(false)
  const [showEvolve, setShowEvolve] = useState(false)
  const [evolveStage, setEvolveStage] = useState(2)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showActivityPicker, setShowActivityPicker] = useState(false)
  const [showTraining, setShowTraining] = useState(false)
  const [pendingActivity, setPendingActivity] = useState<keyof typeof PLAY_ACTIVITIES | null>(null)
  const evolveScale = useRef(new Animated.Value(0)).current
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleTapCount = useRef(0)
  const titleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTitleTap = () => {
    titleTapCount.current += 1
    if (titleTapTimer.current) clearTimeout(titleTapTimer.current)
    titleTapTimer.current = setTimeout(() => { titleTapCount.current = 0 }, 2000)
    if (titleTapCount.current >= 5) { titleTapCount.current = 0; setShowAdmin(true) }
  }

  const showSpeech = useCallback((msg: string) => {
    setSpeechMsg(msg)
    setSpeechVisible(true)
    if (speechTimer.current) clearTimeout(speechTimer.current)
    speechTimer.current = setTimeout(() => setSpeechVisible(false), 2500)
  }, [])

  useEffect(() => {
    showSpeech(getCreatureSpeech(creature))
    const interval = setInterval(() => showSpeech(getCreatureSpeech(creature)), 12000)
    return () => clearInterval(interval)
  }, [creature.stats.hunger, creature.stats.happiness, creature.stats.energy, creature.stats.isSick])

  const triggerParticles = (emojis: string[]) => {
    setParticleEmojis(emojis)
    setParticleTrigger((n) => n + 1)
  }

  const maybeSpawnEvent = useCallback(
    (c: Creature, ev: GameEvent[], qs: Quest[], j: JournalEntry[]) => {
      if (!shouldTriggerEvent()) return { updatedEvents: ev, updatedQuests: qs, updatedJournal: j }
      const event = generateRandomEvent(c)
      const newEvents = [event, ...ev].slice(0, 30)
      const newJournal = addJournalEntry(j, event.message, event.emoji)
      const newQuests = updateQuestsAfterAction(qs, 'events')
      setPendingEvent(event)
      return { updatedEvents: newEvents, updatedQuests: newQuests, updatedJournal: newJournal }
    }, []
  )

  const triggerPose = (p: CreaturePose, ms = 2800) => {
    if (poseTimer.current) clearTimeout(poseTimer.current)
    setCurrentPose(p)
    poseTimer.current = setTimeout(() => setCurrentPose(null), ms)
  }

  const handleFeed = () => {
    if (creature.stats.hunger >= 95) { showSpeech('Je suis rassasié ! 🙅'); return }
    setShowFoodPicker(true)
  }

  const handleFeedWith = async (item: InventoryItem) => {
    setShowFoodPicker(false)
    triggerPose('eat')
    let isSick = creature.stats.isSick
    if (item.effect.combatBuff?.sickChance && Math.random() < item.effect.combatBuff.sickChance) isSick = true
    let activeCombatBuff = creature.activeCombatBuff
    if (item.effect.combatBuff) {
      const expiresAt = new Date(Date.now() + item.effect.combatBuff.durationMin * 60 * 1000).toISOString()
      activeCombatBuff = { damageMult: item.effect.combatBuff.damageMult, expiresAt }
    }
    let updated: Creature = {
      ...creature, lastFed: new Date().toISOString(), totalFed: creature.totalFed + 1, activeCombatBuff,
      stats: {
        ...creature.stats,
        hunger:    Math.min(100, creature.stats.hunger    + (item.effect.hunger    ?? 0)),
        happiness: Math.min(100, Math.max(0, creature.stats.happiness + (item.effect.happiness ?? 0))),
        energy:    Math.min(100, Math.max(0, creature.stats.energy    + (item.effect.energy    ?? 0))),
        isSick,
      },
    }
    updated = { ...addXP(updated, 8), mood: getMood(updated.stats) }
    const newInv = inventory.map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0)
    let nq = updateQuestsAfterAction(quests, 'feed')
    nq = updateQuestsAfterAction(nq, 'level', updated.stats.level)
    let nj = addJournalEntry(journal, `${creature.name} a mangé ${item.emoji} ${item.name}.`, item.emoji)
    const { updatedEvents, updatedQuests: q2, updatedJournal: j2 } = maybeSpawnEvent(updated, events, nq, nj)
    showSpeech(getReactionMessage('feed'))
    triggerParticles([item.emoji, '❤️', '✨'])
    await Promise.all([saveCreature(updated), saveInventory(newInv), saveEvents(updatedEvents), saveQuests(q2), saveJournal(j2)])
    onUpdate(updated, newInv, updatedEvents, q2, j2)
  }

  const handleTrain = async (type: keyof TrainingStats) => {
    const cfg = TRAINING_CONFIG[type]
    const tr = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
    const current = tr[type]
    const totalPts = Object.values(tr).reduce((a, b) => a + b, 0)
    if (current >= 20)                        { showSpeech(`${cfg.emoji} Stat maximale !`); return }
    if (totalPts >= MAX_TRAINING_POINTS)       { showSpeech(`Points épuisés !`); return }
    if (creature.stats.energy < cfg.costEnergy){ showSpeech(`Trop fatigué ! ⚡`); return }
    if (creature.stats.hunger < cfg.costHunger){ showSpeech(`Trop affamé ! 🍖`); return }
    const newTr: TrainingStats = { ...tr, [type]: current + 1 }
    let updated: Creature = {
      ...creature, training: newTr,
      stats: { ...creature.stats, energy: creature.stats.energy - cfg.costEnergy, hunger: Math.max(0, creature.stats.hunger - cfg.costHunger) },
    }
    updated = { ...addXP(updated, 5), mood: getMood(updated.stats) }
    const nj = addJournalEntry(journal, `${creature.name} s'est entraîné : ${cfg.label} Lv ${current + 1} !`, cfg.emoji)
    showSpeech(`${cfg.emoji} ${cfg.label} Lv ${current + 1} !`)
    triggerParticles([cfg.emoji, '⭐', '💪'])
    await Promise.all([saveCreature(updated), saveJournal(nj)])
    onUpdate(updated, inventory, events, quests, nj)
  }

  const handlePlay = () => {
    if (creature.stats.energy < 10) { showSpeech('Trop fatigué pour jouer... 😴'); return }
    setShowActivityPicker(true)
  }

  const handleSelectActivity = (actKey: keyof typeof PLAY_ACTIVITIES) => {
    const act = PLAY_ACTIVITIES[actKey]
    const tr = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
    if (Object.values(tr).reduce((a, b) => a + b, 0) >= MAX_TRAINING_POINTS) { showSpeech(`Points épuisés !`); return }
    if (creature.stats.energy < act.costEnergy) { showSpeech("Pas assez d'énergie ! ⚡"); return }
    if (creature.stats.hunger < act.costHunger)  { showSpeech('Trop affamé ! 🍖'); return }
    setPendingActivity(actKey)
    setShowActivityPicker(false)
    setShowMiniGame(true)
    triggerPose('train', 999999)
  }

  const handleMiniGameEnd = async (score: number) => {
    setShowMiniGame(false)
    setCurrentPose(null)
    const act = pendingActivity ? PLAY_ACTIVITIES[pendingActivity] : null
    const xpGained = score * 3 + 10
    const happinessGain = Math.min(40, act ? act.happinessGain + score : score * 2 + 10)
    const tr = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
    const totalPts = Object.values(tr).reduce((a, b) => a + b, 0)
    const newTr = act && tr[act.stat] < 20 && totalPts < MAX_TRAINING_POINTS
      ? { ...tr, [act.stat]: tr[act.stat] + 1 } : tr
    const statLeveled = act && newTr[act.stat] > tr[act.stat]
    let updated: Creature = {
      ...creature, lastPlayed: new Date().toISOString(), totalPlayed: creature.totalPlayed + 1, training: newTr,
      stats: {
        ...creature.stats,
        happiness: Math.min(100, creature.stats.happiness + happinessGain),
        energy:    Math.max(0, creature.stats.energy - (act?.costEnergy ?? 15)),
        hunger:    Math.max(0, creature.stats.hunger  - (act?.costHunger ?? 10)),
      },
    }
    updated = { ...addXP(updated, xpGained), mood: getMood(updated.stats) }
    let nq = updateQuestsAfterAction(quests, 'play')
    nq = updateQuestsAfterAction(nq, 'level', updated.stats.level)
    const actLabel = act ? `${act.emoji} ${act.label}` : '🎮 Jeu'
    const statNote = statLeveled ? ` · ${TRAINING_CONFIG[act!.stat].label} Lv ${newTr[act!.stat]}` : ''
    let nj = addJournalEntry(journal, `${creature.name} a joué (${actLabel})${statNote} ! +${xpGained} XP`, act?.emoji ?? '🎮')
    const { updatedEvents, updatedQuests: q2, updatedJournal: j2 } = maybeSpawnEvent(updated, events, nq, nj)
    showSpeech(statLeveled ? `${act!.emoji} ${TRAINING_CONFIG[act!.stat].label} Lv ${newTr[act!.stat]} !` : getReactionMessage('play'))
    triggerParticles([act?.emoji ?? '🎮', '⭐', '🎉'])
    setPendingActivity(null)
    await Promise.all([saveCreature(updated), saveEvents(updatedEvents), saveQuests(q2), saveJournal(j2)])
    onUpdate(updated, inventory, updatedEvents, q2, j2)
  }

  const handleSleep = async () => {
    if (creature.stats.energy >= 95) { showSpeech('Je suis en pleine forme ! ⚡'); return }
    triggerPose('sleep', 3500)
    let updated: Creature = {
      ...creature, totalSlept: creature.totalSlept + 1,
      stats: { ...creature.stats, energy: Math.min(100, creature.stats.energy + 40), hunger: Math.max(0, creature.stats.hunger - 5) },
    }
    updated = { ...updated, mood: getMood(updated.stats) }
    let nq = updateQuestsAfterAction(quests, 'sleep')
    let nj = addJournalEntry(journal, `${creature.name} a fait une bonne sieste.`, '💤')
    showSpeech(getReactionMessage('sleep'))
    triggerParticles(['💤', '🌙', '⭐'])
    await Promise.all([saveCreature(updated), saveQuests(nq), saveJournal(nj)])
    onUpdate(updated, inventory, events, nq, nj)
  }

  const handleEventClose = async () => {
    if (!pendingEvent) return
    let updatedCreature = creature
    let newInv = inventory
    if (pendingEvent.type === 'sick')     updatedCreature = { ...creature, stats: { ...creature.stats, isSick: true } }
    if ((pendingEvent.type === 'dream' || pendingEvent.type === 'training') && pendingEvent.reward?.xp)
      updatedCreature = { ...addXP(creature, pendingEvent.reward.xp), mood: getMood(creature.stats) }
    if (pendingEvent.reward?.itemId) {
      const item = getRewardItem(pendingEvent.reward.itemId)
      if (item) newInv = addItemToInventory(inventory, item)
    }
    const newEvents = events.map((e) => e.id === pendingEvent.id ? { ...e, resolved: true } : e)
    setPendingEvent(null)
    await Promise.all([saveCreature(updatedCreature), saveInventory(newInv), saveEvents(newEvents)])
    onUpdate(updatedCreature, newInv, newEvents, quests, journal)
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
    let u = { ...creature }
    switch (action) {
      case 'xp100':      u = addXP(u, 100); break
      case 'xp500':      u = addXP(u, 500); break
      case 'xp9999':     u = addXP(u, 9999); break
      case 'maxstats':   u = { ...u, stats: { ...u.stats, hunger: 100, happiness: 100, energy: 100 } }; break
      case 'heal':       u = { ...u, stats: { ...u.stats, isSick: false } }; break
      case 'lv1':        u = { ...u, stats: { ...u.stats, level: 1,  xp: 0, xpToNextLevel: 100  } }; break
      case 'lv10':       u = { ...u, stats: { ...u.stats, level: 10, xp: 0, xpToNextLevel: 1000 } }; break
      case 'lv20':       u = { ...u, stats: { ...u.stats, level: 20, xp: 0, xpToNextLevel: 2000 } }; break
      case 'type_ignis': u = { ...u, type: 'ignis' }; break
      case 'type_nemo':  u = { ...u, type: 'nemo'  }; break
      case 'type_sylva': u = { ...u, type: 'sylva' }; break
      case 'type_zapp':  u = { ...u, type: 'zapp'  }; break
    }
    u = { ...u, mood: getMood(u.stats) }
    await saveCreature(u)
    onUpdate(u)
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

  // Skin navigation
  const allSkins = [null, ...(creature.ownedSkins ?? [])]
  const curSkinIdx = creature.skin ? Math.max(0, allSkins.indexOf(creature.skin)) : 0
  const handleSkinLeft  = () => onSkinChange(allSkins[(curSkinIdx - 1 + allSkins.length) % allSkins.length])
  const handleSkinRight = () => onSkinChange(allSkins[(curSkinIdx + 1) % allSkins.length])

  const training = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
  const totalTrainingPts = Object.values(training).reduce((a, b) => a + b, 0)
  const foodItems = inventory.filter((i) => (i.effect.hunger ?? 0) > 0)
  const previewInv = inventory.slice(0, 5)

  return (
    <SafeAreaView style={s.root}>
      <ParticleEffect trigger={particleTrigger} emojis={particleEmojis} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <View style={s.hero}>
        <ImageBackground source={TERRAIN[creature.type]} style={s.heroImg} resizeMode="cover">
          <View style={s.heroVignette} pointerEvents="none" />

          {/* Header */}
          <View style={s.heroHeader}>
            <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
              <Text style={s.heroTitle}>Croisio</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={s.heroIconBtn}>
              <Text style={s.heroIconTxt}>🎁</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.heroIconBtn} onPress={() => setShowAdmin(true)}>
              <Text style={s.heroIconTxt}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Chips */}
          <View style={s.chipsRow}>
            <View style={s.chip}><Text style={s.chipTxt}>{WEATHER_EMOJI[weather]} {WEATHER_LABEL[weather]}</Text></View>
            {!!streak && streak > 0 && (
              <View style={s.chip}><Text style={s.chipTxt}>🔥 {streak} jour{streak > 1 ? 's' : ''}</Text></View>
            )}
            <View style={s.chip}><Text style={[s.chipTxt, { color: '#F5A623' }]}>💰 {coins ?? 0}</Text></View>
          </View>

          {/* Speech bubble */}
          {speechVisible && (
            <View style={s.speech} pointerEvents="none">
              <Text style={s.speechQ}>❝</Text>
              <Text style={s.speechTxt}>{speechMsg}</Text>
            </View>
          )}

          {/* Level badges */}
          <View style={s.heroBadges}>
            <View style={s.lvBadge}><Text style={s.lvTxt}>Niv. {creature.stats.level}</Text></View>
            {creature.stats.level >= 20 && <View style={s.maxBadge}><Text style={s.maxTxt}>★ MAX</Text></View>}
            {creature.stats.level >= 10 && creature.stats.level < 20 && <View style={[s.maxBadge, { backgroundColor: '#555' }]}><Text style={s.maxTxt}>★ ADO</Text></View>}
          </View>

          {/* Creature */}
          <View style={s.heroCreature} pointerEvents="box-none">
            <CreatureDisplay creature={creature} pose={currentPose} onEvolve={handleEvolve} variant="hero" />
          </View>

          {/* Sick badge */}
          {creature.stats.isSick && !currentPose && (
            <View style={s.sickBadge} pointerEvents="none">
              <Text style={s.sickTxt}>🤒 Malade</Text>
            </View>
          )}

          {/* Skin arrows */}
          {allSkins.length > 1 && (
            <>
              <TouchableOpacity style={[s.arrow, s.arrowL]} onPress={handleSkinLeft} activeOpacity={0.7}>
                <View style={s.arrowCircle}>
                  <Text style={s.arrowTxt}>‹</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[s.arrow, s.arrowR]} onPress={handleSkinRight} activeOpacity={0.7}>
                <View style={s.arrowCircle}>
                  <Text style={s.arrowTxt}>›</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </ImageBackground>
      </View>

      {/* ── Scrollable content ────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#aaa" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ÉTAT */}
        <View style={s.section}>
          <Text style={s.sectionLbl}>État</Text>
          {([
            { label: 'Faim',    icon: '🍖', value: creature.stats.hunger,    max: 100, color: '#FF6B6B' },
            { label: 'Bonheur', icon: '⭐', value: creature.stats.happiness, max: 100, color: '#FFD700' },
            { label: 'Énergie', icon: '⚡', value: creature.stats.energy,    max: 100, color: '#44CC66' },
          ] as const).map(({ label, icon, value, max, color }) => (
            <View key={label} style={s.statRow}>
              <Text style={s.statIcon}>{icon}</Text>
              <Text style={s.statName}>{label}</Text>
              <View style={s.statTrack}>
                <View style={[s.statFill, { width: `${Math.min(100, (value / max) * 100)}%` as any, backgroundColor: color }]} />
              </View>
              <Text style={s.statVal}>{Math.round(value)}/{max}</Text>
            </View>
          ))}
          <View style={s.statRow}>
            <Text style={s.statIcon}>  </Text>
            <Text style={[s.statName, { color: '#A855F7' }]}>XP</Text>
            <View style={s.statTrack}>
              <View style={[s.statFill, { width: `${Math.min(100, (creature.stats.xp / creature.stats.xpToNextLevel) * 100)}%` as any, backgroundColor: '#A855F7' }]} />
            </View>
            <Text style={s.statVal}>{Math.round(creature.stats.xp)}/{creature.stats.xpToNextLevel}</Text>
          </View>
          {creature.activeCombatBuff && creature.activeCombatBuff.expiresAt > new Date().toISOString() && (
            <View style={s.buffRow}>
              <Text style={s.buffTxt}>⚔️ +{Math.round((creature.activeCombatBuff.damageMult - 1) * 100)}% dégâts actif</Text>
            </View>
          )}
        </View>

        {/* ACTIONS */}
        <View style={s.section}>
          <Text style={s.sectionLbl}>Actions</Text>
          <View style={s.actionsRow}>
            {([
              { label: 'Nourrir',     icon: '🍖', onPress: handleFeed,              disabled: creature.stats.hunger >= 95 },
              { label: 'Jouer',       icon: '🎮', onPress: handlePlay,              disabled: creature.stats.energy < 10 },
              { label: "S'entraîner", icon: '🏋️', onPress: () => setShowTraining(true), disabled: false },
              { label: 'Dormir',      icon: '💤', onPress: handleSleep,             disabled: creature.stats.energy >= 95 },
            ]).map(({ label, icon, onPress, disabled }) => (
              <TouchableOpacity key={label} style={[s.actionBtn, disabled && s.actionDisabled]} onPress={onPress} activeOpacity={0.75}>
                <Text style={s.actionIcon}>{icon}</Text>
                <Text style={s.actionLbl}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* COMBAT + AVENTURE */}
        <View style={s.modeRow}>
          <TouchableOpacity style={s.combatBtn} onPress={onOpenCrossings} activeOpacity={0.85}>
            <Text style={s.modeIcon}>⚔️</Text>
            <View>
              <Text style={s.modeTitle}>COMBATTRE</Text>
              <Text style={s.modeSub}>Défie des joueurs{'\n'}ou l'IA</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.adventureBtn} onPress={onOpenCrossings} activeOpacity={0.85}>
            <Text style={s.modeIcon}>📜</Text>
            <View>
              <Text style={[s.modeTitle, { color: '#C084FC' }]}>AVENTURE</Text>
              <Text style={s.modeSub}>Explore et gagne{'\n'}des récompenses</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* INVENTAIRE */}
        <View style={s.section}>
          <View style={s.invHeader}>
            <Text style={s.sectionLbl}>Inventaire</Text>
            <TouchableOpacity onPress={onOpenInventory}>
              <Text style={s.viewAll}>Voir tout ›</Text>
            </TouchableOpacity>
          </View>
          {inventory.length === 0 ? (
            <Text style={s.invEmpty}>Aucun objet. Gagne des combats !</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {previewInv.map((item) => (
                <View key={item.id} style={s.invItem}>
                  <Text style={s.invIcon}>{item.emoji}</Text>
                  <Text style={s.invQty}>×{item.quantity}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* ── Modals ───────────────────────────────────────────── */}
      <MiniGame
        visible={showMiniGame}
        onClose={handleMiniGameEnd}
        creatureType={creature.type}
        activityStat={pendingActivity ? PLAY_ACTIVITIES[pendingActivity].stat : undefined}
        trainingLevel={pendingActivity ? (creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 })[PLAY_ACTIVITIES[pendingActivity].stat] : 0}
      />

      <EventModal event={pendingEvent} onClose={handleEventClose} />

      {/* Food picker */}
      <Modal visible={showFoodPicker} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} onPress={() => setShowFoodPicker(false)} activeOpacity={1}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>🍽️ Que donner à manger ?</Text>
            {foodItems.length === 0 ? (
              <Text style={s.sheetEmpty}>Aucune nourriture. Gagne des combats !</Text>
            ) : (
              foodItems.map((item) => (
                <TouchableOpacity key={item.id} style={s.sheetRow} onPress={() => handleFeedWith(item)}>
                  <Text style={s.sheetRowIcon}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sheetRowName}>{item.name} ×{item.quantity}</Text>
                    <Text style={s.sheetRowSub}>{formatFoodEffects(item)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Activity picker */}
      <Modal visible={showActivityPicker} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} onPress={() => setShowActivityPicker(false)} activeOpacity={1}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>🎮 Choisir une activité</Text>
            {(Object.entries(PLAY_ACTIVITIES) as [string, typeof PLAY_ACTIVITIES[string]][]).map(([key, act]) => {
              const curLv = training[act.stat]
              const maxed = curLv >= 20
              const canPlay = !maxed && creature.stats.energy >= act.costEnergy && creature.stats.hunger >= act.costHunger
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.sheetRow, !canPlay && { opacity: 0.4 }]}
                  onPress={() => canPlay && handleSelectActivity(key)}
                  activeOpacity={canPlay ? 0.75 : 1}
                >
                  <Text style={s.sheetRowIcon}>{act.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sheetRowName}>{act.label} · {maxed ? '✅ Max' : `${TRAINING_CONFIG[act.stat].label} Lv ${curLv}/20`}</Text>
                    <Text style={s.sheetRowSub}>{act.desc} · -{act.costEnergy}⚡ -{act.costHunger}🍖</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Training */}
      <Modal visible={showTraining} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} onPress={() => setShowTraining(false)} activeOpacity={1}>
          <View style={s.sheet}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={s.sheetTitle}>⚔️ Entraînement</Text>
              <Text style={[s.sheetTitle, { fontSize: 13, color: totalTrainingPts >= MAX_TRAINING_POINTS ? '#FF6B6B' : '#888' }]}>
                {totalTrainingPts}/{MAX_TRAINING_POINTS} pts
              </Text>
            </View>
            {(Object.keys(TRAINING_CONFIG) as (keyof TrainingStats)[]).map((type) => {
              const cfg = TRAINING_CONFIG[type]
              const cur = training[type]
              const canTrain = cur < 20 && totalTrainingPts < MAX_TRAINING_POINTS
                && creature.stats.energy >= cfg.costEnergy && creature.stats.hunger >= cfg.costHunger
              return (
                <TouchableOpacity key={type} style={[s.sheetRow, !canTrain && { opacity: 0.4 }]}
                  onPress={() => canTrain && handleTrain(type)} activeOpacity={canTrain ? 0.75 : 1}>
                  <Text style={s.sheetRowIcon}>{cfg.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={s.sheetRowName}>{cfg.label}</Text>
                      <Text style={s.sheetRowName}>Lv {cur}/20</Text>
                    </View>
                    <Text style={s.sheetRowSub}>{cfg.desc} · -{cfg.costEnergy}⚡ -{cfg.costHunger}🍖</Text>
                    <View style={s.trainTrack}>
                      <View style={[s.trainFill, { width: `${(cur / 20) * 100}%` as any }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Admin */}
      <Modal visible={showAdmin} transparent animationType="slide">
        <View style={s.adminOverlay}>
          <View style={s.adminCard}>
            <Text style={s.adminTitle}>👾 Panel Admin</Text>
            <Text style={s.adminSub}>Lv {creature.stats.level} · {creature.stats.xp}/{creature.stats.xpToNextLevel} XP</Text>
            {(['XP', 'Niveau direct', 'Monstre', 'Stats'] as const).map((section) => (
              <Text key={section} style={s.adminSection}>{section}</Text>
            ))}
            <Text style={s.adminSection}>XP</Text>
            <View style={s.adminRow}>
              {(['xp100', '+100 XP'] as const).map ? null : null}
              {([['xp100','+100 XP'],['xp500','+500 XP'],['xp9999','+9999 XP']] as [string,string][]).map(([a,l]) => (
                <TouchableOpacity key={a} style={s.adminBtn} onPress={() => adminAction(a)}><Text style={s.adminBtnTxt}>{l}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={s.adminSection}>Niveau</Text>
            <View style={s.adminRow}>
              {([['lv1','Niv 1'],['lv10','Niv 10'],['lv20','Niv 20']] as [string,string][]).map(([a,l]) => (
                <TouchableOpacity key={a} style={[s.adminBtn,{backgroundColor:'#A855F7'}]} onPress={() => adminAction(a)}><Text style={s.adminBtnTxt}>{l}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={s.adminSection}>Type</Text>
            <View style={s.adminRow}>
              {([['type_ignis','🔥 Ignis','#C41E0F'],['type_nemo','🌊 Némo','#1A3A6B'],['type_sylva','🌿 Sylva','#2D6A2D'],['type_zapp','⚡ Zapp','#C47A00']] as [string,string,string][]).map(([a,l,c]) => (
                <TouchableOpacity key={a} style={[s.adminBtn,{backgroundColor:c}]} onPress={() => adminAction(a)}><Text style={s.adminBtnTxt}>{l}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={s.adminSection}>Stats</Text>
            <View style={s.adminRow}>
              <TouchableOpacity style={[s.adminBtn,{backgroundColor:'#22C55E'}]} onPress={() => adminAction('maxstats')}><Text style={s.adminBtnTxt}>Max tout</Text></TouchableOpacity>
              <TouchableOpacity style={[s.adminBtn,{backgroundColor:'#3B82F6'}]} onPress={() => adminAction('heal')}><Text style={s.adminBtnTxt}>Soigner</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={s.adminClose} onPress={() => setShowAdmin(false)}>
              <Text style={s.adminCloseTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Evolve */}
      <Modal visible={showEvolve} transparent animationType="fade">
        <View style={s.evolveOverlay}>
          <Animated.View style={[s.evolveCard, { transform: [{ scale: evolveScale }] }]}>
            <Text style={s.evolveEmoji}>✨</Text>
            <Text style={s.evolveTitle}>ÉVOLUTION !</Text>
            <Text style={s.evolveName}>{creature.name}</Text>
            <Text style={s.evolveDesc}>
              {evolveStage === 3 ? 'A atteint sa forme finale !\nLes ailes se déploient...' : 'A grandi et est devenu plus fort !\nSes cornes ont poussé...'}
            </Text>
            <Text style={s.evolveStage}>{evolveStage === 3 ? '★ FORME ULTIME' : '★ FORME ADO'}</Text>
            <TouchableOpacity style={s.evolveBtn} onPress={() => setShowEvolve(false)}>
              <Text style={s.evolveBtnTxt}>Incroyable !</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },

  // ── Hero ──────────────────────────────────────────────────
  hero: { height: HERO_H, overflow: 'hidden' },
  heroImg: { flex: 1 },
  heroVignette: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: '#0f0f1a', opacity: 0.4 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  heroTitle: {
    fontSize: 28, fontWeight: '800', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroIconTxt: { fontSize: 18 },

  chipsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 8 },
  chip: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#fff' },

  speech: {
    position: 'absolute', top: 82, left: 16, right: 110,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 10,
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6,
  },
  speechQ: { fontSize: 15, color: '#aaa', lineHeight: 20 },
  speechTxt: { flex: 1, fontSize: 13, color: '#1a1a2e', fontWeight: '500', lineHeight: 18 },

  heroBadges: { position: 'absolute', top: 90, right: 12, gap: 6, alignItems: 'flex-end' },
  lvBadge: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  lvTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  maxBadge: { backgroundColor: '#F59E0B', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  maxTxt: { color: '#fff', fontWeight: '800', fontSize: 11 },

  heroCreature: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  sickBadge: { position: 'absolute', bottom: 76, left: 16, backgroundColor: '#FFF3CD', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  sickTxt: { fontSize: 12, fontWeight: '700', color: '#856404' },

  arrow: {
    position: 'absolute', top: 0, bottom: 0, width: 60, alignItems: 'center', justifyContent: 'center',
  },
  arrowL: { left: 4 },
  arrowR: { right: 4 },
  arrowCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.38)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  arrowTxt: { fontSize: 22, color: '#fff', fontWeight: '700', marginTop: -1 },

  // ── Scroll content ────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 24, gap: 10 },

  section: { marginHorizontal: 12, backgroundColor: '#1a1a2e', borderRadius: 16, padding: 14 },
  sectionLbl: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#55557a', textTransform: 'uppercase', marginBottom: 10 },

  // Stats
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statIcon: { fontSize: 14, width: 22, textAlign: 'center' },
  statName: { fontSize: 13, fontWeight: '600', color: '#9999bb', width: 68 },
  statTrack: { flex: 1, height: 6, backgroundColor: '#2a2a3e', borderRadius: 3, overflow: 'hidden' },
  statFill: { height: 6, borderRadius: 3 },
  statVal: { fontSize: 11, color: '#55557a', width: 48, textAlign: 'right' },
  buffRow: { marginTop: 4, backgroundColor: '#FFD70011', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#FFD70033' },
  buffTxt: { fontSize: 11, fontWeight: '700', color: '#C47A00' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#252540', borderRadius: 12, paddingVertical: 13, gap: 5 },
  actionDisabled: { opacity: 0.35 },
  actionIcon: { fontSize: 24 },
  actionLbl: { fontSize: 11, fontWeight: '600', color: '#ccc' },

  // Combat / Aventure
  modeRow: { flexDirection: 'row', gap: 10, marginHorizontal: 12 },
  combatBtn: {
    flex: 1, backgroundColor: '#162040', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  adventureBtn: {
    flex: 1, backgroundColor: '#1e1040', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  modeIcon: { fontSize: 28 },
  modeTitle: { fontSize: 13, fontWeight: '800', color: '#60A5FA', letterSpacing: 0.5 },
  modeSub: { fontSize: 11, color: '#6688aa', marginTop: 2, lineHeight: 15 },

  // Inventory preview
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAll: { fontSize: 12, color: '#F5A623', fontWeight: '600' },
  invItem: { width: 64, alignItems: 'center', backgroundColor: '#252540', borderRadius: 12, paddingVertical: 10, gap: 4 },
  invIcon: { fontSize: 28 },
  invQty: { fontSize: 11, color: '#888', fontWeight: '600' },
  invEmpty: { fontSize: 12, color: '#55557a', textAlign: 'center', paddingVertical: 12 },

  // Bottom sheets
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 38 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 14 },
  sheetEmpty: { fontSize: 13, color: '#55557a', textAlign: 'center', padding: 20 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#252540', borderRadius: 12, padding: 12, marginBottom: 8 },
  sheetRowIcon: { fontSize: 26, width: 32, textAlign: 'center' },
  sheetRowName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sheetRowSub: { fontSize: 11, color: '#888', marginTop: 2 },
  trainTrack: { height: 4, backgroundColor: '#2a2a3e', borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  trainFill: { height: 4, backgroundColor: '#7C3AED', borderRadius: 2 },

  // Admin
  adminOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  adminCard: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20 },
  adminTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  adminSub: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 16 },
  adminSection: { fontSize: 11, fontWeight: '700', color: '#55557a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 10 },
  adminRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  adminBtn: { backgroundColor: '#7C3AED', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  adminBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  adminClose: { marginTop: 20, backgroundColor: '#252540', borderRadius: 12, padding: 12, alignItems: 'center' },
  adminCloseTxt: { color: '#aaa', fontWeight: '700', fontSize: 14 },

  // Evolve
  evolveOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center' },
  evolveCard: { backgroundColor: '#1a1a2e', borderRadius: 24, padding: 32, alignItems: 'center', gap: 12, margin: 24 },
  evolveEmoji: { fontSize: 48 },
  evolveTitle: { fontSize: 28, fontWeight: '900', color: '#FFD700', letterSpacing: 2 },
  evolveName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  evolveDesc: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  evolveStage: { fontSize: 13, fontWeight: '800', color: '#FFD700', letterSpacing: 1 },
  evolveBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 },
  evolveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
