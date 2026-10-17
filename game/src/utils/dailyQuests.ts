import { DailyQuest } from '../types'

interface QuestTemplate {
  id: string
  title: string
  description: string
  emoji: string
  action: string
  target: number
  reward: { xp: number; coins: number }
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'feed3',
    title: 'Petit-déjeuner',
    description: 'Nourris ta créature 3 fois aujourd\'hui',
    emoji: '🍖',
    action: 'feed',
    target: 3,
    reward: { xp: 30, coins: 10 },
  },
  {
    id: 'play2',
    title: 'Séance de jeu',
    description: 'Joue 2 fois avec ta créature aujourd\'hui',
    emoji: '🎮',
    action: 'play',
    target: 2,
    reward: { xp: 25, coins: 8 },
  },
  {
    id: 'sleep1',
    title: 'Bonne sieste',
    description: 'Fais dormir ta créature au moins une fois',
    emoji: '💤',
    action: 'sleep',
    target: 1,
    reward: { xp: 20, coins: 6 },
  },
  {
    id: 'win1',
    title: 'Premier combat',
    description: 'Remporte 1 combat aujourd\'hui',
    emoji: '⚔️',
    action: 'combat_win',
    target: 1,
    reward: { xp: 40, coins: 15 },
  },
  {
    id: 'win3',
    title: 'Guerrier du jour',
    description: 'Remporte 3 combats aujourd\'hui',
    emoji: '🏆',
    action: 'combat_win',
    target: 3,
    reward: { xp: 80, coins: 30 },
  },
  {
    id: 'feed5',
    title: 'Grand festin',
    description: 'Nourris ta créature 5 fois aujourd\'hui',
    emoji: '🍕',
    action: 'feed',
    target: 5,
    reward: { xp: 50, coins: 18 },
  },
  {
    id: 'play3',
    title: 'Joueur acharné',
    description: 'Joue 3 fois avec ta créature aujourd\'hui',
    emoji: '🎯',
    action: 'play',
    target: 3,
    reward: { xp: 40, coins: 14 },
  },
  {
    id: 'items2',
    title: 'Consommateur',
    description: 'Utilise 2 objets de ton inventaire',
    emoji: '🎒',
    action: 'use_item',
    target: 2,
    reward: { xp: 30, coins: 12 },
  },
  {
    id: 'combat2',
    title: 'Combattant',
    description: 'Participe à 2 combats (victoire ou défaite)',
    emoji: '⚡',
    action: 'combat',
    target: 2,
    reward: { xp: 35, coins: 12 },
  },
]

function hashDate(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
  }
  return hash
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function generateDailyQuests(): DailyQuest[] {
  const today = getTodayStr()
  const hash = hashDate(today)

  // Pick 3 unique templates deterministically based on date hash
  const indices: number[] = []
  let seed = hash
  while (indices.length < 3) {
    const idx = seed % QUEST_TEMPLATES.length
    if (!indices.includes(idx)) {
      indices.push(idx)
    }
    seed = (seed * 1664525 + 1013904223) >>> 0
  }

  return indices.map((idx) => {
    const template = QUEST_TEMPLATES[idx]
    return {
      id: `daily_${today}_${template.id}`,
      date: today,
      templateId: template.id,
      title: template.title,
      description: template.description,
      emoji: template.emoji,
      action: template.action,
      progress: 0,
      target: template.target,
      completed: false,
      claimed: false,
      reward: template.reward,
    }
  })
}

export function isDailyQuestStale(quests: DailyQuest[]): boolean {
  if (quests.length === 0) return true
  const today = getTodayStr()
  return quests[0].date !== today
}

export function updateDailyQuestProgress(
  quests: DailyQuest[],
  action: string,
  amount = 1
): DailyQuest[] {
  return quests.map((q) => {
    if (q.claimed) return q
    if (q.action !== action) return q
    const newProgress = Math.min(q.target, q.progress + amount)
    return {
      ...q,
      progress: newProgress,
      completed: newProgress >= q.target,
    }
  })
}
