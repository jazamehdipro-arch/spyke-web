export type CreatureMood = 'happy' | 'neutral' | 'sad' | 'excited'
export type CreatureType = 'ignis' | 'nemo' | 'sylva' | 'zapp'
export type ItemRarity = 'common' | 'rare' | 'epic'
export type PersonalityTrait = 'gourmand' | 'joueur' | 'timide' | 'courageux' | 'paresseux' | 'chanceux'
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'clear'
export type FormeLevel = 'excellente' | 'bonne' | 'correcte' | 'mauvaise'

export interface TrainingStats {
  strength: number   // 0-20: +0.8% damageMult per point (max +16%)
  reflexes: number   // 0-20: -0.7% damage received per point, capped at 14%
  endurance: number  // 0-20: +1 maxEnergy per 9 pts, +0.35 maxHP per point
  defense: number    // 0-20: +0.65% dodgeChance per point (max +13%)
  // total across all stats capped at 40 points
}

export interface CreatureStats {
  hunger: number
  happiness: number
  energy: number
  level: number
  xp: number
  xpToNextLevel: number
  isSick: boolean
}

export type SpellId =
  | 'frappe_ardente' | 'explosion' | 'carapace_chauffee' | 'provocation' | 'immolation' | 'brasier'
  | 'vague' | 'siphon' | 'regeneration' | 'barriere' | 'malediction' | 'raz_de_maree'
  | 'coup_voile' | 'ecran_fumee' | 'volute' | 'dissipation' | 'embuscade' | 'brouillard_total'
  | 'decharge' | 'arc_paralysant' | 'esquive_vive' | 'rafale' | 'surcharge' | 'tempete'

export type StatusType =
  | 'burn'        // dégâts par tour
  | 'paralyzed'   // saute ce tour
  | 'cursed'      // sort bloqué
  | 'barrier'     // réduction dégâts reçus
  | 'dodge_up'    // esquive bonus
  | 'smoke'       // action cachée (soi)
  | 'fog'         // info ennemie masquée
  | 'exhausted'   // malus énergie prochain tour
  | 'provoked'    // +30% dégâts reçus ce tour
  | 'dodge_ready' // esquive garantie prochain coup

export interface StatusEffect {
  type: StatusType
  turnsLeft: number
  value?: number   // ex: 4 = 4 dmg/tour pour burn; 50 = 50% pour barrier
  data?: string    // ex: spellId bloqué par cursed
}

export interface Spell {
  id: SpellId
  name: string
  emoji: string
  energyCost: number
  cooldown: number   // 0 = pas de cooldown
  description: string
  scaledDesc?: (mult: number) => string
}

export type SpellLoadout = [SpellId, SpellId, SpellId, SpellId]

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
  training?: TrainingStats
  activeCombatBuff?: { damageMult: number; expiresAt: string }
  spellLoadout?: SpellLoadout
  skin?: string        // equipped shiny skin color (e.g. 'blue'), undefined = default look
  ownedSkins?: string[] // unlocked skin colors for this creature's type
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
    combatBuff?: { damageMult: number; durationMin: number; sickChance?: number }
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
