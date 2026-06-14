import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Creature, CreatureType, SpellLoadout } from '../types'
import { retro, retroShadow, typeTheme } from '../styles/retro'
import { SectionTitle } from '../components/ui'
import CombatScreen, { CombatOpponent } from './CombatScreen'
import AdventureScreen from './AdventureScreen'
import { DEFAULT_LOADOUTS, getEvoStage, EvoStage, SPELL_CATALOG } from '../utils/spells'
import { searchForMatch, LEVEL_RANGE, SEARCH_TIMEOUT_MS, MatchPlayer } from '../services/matchmaking'

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
const SPRITES_E2: Record<CreatureType, ImageSourcePropType> = {
  ignis:   require('../../assets/sprites/ignis_e2_f1.png'),
  nemo:    require('../../assets/sprites/nemo_e2_f1.png'),
  sylva:   require('../../assets/sprites/sylva_e2_f1.png'),
  zapp:    require('../../assets/sprites/zapp_e2_f1.png'),
  ombra:   require('../../assets/sprites/ombra_e2_f1.png'),
  magma:   require('../../assets/sprites/magma_e2_f1.png'),
  abyssal: require('../../assets/sprites/abyssal_e2_f1.png'),
  sable:   require('../../assets/sprites/sable_e2_f1.png'),
}
const SPRITES_E3: Record<CreatureType, ImageSourcePropType> = {
  ignis:   require('../../assets/sprites/ignis_e3_f1.png'),
  nemo:    require('../../assets/sprites/nemo_e3_f1.png'),
  sylva:   require('../../assets/sprites/sylva_e3_f1.png'),
  zapp:    require('../../assets/sprites/zapp_e3_f1.png'),
  ombra:   require('../../assets/sprites/ombra_e3_f1.png'),
  magma:   require('../../assets/sprites/magma_e3_f1.png'),
  abyssal: require('../../assets/sprites/abyssal_e3_f1.png'),
  sable:   require('../../assets/sprites/sable_e3_f1.png'),
}

function getSprite(type: CreatureType, level: number): ImageSourcePropType {
  if (level >= 20) return SPRITES_E3[type]
  if (level >= 10) return SPRITES_E2[type]
  return SPRITES_E1[type]
}

// ── Bot pool for AI / fallback ─────────────────────────────
const BOT_NAMES: Record<CreatureType, Record<EvoStage, string[]>> = {
  ignis:   { e1: ['Cinder', 'Ember', 'Pyra'],     e2: ['Blaze', 'Scorch', 'Inferno'],   e3: ['Vulcan', 'Magmus', 'Ignarok']   },
  nemo:    { e1: ['Ripple', 'Deeps', 'Coral'],    e2: ['Surge', 'Tidal', 'Torrent'],    e3: ['Abyss', 'Mareal', 'Levian']     },
  sylva:   { e1: ['Mossy', 'Fern', 'Wisp'],       e2: ['Bramble', 'Grove', 'Shade'],    e3: ['Sylvane', 'Verdant', 'Nebula']  },
  zapp:    { e1: ['Bolt', 'Spark', 'Zara'],       e2: ['Flash', 'Static', 'Volt'],      e3: ['Thunder', 'Tempête', 'Stormix'] },
  ombra:   { e1: ['Nox', 'Shade', 'Umbra'],       e2: ['Phantom', 'Gloom', 'Wraith'],   e3: ['Ombra', 'Darkwing', 'Specter']  },
  magma:   { e1: ['Pyrok', 'Cinder', 'Lava'],     e2: ['Scorch', 'Vulk', 'Blaze'],      e3: ['Magmus', 'Ignrak', 'Titan']     },
  abyssal: { e1: ['Void', 'Murk', 'Kraek'],       e2: ['Abyss', 'Depth', 'Kraken'],     e3: ['Maelstrom', 'Leviath', 'Obsid'] },
  sable:   { e1: ['Dune', 'Sirocco', 'Dust'],     e2: ['Mirage', 'Khepri', 'Sand'],     e3: ['Pharok', 'Deserta', 'Sphinx']   },
}
const BOT_USERNAMES: Record<CreatureType, string[]> = {
  ignis:   ['FlameBattler', 'AshSeeker', 'PyraFan'],
  nemo:    ['TidalWatcher', 'DeepDiver', 'WaveRider'],
  sylva:   ['ForestRunner', 'MistWalker', 'LeafDancer'],
  zapp:    ['StormCatcher', 'VoltSeeker', 'BoltChaser'],
  ombra:   ['ShadowBlade', 'NightStalker', 'PhantomEdge'],
  magma:   ['LavaCrusher', 'VulcanFist', 'MagmaCore'],
  abyssal: ['DeepVoid', 'AbyssKeeper', 'VoidWatcher'],
  sable:   ['DuneLord', 'SandStrider', 'MirageKing'],
}
const ALL_TYPES: CreatureType[] = ['ignis', 'nemo', 'sylva', 'zapp', 'ombra', 'magma', 'abyssal', 'sable']

