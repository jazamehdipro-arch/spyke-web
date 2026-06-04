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

const CREATURE_SPRITES: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_f2.png'),
  nemo:  require('../../assets/sprites/nemo_f2.png'),
  sylva: require('../../assets/sprites/sylva_f2.png'),
  zapp:  require('../../assets/sprites/zapp_f2.png'),
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
    backgroundColor: '#F8F7FF',
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
    color: '#1a1a2e',
    letterSpacing: -2,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#888',
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
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  creatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  creatureCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  creatureSprite: {
    width: 72,
    height: 72,
    marginBottom: 6,
  },
  creatureLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  firstName: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  creatureDesc: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
})
