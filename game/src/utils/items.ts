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
  croquettes: {
    id: 'croquettes', name: 'Croquettes', emoji: '🥣', rarity: 'common',
    description: 'Nourriture basique. Gagnée en combat.',
    effect: { hunger: 20 },
  },
  steak: {
    id: 'steak', name: 'Steak cru', emoji: '🥩', rarity: 'rare',
    description: 'Boost de combat puissant. Risque de maladie (10%).',
    effect: { hunger: 40, energy: 10, combatBuff: { damageMult: 1.15, durationMin: 45, sickChance: 0.10 } },
  },
  herbes: {
    id: 'herbes', name: 'Herbes amères', emoji: '🌿', rarity: 'common',
    description: 'Sain et énergisant. Infect au goût.',
    effect: { hunger: 25, energy: 20, happiness: -15 },
  },
  bonbon_epice: {
    id: 'bonbon_epice', name: 'Bonbon pimenté', emoji: '🌶️', rarity: 'common',
    description: 'Boost de combat léger. Épuise.',
    effect: { hunger: 5, happiness: 20, energy: -10, combatBuff: { damageMult: 1.10, durationMin: 30 } },
  },
}

export function getStarterInventory(): InventoryItem[] {
  return [
    { ...ITEM_CATALOG.croquettes,   quantity: 5 },
    { ...ITEM_CATALOG.apple,        quantity: 2 },
    { ...ITEM_CATALOG.bonbon_epice, quantity: 1 },
  ]
}
