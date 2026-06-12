import * as Location from 'expo-location'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { CreatureType } from '../types'

const CROSSING_RADIUS_METERS = 200
const LOCATION_INTERVAL_MS   = 15_000
const CROSSING_COOLDOWN_MS   = 90_000   // min 90s between crossings with the same player

export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R  = 6_371_000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface ProximityPlayer {
  userId: string
  username: string
  creatureName: string
  creatureType: CreatureType
  level: number
  latitude: number
  longitude: number
}

export type ProximityStatus = 'idle' | 'requesting' | 'scanning' | 'no_permission' | 'error'

type NearbyCallback    = (player: ProximityPlayer) => void
type StatusCallback    = (status: ProximityStatus) => void
type LocationCallback  = (lat: number, lng: number) => void

class ProximityService {
  private channel:     RealtimeChannel | null = null
  private locationSub: Location.LocationSubscription | null = null
  private myLocation:  { latitude: number; longitude: number } | null = null
  private myPayload:   ProximityPlayer | null = null
  private onNearby:    NearbyCallback | null  = null
  private onStatus:    StatusCallback | null  = null
  private onLocation:  LocationCallback | null = null
  private cooldowns    = new Map<string, number>()
  private running      = false

  async start(
    me: ProximityPlayer,
    onNearby:   NearbyCallback,
    onStatus?:  StatusCallback,
    onLocation?: LocationCallback,
  ): Promise<void> {
    if (this.running) await this.stop()

    this.myPayload  = me
    this.onNearby   = onNearby
    this.onStatus   = onStatus ?? null
    this.onLocation = onLocation ?? null
    this.running    = true

    this.onStatus?.('requesting')

    // Permission
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      this.running = false
      this.onStatus?.('no_permission')
      return
    }

    // Initial position
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      this.myLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      this.onLocation?.(pos.coords.latitude, pos.coords.longitude)
    } catch {
      this.running = false
      this.onStatus?.('error')
      return
    }

    // Watch position
    this.locationSub = await Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.Balanced,
        timeInterval:     LOCATION_INTERVAL_MS,
        distanceInterval: 10,
      },
      (pos) => {
        this.myLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        this.onLocation?.(pos.coords.latitude, pos.coords.longitude)
        this.pushPresence()
      },
    )

    this.onStatus?.('scanning')
    this.joinChannel()
  }

  async stop(): Promise<void> {
    this.running    = false
    this.onNearby   = null
    this.onStatus   = null
    this.onLocation = null
    this.locationSub?.remove()
    this.locationSub = null
    if (this.channel) {
      await supabase.removeChannel(this.channel)
      this.channel = null
    }
  }

  private joinChannel(): void {
    if (!this.myPayload || !this.myLocation) return

    // Skip if Supabase is not configured
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
      this.onStatus?.('error')
      return
    }

    const channelName = 'proximity:world'
    this.channel = supabase.channel(channelName, {
      config: { presence: { key: this.myPayload.userId } },
    })

    this.channel
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (!this.running) return
        for (const p of newPresences as unknown as ProximityPlayer[]) {
          this.checkProximity(p)
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (!this.running || !this.channel) return
        const state = this.channel.presenceState()
        for (const presences of Object.values(state)) {
          for (const p of presences as unknown as ProximityPlayer[]) {
            this.checkProximity(p)
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.pushPresence()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.onStatus?.('error')
        }
      })
  }

  private async pushPresence(): Promise<void> {
    if (!this.channel || !this.myPayload || !this.myLocation) return
    await this.channel.track({
      ...this.myPayload,
      latitude:  this.myLocation.latitude,
      longitude: this.myLocation.longitude,
    } as ProximityPlayer)
  }

  private checkProximity(p: ProximityPlayer): void {
    if (!this.myLocation || !this.myPayload) return
    if (p.userId === this.myPayload.userId) return   // skip self

    const dist = haversineMeters(
      this.myLocation.latitude,
      this.myLocation.longitude,
      p.latitude,
      p.longitude,
    )

    if (dist > CROSSING_RADIUS_METERS) return

    const last = this.cooldowns.get(p.userId) ?? 0
    if (Date.now() - last < CROSSING_COOLDOWN_MS) return

    this.cooldowns.set(p.userId, Date.now())
    this.onNearby?.(p)
  }
}

export const proximityService = new ProximityService()
