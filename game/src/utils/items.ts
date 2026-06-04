import { InventoryItem } from '../types'

export const ITEM_CATALOG: Record<string, Omit<InventoryItem, 'quantity'>> = {
  apple: {
    id: 'apple', name: 'Pomme', emoji: '🍎', rarity: 'common',
    description: 'Un fruit simple et sain.',
    effect: { hunger: 20, happiness: 5 },
  },
  pizza: {
    id: 'pizza', name: 'Pizza', emoji: '🍕', rarity: 'common',
    description: 'Délicieuse mais un peu lourde.',
    effect: { hunger: 35, happiness: 15 },
  },
  sushi: {
    id: 'sushi', name: 'Sushi', emoji: '🍣', rarity: 'rare',
    description: 'Raffiné et énergisant.',
    effect: { hunger: 30, energy: 25, happiness: 10 },
  },
  cake: {
    id: 'cake', name: 'Gâteau', emoji: '🎂', rarity: 'rare',
    description: 'Pour les grandes occasions.',
    effect: { hunger: 40, happiness: 35 },
  },
  potion: {
    id: 'potion', name: 'Potion magique', emoji: '✨', rarity: 'epic',
    description: 'Restaure tout en même temps.',
    effect: { hunger: 40, happiness: 40, energy: 40, xp: 20 },
  },
  medicine: {
    id: 'medicine', name: 'Médicament', emoji: '💊', rarity: 'rare',
    description: 'Guérit les maladies.',
    effect: { healsSickness: true, energy: 20 },
  },
  candy: {
    id: 'candy', name: 'Bonbon', emoji: '🍬', rarity: 'common',
    description: 'Sucré et instantané.',
    effect: { happiness: 20, hunger: 10 },
  },
  star: {
    id: 'star', name: 'Étoile de XP', emoji: '⭐', rarity: 'epic',
    description: 'Donne beaucoup d\'expérience.',
    effect: { xp: 50 },
  },
}

export function getStarterInventory(): InventoryItem[] {
  return [
    { ...ITEM_CATALOG.apple, quantity: 3 },
    { ...ITEM_CATALOG.candy, quantity: 2 },
  ]
}
