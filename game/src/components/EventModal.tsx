import React from 'react'
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { GameEvent } from '../types'
import { font, retro, retroShadowSm } from '../styles/retro'
import { Chip, Panel, PixelButton } from './ui'

interface Props {
  event: GameEvent | null
  onClose: () => void
}

export default function EventModal({ event, onClose }: Props) {
  if (!event) return null

  return (
    <Modal visible={!!event} transparent animationType="fade">
      <View style={styles.overlay}>
        <Panel label="ÉVÉNEMENT" labelColor={retro.gold} shadow="lg" style={styles.card}>
          <View style={styles.emojiSlot}>
            <Text style={styles.emoji}>{event.emoji}</Text>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.message}>{event.message}</Text>

          {event.reward && (
            <View style={styles.rewardBox}>
              <Text style={styles.rewardLabel}>Récompense</Text>
              <View style={styles.rewardChips}>
                {event.reward.xp ? (
                  <Chip text={`+${event.reward.xp} XP`} color={retro.gold} textColor={retro.ink} />
                ) : null}
                {event.reward.itemId ? (
                  <Chip text={"+ item dans l'inventaire !"} color={retro.gold} textColor={retro.ink} />
                ) : null}
              </View>
            </View>
          )}

          {event.type === 'sick' && (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                💊 Donne-lui un médicament depuis l'inventaire !
              </Text>
            </View>
          )}

          <PixelButton title="OK !" onPress={onClose} color={retro.ink} textColor={retro.white} style={{ alignSelf: 'stretch' }} />
        </Panel>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23,27,46,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    padding: 22,
    paddingTop: 26,
    backgroundColor: retro.paper,
  },
  emojiSlot: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    ...retroShadowSm,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    ...font.title,
    fontSize: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: retro.ink2,
    textAlign: 'center',
    lineHeight: 21,
  },
  rewardBox: {
    backgroundColor: retro.white,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    gap: 7,
  },
  rewardLabel: {
    ...font.label,
    fontSize: 9,
    color: retro.goldDark,
  },
  rewardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  alertBox: {
    backgroundColor: '#F6DCC9',
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    padding: 12,
    width: '100%',
  },
  alertText: {
    ...font.mono,
    fontSize: 12,
    color: retro.redDark,
    textAlign: 'center',
  },
})
