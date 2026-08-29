import { Creature } from '../types'
import { getMood } from './creature'

export function getCreatureSpeech(creature: Creature): string {
  const { hunger, happiness, energy, isSick } = creature.stats
  const mood = getMood(creature.stats)

  if (isSick) return 'Je me sens pas bien... 🤒'
  if (hunger < 20) return 'J\'ai vraiment trop faim... 😩'
  if (energy < 20) return 'Je suis épuisé... 😴'
  if (happiness < 20) return 'Je suis tout triste... 😢'
  if (hunger > 90 && happiness > 90 && energy > 90) return 'Je suis au max ! 🤩'
  if (mood === 'excited') return 'Je t\'adore trop ! 💕'
  if (hunger < 50) return 'J\'aurais bien mangé un truc... 🍖'
  if (energy < 50) return 'Une petite sieste ça serait top... 💤'
  if (mood === 'happy') return 'La vie est belle ! 😊'
  if (happiness < 50) return 'On pourrait jouer ? 🥺'

  const idle = [
    'Tu penses à quoi là ? 🤔',
    'Il fait beau aujourd\'hui ! ☀️',
    'J\'ai vu un truc bizarre tout à l\'heure...',
    'On va à l\'aventure ? 🗺️',
    'Regarde comme je suis beau ! 😎',
    'J\'ai un secret... mais je le dis pas 🤫',
    '🚀 Mise à jour OK !',
  ]
  return idle[Math.floor(Math.random() * idle.length)]
}

export function getReactionMessage(action: 'feed' | 'play' | 'sleep' | 'use_item'): string {
  const reactions = {
    feed:     ['Miam ! 😋', 'Délicieux ! 🍖', 'Encore ! 😍', 'Merci ! ❤️'],
    play:     ['Trop fun ! 🎉', 'Encore encore ! 🎮', 'Je t\'aime ! 💕', 'YESSS ! 🙌'],
    sleep:    ['Zzz... 💤', 'Bonne nuit... 😴', 'Je rêve déjà... 🌙'],
    use_item: ['Wow ! ✨', 'C\'est magique ! 🌟', 'Super ! 💪', 'Merci merci ! 🥰'],
  }
  const opts = reactions[action]
  return opts[Math.floor(Math.random() * opts.length)]
}
