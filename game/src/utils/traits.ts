import { PersonalityTrait } from '../types'

export const TRAIT_LABEL: Record<PersonalityTrait, string> = {
  gourmand:  '🍖 Gourmand',
  joueur:    '🎮 Joueur',
  timide:    '🐣 Timide',
  courageux: '⚔️ Courageux',
  paresseux: '😴 Paresseux',
  chanceux:  '🍀 Chanceux',
}

export const TRAIT_DESC: Record<PersonalityTrait, string> = {
  gourmand:  'La nourriture remplit +40% de faim en plus.',
  joueur:    'Jouer donne +40% de bonheur en plus.',
  timide:    '25% de chance de se défendre automatiquement si PV < 50%.',
  courageux: '+20% de dégâts au combat.',
  paresseux: "L'énergie se dégrade 30% moins vite.",
  chanceux:  '15% de chance d\'esquiver une attaque en combat.',
}

const ALL_TRAITS: PersonalityTrait[] = [
  'gourmand',
  'joueur',
  'timide',
  'courageux',
  'paresseux',
  'chanceux',
]

export function assignRandomTraits(count = 2): PersonalityTrait[] {
  const shuffled = [...ALL_TRAITS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, ALL_TRAITS.length))
}

export function hasTrait(
  traits: PersonalityTrait[] | undefined,
  t: PersonalityTrait
): boolean {
  return traits?.includes(t) ?? false
}
