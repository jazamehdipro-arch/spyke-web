import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'
import CreatureDisplay, { CreaturePose } from '../components/CreatureDisplay'
import EventModal from '../components/EventModal'
import MiniGame from '../components/MiniGame'
import ParticleEffect from '../components/ParticleEffect'
import { Creature, Crossing, GameEvent, InventoryItem, JournalEntry, Quest, TrainingStats } from '../types'
import { DAILY_CARE_XP_CAP, FORME_LABELS, MAX_CREATURE_LEVEL, addCareXPWithConversion, addXPWithConversion, applyActiveCareTick, applyOfflineCareDecay, getFormeLevel, getMood, xpForLevel } from '../utils/creature'
import { generateRandomEvent, getRewardItem, shouldTriggerEvent } from '../utils/events'
import { getCreatureSpeech, getReactionMessage } from '../utils/speech'
import { addItemToInventory, addJournalEntry, loadCrossings, saveCreature, saveEvents, saveInventory, saveJournal, saveQuests } from '../utils/storage'
import { updateQuestsAfterAction } from '../utils/quests'
import { retro, retroShadow, typeTheme } from '../styles/retro'
import { PixelBar, PixelButton, SectionTitle } from '../components/ui'
import TutorialCoach, { CoachStep } from '../components/TutorialCoach'

const { height: SCREEN_H } = Dimensions.get('window')
const HERO_H = Math.round(SCREEN_H * 0.38)

const TRAINING_CONFIG: Record<keyof TrainingStats, { label: string; emoji: string; desc: string; costEnergy: number; costHunger: number }> = {
  strength:  { label: 'Force',     emoji: '💪', desc: '+0.8% dégâts',       costEnergy: 18, costHunger: 8  },
  reflexes:  { label: 'Réflexes',  emoji: '🔰', desc: '-0.7% dégâts reçus', costEnergy: 18, costHunger: 8  },
  endurance: { label: 'Endurance', emoji: '🛡️', desc: '+énergie & +PV max', costEnergy: 18, costHunger: 8  },
  defense:   { label: 'Défense',   emoji: '🎯', desc: '+0.65% esquive',      costEnergy: 18, costHunger: 8  },
}

const MAX_TRAINING_POINTS = 40

const PLAY_ACTIVITIES: Record<string, {
  label: string; emoji: string; desc: string
  stat: keyof TrainingStats
  costEnergy: number; costHunger: number; happinessGain: number
}> = {
  sparring:  { label: 'Combat',    emoji: '🥊', desc: 'Entraînement de force au sac',       stat: 'strength',  costEnergy: 10, costHunger: 0,  happinessGain: 15 },
  agility:   { label: 'Agilité',   emoji: '🏃', desc: "Parcours d'obstacles et de vitesse", stat: 'reflexes',  costEnergy: 10, costHunger: 0,  happinessGain: 15 },
  endurance: { label: 'Endurance', emoji: '🧗', desc: 'Escalade et exercices cardio',        stat: 'endurance', costEnergy: 10, costHunger: 0,  happinessGain: 15 },
  puzzle:    { label: 'Stratégie', emoji: '🧩', desc: 'Puzzles tactiques et réflexion',      stat: 'defense',   costEnergy: 10, costHunger: 0,  happinessGain: 15 },
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
    journal?: JournalEntry[],
    dailyQuests?: undefined,
    coins?: number
  ) => void
  onSkinChange: (skin: string | null) => void
  onOpenInventory: () => void
  onOpenBoutique: () => void
  onOpenCrossings: () => void
  onResetTutorial?: () => void
  tutorialActive?: boolean
  onTutorialDone?: () => void
}

