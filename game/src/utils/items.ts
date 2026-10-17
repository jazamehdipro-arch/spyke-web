import { CreatureType, InventoryItem } from '../types'

export const SKINS_BY_TYPE: Record<CreatureType, string[]> = {
  ignis:   ['red', 'blue', 'green', 'gold', 'purple', 'grey'],
  nemo:    ['purple', 'ice', 'green', 'fire', 'dark', 'pink'],
  sylva:   ['orange', 'blue', 'green', 'purple', 'gold', 'grey'],
  zapp:    ['orange', 'blue', 'green', 'red', 'white', 'purple'],
  ombra:   ['violet', 'night', 'crimson', 'jade', 'silver', 'gold'],
  magma:   ['ember', 'obsidian', 'gold', 'crimson', 'ash', 'lava'],
  abyssal: ['deep', 'coral', 'void', 'crystal', 'midnight', 'teal'],
  sable:   ['sand', 'bronze', 'ivory', 'obsidian', 'amber', 'jade'],
}

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
  mystery_box: {
    id: 'mystery_box', name: 'Boîte Mystère', emoji: '📦', rarity: 'epic',
    description: 'Une surprise à l\'intérieur ! Ouvre dans ton sac.',
    effect: {},
  },
}

// Shop: items available for coin purchase (no combat buffs)
export const SHOP_ITEMS: Array<{ itemId: string; price: number }> = [
  { itemId: 'apple',       price: 5   },
  { itemId: 'candy',       price: 6   },
  { itemId: 'herbes',      price: 8   },
  { itemId: 'pizza',       price: 15  },
  { itemId: 'medicine',    price: 25  },
  { itemId: 'sushi',       price: 30  },
  { itemId: 'cake',        price: 35  },
  { itemId: 'potion',      price: 75  },
  { itemId: 'mystery_box', price: 40  },
]

// Mystery box reward pool
export function drawMysteryBox(
  creatureType: CreatureType,
  ownedSkins: string[] = [],
): { itemId: string | null; coins: number; xp: number; skin?: string } {
  const roll = Math.random()
  if (roll < 0.02) return { itemId: 'star',     coins: 10, xp: 0 }   // 2%  epic
  if (roll < 0.07) {                                                    // 5%  shiny skin
    const available = SKINS_BY_TYPE[creatureType].filter((s) => !ownedSkins.includes(s))
    if (available.length > 0) {
      const skin = available[Math.floor(Math.random() * available.length)]
      return { itemId: null, coins: 15, xp: 0, skin }
    }
    // all skins owned: bonus coins instead
    return { itemId: 'potion', coins: 20, xp: 0 }
  }
  if (roll < 0.12) return { itemId: 'potion',   coins: 0,  xp: 0  }   // 5%
  if (roll < 0.25) return { itemId: 'cake',     coins: 10, xp: 0  }   // 13%
  if (roll < 0.42) return { itemId: 'sushi',    coins: 0,  xp: 0  }   // 17%
  if (roll < 0.60) return { itemId: 'medicine', coins: 0,  xp: 0  }   // 18%
  if (roll < 0.78) return { itemId: 'pizza',    coins: 5,  xp: 0  }   // 18%
  return                  { itemId: 'apple',    coins: 5,  xp: 10 }   // 22% common
}

export function getStarterInventory(): InventoryItem[] {
  return [
    { ...ITEM_CATALOG.croquettes,   quantity: 5 },
    { ...ITEM_CATALOG.apple,        quantity: 2 },
    { ...ITEM_CATALOG.bonbon_epice, quantity: 1 },
  ]
}
