import { Creature, GameEvent, InventoryItem } from '../types'
import { ITEM_CATALOG } from './items'

const EVENT_POOL: Array<Omit<GameEvent, 'id' | 'timestamp' | 'resolved'>> = [
  {
    type: 'found_item', emoji: '🍎',
    title: 'Bonne surprise !',
    message: 'a trouvé une pomme dans les buissons.',
    reward: { itemId: 'apple' },
  },
  {
    type: 'found_item', emoji: '🍬',
    title: 'Quelle chance !',
    message: 'a trouvé un bonbon par terre.',
    reward: { itemId: 'candy' },
  },
  {
    type: 'found_item', emoji: '⭐',
    title: 'Incroyable !',
    message: 'a trouvé une étoile brillante. Elle rayonne d\'énergie !',
    reward: { itemId: 'star' },
  },
  {
    type: 'found_item', emoji: '🍕',
    title: 'Festin !',
    message: 'a découvert une pizza abandonnée. Encore chaude !',
    reward: { itemId: 'pizza' },
  },
  {
    type: 'sick', emoji: '🤒',
    title: 'Pas bien...',
    message: 'semble fiévreux. Il faut lui donner un médicament !',
    reward: undefined,
  },
  {
    type: 'dream', emoji: '💭',
    title: 'Rêve étrange',
    message: 'a rêvé qu\'il volait au-dessus des nuages.',
    reward: { xp: 10 },
  },
  {
    type: 'dream', emoji: '🌙',
    title: 'Cauchemar...',
    message: 'a fait un cauchemar. Il a l\'air fatigué ce matin.',
    reward: undefined,
  },
  {
    type: 'training', emoji: '💪',
    title: 'Entraînement secret',
    message: 's\'est entraîné pendant la nuit. Il a l\'air plus fort !',
    reward: { xp: 25 },
  },
  {
    type: 'mood', emoji: '🎉',
    title: 'Super forme !',
    message: 'est de très bonne humeur aujourd\'hui. Tout lui sourit !',
    reward: { xp: 5 },
  },
  {
    type: 'mystery', emoji: '🔮',
    title: 'Mystère...',
    message: 'a regardé le ciel pendant une heure. Que voyait-il ?',
    reward: { xp: 15 },
  },
  {
    type: 'found_item', emoji: '✨',
    title: 'Trésor rare !',
    message: 'a trouvé une potion magique cachée sous un rocher !',
    reward: { itemId: 'potion' },
  },
]

export function generateRandomEvent(creature: Creature): GameEvent {
  const pool = creature.stats.isSick
    ? EVENT_POOL.filter((e) => e.type !== 'sick')
    : EVENT_POOL

  const template = pool[Math.floor(Math.random() * pool.length)]
  return {
    ...template,
    id: Math.random().toString(36).slice(2),
    message: `${creature.name} ${template.message}`,
    timestamp: new Date().toISOString(),
    resolved: false,
  }
}

export function getRewardItem(itemId: string): InventoryItem | null {
  const item = ITEM_CATALOG[itemId]
  if (!item) return null
  return { ...item, quantity: 1 }
}

export function shouldTriggerEvent(): boolean {
  return Math.random() < 0.3
}
