import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { ProximityPlayer } from './proximity'
import { supabase } from './supabase'

const TASK_NAME = 'croisio-background-crossing-location'
const PRESENCE_KEY = 'croisio:background_presence_payload'

type LocationTaskData = { locations?: Location.LocationObject[] }

TaskManager.defineTask<LocationTaskData>(TASK_NAME, async ({ data, error }) => {
  if (error || !supabase) return
  const location = data?.locations?.[0]
  if (!location) return

  const raw = await AsyncStorage.getItem(PRESENCE_KEY)
  if (!raw) return
  const me = JSON.parse(raw) as ProximityPlayer

  await supabase.from('player_locations').upsert({
    user_id: me.userId,
    username: me.username,
    creature_name: me.creatureName,
    creature_type: me.creatureType,
    level: me.level,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    updated_at: new Date().toISOString(),
  })
})

export async function startBackgroundCrossingTracking(me: ProximityPlayer): Promise<boolean> {
  if (!supabase) return false

  await AsyncStorage.setItem(PRESENCE_KEY, JSON.stringify(me))

  const foreground = await Location.getForegroundPermissionsAsync()
  if (!foreground.granted) return false

  const background = await Location.requestBackgroundPermissionsAsync()
  if (background.status !== 'granted') return false

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(TASK_NAME)
  if (alreadyStarted) return true

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 60_000,
    distanceInterval: 50,
    pausesUpdatesAutomatically: true,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'Croisio actif',
      notificationBody: 'Detection des croisements en arriere-plan.',
      notificationColor: '#F5C542',
    },
  })
  return true
}

export async function stopBackgroundCrossingTracking(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME)
  if (started) await Location.stopLocationUpdatesAsync(TASK_NAME)
}
