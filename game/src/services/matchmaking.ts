import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { CreatureType } from '../types'

export const LEVEL_RANGE      = 3
export const SEARCH_TIMEOUT_MS = 30_000

export interface MatchPlayer {
  userId:       string
  username:     string
  creatureName: string
  creatureType: CreatureType
  level:        number
}

export interface MatchResult {
  type:     'real' | 'bot'
  opponent: MatchPlayer
}

export type MatchStatus = 'searching' | 'found' | 'timeout'

type FoundCallback  = (result: MatchResult) => void
type StatusCallback = (status: MatchStatus) => void

// Returns a cancel function — call it to abort the search.
export function searchForMatch(
  me:       MatchPlayer,
  onFound:  FoundCallback,
  onStatus: StatusCallback,
): () => void {
  let settled  = false
  let channel: RealtimeChannel | null = null
  let timerId:  ReturnType<typeof setTimeout>

  const settle = (result: MatchResult) => {
    if (settled) return
    settled = true
    clearTimeout(timerId)
    if (channel) {
      supabase?.removeChannel(channel).catch(() => {/* ignore */})
      channel = null
    }
    onStatus(result.type === 'bot' ? 'timeout' : 'found')
    onFound(result)
  }

  const cancel = () => {
    settled = true
    clearTimeout(timerId)
    if (channel) {
      supabase?.removeChannel(channel).catch(() => {/* ignore */})
      channel = null
    }
  }

  // If Supabase not configured → quick bot fallback (simulates 2s search)
  if (!supabase) {
    timerId = setTimeout(() => settle({ type: 'bot', opponent: makeBotPlayer(me.level) }), 2_500)
    return cancel
  }

  const tryMatch = (presences: unknown[]) => {
    if (settled) return
    const candidates = (presences as MatchPlayer[]).filter(
      (p) => p.userId !== me.userId && Math.abs((p.level ?? 1) - me.level) <= LEVEL_RANGE
    )
    if (candidates.length === 0) return
    // Prefer closest level; break ties randomly
    candidates.sort((a, b) => Math.abs(a.level - me.level) - Math.abs(b.level - me.level))
    const tied = candidates.filter(
      (c) => Math.abs(c.level - me.level) === Math.abs(candidates[0].level - me.level)
    )
    const picked = tied[Math.floor(Math.random() * tied.length)]
    settle({ type: 'real', opponent: picked })
  }

  channel = supabase!.channel('matchmaking:world', {
    config: { presence: { key: me.userId } },
  })

  channel
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      tryMatch(newPresences as unknown[])
    })
    .on('presence', { event: 'sync' }, () => {
      if (!channel) return
      const state = channel.presenceState()
      tryMatch(Object.values(state).flat())
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && channel) {
        await channel.track(me as unknown as Record<string, unknown>)
      }
    })

  // Timeout → bot fallback
  timerId = setTimeout(
    () => settle({ type: 'bot', opponent: makeBotPlayer(me.level) }),
    SEARCH_TIMEOUT_MS,
  )

  return cancel
}

// ── Bot name pool for fallback ──────────────────────────────────────────────
const BOT_POOL: { username: string; creatureName: string; creatureType: CreatureType }[] = [
  { username: 'ShadowBlade',   creatureName: 'Nox',       creatureType: 'ombra'   },
  { username: 'VulcanFist',    creatureName: 'Pyrok',     creatureType: 'magma'   },
  { username: 'AbyssKeeper',   creatureName: 'Void',      creatureType: 'abyssal' },
  { username: 'DuneLord',      creatureName: 'Dune',      creatureType: 'sable'   },
  { username: 'FlameHunter',   creatureName: 'Ember',     creatureType: 'ignis'   },
  { username: 'TidalWatcher',  creatureName: 'Deeps',     creatureType: 'nemo'    },
  { username: 'ForestRunner',  creatureName: 'Mossy',     creatureType: 'sylva'   },
  { username: 'StormCatcher',  creatureName: 'Bolt',      creatureType: 'zapp'    },
]

function makeBotPlayer(playerLevel: number): MatchPlayer {
  const entry = BOT_POOL[Math.floor(Math.random() * BOT_POOL.length)]
  const spread = Math.floor(Math.random() * (LEVEL_RANGE * 2 + 1)) - LEVEL_RANGE
  const level  = Math.max(1, playerLevel + spread)
  return {
    userId:       `bot:${Math.random().toString(36).slice(2)}`,
    username:     entry.username + (Math.floor(Math.random() * 900) + 100),
    creatureName: entry.creatureName,
    creatureType: entry.creatureType,
    level,
  }
}
