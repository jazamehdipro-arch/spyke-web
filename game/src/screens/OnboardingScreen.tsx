import React, { useState } from 'react'
import {
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { CreatureType } from '../types'
import { CREATURE_COLORS, CREATURE_LABELS, CREATURE_NAMES } from '../utils/creature'
import { retro, retroShadow } from '../styles/retro'

const CREATURE_SPRITES: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_e1_clean.png'),
  nemo:  require('../../assets/sprites/nemo_e1_clean.png'),
  sylva: require('../../assets/sprites/sylva_e1_clean.png'),
  zapp:  require('../../assets/sprites/zapp_e1_clean.png'),
}

const CREATURE_TYPES: CreatureType[] = ['ignis', 'nemo', 'sylva', 'zapp']

interface Props {
  onComplete: (username: string, creatureType: CreatureType) => void
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState<'username' | 'creature'>('username')
  const [username, setUsername] = useState('')
  const [selectedType, setSelectedType] = useState<CreatureType | null>(null)

  const handleNext = () => {
    if (step === 'username') {
      if (username.trim().length < 2) return
      setStep('creature')
    } else {
      if (!selectedType) return
      onComplete(username.trim(), selectedType)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>Croisio</Text>
        <Text style={styles.tagline}>Élève ta créature, croise le monde.</Text>

        {step === 'username' ? (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Comment tu t'appelles ?</Text>
            <TextInput
              style={styles.input}
              placeholder="Ton pseudo"
              placeholderTextColor="#bbb"
              value={username}
              onChangeText={setUsername}
              maxLength={20}
              autoFocus
            />
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choisis ta créature</Text>
            <View style={styles.creatureGrid}>
              {CREATURE_TYPES.map((type) => {
                const color = CREATURE_COLORS[type]
                const { name: label, description } = CREATURE_LABELS[type]
                const firstName = CREATURE_NAMES[type][0]
                const selected = selectedType === type

                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.creatureCard,
                      selected && { borderColor: color, borderWidth: 2, backgroundColor: color + '11' },
                    ]}
                    onPress={() => setSelectedType(type)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={CREATURE_SPRITES[type]}
                      style={styles.creatureSprite}
                      resizeMode="contain"
                    />
                    <Text style={[styles.creatureLabel, selected && { color }]}>{label}</Text>
                    <Text style={styles.firstName}>{firstName}</Text>
                    <Text style={styles.creatureDesc}>{description}</Text>
                    {selected && (
                      <View style={[styles.selectedDot, { backgroundColor: color }]} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (step === 'username' ? username.trim().length < 2 : !selectedType) &&
              styles.buttonDisabled,
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {step === 'username' ? 'Suivant →' : 'Commencer !'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: retro.paper,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: retro.ink,
    letterSpacing: 0,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  tagline: {
    fontSize: 16,
    color: retro.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 50,
  },
  stepContainer: {
    flex: 1,
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: retro.ink,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: retro.white,
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: retro.ink,
    borderWidth: 3,
    borderColor: retro.line,
    ...retroShadow,
    elevation: 3,
  },
  creatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  creatureCard: {
    width: '47%',
    backgroundColor: retro.white,
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: retro.line,
    ...retroShadow,
    elevation: 3,
  },
  creatureSprite: {
    width: 72,
    height: 72,
    marginBottom: 6,
  },
  creatureLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: retro.ink,
    fontFamily: 'monospace',
  },
  firstName: {
    fontSize: 12,
    color: retro.muted,
    marginTop: 2,
  },
  creatureDesc: {
    fontSize: 11,
    color: retro.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    marginTop: 8,
  },
  button: {
    backgroundColor: retro.ink,
    borderRadius: 4,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 3,
    borderColor: retro.line,
    ...retroShadow,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: retro.white,
    fontSize: 17,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
})