function generateAIOpponent(playerLevel: number): CombatOpponent {
  const type  = ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)]
  const minLv = Math.max(1, playerLevel - 2)
  const maxLv = playerLevel + 5
  const level = Math.floor(Math.random() * (maxLv - minLv + 1)) + minLv
  const evo   = getEvoStage(level)
  const names = BOT_NAMES[type][evo]
  const name  = names[Math.floor(Math.random() * names.length)]
  const users = BOT_USERNAMES[type]
  const user  = users[Math.floor(Math.random() * users.length)] + (Math.floor(Math.random() * 900) + 100)
  return { username: user, creatureName: name, creatureType: type, level }
}

// ── Matchmaking modal ──────────────────────────────────────
function MatchmakingModal({
  visible,
  playerLevel,
  playerType,
  onMatchFound,
  onCancel,
}: {
  visible:      boolean
  playerLevel:  number
  playerType:   CreatureType
  onMatchFound: (opponent: CombatOpponent) => void
  onCancel:     () => void
}) {
  const [phase, setPhase]                   = useState<'searching' | 'found'>('searching')
  const [elapsed, setElapsed]               = useState(0)
  const [foundOpponent, setFoundOpponent]   = useState<CombatOpponent | null>(null)
  const [isBot, setIsBot]                   = useState(false)
  const cancelRef                           = useRef<(() => void) | null>(null)
  const pulse                               = useRef(new Animated.Value(1)).current
  const revealScale                         = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) return
    setPhase('searching')
    setElapsed(0)
    setFoundOpponent(null)
    setIsBot(false)
    revealScale.setValue(0)

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.22, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    pulseAnim.start()
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000)

    return () => { pulseAnim.stop(); clearInterval(tick); cancelRef.current?.() }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const me: MatchPlayer = {
      userId: `search:${Math.random().toString(36).slice(2)}`,
      username: 'me',
      creatureName: 'Player',
      creatureType: playerType,
      level: playerLevel,
    }
    cancelRef.current = searchForMatch(
      me,
      (result) => {
        const opp: CombatOpponent = {
          username:     result.opponent.username,
          creatureName: result.opponent.creatureName,
          creatureType: result.opponent.creatureType,
          level:        result.opponent.level,
          loadout:      DEFAULT_LOADOUTS[result.opponent.creatureType][getEvoStage(result.opponent.level)],
        }
        setFoundOpponent(opp)
        setIsBot(result.type === 'bot')
        setPhase('found')
        Animated.spring(revealScale, { toValue: 1, bounciness: 14, useNativeDriver: true }).start()
        setTimeout(() => onMatchFound(opp), 2_400)
      },
      () => {},
    )
    return () => { cancelRef.current?.() }
  }, [visible, playerLevel, playerType])

  if (!visible) return null
  const progress = Math.min(1, elapsed / (SEARCH_TIMEOUT_MS / 1000))

  return (
    <Modal visible transparent animationType="fade">
      <View style={mm.overlay}>
        <View style={mm.card}>
          <Text style={mm.kicker}>
            {phase === 'searching' ? '🔍 MATCHMAKING' : '⚔️ ADVERSAIRE TROUVÉ'}
          </Text>

          {phase === 'searching' ? (
            <>
              <View style={mm.radarWrap}>
                <Animated.View style={[mm.radarRing, mm.radarRing3, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.22], outputRange: [0.15, 0.05] }) }]} />
                <Animated.View style={[mm.radarRing, mm.radarRing2, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.22], outputRange: [0.25, 0.1] }) }]} />
                <Animated.View style={[mm.radarRing, mm.radarRing1, { transform: [{ scale: pulse }] }]} />
                <View style={mm.radarCore}><Text style={mm.radarEmoji}>🎮</Text></View>
              </View>
              <Text style={mm.searchTxt}>Recherche d'un adversaire…</Text>
              <Text style={mm.rangeTxt}>Niv. {Math.max(1, playerLevel - LEVEL_RANGE)}–{playerLevel + LEVEL_RANGE}</Text>
              <View style={mm.progressWrap}>
                <View style={[mm.progressBar, { width: `${Math.round(progress * 100)}%` as any }]} />
              </View>
              <Text style={mm.timerTxt}>{elapsed}s</Text>
              <TouchableOpacity style={mm.cancelBtn} onPress={onCancel}>
                <Text style={mm.cancelTxt}>ANNULER</Text>
              </TouchableOpacity>
            </>
          ) : foundOpponent ? (
            <>
              <Animated.View style={[mm.foundWrap, { transform: [{ scale: revealScale }] }]}>
                <View style={[mm.foundSpriteBox, { backgroundColor: typeTheme[foundOpponent.creatureType].soft }]}>
                  <Image source={getSprite(foundOpponent.creatureType, foundOpponent.level)} style={mm.foundSprite} resizeMode="contain" />
                </View>
                <Text style={mm.foundName}>{foundOpponent.creatureName}</Text>
                <Text style={mm.foundUser}>@{foundOpponent.username}</Text>
                <View style={[mm.foundChip, { backgroundColor: typeTheme[foundOpponent.creatureType].main }]}>
                  <Text style={mm.foundChipTxt}>Niv.{foundOpponent.level}</Text>
                </View>
                {isBot && <View style={mm.botBadge}><Text style={mm.botBadgeTxt}>🤖 BOT</Text></View>}
              </Animated.View>
              <Text style={mm.countdownTxt}>Combat dans 3 secondes…</Text>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const mm = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center' },
  card:          { backgroundColor: retro.paper, borderWidth: 3, borderColor: retro.ink, borderRadius: 6, padding: 28, alignItems: 'center', width: 300, gap: 16 },
  kicker:        { fontSize: 13, fontWeight: '900', color: retro.ink, fontFamily: 'monospace', letterSpacing: 1.5 },
  radarWrap:     { alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  radarRing:     { position: 'absolute', borderRadius: 200, borderWidth: 2, borderColor: retro.gold },
  radarRing1:    { width: 60,  height: 60  },
  radarRing2:    { width: 90,  height: 90  },
  radarRing3:    { width: 120, height: 120 },
  radarCore:     { width: 48, height: 48, borderRadius: 24, backgroundColor: retro.gold + '22', borderWidth: 3, borderColor: retro.gold, alignItems: 'center', justifyContent: 'center' },
  radarEmoji:    { fontSize: 22 },
  searchTxt:     { fontSize: 14, fontWeight: '800', color: retro.ink, fontFamily: 'monospace', textAlign: 'center' },
  rangeTxt:      { fontSize: 11, color: retro.muted, fontFamily: 'monospace' },
  progressWrap:  { width: '100%', height: 6, backgroundColor: retro.paper3, borderRadius: 3, overflow: 'hidden' },
  progressBar:   { height: 6, borderRadius: 3, backgroundColor: retro.gold },
  timerTxt:      { fontSize: 10, color: retro.faded, fontFamily: 'monospace' },
  cancelBtn:     { paddingHorizontal: 20, paddingVertical: 8, borderWidth: 2, borderColor: retro.red, borderRadius: 3 },
  cancelTxt:     { fontSize: 11, fontWeight: '900', color: retro.red, fontFamily: 'monospace' },
  foundWrap:     { alignItems: 'center', gap: 8 },
  foundSpriteBox:{ width: 100, height: 100, borderRadius: 6, borderWidth: 3, borderColor: retro.line, alignItems: 'center', justifyContent: 'center' },
  foundSprite:   { width: 86, height: 86 },
  foundName:     { fontSize: 20, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  foundUser:     { fontSize: 12, color: retro.muted, fontFamily: 'monospace' },
  foundChip:     { borderRadius: 2, paddingHorizontal: 10, paddingVertical: 3 },
  foundChipTxt:  { fontSize: 11, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },
  botBadge:      { borderRadius: 2, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 2, borderColor: retro.paper3 },
  botBadgeTxt:   { fontSize: 10, color: retro.faded, fontFamily: 'monospace' },
  countdownTxt:  { fontSize: 12, color: retro.muted, fontFamily: 'monospace', textAlign: 'center' },
})

// ── Main screen ────────────────────────────────────────────
interface Props {
  player: Creature
  username: string
  onCombatEnd: (won: boolean, xpGained: number, coinsGained?: number) => void
}

export default function CombatHubScreen({ player, username, onCombatEnd }: Props) {
  const [combat, setCombat]                 = useState<CombatOpponent | null>(null)
  const [showAdventure, setShowAdventure]   = useState(false)
  const [showMatchmaking, setShowMatchmaking] = useState(false)

  const playerLevel = player.stats.level
  const minLv = Math.max(1, playerLevel - 2)
  const maxLv = playerLevel + 5

  const startCombat = (opponent: CombatOpponent) => {
    setShowMatchmaking(false)
    setCombat(opponent)
  }

  const handleCombatEnd = (won: boolean, xpGained: number) => {
    setCombat(null)
    onCombatEnd(won, xpGained)
  }

  if (combat) {
    return <CombatScreen player={player} opponent={combat} onFinish={handleCombatEnd} />
  }

  if (showAdventure) {
    return (
      <AdventureScreen
        player={player}
        onCombatEnd={(won, xp, coins) => { onCombatEnd(won, xp, coins) }}
        onClose={() => setShowAdventure(false)}
      />
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.titleEcho}>Combat</Text>
          <Text style={s.title}>Combat</Text>
          <Text style={s.subtitle}>{player.name} · Niv.{playerLevel}</Text>
        </View>

        {/* Adventure — wide card */}
        <SectionTitle title="MODES" color={retro.red} style={s.sectionTitle} />
        <TouchableOpacity
          style={[s.modeCardWide, { backgroundColor: retro.blue }]}
          onPress={() => setShowAdventure(true)}
          activeOpacity={0.85}
        >
          <Text style={s.modeEmoji}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.modeTitle}>AVENTURE</Text>
            <Text style={s.modeSub}>6 routes · PNJ · Récompenses</Text>
          </View>
          <Text style={s.modeArrow}>›</Text>
        </TouchableOpacity>

        {/* AI + Multi — side by side */}
        <View style={s.modeRow}>
          <TouchableOpacity
            style={[s.modeCard, { backgroundColor: retro.ink }]}
            onPress={() => startCombat(generateAIOpponent(playerLevel))}
            activeOpacity={0.85}
          >
            <Text style={s.modeEmoji}>🤖</Text>
            <Text style={s.modeTitle}>COMBAT IA</Text>
            <Text style={s.modeSub}>Niv {minLv}–{maxLv}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeCard, { backgroundColor: retro.red }]}
            onPress={() => setShowMatchmaking(true)}
            activeOpacity={0.85}
          >
            <Text style={s.modeEmoji}>👥</Text>
            <Text style={s.modeTitle}>MULTI</Text>
            <Text style={s.modeSub}>Matchmaking ±{LEVEL_RANGE}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <MatchmakingModal
        visible={showMatchmaking}
        playerLevel={playerLevel}
        playerType={player.type}
        onMatchFound={startCombat}
        onCancel={() => setShowMatchmaking(false)}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: retro.paper },
  scroll: { paddingBottom: 36 },

  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16 },
  titleEcho: {
    fontSize: 30, fontWeight: '900', fontFamily: 'monospace', letterSpacing: -0.5,
    position: 'absolute', left: 22.5, top: 18.5, color: retro.gold, opacity: 0.5,
  },
  title:    { fontSize: 30, fontWeight: '900', color: retro.ink, fontFamily: 'monospace', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: retro.muted, marginTop: 4 },

  sectionTitle: { paddingHorizontal: 20, marginTop: 8, marginBottom: 10 },

  modeCardWide: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 6, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 3, borderColor: 'rgba(0,0,0,0.25)',
    ...retroShadow,
  },
  modeEmoji: { fontSize: 28 },
  modeTitle: { fontSize: 16, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },
  modeSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontFamily: 'monospace' },
  modeArrow: { fontSize: 24, color: retro.white, opacity: 0.7 },

  modeRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10 },
  modeCard: {
    flex: 1, borderRadius: 6, padding: 18,
    alignItems: 'center', gap: 6,
    borderWidth: 3, borderColor: 'rgba(0,0,0,0.25)',
    ...retroShadow,
  },
})
