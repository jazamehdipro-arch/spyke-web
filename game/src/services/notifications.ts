import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { SocialEvent } from '../types'
import { supabase } from './supabase'

let configured = false

export async function configureCrossingNotifications(): Promise<boolean> {
  if (!configured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
    configured = true
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('crossings', {
      name: 'Croisements',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#F5C542',
    })
  }

  const current = await Notifications.getPermissionsAsync()
  const finalStatus = current.granted
    ? current.status
    : (await Notifications.requestPermissionsAsync()).status

  return finalStatus === Notifications.PermissionStatus.GRANTED
}

export async function notifyCrossing(event: SocialEvent, queued: boolean): Promise<void> {
  const allowed = await configureCrossingNotifications()
  if (!allowed) return

  await Notifications.scheduleNotificationAsync({
    content: {
      title: queued ? 'Croisement mis en attente' : event.title,
      body: queued
        ? `${event.title} avec ${event.opponent?.creatureName ?? 'un monstre'} sera disponible apres le combat.`
        : event.message,
      data: { type: 'crossing', eventId: event.id, pendingCombat: !!event.pendingCombat },
      sound: true,
    },
    trigger: null,
  })
}

export async function registerCrossingPushToken(userId: string): Promise<string | null> {
  if (!supabase) return null
  const allowed = await configureCrossingNotifications()
  if (!allowed) return null

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  if (!projectId) return null

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  await supabase.from('device_push_tokens').upsert({
    user_id: userId,
    expo_push_token: token,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
  })
  return token
}
