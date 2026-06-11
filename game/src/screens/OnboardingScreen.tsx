import React, { useState } from 'react'
import {
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { CreatureType } from '../types'
import { CREATURE_LABELS, CREATURE_NAMES } from '../utils/creature'
import { font, retro, retroShadow, typeTheme } from '../styles/retro'
import { Chip, PixelButton } from '../components/ui'

const CREATURE_SPRITES: Record<CreatureType, ImageSourcePropType> = {
  ignis:   require('../../assets/sprites/ignis_e1_clean.png'),
  nemo:    require('../../assets/sprites/nemo_e1_clean.png'),
  sylva:   require('../../assets/sprites/sylva_e1_clean.png'),
  zapp:    require('../../assets/sprites/zapp_e1_clean.png'),
  ombra:   require('../../assets/sprites/ombra_e1_clean.png'),
  magma:   require('../../assets/sprites/magma_e1_clean.png'),
  abyssal: require('../../assets/sprites/abyssal_e1_clean.png'),
  sable:   require('../../assets/sprites/sable_e1_clean.png'),
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

  const ctaDisabled = step === 'username' ? username.trim().length < 2 : !selectedType

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ── Hero logotype with gold echo ── */}
        <View style={styles.logoWrap}>
          <View>
            <Text style={styles.logoEcho}>Croisio</Text>
            <Text style={styles.logo}>Croisio</Text>
          </View>
          <View style={styles.taglineRow}>
            <View style={styles.taglineRule} />
            <Text style={styles.tagline}>Élève ta créature, croise le monde.</Text>
            <View style={styles.taglineRule} />
          </View>
        </View>

        {step === 'username' ? (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Chip text="1/2" color={retro.ink} textColor={retro.white} />
              <Text style={styles.stepTitle}>Comment tu t'appelles ?</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ton pseudo"
              placeholderTextColor={retro.faded}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
              autoFocus
            />
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Chip text="2/2" color={retro.ink} textColor={retro.white} />
              <Text style={styles.stepTitle}>Choisis ta créature</Text>
            </View>
            <View style={styles.creatureGrid}>
              {CREATURE_TYPES.map((type) => {
                const theme = typeTheme[type]
                const { name: label, description } = CREATURE_LABELS[type]
                const firstName = CREATURE_NAMES[type][0]
                const selected = selectedType === type

                return (
                  <PixelButton
                    key={type}
                    onPress={() => setSelectedType(type)}
                    color={selected ? theme.soft : retro.white}
                    style={[
                      styles.creatureCard,
                      ...(selected ? [{ borderColor: theme.dark }] : []),
                    ]}
                  >
                    <View style={styles.spriteSlot}>
                      <Image
                        source={CREATURE_SPRITES[type]}
                        style={styles.creatureSprite}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={[styles.creatureLabel, selected && { color: theme.dark }]}>
                      {label}
                    </Text>
                    <Text style={styles.firstName}>{firstName}</Text>
                    <Text style={styles.creatureDesc}>{description}</Text>
                    {selected && (
                      <Chip
                        text="✓"
                        color={theme.main}
                        textColor={retro.white}
                        style={styles.checkChip}
                      />
                    )}
                  </PixelButton>
                )
              })}
            </View>
          </View>
        )}

        <PixelButton
          big
          title={step === 'username' ? 'Suivant →' : 'Commencer !'}
          onPress={handleNext}
          disabled={ctaDisabled}
          color={retro.ink}
          style={styles.cta}
        />
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
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 40,
  },

  // hero
  logoWrap: {
    alignItems: 'center',
    marginBottom: 44,
    gap: 12,
  },
  logoEcho: {
    ...font.display,
    fontSize: 46,
    textAlign: 'center',
    position: 'absolute',
    left: 4,
    top: 4,
    color: retro.gold,
    opacity: 0.6,
  },
  logo: {
    ...font.display,
    fontSize: 46,
    textAlign: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
    paddingHorizontal: 4,
  },
  taglineRule: {
    flex: 1,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderColor: retro.ink,
    opacity: 0.25,
  },
  tagline: {
    fontSize: 13,
    color: retro.muted,
    textAlign: 'center',
  },

  // step
  stepContainer: {
    flex: 1,
    gap: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepTitle: {
    ...font.title,
    fontSize: 20,
    flexShrink: 1,
  },

  // username input
  input: {
    backgroundColor: retro.white,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    color: retro.ink,
    fontFamily: 'monospace',
    fontWeight: '800',
    borderWidth: 3,
    borderColor: retro.line,
    ...retroShadow,
  },

  // creature pick
  creatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  creatureCard: {
    width: '47%',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  spriteSlot: {
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    padding: 8,
    marginBottom: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  creatureSprite: {
    width: 64,
    height: 64,
  },
  creatureLabel: {
    ...font.title,
    fontSize: 16,
  },
  firstName: {
    ...font.mono,
    fontSize: 11,
    color: retro.muted,
    marginTop: 2,
  },
  creatureDesc: {
    fontSize: 11,
    color: retro.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  checkChip: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  // CTA
  cta: {
    marginTop: 28,
  },
})
