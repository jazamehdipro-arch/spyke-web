import { WeatherType } from '../types'

export const WEATHER_EMOJI: Record<WeatherType, string> = {
  sunny:  '☀️',
  cloudy: '⛅',
  rainy:  '🌧️',
  stormy: '⛈️',
  foggy:  '🌫️',
  clear:  '🌙',
}

export const WEATHER_LABEL: Record<WeatherType, string> = {
  sunny:  'Ensoleillé',
  cloudy: 'Nuageux',
  rainy:  'Pluvieux',
  stormy: 'Orageux',
  foggy:  'Brumeux',
  clear:  'Clair',
}

export interface WeatherEffects {
  sickChanceBonus: number
  xpMultiplier: number
  energyDecayMult: number
  happinessDecayMult: number
}

export const WEATHER_EFFECTS: Record<WeatherType, WeatherEffects> = {
  sunny:  { sickChanceBonus: 0,    xpMultiplier: 1.05, energyDecayMult: 0.9, happinessDecayMult: 0.8 },
  cloudy: { sickChanceBonus: 0,    xpMultiplier: 1.0,  energyDecayMult: 1.0, happinessDecayMult: 1.0 },
  rainy:  { sickChanceBonus: 0.08, xpMultiplier: 1.0,  energyDecayMult: 1.1, happinessDecayMult: 1.1 },
  stormy: { sickChanceBonus: 0.05, xpMultiplier: 1.15, energyDecayMult: 1.3, happinessDecayMult: 1.2 },
  foggy:  { sickChanceBonus: 0.03, xpMultiplier: 0.85, energyDecayMult: 1.0, happinessDecayMult: 1.05 },
  clear:  { sickChanceBonus: 0,    xpMultiplier: 1.0,  energyDecayMult: 0.9, happinessDecayMult: 0.9 },
}

const WEATHER_TYPES: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy', 'clear']

function hashDate(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getDailyWeather(dateStr?: string): WeatherType {
  const today = dateStr ?? new Date().toISOString().slice(0, 10)
  const hash = hashDate(today)
  return WEATHER_TYPES[hash % WEATHER_TYPES.length]
}
