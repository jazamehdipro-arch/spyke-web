import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Creature, CreatureType } from '../types'
import { retro, retroShadow, typeTheme } from '../styles/retro'
import CombatScreen, { CombatOpponent } from './CombatScreen'

// ── Sprites ────────────────────────────────────────────────
const SPRITES_E1: Record<CreatureType, ImageSourcePropType> = {
  ignis:   require('../../assets/sprites/ignis_e1_clean.png'),
  nemo:    require('../../assets/sprites/nemo_e1_clean.png'),
  sylva:   require('../../assets/sprites/sylva_e1_clean.png'),
  zapp:    require('../../assets/sprites/zapp_e1_clean.png'),
  ombra:   require('../../assets/sprites/ombra_e1_clean.png'),
  magma:   require('../../assets/sprites/magma_e1_clean.png'),
  abyssal: require('../../assets/sprites/abyssal_e1_clean.png'),
  sable:   require('../../assets/sprites/sable_e1_clean.png'),
}

interface TutorialItem { emoji: string; label: string; desc: string }

interface TutorialSlide {
  id: string
  emoji: string
  title: string
  body?: string
  items?: TutorialItem[]
  isWelcome?: boolean
  isCombatIntro?: boolean
}

// Slides can use [NAME] as placeholder for creature name
const SLIDES: TutorialSlide[] = [
  {
    id: 'welcome',
    emoji: '🎉',
    title: 'Bienvenue dans Croisio !',
    body: "Tu viens d'adopter [NAME]. Prends soin de lui chaque jour et il deviendra le monstre le plus redoutable du monde.",
    isWelcome: true,
  },
  {
    id: 'home',
    emoji: '🏠',
    title: 'L\'écran principal',
    body: 'Surveille les 3 jauges de ton monstre en permanence.',
    items: [
      { emoji: '🍗', label: 'Faim', desc: 'S\'il a trop faim, il perd de la vitalité. Nourris-le plusieurs fois par jour.' },
      { emoji: '⭐', label: 'Bonheur', desc: 'Un monstre heureux gagne +20% d\'XP. Joue avec lui régulièrement.' },
      { emoji: '⚡', label: 'Énergie', desc: 'Nécessaire pour s\'entraîner et bien combattre. Fais-le dormir la nuit.' },
    ],
  },
  {
    id: 'actions',
    emoji: '🎮',
    title: 'Les Actions',
    body: 'Quatre actions disponibles chaque jour pour prendre soin de lui.',
    items: [
      { emoji: '🍗', label: 'Nourrir', desc: 'Remonte la faim. À faire plusieurs fois par jour avec des objets de l\'inventaire.' },
      { emoji: '🎮', label: 'Jouer', desc: 'Augmente le bonheur et donne de l\'XP. Débloque des mini-jeux fun.' },
      { emoji: '💪', label: 'S\'entraîner', desc: 'Améliore ses statistiques de combat de façon permanente. Coûte de l\'énergie.' },
      { emoji: '💤', label: 'Dormir', desc: 'Récupère toute l\'énergie d\'un coup. Idéal avant un entraînement ou un combat.' },
    ],
  },
  {
    id: 'xp',
    emoji: '📈',
    title: 'Progression & Niveaux',
    body: '',
    items: [
      { emoji: '📈', label: 'XP quotidien', desc: 'Chaque soin, repas et session de jeu rapporte jusqu\'à 30 XP par jour.' },
      { emoji: '⭐', label: 'Monter de niveau', desc: 'Plus ton niveau est haut, plus tu débloques de sorts puissants et d\'évolutions.' },
      { emoji: '💰', label: 'Pièces', desc: 'Gagnées en combattant et en croisements. Sert à acheter des objets en boutique.' },
      { emoji: '🎒', label: 'Inventaire', desc: 'Ton sac contient les objets de soin et de boost. Accessible depuis l\'écran principal.' },
    ],
  },
  {
    id: 'crossings',
    emoji: '📡',
    title: 'Les Croisements',
    body: 'Le cœur de Croisio — des rencontres réelles avec d\'autres joueurs.',
    items: [
      { emoji: '📡', label: 'Radar GPS', desc: 'Quand tu croises un dresseur à moins de 200m, ton monstre interagit automatiquement.' },
      { emoji: '🤝', label: 'Liens sociaux', desc: 'Chaque rencontre peut évoluer en amitié, rivalité ou même romance entre monstres.' },
      { emoji: '⚔️', label: 'Duels', desc: 'Selon le caractère de ton monstre, il peut défier ou être défié spontanément.' },
      { emoji: '🎭', label: 'Caractère', desc: 'Configure son attitude : sociable, agressif, filou… il agira selon ta personnalité.' },
    ],
  },
  {
    id: 'combat_intro',
    emoji: '⚔️',
    title: 'Le Combat',
    body: 'Des combats au tour par tour contre d\'autres monstres.',
    items: [
      { emoji: '❤️', label: 'Points de vie (PV)', desc: 'Tombe à 0 PV = défaite. Surveille la barre rouge de ton adversaire et la tienne.' },
      { emoji: '⚡', label: 'Énergie de combat', desc: 'Chaque sort coûte de l\'énergie. Tu récupères 2 points par tour automatiquement.' },
      { emoji: '🔮', label: '4 sorts disponibles', desc: 'Attaque, défense, soin, statut… choisis le bon sort selon la situation.' },
      { emoji: '🎯', label: 'Esquive & Type', desc: 'Ton type de monstre peut donner un avantage naturel contre certains adversaires.' },
    ],
    isCombatIntro: true,
  },
]

