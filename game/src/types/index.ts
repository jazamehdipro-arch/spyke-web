export type CreatureMood = 'happy' | 'neutral' | 'sad' | 'excited'
export type CreatureType = 'ignis' | 'nemo' | 'sylva' | 'zapp'
export type ItemRarity = 'common' | 'rare' | 'epic'
export type PersonalityTrait = 'gourmand' | 'joueur' | 'timide' | 'courageux' | 'paresseux' | 'chanceux'
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'clear'

export interface CreatureStats {
  hunger: number
  happiness: number
  energy: number
  level: number
  xp: number
  xpToNextLevel: number
  isSick: boolean
}

export interface Creature {
  id: string
  name: string
  type: CreatureType
  stats: CreatureStats
  mood: CreatureMood
  lastFed: string
  lastPlayed: string
  createdAt: string
  totalFed: number
  totalPlayed: number
  totalSlept: number
  traits?: PersonalityTrait[]
}

export interface Player {
  id: string
  username: string
  creature: Creature
  latitude?: number
  longitude?: number
  lastSeen?: string
  coins?: number
  streak?: number
  lastLoginDate?: string
}

export interface Crossing {
  id: string
  playerId: string
  username: string
  creatureName: string
  creatureType: CreatureType
  crossedAt: string
  latitude: number
  longitude: number
  interactionType: 'friendly' | 'battle' | 'gift'
  xpGained: number
}

export interface InventoryItem {
  id: string
  name: string
  emoji: string
  description: string
  rarity: ItemRarity
  effect: {
    hunger?: number
    happiness?: number
    energy?: number
    xp?: number
    healsSickness?: boolean
  }
  quantity: number
}

export interface GameEvent {
  id: string
  type: 'found_item' | 'sick' | 'dream' | 'training' | 'mood' | 'mystery'
  title: string
  message: string
  emoji: string
  timestamp: string
  resolved: boolean
  reward?: { itemId?: string; xp?: number }
}

export interface Quest {
  id: string
  title: string
  description: string
  emoji: string
  progress: number
  target: number
  reward: { xp: number; itemId?: string }
  completed: boolean
  claimed: boolean
  type: 'feed' | 'play' | 'sleep' | 'level' | 'events'
}

export interface DailyQuest {
  id: string
  date: string
  templateId: string
  title: string
  description: string
  emoji: string
  action: string
  progress: number
  target: number
  completed: boolean
  claimed: boolean
  reward: { xp: number; coins: number }
}

export interface JournalEntry {
  id: string
  message: string
  emoji: string
  timestamp: string
}