export default function HomeScreen({
  creature, inventory, events, quests, journal,
  streak, coins, onUpdate, onSkinChange, onOpenInventory, onOpenBoutique, onOpenCrossings,
  onResetTutorial, tutorialActive, onTutorialDone,
}: Props) {
  const applyXPReward = (base: Creature, amount: number, care = false): { creature: Creature; coins: number } => {
    const result = care ? addCareXPWithConversion(base, amount) : addXPWithConversion(base, amount)
    return {
      creature: { ...result.creature, mood: getMood(result.creature.stats) },
      coins: result.convertedCoins,
    }
  }

  const todayCareXP = (() => {
    const today = new Date().toISOString().slice(0, 10)
    return creature.dailyCareXPDate === today ? (creature.dailyCareXP ?? 0) : 0
  })()

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
  const [boredomCount, setBoredomCount] = useState(0)
  const [todayCrossings, setTodayCrossings] = useState(0)
  const evolveScale = useRef(new Animated.Value(0)).current
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeCareTick = useRef(Date.now())
  const boredomRef = useRef<{ key: string | null; count: number }>({ key: null, count: 0 })
  const titleTapCount = useRef(0)
  const titleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Tutorial coach targets ──
  const scrollRef       = useRef<ScrollView | null>(null)
  const tutCreatureRef  = useRef<View | null>(null)
  const tutStatsRef     = useRef<View | null>(null)
  const tutSacRef       = useRef<View | null>(null)
  const tutBoutiqueRef  = useRef<View | null>(null)
  const tutActionsRef   = useRef<View | null>(null)
  const [tutReady, setTutReady] = useState(false)

  // When tutorial starts, scroll to top so the stat bars are measurable
  useEffect(() => {
    if (!tutorialActive) { setTutReady(false); return }
    scrollRef.current?.scrollTo({ y: 0, animated: false })
    const t = setTimeout(() => setTutReady(true), 400)
    return () => clearTimeout(t)
  }, [tutorialActive])

  const tutorialSteps: CoachStep[] = [
    {
      id: 'welcome',
      title: `Voici ${creature.name} !`,
      text: `Bienvenue ! Je vais te montrer comment t'occuper de ${creature.name} en quelques secondes. Suis les bulles.`,
      placement: 'center',
    },
    {
      id: 'creature',
      title: 'Ta créature',
      text: `C'est ${creature.name}. Touche-le pour le caresser et le rendre heureux. Son humeur change selon tes soins.`,
      target: tutCreatureRef,
    },
    {
      id: 'stats',
      title: 'Surveille son état',
      text: 'Faim, Bonheur et Énergie baissent avec le temps. S\'ils tombent trop bas, ta créature devient malade et plus faible au combat.',
      target: tutStatsRef,
    },
    {
      id: 'actions',
      title: 'Occupe-toi de lui',
      text: 'Nourris, joue, entraîne ou fais dormir ta créature ici. Chaque action lui donne de l\'XP et le fait évoluer.',
      target: tutActionsRef,
    },
    {
      id: 'sac',
      title: 'Le Sac',
      text: 'Ouvre ton sac pour utiliser tes objets : nourriture, soins et boîtes mystères.',
      target: tutSacRef,
    },
    {
      id: 'boutique',
      title: 'La Boutique',
      text: 'Dépense tes pièces 💰 (gagnées en combat et en quêtes) pour acheter de la nourriture et des objets rares.',
      target: tutBoutiqueRef,
    },
    {
      id: 'tabs',
      title: 'Combat & Croisements',
      text: 'En bas : l\'onglet ⚔️ Combat pour affronter joueurs et IA, et 🤝 Croisements pour rencontrer les dresseurs près de toi. On va faire un combat d\'entraînement !',
      placement: 'center',
      ctaLabel: '⚔️ Combat test !',
    },
  ]

  const streakXPBonus = (streak ?? 0) > 0 ? 1.1 : 1.0

  useEffect(() => {
    loadCrossings().then(list => {
      const today = new Date().toISOString().slice(0, 10)
      setTodayCrossings((list ?? []).filter((c: Crossing) => c.crossedAt.startsWith(today)).length)
    })
  }, [])

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

  useEffect(() => {
    activeCareTick.current = Date.now()
    const interval = setInterval(async () => {
      const now = Date.now()
      const hours = (now - activeCareTick.current) / (1000 * 60 * 60)
      activeCareTick.current = now
      if (hours <= 0) return
      const updated = applyActiveCareTick(creature, hours)
      if (updated === creature) return
      await saveCreature(updated)
      onUpdate(updated)
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [creature, onUpdate])

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
    if (creature.stats.hunger >= 90) { showSpeech('J\'ai déjà assez mangé ! 🙅'); return }
    setShowFoodPicker(true)
  }

  const handleFeedWith = async (item: InventoryItem) => {
    setShowFoodPicker(false)
    boredomRef.current = { key: null, count: 0 }
    setBoredomCount(0)
    triggerPose('eat')
    let isSick = creature.stats.isSick
    if (item.effect.combatBuff?.sickChance && Math.random() < item.effect.combatBuff.sickChance) isSick = true
    let activeCombatBuff = creature.activeCombatBuff
    if (item.effect.combatBuff) {
      const expiresAt = new Date(Date.now() + item.effect.combatBuff.durationMin * 60 * 1000).toISOString()
      activeCombatBuff = { damageMult: item.effect.combatBuff.damageMult, expiresAt }
    }
    const hungerBonus = creature.stats.hunger < 30 && (item.effect.hunger ?? 0) > 0 ? 5 : 0
    let updated: Creature = {
      ...creature, lastFed: new Date().toISOString(), totalFed: creature.totalFed + 1, activeCombatBuff,
      stats: {
        ...creature.stats,
        hunger:    Math.min(100, creature.stats.hunger    + (item.effect.hunger    ?? 0)),
        happiness: Math.min(100, Math.max(0, creature.stats.happiness + (item.effect.happiness ?? 0) + hungerBonus)),
        energy:    Math.min(100, Math.max(0, creature.stats.energy    + (item.effect.energy    ?? 0))),
        isSick,
      },
    }
    const xpReward = applyXPReward(updated, Math.round(5 * streakXPBonus), true)
    updated = xpReward.creature
    const newCoins = (coins ?? 0) + xpReward.coins
    const newInv = inventory.map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter((i) => i.quantity > 0)
    let nq = updateQuestsAfterAction(quests, 'feed')
    nq = updateQuestsAfterAction(nq, 'level', updated.stats.level)
    let nj = addJournalEntry(journal, `${creature.name} a mangé ${item.emoji} ${item.name}.`, item.emoji)
    const { updatedEvents, updatedQuests: q2, updatedJournal: j2 } = maybeSpawnEvent(updated, events, nq, nj)
    showSpeech(getReactionMessage('feed'))
    triggerParticles([item.emoji, '❤️', '✨'])
    await Promise.all([saveCreature(updated), saveInventory(newInv), saveEvents(updatedEvents), saveQuests(q2), saveJournal(j2)])
    onUpdate(updated, newInv, updatedEvents, q2, j2, undefined, newCoins)
  }

  const handleTrain = async (type: keyof TrainingStats) => {
    boredomRef.current = { key: null, count: 0 }
    setBoredomCount(0)
    const cfg = TRAINING_CONFIG[type]
    const tr = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
    const current = tr[type]
    const totalPts = Object.values(tr).reduce((a, b) => a + b, 0)
    const hasPending = (creature.pendingTrainingPoints ?? 0) > 0
    if (current >= 20)              { showSpeech(`${cfg.emoji} Stat maximale !`); return }
    if (totalPts >= MAX_TRAINING_POINTS) { showSpeech(`Points épuisés !`); return }
    if (!hasPending) {
      if (creature.stats.energy < 20)            { showSpeech('Trop épuisé pour s\'entraîner ! 😴'); return }
      if (creature.stats.energy < cfg.costEnergy){ showSpeech(`Trop fatigué ! ⚡`); return }
      if (creature.stats.hunger < cfg.costHunger){ showSpeech(`Trop affamé ! 🍖`); return }
    }
    const newTr: TrainingStats = { ...tr, [type]: current + 1 }
    let updated: Creature = {
      ...creature, training: newTr,
      pendingTrainingPoints: hasPending ? (creature.pendingTrainingPoints ?? 1) - 1 : (creature.pendingTrainingPoints ?? 0),
      stats: hasPending ? creature.stats : {
        ...creature.stats,
        energy: creature.stats.energy - cfg.costEnergy,
        hunger: Math.max(0, creature.stats.hunger - cfg.costHunger),
      },
    }
    const xpReward = applyXPReward(updated, Math.round(5 * streakXPBonus))
    updated = xpReward.creature
    const newCoins = (coins ?? 0) + xpReward.coins
    const nj = addJournalEntry(journal, `${creature.name} s'est entraîné : ${cfg.label} Lv ${current + 1} !`, cfg.emoji)
    showSpeech(`${cfg.emoji} ${cfg.label} Lv ${current + 1} !`)
    triggerParticles([cfg.emoji, '⭐', '💪'])
    await Promise.all([saveCreature(updated), saveJournal(nj)])
    onUpdate(updated, inventory, events, quests, nj, undefined, newCoins)
  }

  const handlePlay = () => {
    if (creature.stats.energy < 20) { showSpeech('Trop épuisé pour jouer... 😴'); return }
    setShowActivityPicker(true)
  }

  const handleSelectActivity = (actKey: keyof typeof PLAY_ACTIVITIES) => {
    const act = PLAY_ACTIVITIES[actKey]
    const tr = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
    if (Object.values(tr).reduce((a, b) => a + b, 0) >= MAX_TRAINING_POINTS) { showSpeech(`Points épuisés !`); return }
    if (creature.stats.energy < 20)              { showSpeech('Trop épuisé pour jouer... 😴'); return }
    if (creature.stats.energy < act.costEnergy)  { showSpeech("Pas assez d'énergie ! ⚡"); return }
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
    const boredomKey = pendingActivity ?? 'play'
    if (boredomRef.current.key === boredomKey) {
      boredomRef.current.count += 1
    } else {
      boredomRef.current = { key: boredomKey, count: 1 }
    }
    setBoredomCount(boredomRef.current.count)
    const boredomMult = Math.pow(0.8, Math.max(0, boredomRef.current.count - 1))
    const baseHappinessGain = Math.min(40, act ? act.happinessGain + score : score * 2 + 10)
    const happinessGain = Math.max(1, Math.round(baseHappinessGain * boredomMult))
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
        hunger:    Math.max(0, creature.stats.hunger  - (act?.costHunger ?? 0)),
      },
    }
    const xpReward = applyXPReward(updated, Math.round(5 * streakXPBonus), true)
    updated = xpReward.creature
    const newCoins = (coins ?? 0) + xpReward.coins
    let nq = updateQuestsAfterAction(quests, 'play')
    nq = updateQuestsAfterAction(nq, 'level', updated.stats.level)
    const actLabel = act ? `${act.emoji} ${act.label}` : '🎮 Jeu'
    const statNote = statLeveled ? ` · ${TRAINING_CONFIG[act!.stat].label} Lv ${newTr[act!.stat]}` : ''
    let nj = addJournalEntry(journal, `${creature.name} a joué (${actLabel})${statNote} ! +5 XP`, act?.emoji ?? '🎮')
    const { updatedEvents, updatedQuests: q2, updatedJournal: j2 } = maybeSpawnEvent(updated, events, nq, nj)
    showSpeech(statLeveled ? `${act!.emoji} ${TRAINING_CONFIG[act!.stat].label} Lv ${newTr[act!.stat]} !` : getReactionMessage('play'))
    triggerParticles([act?.emoji ?? '🎮', '⭐', '🎉'])
    setPendingActivity(null)
    await Promise.all([saveCreature(updated), saveEvents(updatedEvents), saveQuests(q2), saveJournal(j2)])
    onUpdate(updated, inventory, updatedEvents, q2, j2, undefined, newCoins)
  }

  const handleSleep = async () => {
    boredomRef.current = { key: null, count: 0 }
    setBoredomCount(0)
    if (creature.stats.energy >= 95) { showSpeech('Je suis en pleine forme ! ⚡'); return }
    triggerPose('sleep', 3500)
    const sleepRecovery = 60
    let updated: Creature = {
      ...creature, lastPlayed: new Date().toISOString(), totalSlept: creature.totalSlept + 1,
      stats: { ...creature.stats, energy: Math.min(100, creature.stats.energy + sleepRecovery), hunger: Math.max(10, creature.stats.hunger - 3) },
    }
    const xpReward = applyXPReward(updated, Math.round(5 * streakXPBonus), true)
    updated = xpReward.creature
    const newCoins = (coins ?? 0) + xpReward.coins
    let nq = updateQuestsAfterAction(quests, 'sleep')
    let nj = addJournalEntry(journal, `${creature.name} a fait une bonne sieste.`, '💤')
    showSpeech(getReactionMessage('sleep'))
    triggerParticles(['💤', '🌙', '⭐'])
    await Promise.all([saveCreature(updated), saveQuests(nq), saveJournal(nj)])
    onUpdate(updated, inventory, events, nq, nj, undefined, newCoins)
  }

  const handleEventClose = async () => {
    if (!pendingEvent) return
    let updatedCreature = creature
    let newInv = inventory
    let convertedCoins = 0
    if (pendingEvent.type === 'sick')     updatedCreature = { ...creature, stats: { ...creature.stats, isSick: true } }
    if ((pendingEvent.type === 'dream' || pendingEvent.type === 'training') && pendingEvent.reward?.xp) {
      const xpReward = applyXPReward(creature, pendingEvent.reward.xp)
      updatedCreature = xpReward.creature
      convertedCoins = xpReward.coins
    }
    if (pendingEvent.reward?.itemId) {
      const item = getRewardItem(pendingEvent.reward.itemId)
      if (item) newInv = addItemToInventory(inventory, item)
    }
    const newEvents = events.map((e) => e.id === pendingEvent.id ? { ...e, resolved: true } : e)
    setPendingEvent(null)
    await Promise.all([saveCreature(updatedCreature), saveInventory(newInv), saveEvents(newEvents)])
    onUpdate(updatedCreature, newInv, newEvents, quests, journal, undefined, (coins ?? 0) + convertedCoins)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    const withMood = applyOfflineCareDecay(creature)
    await saveCreature(withMood)
    onUpdate(withMood)
    setRefreshing(false)
  }, [creature])

  const adminAction = async (action: string) => {
    let u = { ...creature }
    switch (action) {
      case 'xp100':      u = addXPWithConversion(u, 100).creature; break
      case 'xp500':      u = addXPWithConversion(u, 500).creature; break
      case 'xp9999':     u = addXPWithConversion(u, 9999).creature; break
      case 'maxstats':   u = { ...u, stats: { ...u.stats, hunger: 100, happiness: 100, energy: 100 } }; break
      case 'heal':       u = { ...u, stats: { ...u.stats, isSick: false } }; break
      case 'lv1':        u = { ...u, stats: { ...u.stats, level: 1,  xp: 0, xpToNextLevel: xpForLevel(1)  } }; break
      case 'lv10':       u = { ...u, stats: { ...u.stats, level: 10, xp: 0, xpToNextLevel: xpForLevel(10) } }; break
      case 'lv20':       u = { ...u, stats: { ...u.stats, level: 20, xp: 0, xpToNextLevel: xpForLevel(20) } }; break
      case 'lv30':       u = { ...u, stats: { ...u.stats, level: 30, xp: 0, xpToNextLevel: xpForLevel(30) } }; break
      case 'type_ignis': u = { ...u, type: 'ignis' }; break
      case 'type_nemo':  u = { ...u, type: 'nemo'  }; break
      case 'type_sylva': u = { ...u, type: 'sylva' }; break
      case 'type_zapp':  u = { ...u, type: 'zapp'  }; break
      case 'resettraining': u = { ...u, training: { strength: 0, reflexes: 0, endurance: 0, defense: 0 } }; break
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

  const allSkins = [null, ...(creature.ownedSkins ?? [])]
  const curSkinIdx = creature.skin ? Math.max(0, allSkins.indexOf(creature.skin)) : 0
  const handleSkinLeft  = () => onSkinChange(allSkins[(curSkinIdx - 1 + allSkins.length) % allSkins.length])
  const handleSkinRight = () => onSkinChange(allSkins[(curSkinIdx + 1) % allSkins.length])

  const training = creature.training ?? { strength: 0, reflexes: 0, endurance: 0, defense: 0 }
  const totalTrainingPts = Object.values(training).reduce((a, b) => a + b, 0)
  const foodItems = inventory.filter((i) => (i.effect.hunger ?? 0) > 0)
  const previewInv = inventory.slice(0, 5)
  const activeQuest = quests
    .filter(q => !q.completed && !q.claimed)
    .sort((a, b) => (b.progress / b.target) - (a.progress / a.target))[0] ?? null

  const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 54
  const theme = typeTheme[creature.type]

  return (
    <View style={s.root}>
      <ExpoStatusBar style="light" />
      <ParticleEffect trigger={particleTrigger} emojis={particleEmojis} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <View style={s.hero}>
        {/* Dark LCD bezel */}
        <View style={s.heroBezel}>
          {/* Ground shadow */}
          <View style={s.heroGround} pointerEvents="none" />
          {/* Bottom fade to paper */}
          <View style={s.heroVignette} pointerEvents="none" />

          {/* Header bar */}
          <View style={[s.heroHeader, { paddingTop: statusBarH + 10 }]}>
            <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
              <Text style={s.heroTitle}>Croisio</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            {(streak ?? 0) > 0 && (
              <View style={s.streakChip}>
                <Text style={s.streakTxt}>🔥 {streak}j</Text>
              </View>
            )}
            <View style={s.coinChip}>
              <Text style={s.coinTxt}>💰 {coins ?? 0}</Text>
            </View>
            <TouchableOpacity style={s.heroIconBtn} onPress={() => setShowAdmin(true)}>
              <Text style={s.heroIconTxt}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Speech bubble */}
          {speechVisible && (
            <View style={[s.speech, { top: statusBarH + 56 }]} pointerEvents="none">
              <Text style={s.speechQ}>❝</Text>
              <Text style={s.speechTxt}>{speechMsg}</Text>
            </View>
          )}

          {/* Level + evo badges — right column */}
          <View style={[s.heroBadges, { top: statusBarH + 56 }]}>
            <View style={s.lvBadge}><Text style={s.lvTxt}>Niv.{creature.stats.level}</Text></View>
            {creature.stats.level >= 20 && (
              <View style={[s.evoBadge, { backgroundColor: retro.gold, borderColor: retro.goldDark }]}>
                <Text style={s.evoTxt}>★ MAX</Text>
              </View>
            )}
            {creature.stats.level >= 10 && creature.stats.level < 20 && (
              <View style={[s.evoBadge, { backgroundColor: retro.ink2, borderColor: retro.ink }]}>
                <Text style={s.evoTxt}>★ ADO</Text>
              </View>
            )}
          </View>

          {/* Creature */}
          <View ref={tutCreatureRef} collapsable={false} style={s.heroCreature} pointerEvents="box-none">
            <CreatureDisplay creature={creature} pose={currentPose} onEvolve={handleEvolve} variant="hero" />
          </View>

          {/* Sick badge */}
          {creature.stats.isSick && !currentPose && (
            <View style={s.sickBadge} pointerEvents="none">
              <Text style={s.sickTxt}>🤒 Malade</Text>
            </View>
          )}

          {/* Sac + Boutique + skin nav — bottom left */}
          <View style={s.heroBottomLeft}>
            <View style={s.heroBottomBtns}>
              <View ref={tutSacRef} collapsable={false}>
                <TouchableOpacity style={s.invSideBtn} onPress={onOpenInventory} activeOpacity={0.8}>
                  <Text style={s.invSideBtnEmoji}>🎒</Text>
                  <Text style={s.invSideBtnLbl}>Sac</Text>
                </TouchableOpacity>
              </View>
              <View ref={tutBoutiqueRef} collapsable={false}>
                <TouchableOpacity style={s.invSideBtn} onPress={onOpenBoutique} activeOpacity={0.8}>
                  <Text style={s.invSideBtnEmoji}>🛍️</Text>
                  <Text style={s.invSideBtnLbl}>Boutique</Text>
                </TouchableOpacity>
              </View>
            </View>
            {allSkins.length > 1 && (
              <View style={s.skinNav}>
                <TouchableOpacity style={s.skinArrow} onPress={handleSkinLeft} activeOpacity={0.7}>
                  <Text style={s.skinArrowTxt}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.skinArrow} onPress={handleSkinRight} activeOpacity={0.7}>
                  <Text style={s.skinArrowTxt}>›</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Colored nameplate — type accent bar */}
        <View style={[s.nameplate, { backgroundColor: theme.main, borderColor: theme.dark }]}>
          <Text style={s.nameplateCreature}>{creature.name}</Text>
          <View style={s.nameplateRight}>
            {(() => {
              const fl = getFormeLevel(creature.stats)
              const flData = FORME_LABELS[fl]
              return <Text style={s.nameplateForm}>{flData.emoji} {flData.label}</Text>
            })()}
          </View>
        </View>
      </View>

      {/* ── Scrollable content ────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        scrollEnabled={!tutorialActive}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#aaa" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ÉTAT */}
        <View ref={tutStatsRef} collapsable={false} style={s.section}>
          <SectionTitle title="ÉTAT" color={retro.red} style={{ marginBottom: 12 }} />
          {([
            { label: 'Faim',    icon: '🍖', value: creature.stats.hunger,    max: 100, color: retro.red },
            { label: 'Bonheur', icon: '⭐', value: creature.stats.happiness, max: 100, color: retro.gold },
            { label: 'Énergie', icon: '⚡', value: creature.stats.energy,    max: 100, color: retro.mint },
          ] as const).map(({ label, icon, value, max, color }) => (
            <View key={label} style={s.statRow}>
              <Text style={s.statIcon}>{icon}</Text>
              <Text style={s.statName}>{label}</Text>
              <PixelBar value={value / max} color={color} cells={10} height={12} style={{ flex: 1 }} />
              <Text style={s.statVal}>{Math.round(value)}</Text>
            </View>
          ))}
          {(() => {
            const fl = getFormeLevel(creature.stats)
            const flData = FORME_LABELS[fl]
            return (
              <View style={s.formeRow}>
                <Text style={s.formeLbl}>Forme</Text>
                <Text style={[s.formeVal, { color: flData.color }]}>{flData.emoji} {flData.label}</Text>
              </View>
            )
          })()}
          <View style={s.statRow}>
            <Text style={s.statIcon}>  </Text>
            <Text style={[s.statName, { color: retro.purple }]}>XP</Text>
            <PixelBar value={creature.stats.level >= MAX_CREATURE_LEVEL ? 1 : creature.stats.xp / creature.stats.xpToNextLevel} color={retro.purple} cells={10} height={12} style={{ flex: 1 }} />
            <Text style={s.statVal}>{creature.stats.level >= MAX_CREATURE_LEVEL ? 'MAX' : `${Math.round(creature.stats.xp)}/${creature.stats.xpToNextLevel}`}</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statIcon}>  </Text>
            <Text style={[s.statName, { color: retro.faded, fontSize: 11 }]}>Soin/j</Text>
            <PixelBar
              value={todayCareXP / DAILY_CARE_XP_CAP}
              color={todayCareXP >= DAILY_CARE_XP_CAP ? retro.red : retro.faded}
              cells={10} height={10} style={{ flex: 1 }}
            />
            <Text style={[s.statVal, { fontSize: 10 }]}>{todayCareXP}/{DAILY_CARE_XP_CAP}</Text>
          </View>
          {creature.activeCombatBuff && creature.activeCombatBuff.expiresAt > new Date().toISOString() && (
            <View style={s.buffRow}>
              <Text style={s.buffTxt}>⚔️ +{Math.round((creature.activeCombatBuff.damageMult - 1) * 100)}% dégâts actif</Text>
            </View>
          )}
          {todayCrossings > 0 && (
            <TouchableOpacity style={s.crossingRow} onPress={onOpenCrossings} activeOpacity={0.8}>
              <Text style={s.crossingTxt}>🌐 {todayCrossings} croisement{todayCrossings > 1 ? 's' : ''} aujourd'hui</Text>
              <Text style={s.crossingArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ACTIONS */}
        <View ref={tutActionsRef} collapsable={false} style={s.section}>
          <SectionTitle title="ACTIONS" color={retro.red} style={{ marginBottom: 12 }} />
          <View style={s.actionsRow}>
            {([
              { label: 'Nourrir',     icon: '🍖', onPress: handleFeed,                   disabled: creature.stats.hunger >= 90,  color: retro.red },
              { label: 'Jouer',       icon: '🎮', onPress: handlePlay,                   disabled: creature.stats.energy < 20,   color: retro.blue },
              { label: "S'entraîner", icon: '🏋️', onPress: () => setShowTraining(true),  disabled: false,                        color: retro.purple },
              { label: 'Dormir',      icon: '💤', onPress: handleSleep,                  disabled: creature.stats.energy >= 95,  color: retro.mintDark },
            ]).map(({ label, icon, onPress, disabled, color }) => (
              <PixelButton key={label} onPress={onPress} disabled={disabled} color={color} style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, textAlign: 'center' }}>{icon}</Text>
                <Text style={s.actionLbl}>{label}</Text>
              </PixelButton>
            ))}
          </View>
          {boredomCount >= 3 && (
            <View style={s.boredomWarn}>
              <Text style={s.boredomTxt}>🥱 {creature.name} s'ennuie — varie les activités !</Text>
            </View>
          )}
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
              <Text style={s.modeTitle}>AVENTURE</Text>
              <Text style={s.modeSub}>Explore et gagne{'\n'}des récompenses</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* QUÊTE ACTIVE */}
        {activeQuest && (
          <View style={[s.section, s.questSection]}>
            <View style={s.questHeader}>
              <Text style={s.questEmoji}>{activeQuest.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.questTitle}>{activeQuest.title}</Text>
                <Text style={s.questDesc}>{activeQuest.description}</Text>
              </View>
              <Text style={s.questProg}>{activeQuest.progress}/{activeQuest.target}</Text>
            </View>
            <View style={s.questTrack}>
              <View style={[s.questFill, { width: `${Math.min(100, (activeQuest.progress / activeQuest.target) * 100)}%` as any }]} />
            </View>
          </View>
        )}

        {/* INVENTAIRE */}
        <View style={s.section}>
          <View style={s.invHeader}>
            <SectionTitle title="INVENTAIRE" color={retro.red} />
            <TouchableOpacity onPress={onOpenInventory}>
              <Text style={s.viewAll}>Voir tout ›</Text>
            </TouchableOpacity>
          </View>
          {inventory.length === 0 ? (
            <Text style={s.invEmpty}>Aucun objet. Gagne des combats !</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
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
                    <Text style={s.sheetRowSub}>{act.desc} · -{act.costEnergy}⚡{act.costHunger > 0 ? ` -${act.costHunger}🍖` : ''}</Text>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={s.sheetTitle}>⚔️ Entraînement</Text>
              <Text style={[s.sheetTitle, { fontSize: 13, color: totalTrainingPts >= MAX_TRAINING_POINTS ? retro.red : retro.muted }]}>
                {totalTrainingPts}/{MAX_TRAINING_POINTS} pts
              </Text>
            </View>
            {(creature.pendingTrainingPoints ?? 0) > 0 && (
              <View style={{ backgroundColor: retro.paper2, borderRadius: 3, padding: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: retro.purple }}>
                <Text style={{ fontSize: 18 }}>✨</Text>
                <Text style={{ color: retro.purple, fontWeight: '900', fontSize: 13, fontFamily: 'monospace' }}>
                  {creature.pendingTrainingPoints} point{(creature.pendingTrainingPoints ?? 0) > 1 ? 's' : ''} de niveau — entraînement gratuit !
                </Text>
              </View>
            )}
            {(Object.keys(TRAINING_CONFIG) as (keyof TrainingStats)[]).map((type) => {
              const cfg = TRAINING_CONFIG[type]
              const cur = training[type]
              const hasPending = (creature.pendingTrainingPoints ?? 0) > 0
              const canTrain = cur < 20 && totalTrainingPts < MAX_TRAINING_POINTS && (
                hasPending || (creature.stats.energy >= cfg.costEnergy && creature.stats.hunger >= cfg.costHunger)
              )
              const costLabel = hasPending ? '✨ Gratuit' : `-${cfg.costEnergy}⚡${cfg.costHunger > 0 ? ` -${cfg.costHunger}🍖` : ''}`
              return (
                <TouchableOpacity key={type} style={[s.sheetRow, !canTrain && { opacity: 0.4 }]}
                  onPress={() => canTrain && handleTrain(type)} activeOpacity={canTrain ? 0.75 : 1}>
                  <Text style={s.sheetRowIcon}>{cfg.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={s.sheetRowName}>{cfg.label}</Text>
                      <Text style={s.sheetRowName}>Lv {cur}/20</Text>
                    </View>
                    <Text style={s.sheetRowSub}>{cfg.desc} · {costLabel}</Text>
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
            <Text style={s.adminSub}>Lv {creature.stats.level} · {creature.stats.level >= MAX_CREATURE_LEVEL ? 'MAX' : `${creature.stats.xp}/${creature.stats.xpToNextLevel} XP`}</Text>
            <Text style={s.adminSection}>XP</Text>
            <View style={s.adminRow}>
              {([['xp100','+100 XP'],['xp500','+500 XP'],['xp9999','+9999 XP']] as [string,string][]).map(([a,l]) => (
                <TouchableOpacity key={a} style={s.adminBtn} onPress={() => adminAction(a)}><Text style={s.adminBtnTxt}>{l}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={s.adminSection}>Niveau</Text>
            <View style={s.adminRow}>
              {([['lv1','Niv 1'],['lv10','Niv 10'],['lv20','Niv 20'],['lv30','Niv 30']] as [string,string][]).map(([a,l]) => (
                <TouchableOpacity key={a} style={[s.adminBtn,{backgroundColor:retro.purple}]} onPress={() => adminAction(a)}><Text style={s.adminBtnTxt}>{l}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={s.adminSection}>Type</Text>
            <View style={s.adminRow}>
              {([['type_ignis','🔥 Ignis',retro.red],['type_nemo','🌊 Némo',retro.blue],['type_sylva','🌿 Sylva',retro.mint],['type_zapp','⚡ Zapp',retro.gold]] as [string,string,string][]).map(([a,l,c]) => (
                <TouchableOpacity key={a} style={[s.adminBtn,{backgroundColor:c}]} onPress={() => adminAction(a)}><Text style={s.adminBtnTxt}>{l}</Text></TouchableOpacity>
              ))}
            </View>
            <Text style={s.adminSection}>Stats</Text>
            <View style={s.adminRow}>
              <TouchableOpacity style={[s.adminBtn,{backgroundColor:retro.mint}]} onPress={() => adminAction('maxstats')}><Text style={s.adminBtnTxt}>Max tout</Text></TouchableOpacity>
              <TouchableOpacity style={[s.adminBtn,{backgroundColor:retro.blue}]} onPress={() => adminAction('heal')}><Text style={s.adminBtnTxt}>Soigner</Text></TouchableOpacity>
            </View>
            <Text style={s.adminSection}>Entraînement</Text>
            <View style={s.adminRow}>
              <TouchableOpacity style={[s.adminBtn,{backgroundColor:retro.red}]} onPress={() => adminAction('resettraining')}><Text style={s.adminBtnTxt}>Reset points (→ 0)</Text></TouchableOpacity>
            </View>
            <Text style={s.adminSection}>Tutoriel</Text>
            <View style={s.adminRow}>
              <TouchableOpacity
                style={[s.adminBtn, { backgroundColor: retro.purple }]}
                onPress={() => { setShowAdmin(false); onResetTutorial?.() }}
              >
                <Text style={s.adminBtnTxt}>▶ Rejouer le tuto</Text>
              </TouchableOpacity>
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

      {/* ── Tutorial coach overlay ──────────────────────────── */}
      {tutorialActive && tutReady && (
        <TutorialCoach
          steps={tutorialSteps}
          onDone={() => onTutorialDone?.()}
          onSkip={() => onTutorialDone?.()}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: retro.paper },

  // ── Hero ──────────────────────────────────────────────────
  hero: { height: HERO_H, overflow: 'hidden' },

  // Dark LCD screen bezel — the main hero background
  heroBezel: {
    flex: 1,
    backgroundColor: retro.night,
    overflow: 'hidden',
  },

  // Subtle LCD ground line
  heroGround: {
    position: 'absolute',
    left: 48,
    right: 48,
    bottom: 48,
    height: 4,
    backgroundColor: retro.screen,
    opacity: 0.35,
    borderRadius: 2,
  },

  // Bottom fade so hero blends into paper content
  heroVignette: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 52,
    backgroundColor: retro.paper,
    opacity: 0.9,
  },

  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: retro.screenSoft,
    fontFamily: 'monospace',
    letterSpacing: 1,
    textShadowColor: retro.screenDark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },

  // Gold coin counter
  coinChip: {
    backgroundColor: retro.gold,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: retro.goldDark,
  },
  coinTxt: {
    fontSize: 12,
    fontWeight: '900',
    color: retro.ink,
    fontFamily: 'monospace',
  },

  heroIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: retro.ink2,
    borderWidth: 2,
    borderColor: retro.ink3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconTxt: { fontSize: 16 },

  speech: {
    position: 'absolute', left: 16, right: 100,
    backgroundColor: retro.white, borderRadius: 4, padding: 10, borderWidth: 2, borderColor: retro.line,
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    ...retroShadow,
    zIndex: 2,
  },
  speechQ: { fontSize: 15, color: retro.muted, lineHeight: 20 },
  speechTxt: { flex: 1, fontSize: 13, color: retro.ink, fontWeight: '800', lineHeight: 18, fontFamily: 'monospace' },

  heroBadges: { position: 'absolute', right: 12, gap: 5, alignItems: 'flex-end', zIndex: 2 },
  lvBadge: {
    backgroundColor: retro.screenDeep,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: retro.screen,
  },
  lvTxt: { color: retro.screenSoft, fontWeight: '900', fontSize: 12, fontFamily: 'monospace' },

  // Evolution stage badges
  evoBadge: {
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
  },
  evoTxt: {
    color: retro.white,
    fontWeight: '900',
    fontSize: 11,
    fontFamily: 'monospace',
  },

  heroCreature: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },

  sickBadge: {
    position: 'absolute', bottom: 68, left: 16,
    backgroundColor: retro.red, borderRadius: 0, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 2, borderColor: retro.redDark,
  },
  sickTxt: { fontSize: 12, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },

  // Positioned container for bag + skin nav
  heroBottomLeft: {
    position: 'absolute',
    bottom: 50,
    left: 12,
    gap: 6,
    alignItems: 'flex-start',
  },

  heroBottomBtns: { flexDirection: 'row', gap: 6 },
  invSideBtn: {
    backgroundColor: retro.ink2,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: 54,
    borderWidth: 2,
    borderColor: retro.ink3,
  },
  invSideBtnEmoji: { fontSize: 20 },
  invSideBtnLbl: { fontSize: 9, color: retro.screenSoft, fontWeight: '900', marginTop: 2, fontFamily: 'monospace' },

  // Skin navigation arrows
  skinNav: { flexDirection: 'row', gap: 4 },
  skinArrow: {
    width: 30,
    height: 30,
    backgroundColor: retro.ink2,
    borderWidth: 2,
    borderColor: retro.ink3,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skinArrowTxt: {
    fontSize: 16,
    color: retro.paper,
    fontWeight: '900',
    lineHeight: 20,
  },

  // Creature nameplate — colored accent bar below the screen
  nameplate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 3,
    borderColor: retro.line,
  },
  nameplateCreature: {
    fontSize: 17,
    fontWeight: '900',
    color: retro.white,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  nameplateRight: { alignItems: 'flex-end' },
  nameplateForm: {
    fontSize: 11,
    fontWeight: '900',
    color: retro.white,
    fontFamily: 'monospace',
    opacity: 0.88,
  },

  // ── Scroll content ────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 24, gap: 10 },

  section: {
    marginHorizontal: 12,
    backgroundColor: retro.white,
    borderRadius: 6,
    padding: 14,
    borderWidth: 3,
    borderColor: retro.line,
    ...retroShadow,
  },

  // Stats
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  statIcon: { fontSize: 14, width: 22, textAlign: 'center' },
  statName: { fontSize: 12, fontWeight: '900', color: retro.ink, width: 60, fontFamily: 'monospace' },
  statVal: { fontSize: 11, color: retro.muted, width: 44, textAlign: 'right', fontFamily: 'monospace', fontWeight: '800' },
  formeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 2, paddingHorizontal: 2 },
  formeLbl: { fontSize: 13, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  formeVal: { fontSize: 13, fontWeight: '700' },

  buffRow: { marginTop: 4, backgroundColor: retro.paper2, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 2, borderColor: retro.goldDark },
  buffTxt: { fontSize: 11, fontWeight: '800', color: retro.goldDark, fontFamily: 'monospace' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionLbl: { fontSize: 10, fontWeight: '900', color: retro.white, fontFamily: 'monospace', textAlign: 'center', marginTop: 4 },

  // Combat / Aventure
  modeRow: { flexDirection: 'row', gap: 10, marginHorizontal: 12 },
  combatBtn: {
    flex: 1, backgroundColor: retro.blue, borderRadius: 4, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 3, borderColor: retro.line, ...retroShadow,
  },
  adventureBtn: {
    flex: 1, backgroundColor: retro.mintDark, borderRadius: 4, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 3, borderColor: retro.line, ...retroShadow,
  },
  modeIcon: { fontSize: 26 },
  modeTitle: { fontSize: 13, fontWeight: '900', color: retro.white, letterSpacing: 0.5, fontFamily: 'monospace' },
  modeSub: { fontSize: 11, color: retro.paper, marginTop: 2, lineHeight: 15, fontWeight: '700' },

  // Inventory preview
  invHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  viewAll: { fontSize: 12, color: retro.red, fontWeight: '900', fontFamily: 'monospace' },
  invItem: { width: 64, alignItems: 'center', backgroundColor: retro.paper2, borderRadius: 4, paddingVertical: 10, gap: 4, borderWidth: 2, borderColor: retro.line },
  invIcon: { fontSize: 28 },
  invQty: { fontSize: 11, color: retro.ink, fontWeight: '900', fontFamily: 'monospace' },
  invEmpty: { fontSize: 12, color: retro.muted, textAlign: 'center', paddingVertical: 12 },

  // Bottom sheets
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: retro.white, borderTopLeftRadius: 6, borderTopRightRadius: 6, padding: 20, paddingBottom: 38, borderWidth: 3, borderColor: retro.line },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: retro.ink, marginBottom: 14, fontFamily: 'monospace' },
  sheetEmpty: { fontSize: 13, color: retro.muted, textAlign: 'center', padding: 20 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: retro.paper2, borderRadius: 4, padding: 12, marginBottom: 8, borderWidth: 2, borderColor: retro.line },
  sheetRowIcon: { fontSize: 26, width: 32, textAlign: 'center' },
  sheetRowName: { fontSize: 14, fontWeight: '900', color: retro.ink },
  sheetRowSub: { fontSize: 11, color: retro.muted, marginTop: 2 },
  trainTrack: { height: 6, backgroundColor: retro.paper, borderRadius: 0, overflow: 'hidden', marginTop: 6, borderWidth: 1, borderColor: retro.line },
  trainFill: { height: '100%', backgroundColor: retro.screenDark, borderRadius: 0 },

  // Admin
  adminOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  adminCard: { backgroundColor: retro.white, borderRadius: 6, padding: 20, borderWidth: 3, borderColor: retro.line, ...retroShadow },
  adminTitle: { fontSize: 20, fontWeight: '900', color: retro.ink, textAlign: 'center', marginBottom: 4, fontFamily: 'monospace' },
  adminSub: { fontSize: 12, color: retro.muted, textAlign: 'center', marginBottom: 16 },
  adminSection: { fontSize: 11, fontWeight: '900', color: retro.red, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 10, fontFamily: 'monospace' },
  adminRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  adminBtn: { backgroundColor: retro.blue, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: retro.line },
  adminBtnTxt: { color: retro.white, fontWeight: '900', fontSize: 12, fontFamily: 'monospace' },
  adminClose: { marginTop: 20, backgroundColor: retro.ink, borderRadius: 4, padding: 12, alignItems: 'center' },
  adminCloseTxt: { color: retro.white, fontWeight: '900', fontSize: 14, fontFamily: 'monospace' },

  // Streak chip
  streakChip: {
    backgroundColor: retro.red,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: retro.redDark,
  },
  streakTxt: {
    fontSize: 12,
    fontWeight: '900',
    color: retro.white,
    fontFamily: 'monospace',
  },

  // Crossings today row
  crossingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: retro.paper2,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: retro.line,
  },
  crossingTxt: { fontSize: 12, fontWeight: '800', color: retro.ink, fontFamily: 'monospace' },
  crossingArrow: { fontSize: 16, color: retro.muted, fontWeight: '900' },

  // Boredom warning
  boredomWarn: {
    marginTop: 10,
    backgroundColor: retro.paper2,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: retro.gold,
    borderStyle: 'dashed',
  },
  boredomTxt: { fontSize: 12, fontWeight: '800', color: retro.goldDark, fontFamily: 'monospace', textAlign: 'center' },

  // Quest chip
  questSection: { borderColor: retro.purple },
  questHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  questEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  questTitle: { fontSize: 13, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  questDesc: { fontSize: 11, color: retro.muted, marginTop: 1 },
  questProg: { fontSize: 12, fontWeight: '900', color: retro.purple, fontFamily: 'monospace' },
  questTrack: { height: 8, backgroundColor: retro.paper, borderRadius: 0, overflow: 'hidden', borderWidth: 2, borderColor: retro.line },
  questFill: { height: '100%', backgroundColor: retro.purple },

  // Evolve
  evolveOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center' },
  evolveCard: { backgroundColor: retro.white, borderRadius: 6, padding: 32, alignItems: 'center', gap: 12, margin: 24, borderWidth: 3, borderColor: retro.line, ...retroShadow },
  evolveEmoji: { fontSize: 48 },
  evolveTitle: { fontSize: 28, fontWeight: '900', color: retro.red, letterSpacing: 2, fontFamily: 'monospace' },
  evolveName: { fontSize: 18, fontWeight: '900', color: retro.ink },
  evolveDesc: { fontSize: 14, color: retro.muted, textAlign: 'center', lineHeight: 20 },
  evolveStage: { fontSize: 13, fontWeight: '900', color: retro.gold, letterSpacing: 1, fontFamily: 'monospace' },
  evolveBtn: { backgroundColor: retro.ink, borderRadius: 4, paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 },
  evolveBtnTxt: { color: retro.white, fontWeight: '900', fontSize: 15, fontFamily: 'monospace' },
})