interface Props {
  creature: Creature
  username: string
  onComplete: () => void
}

export default function TutorialScreen({ creature, username, onComplete }: Props) {
  const [slideIndex, setSlideIndex]   = useState(0)
  const [phase, setPhase]             = useState<'slides' | 'combat'>('slides')
  const slideAnim                     = useRef(new Animated.Value(0)).current
  const spriteAnim                    = useRef(new Animated.Value(0)).current
  const theme                         = typeTheme[creature.type]

  const currentSlide = SLIDES[slideIndex]

  useEffect(() => {
    slideAnim.setValue(0)
    Animated.timing(slideAnim, {
      toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start()

    if (currentSlide?.isWelcome) {
      spriteAnim.setValue(0)
      Animated.spring(spriteAnim, { toValue: 1, bounciness: 12, useNativeDriver: true }).start()
    }
  }, [slideIndex])

  const handleNext = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1)
    } else {
      setPhase('combat')
    }
  }

  const handleSkip = () => { onComplete() }

  const handleCombatEnd = (_won: boolean, _xp: number) => { onComplete() }

  // ── Tutorial combat opponent (level 1, easy) ─────────────
  const tutorialOpponent: CombatOpponent = {
    username:     'DresseurRival',
    creatureName: 'Flick',
    creatureType: 'nemo',
    level:        1,
  }

  if (phase === 'combat') {
    return (
      <View style={{ flex: 1 }}>
        {/* Intro banner shown above combat */}
        <CombatScreen
          player={creature}
          opponent={tutorialOpponent}
          onFinish={handleCombatEnd}
          tutorialMode
        />
      </View>
    )
  }

  const isLast = slideIndex === SLIDES.length - 1
  const progress = (slideIndex + 1) / SLIDES.length

  return (
    <SafeAreaView style={s.safe}>
      {/* Skip button */}
      <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
        <Text style={s.skipTxt}>Passer le tuto</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Progress dots */}
        <View style={s.progressRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.progressDot, i <= slideIndex && s.progressDotActive, i === slideIndex && s.progressDotCurrent]} />
          ))}
        </View>

        {/* Slide content */}
        <Animated.View style={[s.slideWrap, {
          opacity: slideAnim,
          transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }]}>

          {/* Welcome slide — big creature reveal */}
          {currentSlide.isWelcome ? (
            <View style={s.welcomeWrap}>
              <Animated.View style={[s.welcomeSpriteRing, { backgroundColor: theme.main + '18', transform: [{ scale: spriteAnim }] }]} />
              <Animated.View style={[s.welcomeSpriteRing2, { backgroundColor: theme.main + '28', transform: [{ scale: spriteAnim }] }]} />
              <Animated.View style={{ transform: [{ scale: spriteAnim }] }}>
                <View style={[s.welcomeSpriteBox, { backgroundColor: theme.soft, borderColor: theme.dark }]}>
                  <Image source={SPRITES_E1[creature.type]} style={s.welcomeSprite} resizeMode="contain" />
                </View>
              </Animated.View>
              <View style={[s.welcomeNameTag, { backgroundColor: theme.main, borderColor: theme.dark }]}>
                <Text style={s.welcomeNameTxt}>{creature.name}</Text>
              </View>
            </View>
          ) : (
            <View style={s.slideIconWrap}>
              <Text style={s.slideIcon}>{currentSlide.emoji}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={s.slideTitle}>{currentSlide.title}</Text>

          {/* Body text */}
          {currentSlide.body ? (
            <Text style={s.slideBody}>
              {currentSlide.body.replace('[NAME]', creature.name)}
            </Text>
          ) : null}

          {/* Items list */}
          {currentSlide.items && (
            <View style={s.itemsList}>
              {currentSlide.items.map((item) => (
                <View key={item.label} style={s.itemRow}>
                  <View style={[s.itemIcon, { backgroundColor: theme.main + '18' }]}>
                    <Text style={s.itemEmoji}>{item.emoji}</Text>
                  </View>
                  <View style={s.itemText}>
                    <Text style={s.itemLabel}>{item.label}</Text>
                    <Text style={s.itemDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Combat intro — extra warning */}
          {currentSlide.isCombatIntro && (
            <View style={[s.combatBanner, { borderLeftColor: retro.red }]}>
              <Text style={s.combatBannerTxt}>
                💡 Après ce tutoriel, un combat d'entraînement te sera proposé contre un adversaire facile. Tu peux mettre en pratique !
              </Text>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={s.navRow}>
        {slideIndex > 0 && (
          <TouchableOpacity style={s.backBtn} onPress={() => setSlideIndex(slideIndex - 1)}>
            <Text style={s.backTxt}>← Précédent</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[s.nextBtn, { backgroundColor: isLast ? retro.red : theme.main }]}
          onPress={handleNext}
        >
          <Text style={s.nextTxt}>{isLast ? '⚔️ Combat test !' : 'Suivant →'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: retro.paper },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 20 },

  skipBtn: { position: 'absolute', top: 52, right: 16, zIndex: 10, paddingHorizontal: 12, paddingVertical: 6 },
  skipTxt: { fontSize: 11, color: retro.faded, fontFamily: 'monospace', fontWeight: '800' },

  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 10 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: retro.paper3 },
  progressDotActive: { backgroundColor: retro.line },
  progressDotCurrent: { width: 20, backgroundColor: retro.ink },

  slideWrap: { gap: 18, paddingTop: 16 },

  // Welcome slide
  welcomeWrap: { alignItems: 'center', paddingVertical: 12 },
  welcomeSpriteRing: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
  },
  welcomeSpriteRing2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
  },
  welcomeSpriteBox: {
    width: 120, height: 120, borderRadius: 8, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', ...retroShadow,
  },
  welcomeSprite: { width: 100, height: 100 },
  welcomeNameTag: {
    marginTop: 12, borderRadius: 4, borderWidth: 2,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  welcomeNameTxt: { fontSize: 18, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },

  // Generic slide
  slideIconWrap: { alignItems: 'center', paddingVertical: 8 },
  slideIcon: { fontSize: 56 },

  slideTitle: { fontSize: 24, fontWeight: '900', color: retro.ink, fontFamily: 'monospace', textAlign: 'center' },
  slideBody:  { fontSize: 14, color: retro.ink2, lineHeight: 22, textAlign: 'center' },

  // Items
  itemsList: { gap: 10 },
  itemRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: retro.white, borderWidth: 2, borderColor: retro.line,
    borderRadius: 6, padding: 12, ...retroShadow,
  },
  itemIcon: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  itemEmoji: { fontSize: 22 },
  itemText: { flex: 1, gap: 3 },
  itemLabel: { fontSize: 14, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  itemDesc:  { fontSize: 12, color: retro.muted, lineHeight: 17 },

  combatBanner: {
    backgroundColor: retro.red + '10', borderLeftWidth: 4, borderWidth: 2,
    borderColor: retro.red + '33', borderRadius: 4, padding: 12,
  },
  combatBannerTxt: { fontSize: 12, color: retro.ink, lineHeight: 18 },

  // Navigation bar
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 2, borderTopColor: retro.line,
    backgroundColor: retro.paper,
  },
  backBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  backTxt: { fontSize: 13, color: retro.muted, fontFamily: 'monospace', fontWeight: '800' },
  nextBtn: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)' },
  nextTxt: { fontSize: 14, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },
})
