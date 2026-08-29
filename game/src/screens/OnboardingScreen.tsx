import React, { useRef, useState } from 'react'
import {
  Animated,
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
import { CREATURE_LABELS, CREATURE_NAMES } from '../utils/creature'
import { DEFAULT_LOADOUTS } from '../utils/spells'
import { SPELL_CATALOG } from '../utils/spells'
import { font, retro, retroShadow, typeTheme } from '../styles/retro'
import { PixelButton } from '../components/ui'

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

const SELECTABLE_TYPES: CreatureType[] = ['ignis', 'nemo', 'sylva', 'zapp']

const COMBAT_STYLES: Record<CreatureType, string> = {
  ignis:   '🔥 Attaquant — Brûlures puissantes et explosions. Idéal pour jouer offensif.',
  nemo:    '💧 Soutien — Soins, barrières et malédictions. Fort en longue durée.',
  sylva:   '🌿 Furtif — Esquive élevée et dégâts en embuscade. Imprévisible.',
  zapp:    '⚡ Rapide — Paralysie et décharges électriques. Contrôle du terrain.',
  ombra: '', magma: '', abyssal: '', sable: '',
}

const TYPE_ICONS: Record<CreatureType, string> = {
  ignis: '🔥', nemo: '💧', sylva: '🌿', zapp: '⚡',
  ombra: '🌑', magma: '🌋', abyssal: '🌀', sable: '🏜️',
}

interface Props {
  onComplete: (username: string, creatureType: CreatureType, creatureName: string) => void
}

type Step = 'username' | 'pick' | 'name'

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep]               = useState<Step>('username')
  const [username, setUsername]       = useState('')
  const [selectedType, setSelectedType] = useState<CreatureType | null>(null)
  const [creatureName, setCreatureName] = useState('')
  const panelAnim = useRef(new Animated.Value(0)).current

  const selectType = (type: CreatureType) => {
    if (selectedType === type) return
    setSelectedType(type)
    setCreatureName(CREATURE_NAMES[type][0])
    panelAnim.setValue(0)
    Animated.spring(panelAnim, { toValue: 1, bounciness: 8, useNativeDriver: true }).start()
  }

  const goToName = () => {
    if (!selectedType) return
    setStep('name')
    panelAnim.setValue(0)
  }

  const handleComplete = () => {
    if (!selectedType || creatureName.trim().length < 1) return
    onComplete(username.trim(), selectedType, creatureName.trim())
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logoEcho}>Croisio</Text>
          <Text style={s.logo}>Croisio</Text>
          <Text style={s.tagline}>Élève ta créature, croise le monde.</Text>
        </View>

        {/* ── Step 1: Username ── */}
        {step === 'username' && (
          <View style={s.stepWrap}>
            <View style={s.stepBadge}><Text style={s.stepBadgeTxt}>1 / 3</Text></View>
            <Text style={s.stepTitle}>Comment tu t'appelles ?</Text>
            <TextInput
              style={s.input}
              placeholder="Ton pseudo de dresseur"
              placeholderTextColor={retro.faded}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => { if (username.trim().length >= 2) setStep('pick') }}
            />
            <PixelButton
              big
              title="Suivant →"
              onPress={() => setStep('pick')}
              disabled={username.trim().length < 2}
              color={retro.ink}
              style={s.cta}
            />
          </View>
        )}

        {/* ── Step 2: Creature picker ── */}
        {step === 'pick' && (
          <View style={s.stepWrap}>
            <View style={s.stepBadge}><Text style={s.stepBadgeTxt}>2 / 3</Text></View>
            <Text style={s.stepTitle}>Choisis ta créature</Text>
            <Text style={s.stepSub}>Appuie sur une créature pour voir ses caractéristiques</Text>

            {/* 2×2 grid */}
            <View style={s.grid}>
              {SELECTABLE_TYPES.map((type) => {
                const theme   = typeTheme[type]
                const label   = CREATURE_LABELS[type].name
                const desc    = CREATURE_LABELS[type].description
                const chosen  = selectedType === type
                return (
                  <TouchableOpacity
                    key={type}
                    style={[s.card, chosen && { borderColor: theme.dark, backgroundColor: theme.soft }]}
                    onPress={() => selectType(type)}
                    activeOpacity={0.8}
                  >
                    {chosen && (
                      <View style={[s.cardCheckBadge, { backgroundColor: theme.main }]}>
                        <Text style={s.cardCheckTxt}>✓</Text>
                      </View>
                    )}
                    <View style={[s.cardSpriteBox, { backgroundColor: chosen ? theme.main + '22' : retro.paper2 }]}>
                      <Image source={CREATURE_SPRITES[type]} style={s.cardSprite} resizeMode="contain" />
                    </View>
                    <Text style={[s.cardLabel, chosen && { color: theme.dark }]}>{label}</Text>
                    <Text style={s.cardDesc}>{desc}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Detail panel — appears when a creature is selected */}
            {selectedType && (() => {
              const theme  = typeTheme[selectedType]
              const label  = CREATURE_LABELS[selectedType].name
              const spells = DEFAULT_LOADOUTS[selectedType].e1.slice(0, 2)
              return (
                <Animated.View style={[s.detailPanel, {
                  borderColor: theme.dark,
                  transform: [{ translateY: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                  opacity: panelAnim,
                }]}>
                  {/* Accent stripe */}
                  <View style={[s.detailStripe, { backgroundColor: theme.main }]}>
                    <Text style={s.detailStripeEmoji}>{TYPE_ICONS[selectedType]}</Text>
                    <Text style={s.detailStripeName}>{label}</Text>
                    <View style={s.detailLvlBadge}><Text style={s.detailLvlTxt}>Niv. 1</Text></View>
                  </View>

                  <View style={s.detailBody}>
                    {/* Large sprite */}
                    <View style={[s.detailSpriteBox, { backgroundColor: theme.soft }]}>
                      <Image source={CREATURE_SPRITES[selectedType]} style={s.detailSprite} resizeMode="contain" />
                    </View>
                    <View style={s.detailInfo}>
                      <Text style={s.detailStyleTitle}>Style de combat</Text>
                      <Text style={s.detailStyle}>{COMBAT_STYLES[selectedType]}</Text>
                      <Text style={s.detailSpellsTitle}>Sorts de départ</Text>
                      <View style={s.detailSpells}>
                        {spells.map((sid) => (
                          <View key={sid} style={[s.detailSpellChip, { backgroundColor: theme.main }]}>
                            <Text style={s.detailSpellTxt}>{SPELL_CATALOG[sid].emoji} {SPELL_CATALOG[sid].name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={[s.chooseBtn, { backgroundColor: theme.main, borderColor: theme.dark }]} onPress={goToName}>
                    <Text style={s.chooseBtnTxt}>Choisir {label} →</Text>
                  </TouchableOpacity>
                </Animated.View>
              )
            })()}
          </View>
        )}

        {/* ── Step 3: Name creature ── */}
        {step === 'name' && selectedType && (() => {
          const theme = typeTheme[selectedType]
          const label = CREATURE_LABELS[selectedType].name
          return (
            <View style={s.stepWrap}>
              <View style={s.stepBadge}><Text style={s.stepBadgeTxt}>3 / 3</Text></View>
              <Text style={s.stepTitle}>Comment s'appelle-t-il ?</Text>

              {/* Creature preview */}
              <View style={[s.namePreview, { backgroundColor: theme.soft, borderColor: theme.dark }]}>
                <Image source={CREATURE_SPRITES[selectedType]} style={s.nameSprite} resizeMode="contain" />
                <View>
                  <Text style={[s.nameTypeBadge, { color: theme.main }]}>{TYPE_ICONS[selectedType]} {label}</Text>
                  <Text style={s.nameHint}>Tu pourras changer ce prénom plus tard</Text>
                </View>
              </View>

              <TextInput
                style={[s.input, { borderColor: theme.dark }]}
                placeholder={`Prénom de ta créature`}
                placeholderTextColor={retro.faded}
                value={creatureName}
                onChangeText={setCreatureName}
                maxLength={16}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleComplete}
              />

              <View style={s.nameBtnsRow}>
                <TouchableOpacity style={s.backBtn} onPress={() => setStep('pick')}>
                  <Text style={s.backBtnTxt}>← Retour</Text>
                </TouchableOpacity>
                <PixelButton
                  big
                  title="Commencer !"
                  onPress={handleComplete}
                  disabled={creatureName.trim().length < 1}
                  color={theme.main}
                  style={s.ctaFlex}
                />
              </View>
            </View>
          )
        })()}

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: retro.paper },
  container: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 48 },

  logoWrap: { alignItems: 'center', marginBottom: 36, gap: 6 },
  logoEcho: { ...font.display, fontSize: 44, textAlign: 'center', position: 'absolute', left: '28%', top: 4, color: retro.gold, opacity: 0.55 },
  logo: { ...font.display, fontSize: 44, textAlign: 'center' },
  tagline: { fontSize: 12, color: retro.muted, textAlign: 'center', marginTop: 4 },

  stepWrap: { gap: 14 },
  stepBadge: { alignSelf: 'flex-start', backgroundColor: retro.ink, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 4 },
  stepBadgeTxt: { fontSize: 11, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },
  stepTitle: { ...font.title, fontSize: 22 },
  stepSub: { fontSize: 12, color: retro.muted, marginTop: -6 },

  input: {
    backgroundColor: retro.white, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 17, color: retro.ink, fontFamily: 'monospace', fontWeight: '800',
    borderWidth: 3, borderColor: retro.line, ...retroShadow,
  },
  cta: { marginTop: 8 },
  ctaFlex: { flex: 1 },

  // ── Creature grid ─────────────────────────────────────
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47.5%', backgroundColor: retro.white, borderWidth: 3, borderColor: retro.line,
    borderRadius: 6, padding: 10, alignItems: 'center', gap: 6,
    ...retroShadow,
  },
  cardSpriteBox: {
    width: '100%', aspectRatio: 1, borderRadius: 4, borderWidth: 2, borderColor: retro.line,
    alignItems: 'center', justifyContent: 'center',
  },
  cardSprite: { width: 72, height: 72 },
  cardLabel: { ...font.title, fontSize: 15, textAlign: 'center' },
  cardDesc: { fontSize: 10, color: retro.muted, textAlign: 'center', fontFamily: 'monospace' },
  cardCheckBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  cardCheckTxt: { fontSize: 12, color: retro.white, fontWeight: '900' },

  // ── Detail panel ─────────────────────────────────────
  detailPanel: {
    borderWidth: 3, borderRadius: 6, overflow: 'hidden', backgroundColor: retro.white,
    marginTop: 4, ...retroShadow,
  },
  detailStripe: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  detailStripeEmoji: { fontSize: 18 },
  detailStripeName:  { flex: 1, fontSize: 16, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },
  detailLvlBadge: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  detailLvlTxt: { fontSize: 10, color: retro.white, fontWeight: '900', fontFamily: 'monospace' },

  detailBody: { flexDirection: 'row', padding: 12, gap: 12, alignItems: 'flex-start' },
  detailSpriteBox: { width: 80, height: 80, borderRadius: 4, borderWidth: 2, borderColor: retro.line, alignItems: 'center', justifyContent: 'center' },
  detailSprite: { width: 68, height: 68 },

  detailInfo: { flex: 1, gap: 8 },
  detailStyleTitle: { fontSize: 9, fontWeight: '900', color: retro.muted, fontFamily: 'monospace', letterSpacing: 1 },
  detailStyle: { fontSize: 12, color: retro.ink, lineHeight: 17 },
  detailSpellsTitle: { fontSize: 9, fontWeight: '900', color: retro.muted, fontFamily: 'monospace', letterSpacing: 1 },
  detailSpells: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  detailSpellChip: { borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4 },
  detailSpellTxt: { fontSize: 11, color: retro.white, fontWeight: '900', fontFamily: 'monospace' },

  chooseBtn: {
    margin: 12, marginTop: 4, paddingVertical: 12, borderRadius: 4, borderWidth: 3,
    alignItems: 'center',
  },
  chooseBtnTxt: { fontSize: 15, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },

  // ── Name step ─────────────────────────────────────────
  namePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 3, borderRadius: 6, padding: 12, ...retroShadow,
  },
  nameSprite: { width: 64, height: 64 },
  nameTypeBadge: { fontSize: 15, fontWeight: '900', fontFamily: 'monospace' },
  nameHint: { fontSize: 10, color: retro.muted, marginTop: 4 },
  nameBtnsRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 10 },
  backBtnTxt: { fontSize: 13, color: retro.muted, fontFamily: 'monospace', fontWeight: '800' },
})
