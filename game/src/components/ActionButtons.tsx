import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface Action {
  icon: string
  label: string
  onPress: () => void
  disabled?: boolean
}

interface Props {
  onFeed: () => void
  onPlay: () => void
  onSleep: () => void
  hungerFull: boolean
  energyFull: boolean
}

export default function ActionButtons({
  onFeed,
  onPlay,
  onSleep,
  hungerFull,
  energyFull,
}: Props) {
  const actions: Action[] = [
    { icon: '🍖', label: 'Nourrir', onPress: onFeed, disabled: hungerFull },
    { icon: '🎮', label: 'Jouer',   onPress: onPlay },
    { icon: '💤', label: 'Dormir',  onPress: onSleep, disabled: energyFull },
  ]

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={[styles.button, action.disabled && styles.disabled]}
          onPress={action.onPress}
          disabled={action.disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{action.icon}</Text>
          <Text style={[styles.label, action.disabled && styles.disabledLabel]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 28,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  disabledLabel: {
    color: '#999',
  },
})
