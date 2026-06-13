import AsyncStorage from '@react-native-async-storage/async-storage'
import { Creature, Crossing, CreatureType, DailyQuest, GameEvent, InventoryItem, JournalEntry, PendingCrossing, Player, Quest, SocialAttitude, SocialEvent, SocialProfile, SocialRelation } from '../types'

// Migrate old type names (flame→ignis, aqua→nemo, leaf→sylva, spark→zapp)
const TYPE_MIGRATION: Record<string, CreatureType> = {
  flame: 'ignis',
  aqua:  'nemo',
  leaf:  'sylva',
  spark: 'zapp',
}

function migrateCreature(c: Creature): Creature {
  const mapped = TYPE_MIGRATION[c.type]
  return mapped ? { ...c, type: mapped } : c
}

const KEYS = {
  PLAYER:       'croisio:player',
  CREATURE:     'croisio:creature',
  CROSSINGS:    'croisio:crossings',
  INVENTORY:    'croisio:inventory',
  EVENTS:       'croisio:events',
  QUESTS:       'croisio:quests',
  JOURNAL:      'croisio:journal',
  DAILY_QUESTS: 'croisio:dailyquests',
  STREAK:       'croisio:streak',
  ADVENTURE:    'croisio:adventure',
  SOCIAL_ATTITUDE: 'croisio:social_attitude',
  SOCIAL_PROFILE:  'croisio:social_profile',
  SOCIAL_EVENTS:   'croisio:social_events',
  SOCIAL_RELATIONS:'croisio:social_relations',
  PENDING_CROSSINGS:'croisio:pending_crossings',
}

async function get<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

async function set(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

export const saveCreature = (c: Creature) => set(KEYS.CREATURE, c)
export async function loadCreature(): Promise<Creature | null> {
  const c = await get<Creature>(KEYS.CREATURE)
  return c ? migrateCreature(c) : null
}
export const savePlayer     = (p: Omit<Player, 'creature'>) => set(KEYS.PLAYER, p)
export const loadPlayer     = ()                           => get<Omit<Player, 'creature'>>(KEYS.PLAYER)
export const saveInventory  = (i: InventoryItem[])         => set(KEYS.INVENTORY, i)
export const loadInventory  = ()                           => get<InventoryItem[]>(KEYS.INVENTORY)
export const saveEvents     = (e: GameEvent[])             => set(KEYS.EVENTS, e)
export const loadEvents     = ()                           => get<GameEvent[]>(KEYS.EVENTS)
export const saveQuests     = (q: Quest[])                 => set(KEYS.QUESTS, q)
export const loadQuests     = ()                           => get<Quest[]>(KEYS.QUESTS)
export const saveJournal    = (j: JournalEntry[])          => set(KEYS.JOURNAL, j.slice(0, 100))
export const loadJournal    = ()                           => get<JournalEntry[]>(KEYS.JOURNAL)

export async function saveCrossings(crossings: Crossing[]): Promise<void> {
  await set(KEYS.CROSSINGS, crossings.slice(0, 50))
}
export const loadCrossings = () => get<Crossing[]>(KEYS.CROSSINGS)

export async function addCrossing(crossing: Crossing): Promise<Crossing[]> {
  const existing = (await loadCrossings()) ?? []
  const updated = [crossing, ...existing].slice(0, 50)
  await saveCrossings(updated)
  return updated
}

export function addJournalEntry(
  entries: JournalEntry[],
  message: string,
  emoji: string
): JournalEntry[] {
  const entry: JournalEntry = {
    id: Math.random().toString(36).slice(2),
    message,
    emoji,
    timestamp: new Date().toISOString(),
  }
  return [entry, ...entries].slice(0, 100)
}

export const saveDailyQuests    = (q: DailyQuest[]) => set(KEYS.DAILY_QUESTS, q)
export const loadDailyQuests    = () => get<DailyQuest[]>(KEYS.DAILY_QUESTS)
export const saveAdventureProgress = (p: Record<string, number[]>) => set(KEYS.ADVENTURE, p)
export const loadAdventureProgress = () => get<Record<string, number[]>>(KEYS.ADVENTURE)
export const saveSocialAttitude = (a: SocialAttitude) => set(KEYS.SOCIAL_ATTITUDE, a)
export const loadSocialAttitude = () => get<SocialAttitude>(KEYS.SOCIAL_ATTITUDE)
export const saveSocialProfile = (profile: SocialProfile) => set(KEYS.SOCIAL_PROFILE, profile)
export const loadSocialProfile = () => get<SocialProfile>(KEYS.SOCIAL_PROFILE)
export const saveSocialEvents = (events: SocialEvent[]) => set(KEYS.SOCIAL_EVENTS, events.slice(0, 60))
export const loadSocialEvents = () => get<SocialEvent[]>(KEYS.SOCIAL_EVENTS)
export const saveSocialRelations = (relations: SocialRelation[]) => set(KEYS.SOCIAL_RELATIONS, relations.slice(0, 80))
export const loadSocialRelations = () => get<SocialRelation[]>(KEYS.SOCIAL_RELATIONS)
export const savePendingCrossings = (items: PendingCrossing[]) => set(KEYS.PENDING_CROSSINGS, items.slice(0, 30))
export const loadPendingCrossings = () => get<PendingCrossing[]>(KEYS.PENDING_CROSSINGS)

export async function addPendingCrossing(item: PendingCrossing): Promise<PendingCrossing[]> {
  const existing = (await loadPendingCrossings()) ?? []
  const updated = [item, ...existing.filter((p) => p.id !== item.id)].slice(0, 30)
  await savePendingCrossings(updated)
  return updated
}

export async function resolvePendingCrossing(id: string): Promise<PendingCrossing[]> {
  const existing = (await loadPendingCrossings()) ?? []
  const updated = existing.filter((p) => p.id !== id)
  await savePendingCrossings(updated)
  return updated
}

interface StreakData { streak: number; lastLoginDate: string }
export const saveStreak = (streak: number, lastLoginDate: string) =>
  set(KEYS.STREAK, { streak, lastLoginDate } satisfies StreakData)
export const loadStreak = () => get<StreakData>(KEYS.STREAK)

export const saveTutorialDone = (done: boolean) => set('croisio:tutorial_done', done)
export const loadTutorialDone = () => get<boolean>('croisio:tutorial_done')

export async function clearAllGameData(): Promise<void> {
  const allKeys = [...Object.values(KEYS), 'croisio:tutorial_done']
  await AsyncStorage.multiRemove(allKeys)
}

export function addItemToInventory(
  inventory: InventoryItem[],
  newItem: InventoryItem
): InventoryItem[] {
  const existing = inventory.find((i) => i.id === newItem.id)
  if (existing) {
    return inventory.map((i) =>
      i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
    )
  }
  return [...inventory, newItem]
}
