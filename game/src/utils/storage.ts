import AsyncStorage from '@react-native-async-storage/async-storage'
import { Creature, Crossing, Player } from '../types'

const KEYS = {
  PLAYER: 'croisio:player',
  CREATURE: 'croisio:creature',
  CROSSINGS: 'croisio:crossings',
}

export async function saveCreature(creature: Creature): Promise<void> {
  await AsyncStorage.setItem(KEYS.CREATURE, JSON.stringify(creature))
}

export async function loadCreature(): Promise<Creature | null> {
  const raw = await AsyncStorage.getItem(KEYS.CREATURE)
  return raw ? JSON.parse(raw) : null
}

export async function savePlayer(player: Omit<Player, 'creature'>): Promise<void> {
  await AsyncStorage.setItem(KEYS.PLAYER, JSON.stringify(player))
}

export async function loadPlayer(): Promise<Omit<Player, 'creature'> | null> {
  const raw = await AsyncStorage.getItem(KEYS.PLAYER)
  return raw ? JSON.parse(raw) : null
}

export async function saveCrossings(crossings: Crossing[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CROSSINGS, JSON.stringify(crossings.slice(0, 50)))
}

export async function loadCrossings(): Promise<Crossing[]> {
  const raw = await AsyncStorage.getItem(KEYS.CROSSINGS)
  return raw ? JSON.parse(raw) : []
}

export async function addCrossing(crossing: Crossing): Promise<Crossing[]> {
  const existing = await loadCrossings()
  const updated = [crossing, ...existing].slice(0, 50)
  await saveCrossings(updated)
  return updated
}
