import { Creature, Quest } from '../types'

export const QUEST_DEFINITIONS: Quest[] = [
  {
    id: 'feed_5', type: 'feed', emoji: '🍖',
    title: 'Bon appétit',
    description: 'Nourris ta créature 5 fois',
    progress: 0, target: 5,
    reward: { xp: 50, itemId: 'sushi' },
    completed: false, claimed: false,
  },
  {
    id: 'play_5', type: 'play', emoji: '🎮',
    title: 'Joueur assidu',
    description: 'Joue 5 fois avec ta créature',
    progress: 0, target: 5,
    reward: { xp: 50, itemId: 'candy' },
    completed: false, claimed: false,
  },
  {
    id: 'sleep_3', type: 'sleep', emoji: '💤',
    title: 'Bonne nuit',
    description: 'Fais dormir ta créature 3 fois',
    progress: 0, target: 3,
    reward: { xp: 30, itemId: 'apple' },
    completed: false, claimed: false,
  },
  {
    id: 'level_5', type: 'level', emoji: '⭐',
    title: 'En route !',
    description: 'Atteins le niveau 5',
    progress: 0, target: 5,
    reward: { xp: 100, itemId: 'potion' },
    completed: false, claimed: false,
  },
  {
    id: 'feed_20', type: 'feed', emoji: '🍕',
    title: 'Chef cuisinier',
    description: 'Nourris ta créature 20 fois',
    progress: 0, target: 20,
    reward: { xp: 150, itemId: 'cake' },
    completed: false, claimed: false,
  },
  {
    id: 'play_20', type: 'play', emoji: '🏆',
    title: 'Champion',
    description: 'Joue 20 fois avec ta créature',
    progress: 0, target: 20,
    reward: { xp: 150, itemId: 'star' },
    completed: false, claimed: false,
  },
  {
    id: 'events_3', type: 'events', emoji: '🎲',
    title: 'L\'aventurier',
    description: 'Vis 3 événements aléatoires',
    progress: 0, target: 3,
    reward: { xp: 80, itemId: 'medicine' },
    completed: false, claimed: false,
  },
  {
    id: 'level_10', type: 'level', emoji: '💎',
    title: 'Légende',
    description: 'Atteins le niveau 10',
    progress: 0, target: 10,
    reward: { xp: 200, itemId: 'star' },
    completed: false, claimed: false,
  },
]

export function updateQuestsAfterAction(
  quests: Quest[],
  action: 'feed' | 'play' | 'sleep' | 'level' | 'events',
  value: number = 1
): Quest[] {
  return quests.map((q) => {
    if (q.claimed) return q
    if (q.type !== action) return q
    const newProgress = action === 'level'
      ? value
      : Math.min(q.target, q.progress + value)
    return {
      ...q,
      progress: newProgress,
      completed: newProgress >= q.target,
    }
  })
}
