export type CreatureMood = 'happy' | 'neutral' | 'sad' | 'excited'

export type CreatureType = 'flame' | 'aqua' | 'leaf' | 'spark'

export interface CreatureStats {
  hunger: number      // 0-100
  happiness: number   // 0-100
  energy: number      // 0-100
  level: number
  xp: number
  xpToNextLevel: number
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
}

export interface Player {
  id: string
  username: string
  creature: Creature
  latitude?: number
  longitude?: number
  lastSeen?: string
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
