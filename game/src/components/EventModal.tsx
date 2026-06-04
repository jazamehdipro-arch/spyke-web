import React from 'react'
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { GameEvent } from '../types'

interface Props {
  event: GameEvent | null
  onClose: () => void
}

export default function EventModal({ event, onClose }: Props) {
  if (!event) return null

  return (
    <Modal visible={!!event} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{event.emoji}</Text>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.message}>{event.message}</Text>

          {event.reward && (
            <View style={styles.rewardBox}>
              <Text style={styles.rewardLabel}>Récompense</Text>
              <Text style={styles.rewardText}>
                {event.reward.xp ? `+${event.reward.xp} XP` : ''}
                {event.reward.itemId ? ' + item dans l\'inventaire !' : ''}
              </Text>
            </View>
          )}

          {event.type === 'sick' && (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                💊 Donne-lui un médicament depuis l'inventaire !
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>OK !</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  rewardBox: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 11,
    color: '#A855F7',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  rewardText: {
    fontSize: 15,
    color: '#1a1a2e',
    fontWeight: '700',
  },
  alertBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  alertText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
