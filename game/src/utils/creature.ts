import { Creature, CreatureMood, CreatureStats, CreatureType } from '../types'

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
  const avg = (stats.hunger + stats.happiness + stats.energy) / 3
  if (avg >= 80) return 'excited'
  if (avg >= 50) return 'happy'
  if (avg >= 25) return 'neutral'
  return 'sad'
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

export function decayStats(creature: Creature): CreatureStats {
  const now = Date.now()
  const lastFed = new Date(creature.lastFed).getTime()
  const hoursSinceFed = (now - lastFed) / (1000 * 60 * 60)

  const hungerDecay = Math.min(hoursSinceFed * 8, 100)
  const happinessDecay = Math.min(hoursSinceFed * 4, 100)
  const energyDecay = Math.min(hoursSinceFed * 6, 100)

  return {
    ...creature.stats,
    hunger:    Math.max(0, creature.stats.hunger - hungerDecay),
    happiness: Math.max(0, creature.stats.happiness - happinessDecay),
    energy:    Math.max(0, creature.stats.energy - energyDecay),
  }
}

export function xpForLevel(level: number): number {
  return level * 100
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
      xpToNextLevel: 100,
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
  let { xp, level, xpToNextLevel } = creature.stats
  xp += amount

  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel
    level++
    xpToNextLevel = xpForLevel(level)
  }

  return {
    ...creature,
    stats: { ...creature.stats, xp, level, xpToNextLevel },
  }
}
