import { Creature, CreatureMood, CreatureStats, CreatureType, FormeLevel, PersonalityTrait } from '../types'
import { hasTrait } from './traits'

export const CREATURE_COLORS: Record<CreatureType, string> = {
  ignis: '#C41E0F',
  nemo:  '#1A3A6B',
  sylva: '#2D6A2D',
  zapp:  '#C47A00',
}

export const CREATURE_NAMES: Record<CreatureType, string[]> = {
  ignis: ['Ignïs', 'Pyra', 'Ember', 'Flax'],
  nemo:  ['Némo', 'Crest', 'Deeps', 'Mare'],
  sylva: ['Sylva', 'Fern', 'Mossy', 'Grove'],
  zapp:  ['Zapp', 'Volt', 'Flash', 'Bolt'],
}

export const CREATURE_LABELS: Record<CreatureType, { name: string; description: string }> = {
  ignis: { name: 'Ignïs',  description: 'Ardent et courageux' },
  nemo:  { name: 'Némo',   description: 'Calme et mystérieux' },
  sylva: { name: 'Sylva',  description: 'Sage et endurant' },
  zapp:  { name: 'Zapp',   description: 'Rapide et espiègle' },
}

export function getMood(stats: CreatureStats): CreatureMood {
  // Individual critical thresholds first — any single low stat triggers sad/neutral
  if (stats.hunger < 20 || stats.energy < 20) return 'sad'
  if (stats.hunger < 35 || stats.energy < 35 || stats.happiness < 20) return 'neutral'
  const avg = (stats.hunger + stats.happiness + stats.energy) / 3
  if (avg >= 75) return 'excited'
  if (avg >= 45) return 'happy'
  return 'neutral'
}

export function getFormeLevel(stats: CreatureStats): FormeLevel {
  const score = stats.hunger * 0.40 + stats.energy * 0.35 + stats.happiness * 0.25
  if (score >= 75) return 'excellente'
  if (score >= 50) return 'bonne'
  if (score >= 30) return 'correcte'
  return 'mauvaise'
}

export const FORME_LABELS: Record<FormeLevel, { label: string; emoji: string; color: string }> = {
  excellente: { label: 'Excellente', emoji: '💪', color: '#22C55E' },
  bonne:      { label: 'Bonne',      emoji: '😊', color: '#60A5FA' },
  correcte:   { label: 'Correcte',   emoji: '😐', color: '#F59E0B' },
  mauvaise:   { label: 'Mauvaise',   emoji: '😓', color: '#EF4444' },
}

export function getMoodEmoji(mood: CreatureMood): string {
  const map: Record<CreatureMood, string> = {
    excited: '🤩',
    happy:   '😊',
    neutral: '😐',
    sad:     '😢',
  }
  return map[mood]
}

export function decayStats(
  creature: Creature,
  traits?: PersonalityTrait[]
): CreatureStats {
  const now = Date.now()
  const lastCare = Math.max(
    new Date(creature.lastFed).getTime(),
    new Date(creature.lastPlayed).getTime(),
  )
  const hoursSinceCare = Math.max(0, (now - lastCare) / (1000 * 60 * 60))

  const effectiveTraits = traits ?? creature.traits
  const energyRecoveryMult = hasTrait(effectiveTraits, 'paresseux') ? 1.15 : 1.0

  const hungerDecay = Math.min(hoursSinceCare * 3, 100)
  const restedEnergy = Math.min(80, creature.stats.energy + hoursSinceCare * 5 * energyRecoveryMult)
  const happinessDecay = Math.min(hoursSinceCare * 1.5, 100)

  return {
    ...creature.stats,
    hunger: Math.max(10, creature.stats.hunger - hungerDecay),
    happiness: Math.max(25, creature.stats.happiness - happinessDecay),
    energy: Math.max(10, restedEnergy),
  }
}

export function applyOfflineCareDecay(creature: Creature): Creature {
  const now = new Date().toISOString()
  const stats = decayStats(creature)
  return {
    ...creature,
    stats,
    mood: getMood(stats),
    lastFed: now,
    lastPlayed: now,
  }
}

export function applyActiveCareTick(creature: Creature, hours: number): Creature {
  if (hours <= 0) return creature
  if (creature.stats.energy <= 0) {
    const stats = {
      ...creature.stats,
      hunger: Math.max(10, creature.stats.hunger - hours * 3),
      energy: Math.min(100, creature.stats.energy + hours * 20),
      happiness: Math.max(0, creature.stats.happiness - hours * 3),
    }
    return { ...creature, stats, mood: getMood(stats), lastPlayed: new Date().toISOString() }
  }
  const hunger = Math.max(0, creature.stats.hunger - hours * 8)
  const lowNeeds = hunger < 30 || creature.stats.energy < 20
  const happinessDrift = lowNeeds ? hours * 3 : Math.max(0, creature.stats.happiness - 70) * Math.min(1, hours * 0.1)
  const stats = {
    ...creature.stats,
    hunger,
    energy: Math.max(0, creature.stats.energy - hours * 5),
    happiness: Math.max(0, creature.stats.happiness - happinessDrift),
  }
  return { ...creature, stats, mood: getMood(stats), lastPlayed: new Date().toISOString() }
}

export const DAILY_CARE_XP_CAP = 30

export function xpForLevel(level: number): number {
  return Math.round(30 + 18 * Math.pow(level, 1.15))
}

export function createNewCreature(type: CreatureType): Creature {
  const names = CREATURE_NAMES[type]
  const name = names[Math.floor(Math.random() * names.length)]
  const now = new Date().toISOString()
  return {
    id: Math.random().toString(36).slice(2),
    name,
    type,
    stats: {
      hunger: 80,
      happiness: 80,
      energy: 80,
      level: 1,
      xp: 0,
      xpToNextLevel: xpForLevel(1),
      isSick: false,
    },
    mood: 'happy',
    lastFed: now,
    lastPlayed: now,
    createdAt: now,
    totalFed: 0,
    totalPlayed: 0,
    totalSlept: 0,
  }
}

export function addXP(creature: Creature, amount: number): Creature {
  const happinessMult = creature.stats.happiness >= 70 ? 1.2 : creature.stats.happiness < 30 ? 0.7 : 1.0
  let { xp, level, xpToNextLevel } = creature.stats
  const prevLevel = level
  xp += Math.round(amount * happinessMult)

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel
    level++
    xpToNextLevel = xpForLevel(level)
  }

  const levelsGained = level - prevLevel
  return {
    ...creature,
    stats: { ...creature.stats, xp, level, xpToNextLevel },
    pendingTrainingPoints: (creature.pendingTrainingPoints ?? 0) + levelsGained * 2,
  }
}

// Like addXP but enforces a daily cap on care-source XP (feed/play/sleep).
export function addCareXP(creature: Creature, amount: number): Creature {
  const today = new Date().toISOString().slice(0, 10)
  const todayBase = creature.dailyCareXPDate === today ? (creature.dailyCareXP ?? 0) : 0
  const remaining = Math.max(0, DAILY_CARE_XP_CAP - todayBase)
  if (remaining <= 0) return creature
  const base = Math.min(amount, remaining)
  return {
    ...addXP(creature, base),
    dailyCareXP: todayBase + base,
    dailyCareXPDate: today,
  }
}
