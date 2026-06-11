import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Creature, CreatureType } from '../types'
import { loadAdventureProgress, saveAdventureProgress } from '../utils/storage'
import CombatScreen, { CombatOpponent } from './CombatScreen'
import { retro, retroShadow, retroShadowLg, typeTheme } from '../styles/retro'

// ─── Sprites ─────────────────────────────────────────────────────────────────

const SPRITES_E1: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_e1_clean.png'),
  nemo:  require('../../assets/sprites/nemo_e1_clean.png'),
  sylva: require('../../assets/sprites/sylva_e1_clean.png'),
  zapp:  require('../../assets/sprites/zapp_e1_clean.png'),
}
const SPRITES_E2: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_e2_f1.png'),
  nemo:  require('../../assets/sprites/nemo_e2_f1.png'),
  sylva: require('../../assets/sprites/sylva_e2_f1.png'),
  zapp:  require('../../assets/sprites/zapp_e2_f1.png'),
}
const SPRITES_E3: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_e3_f1.png'),
  nemo:  require('../../assets/sprites/nemo_e3_f1.png'),
  sylva: require('../../assets/sprites/sylva_e3_f1.png'),
  zapp:  require('../../assets/sprites/zapp_e3_f1.png'),
}

function getOpponentSprite(type: CreatureType, level: number): ImageSourcePropType {
  if (level >= 20) return SPRITES_E3[type]
  if (level >= 10) return SPRITES_E2[type]
  return SPRITES_E1[type]
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdventureMonster {
  name: string
  title: string
  emoji: string
  type: CreatureType
  isBoss?: boolean
}

interface LeagueStop {
  username: string
  monster: AdventureMonster
  level: number
}

interface MapDecoration {
  emoji: string
  fx: number
  y: number
  size: number
}

interface League {
  id: string
  name: string
  subtitle: string
  minLevel: number
  bgColor: string
  pathColor: string
  accentColor: string
  bossBuildingEmoji: string
  bonusCoins: number
  stops: LeagueStop[]
  decorations: MapDecoration[]
}

interface Props {
  player: Creature
  onCombatEnd: (won: boolean, xpGained: number, coinsGained: number) => void
  onClose: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SW = Dimensions.get('window').width
const MAP_H = 800

const NODE_POSITIONS = [
  { fx: 0.37, y: 660 }, // stop 0
  { fx: 0.66, y: 545 }, // stop 1
  { fx: 0.33, y: 430 }, // stop 2
  { fx: 0.67, y: 318 }, // stop 3
  { fx: 0.35, y: 210 }, // stop 4
  { fx: 0.50, y: 100 }, // boss (idx 5)
]

const START_POS = { fx: 0.50, y: 740 }

const TYPE_EMOJI: Record<CreatureType, string> = {
  ignis: '🔥',
  nemo: '💧',
  sylva: '🌿',
  zapp: '⚡',
}

// ─── League Data ──────────────────────────────────────────────────────────────

const LEAGUES: League[] = [
  {
    id: 'verdante',
    name: 'Ligue Verdante',
    subtitle: 'Les secrets de la forêt ancienne',
    minLevel: 1,
    bgColor: '#1B3A28',
    pathColor: '#C8A96A',
    accentColor: '#5E9A68',
    bossBuildingEmoji: '🌳',
    bonusCoins: 40,
    stops: [
      { username: 'Druide Errant',       monster: { name: 'BRAMBLORC',  title: 'Sanglier des Ronces',           emoji: '🐗', type: 'sylva' }, level: 3  },
      { username: 'Gardien Mousseux',    monster: { name: 'SPINETHORN', title: 'Hérisson Géant Vénéneux',       emoji: '🦔', type: 'sylva' }, level: 5  },
      { username: 'Chasseur des Bois',   monster: { name: 'MOSSCRAWL',  title: 'Lézard des Sous-Bois',          emoji: '🦎', type: 'ignis' }, level: 7  },
      { username: 'Esprit de la Forêt',  monster: { name: 'FERALHOWL',  title: 'Loup des Ombres Vertes',        emoji: '🐺', type: 'sylva' }, level: 9  },
      { username: 'Vieux Druide Kael',   monster: { name: 'ROOTWRAITH', title: 'Colosse des Racines Anciennes', emoji: '🦕', type: 'sylva' }, level: 11 },
      { username: 'Le Gardien Suprême',  monster: { name: 'SYLVARAK',   title: 'Titan Forestier Ancestral',     emoji: '🌳', type: 'sylva', isBoss: true }, level: 15 },
    ],
    decorations: [
      { emoji: '🌲', fx: 0.06, y: 70,  size: 28 },
      { emoji: '🌳', fx: 0.84, y: 90,  size: 32 },
      { emoji: '🌲', fx: 0.88, y: 200, size: 24 },
      { emoji: '🍄', fx: 0.10, y: 195, size: 20 },
      { emoji: '🌿', fx: 0.05, y: 350, size: 22 },
      { emoji: '🌲', fx: 0.86, y: 380, size: 26 },
      { emoji: '🦋', fx: 0.78, y: 480, size: 18 },
      { emoji: '🌳', fx: 0.08, y: 520, size: 30 },
      { emoji: '🍄', fx: 0.82, y: 600, size: 18 },
      { emoji: '🌲', fx: 0.06, y: 640, size: 24 },
      { emoji: '🐦', fx: 0.88, y: 700, size: 20 },
      { emoji: '🌿', fx: 0.14, y: 760, size: 20 },
    ],
  },
  {
    id: 'ignee',
    name: 'Ligue Ignée',
    subtitle: 'Le cœur volcanique des flammes',
    minLevel: 6,
    bgColor: '#1A0A04',
    pathColor: '#6B4226',
    accentColor: '#C94F3D',
    bossBuildingEmoji: '🏯',
    bonusCoins: 65,
    stops: [
      { username: 'Forgeron Aldric',        monster: { name: 'CINDERAX',   title: 'Gecko des Cendres',           emoji: '🦎', type: 'ignis' }, level: 8  },
      { username: 'Pyromage Kiran',         monster: { name: 'LAVACRAK',   title: 'Crabe de Lave Incandescent',  emoji: '🦀', type: 'ignis' }, level: 10 },
      { username: 'Cendreux Orion',         monster: { name: 'SCALDBEAST', title: 'Crocodile Volcanique',        emoji: '🐊', type: 'ignis' }, level: 12 },
      { username: 'Flamme Sera',            monster: { name: 'EMBERWING',  title: 'Raptor du Cratère Ardent',    emoji: '🦅', type: 'ignis' }, level: 15 },
      { username: 'Maître du Feu',          monster: { name: 'MAGMAHIDE',  title: 'Rhinocéros de Magma',         emoji: '🦏', type: 'ignis' }, level: 17 },
      { username: 'Le Seigneur des Cendres',monster: { name: 'IGNARAK',    title: 'Démon Volcanique Originel',   emoji: '🌋', type: 'ignis', isBoss: true }, level: 22 },
    ],
    decorations: [
      { emoji: '🔥', fx: 0.08, y: 75,  size: 26 },
      { emoji: '💀', fx: 0.84, y: 95,  size: 22 },
      { emoji: '🌋', fx: 0.88, y: 200, size: 28 },
      { emoji: '🪨', fx: 0.07, y: 210, size: 20 },
      { emoji: '🔥', fx: 0.86, y: 360, size: 22 },
      { emoji: '💀', fx: 0.06, y: 380, size: 18 },
      { emoji: '⛏️', fx: 0.80, y: 480, size: 20 },
      { emoji: '🪨', fx: 0.10, y: 510, size: 22 },
      { emoji: '🔥', fx: 0.84, y: 600, size: 24 },
      { emoji: '💀', fx: 0.06, y: 630, size: 18 },
      { emoji: '🌋', fx: 0.85, y: 710, size: 20 },
      { emoji: '🔥', fx: 0.10, y: 760, size: 20 },
    ],
  },
  {
    id: 'abyssale',
    name: 'Ligue Abyssale',
    subtitle: "Les profondeurs insondables de l'océan",
    minLevel: 12,
    bgColor: '#040F1E',
    pathColor: '#4A6B78',
    accentColor: '#3B6EA8',
    bossBuildingEmoji: '🏛️',
    bonusCoins: 90,
    stops: [
      { username: 'Pêcheur Nael',   monster: { name: 'TIDEGRIP',   title: 'Tentacule des Marées Sombres', emoji: '🦑', type: 'nemo' }, level: 12 },
      { username: 'Sirène Lyra',    monster: { name: 'DEEPSLITH',  title: 'Serpent des Abysses Froids',   emoji: '🐍', type: 'nemo' }, level: 14 },
      { username: 'Abyssal Nirel',  monster: { name: 'VORTEXJAW',  title: 'Requin Tourbillon',             emoji: '🦈', type: 'nemo' }, level: 16 },
      { username: 'Marin Tobias',   monster: { name: 'CORALSHELL', title: 'Gardien de Corail Cristal',    emoji: '🐠', type: 'nemo' }, level: 19 },
      { username: 'Prêtre des Eaux',monster: { name: 'ABYSSHORN',  title: 'Béhémoth des Grands Fonds',   emoji: '🐳', type: 'nemo' }, level: 21 },
      { username: 'Le Dieu Abyssal',monster: { name: 'MAELSTRIX',  title: 'Le Grand Kraken Éternel',     emoji: '🐙', type: 'nemo', isBoss: true }, level: 26 },
    ],
    decorations: [
      { emoji: '💎', fx: 0.07, y: 75,  size: 22 },
      { emoji: '🫧', fx: 0.85, y: 90,  size: 20 },
      { emoji: '🪸', fx: 0.88, y: 195, size: 24 },
      { emoji: '🐚', fx: 0.07, y: 210, size: 20 },
      { emoji: '🌊', fx: 0.06, y: 365, size: 24 },
      { emoji: '💎', fx: 0.86, y: 380, size: 20 },
      { emoji: '🫧', fx: 0.80, y: 490, size: 18 },
      { emoji: '🪸', fx: 0.08, y: 510, size: 22 },
      { emoji: '🐚', fx: 0.84, y: 605, size: 20 },
      { emoji: '🌊', fx: 0.07, y: 635, size: 22 },
      { emoji: '🫧', fx: 0.84, y: 715, size: 18 },
      { emoji: '💎', fx: 0.09, y: 760, size: 18 },
    ],
  },
  {
    id: 'sables',
    name: 'Ligue des Sables',
    subtitle: 'Les ruines du pharaon oublié',
    minLevel: 17,
    bgColor: '#7A4B12',
    pathColor: '#E8D0A0',
    accentColor: '#D9A441',
    bossBuildingEmoji: '🕌',
    bonusCoins: 120,
    stops: [
      { username: 'Voyageur Farouk',     monster: { name: 'DUSTFANG',   title: 'Vipère des Dunes Écarlates', emoji: '🐍', type: 'zapp' }, level: 17 },
      { username: 'Danseur des Sables',  monster: { name: 'EMBERSTIK',  title: 'Scorpion de Feu Doré',       emoji: '🦂', type: 'zapp' }, level: 19 },
      { username: 'Illusionniste Ashar', monster: { name: 'MIRAGEKUN',  title: 'Renard-Fantôme des Mirages', emoji: '🦊', type: 'zapp' }, level: 21 },
      { username: 'Gardien des Ruines',  monster: { name: 'DUNELOOM',   title: 'Golem de Pierre Antique',    emoji: '🗿', type: 'zapp' }, level: 24 },
      { username: 'Seigneur Caravane',   monster: { name: 'IRONHUMP',   title: 'Chameau de Guerre Blindé',   emoji: '🐪', type: 'zapp' }, level: 26 },
      { username: "L'Immortel",          monster: { name: 'PHARAKOS',   title: 'Pharaon Éternel des Sables', emoji: '🏺', type: 'zapp', isBoss: true }, level: 30 },
    ],
    decorations: [
      { emoji: '🏺', fx: 0.06, y: 72,  size: 26 },
      { emoji: '🌵', fx: 0.85, y: 88,  size: 28 },
      { emoji: '🌴', fx: 0.88, y: 195, size: 26 },
      { emoji: '🦂', fx: 0.07, y: 215, size: 20 },
      { emoji: '🌵', fx: 0.06, y: 365, size: 24 },
      { emoji: '🏺', fx: 0.87, y: 385, size: 22 },
      { emoji: '🌴', fx: 0.80, y: 490, size: 22 },
      { emoji: '🦂', fx: 0.09, y: 515, size: 18 },
      { emoji: '🌵', fx: 0.85, y: 605, size: 24 },
      { emoji: '🏺', fx: 0.07, y: 638, size: 20 },
      { emoji: '🌴', fx: 0.85, y: 715, size: 22 },
      { emoji: '🦂', fx: 0.10, y: 760, size: 18 },
    ],
  },
  {
    id: 'supreme',
    name: 'Ligue Suprême',
    subtitle: "L'épreuve des Anciens légendaires",
    minLevel: 22,
    bgColor: '#0D0D22',
    pathColor: '#6B5C9E',
    accentColor: '#7B5EA7',
    bossBuildingEmoji: '🏰',
    bonusCoins: 200,
    stops: [
      { username: 'Sage Aelin',            monster: { name: 'VOIDSTRIKE', title: 'Fantôme du Vide',              emoji: '⚡', type: 'zapp'  }, level: 22 },
      { username: 'Oracle Verdant',        monster: { name: 'TIDECALLER', title: 'Invocateur des Tempêtes',       emoji: '🌊', type: 'nemo'  }, level: 25 },
      { username: 'Ancien Pyrex',          monster: { name: 'ASHBLOOM',   title: 'Phénix des Cendres Éternelles', emoji: '🔥', type: 'ignis' }, level: 27 },
      { username: 'Maître Zéphyr',         monster: { name: 'WILDBLIGHT', title: 'Fléau Ancestral de la Nature',  emoji: '🌿', type: 'sylva' }, level: 29 },
      { username: 'Gardien Suprême',       monster: { name: 'STELLARAX',  title: 'Éclat Cosmique Ultime',         emoji: '💥', type: 'zapp'  }, level: 32 },
      { username: "L'Ancien des Anciens",  monster: { name: 'CHRONALIS',  title: 'Gardien Éternel du Temps',      emoji: '✨', type: 'ignis', isBoss: true }, level: 38 },
    ],
    decorations: [
      { emoji: '✨', fx: 0.07, y: 72,  size: 24 },
      { emoji: '🌟', fx: 0.85, y: 90,  size: 22 },
      { emoji: '💫', fx: 0.88, y: 195, size: 20 },
      { emoji: '⚡', fx: 0.07, y: 215, size: 22 },
      { emoji: '🔮', fx: 0.06, y: 360, size: 24 },
      { emoji: '✨', fx: 0.86, y: 380, size: 20 },
      { emoji: '🌟', fx: 0.80, y: 488, size: 22 },
      { emoji: '🔮', fx: 0.09, y: 512, size: 20 },
      { emoji: '💫', fx: 0.85, y: 605, size: 22 },
      { emoji: '⚡', fx: 0.07, y: 635, size: 20 },
      { emoji: '✨', fx: 0.84, y: 712, size: 22 },
      { emoji: '🌟', fx: 0.09, y: 760, size: 18 },
    ],
  },
]

// ─── PathSegment ─────────────────────────────────────────────────────────────

function PathSegment({
  from,
  to,
  pathColor,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  pathColor: string
}) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  const cx = (from.x + to.x) / 2
  const cy = (from.y + to.y) / 2
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: cx - len / 2,
        top: cy - 15,
        width: len,
        height: 30,
        backgroundColor: pathColor,
        borderTopWidth: 3,
        borderBottomWidth: 3,
        borderColor: 'rgba(0,0,0,0.3)',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  )
}

// ─── PulsingDot ───────────────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 400, useNativeDriver: true }),
      ]),
      { iterations: -1 }
    )
    anim.start()
    return () => anim.stop()
  }, [scale])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: -14,
        left: -5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: '#fff',
        transform: [{ scale }],
      }}
    />
  )
}

// ─── MapNode ──────────────────────────────────────────────────────────────────

function MapNode({
  idx,
  x,
  y,
  beaten,
  available,
  isBoss,
  accentColor,
  onPress,
}: {
  idx: number
  x: number
  y: number
  beaten: boolean
  available: boolean
  isBoss: boolean
  accentColor: string
  onPress: () => void
}) {
  const r = isBoss ? 54 : 42
  const diam = r * 2

  let bgColor: string
  if (beaten) {
    bgColor = accentColor
  } else if (available) {
    bgColor = retro.ink
  } else {
    bgColor = '#3a3a3a'
  }

  const opacity = !beaten && !available ? 0.45 : 1

  return (
    <TouchableOpacity
      onPress={available || beaten ? onPress : undefined}
      activeOpacity={available ? 0.75 : 1}
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: diam,
        height: diam,
        borderRadius: r,
        backgroundColor: bgColor,
        borderWidth: isBoss ? 4 : 3,
        borderColor: beaten ? '#fff' : available ? accentColor : '#555',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        ...retroShadow,
      }}
    >
      {isBoss ? (
        <Text style={{ fontSize: 28 }}>
          {beaten ? '⭐' : available ? '💀' : '🔒'}
        </Text>
      ) : beaten ? (
        <Text style={{ fontSize: 20, color: '#fff', fontWeight: '900', fontFamily: 'monospace' }}>✓</Text>
      ) : available ? (
        <Text style={{ fontSize: 18, color: '#fff', fontWeight: '900', fontFamily: 'monospace' }}>{idx + 1}</Text>
      ) : (
        <Text style={{ fontSize: 18, color: '#888', fontWeight: '900', fontFamily: 'monospace' }}>{idx + 1}</Text>
      )}
      {available && !beaten && <PulsingDot color={accentColor} />}
    </TouchableOpacity>
  )
}

// ─── LeagueMap ────────────────────────────────────────────────────────────────

function LeagueMap({
  league,
  beaten,
  onNodeTap,
}: {
  league: League
  beaten: Set<number>
  onNodeTap: (idx: number) => void
}) {
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    // Scroll to bottom to show DÉPART first
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false })
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const pathNodes = NODE_POSITIONS.map((pos) => ({
    x: pos.fx * SW,
    y: pos.y,
  }))
  const startNode = { x: START_POS.fx * SW, y: START_POS.y }

  // Build path: start → node0 → node1 → ... → boss
  const pathPoints = [startNode, ...pathNodes]

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ height: MAP_H }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: SW, height: MAP_H, backgroundColor: league.bgColor, position: 'relative', overflow: 'hidden' }}>

        {/* Decorations */}
        {league.decorations.map((d, i) => (
          <Text
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: d.fx * SW,
              top: d.y,
              fontSize: d.size,
              opacity: 0.8,
            }}
          >
            {d.emoji}
          </Text>
        ))}

        {/* Path segments */}
        {pathPoints.slice(0, pathPoints.length - 1).map((pt, i) => (
          <PathSegment
            key={i}
            from={pt}
            to={pathPoints[i + 1]}
            pathColor={league.pathColor}
          />
        ))}

        {/* Boss building at top center */}
        <View
          style={{
            position: 'absolute',
            left: SW * 0.50 - 50,
            top: 18,
            width: 100,
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <View
            style={{
              backgroundColor: league.bgColor,
              borderWidth: 3,
              borderColor: league.accentColor,
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              alignItems: 'center',
              ...retroShadowLg,
            }}
          >
            <Text style={{ fontSize: 32 }}>{league.bossBuildingEmoji}</Text>
            <Text
              style={{
                color: league.accentColor,
                fontFamily: 'monospace',
                fontWeight: '900',
                fontSize: 10,
                letterSpacing: 2,
                marginTop: 2,
              }}
            >
              BOSS
            </Text>
          </View>
        </View>

        {/* DÉPART sign at bottom */}
        <View
          style={{
            position: 'absolute',
            left: START_POS.fx * SW - 45,
            top: START_POS.y + 20,
            width: 90,
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <View
            style={{
              backgroundColor: '#8B5E3C',
              borderWidth: 3,
              borderColor: '#5C3A1E',
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
              ...retroShadow,
            }}
          >
            <Text
              style={{
                color: '#FFF8DC',
                fontFamily: 'monospace',
                fontWeight: '900',
                fontSize: 11,
                letterSpacing: 1,
              }}
            >
              DÉPART
            </Text>
          </View>
        </View>

        {/* Map nodes */}
        {NODE_POSITIONS.map((pos, idx) => {
          const isBoss = idx === 5
          const isBeaten = beaten.has(idx)
          const isAvailable = idx === 0
            ? !isBeaten
            : isBoss
              ? !isBeaten && beaten.size === 5
              : !isBeaten && beaten.has(idx - 1)

          return (
            <MapNode
              key={idx}
              idx={idx}
              x={pos.fx * SW}
              y={pos.y}
              beaten={isBeaten}
              available={isAvailable}
              isBoss={isBoss}
              accentColor={league.accentColor}
              onPress={() => onNodeTap(idx)}
            />
          )
        })}
      </View>
    </ScrollView>
  )
}

// ─── FightModal ───────────────────────────────────────────────────────────────

function FightModal({
  league,
  stopIdx,
  onClose,
  onFight,
}: {
  league: League
  stopIdx: number
  onClose: () => void
  onFight: () => void
}) {
  const stop = league.stops[stopIdx]
  if (!stop) return null

  const { monster } = stop
  const theme = typeTheme[monster.type]
  const sprite = getOpponentSprite(monster.type, stop.level)

  return (
    <Modal visible transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.72)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            backgroundColor: retro.paper,
            borderWidth: 4,
            borderColor: retro.ink,
            borderRadius: 6,
            width: '100%',
            maxWidth: 360,
            overflow: 'hidden',
            ...retroShadowLg,
          }}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: league.bgColor,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderBottomWidth: 3,
              borderBottomColor: retro.ink,
            }}
          >
            <Text style={{ fontSize: 28 }}>{league.bossBuildingEmoji}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: league.accentColor,
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  fontSize: 13,
                  letterSpacing: 1,
                }}
                numberOfLines={1}
              >
                {league.name.toUpperCase()}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1 }}>
                {monster.isBoss ? 'BOSS FINAL' : `ARÈNE ${stopIdx + 1}`}
              </Text>
            </View>
            {/* Level badge */}
            <View
              style={{
                backgroundColor: league.accentColor,
                borderWidth: 2,
                borderColor: retro.ink,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  fontSize: 12,
                  color: retro.ink,
                }}
              >
                Lv {stop.level}
              </Text>
            </View>
          </View>

          {/* Monster card */}
          <View
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            {/* Emoji avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                backgroundColor: theme.soft,
                borderWidth: 3,
                borderColor: retro.ink,
                borderRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
                ...retroShadow,
              }}
            >
              <Text style={{ fontSize: 40 }}>{monster.emoji}</Text>
            </View>

            {/* Monster info */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  fontSize: 18,
                  color: retro.ink,
                  letterSpacing: 1,
                }}
              >
                {monster.name}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: retro.muted,
                  marginTop: 2,
                  fontStyle: 'italic',
                }}
                numberOfLines={2}
              >
                {monster.title}
              </Text>
              {/* Type badge */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.main,
                    borderWidth: 2,
                    borderColor: retro.ink,
                    borderRadius: 3,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{TYPE_EMOJI[monster.type]}</Text>
                  <Text
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: '900',
                      fontSize: 10,
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {monster.type}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sprite + trainer */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 12,
              backgroundColor: theme.soft,
              borderWidth: 2,
              borderColor: retro.ink,
              borderRadius: 4,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Image
              source={sprite}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: retro.muted, fontFamily: 'monospace' }}>
                DRESSEUR
              </Text>
              <Text
                style={{
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  fontSize: 14,
                  color: retro.ink,
                  marginTop: 1,
                }}
                numberOfLines={1}
              >
                {stop.username}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              padding: 16,
              paddingTop: 4,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: retro.paper2,
                borderWidth: 3,
                borderColor: retro.ink,
                borderRadius: 4,
                paddingVertical: 12,
                alignItems: 'center',
                ...retroShadow,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  fontSize: 14,
                  color: retro.ink,
                }}
              >
                FUIR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onFight}
              style={{
                flex: 2,
                backgroundColor: monster.isBoss ? league.accentColor : retro.red,
                borderWidth: 3,
                borderColor: retro.ink,
                borderRadius: 4,
                paddingVertical: 12,
                alignItems: 'center',
                ...retroShadowLg,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  fontSize: 15,
                  color: '#fff',
                  letterSpacing: 1,
                }}
              >
                ⚔️ COMBATTRE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── LeagueCard ───────────────────────────────────────────────────────────────

function LeagueCard({
  league,
  beaten,
  playerLevel,
  onPress,
}: {
  league: League
  beaten: number[]
  playerLevel: number
  onPress: () => void
}) {
  const locked = playerLevel < league.minLevel
  const count = beaten.length
  const total = league.stops.length
  const done = count >= total
  const pct = Math.min(count / total, 1)

  return (
    <TouchableOpacity
      onPress={locked ? undefined : onPress}
      activeOpacity={locked ? 1 : 0.82}
      style={[
        {
          flexDirection: 'row',
          backgroundColor: retro.white,
          borderWidth: 3,
          borderColor: retro.line,
          borderRadius: 4,
          overflow: 'hidden',
          ...retroShadow,
        },
        locked && { opacity: 0.5 },
      ]}
    >
      {/* Accent bar */}
      <View
        style={{
          width: 20,
          backgroundColor: locked ? retro.muted : league.accentColor,
        }}
      />

      {/* Boss emoji */}
      <View
        style={{
          width: 64,
          height: 88,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: locked ? '#2223' : league.bgColor,
        }}
      >
        <Text style={{ fontSize: locked ? 28 : 32 }}>
          {locked ? '🔒' : league.bossBuildingEmoji}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12 }}>
        <Text
          style={{
            fontFamily: 'monospace',
            fontWeight: '900',
            fontSize: 14,
            color: locked ? retro.muted : retro.ink,
          }}
          numberOfLines={1}
        >
          {league.name.toUpperCase()}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: retro.muted,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {league.subtitle}
        </Text>

        {/* Progress bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 7,
              backgroundColor: retro.paper2,
              borderWidth: 1,
              borderColor: retro.line,
              borderRadius: 0,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${pct * 100}%` as any,
                backgroundColor: done ? retro.mint : league.accentColor,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: 'monospace',
              fontWeight: '900',
              fontSize: 11,
              color: retro.ink,
            }}
          >
            {count}/{total}
          </Text>
        </View>
      </View>

      {/* Right side */}
      <View
        style={{
          width: 52,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {locked ? (
          <Text
            style={{
              fontFamily: 'monospace',
              fontWeight: '700',
              fontSize: 10,
              color: retro.muted,
              textAlign: 'center',
            }}
          >
            Lv{'\n'}{league.minLevel}
          </Text>
        ) : done ? (
          <View
            style={{
              backgroundColor: retro.mint,
              borderWidth: 2,
              borderColor: retro.ink,
              borderRadius: 3,
              paddingHorizontal: 4,
              paddingVertical: 4,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'monospace',
                fontWeight: '900',
                fontSize: 9,
                color: '#fff',
                textAlign: 'center',
              }}
            >
              ✓{'\n'}TERMINÉE
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontSize: 24,
              color: league.accentColor,
              fontWeight: '900',
            }}
          >
            ›
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdventureScreen({ player, onCombatEnd, onClose }: Props) {
  const [progress, setProgress] = useState<Record<string, number[]>>({})
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [selectedStopIdx, setSelectedStopIdx] = useState<number | null>(null)
  const [activeCombat, setActiveCombat] = useState<{
    league: League
    stopIdx: number
    opponent: CombatOpponent
  } | null>(null)

  useEffect(() => {
    loadAdventureProgress().then((p) => setProgress(p ?? {}))
  }, [])

  const handleCombatEnd = useCallback(
    async (won: boolean, xpGained: number) => {
      if (!activeCombat) return
      const { league, stopIdx } = activeCombat
      const leagueIdx = LEAGUES.indexOf(league)

      let coinsGained = 0
      let bonusXP = 0

      if (won) {
        const prev = new Set(progress[league.id] ?? [])
        prev.add(stopIdx)
        const updated = { ...progress, [league.id]: Array.from(prev) }
        setProgress(updated)
        await saveAdventureProgress(updated)

        const perOpponent = 12 + leagueIdx * 6
        const isComplete = prev.size === league.stops.length
        coinsGained = perOpponent + (isComplete ? league.bonusCoins : 0)
        if (isComplete) bonusXP = 150
      } else {
        coinsGained = 3
      }

      setActiveCombat(null)
      onCombatEnd(won, xpGained + bonusXP, coinsGained)
    },
    [activeCombat, progress, onCombatEnd]
  )

  // ── Active combat ──────────────────────────────────────────────────────────
  if (activeCombat) {
    return (
      <CombatScreen
        player={player}
        opponent={activeCombat.opponent}
        onFinish={handleCombatEnd}
        isAdventure
      />
    )
  }

  const playerLevel = player.stats.level
  const androidTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0

  // ── League map view ────────────────────────────────────────────────────────
  if (selectedLeague) {
    const beaten = new Set(progress[selectedLeague.id] ?? [])

    const handleNodeTap = (idx: number) => {
      setSelectedStopIdx(idx)
    }

    const handleStartFight = () => {
      if (selectedStopIdx === null) return
      const stop = selectedLeague.stops[selectedStopIdx]
      if (!stop) return

      const opponent: CombatOpponent = {
        username: stop.username,
        creatureName: stop.monster.name,
        creatureType: stop.monster.type,
        level: stop.level,
      }

      setSelectedStopIdx(null)
      setActiveCombat({ league: selectedLeague, stopIdx: selectedStopIdx, opponent })
    }

    return (
      <View style={{ flex: 1, backgroundColor: selectedLeague.bgColor, paddingTop: androidTop }}>
        {/* Map header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 3,
            borderBottomColor: selectedLeague.accentColor,
            backgroundColor: selectedLeague.bgColor,
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedLeague(null)}
            style={{ marginRight: 10 }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: selectedLeague.accentColor,
                fontFamily: 'monospace',
                fontWeight: '900',
                fontSize: 18,
              }}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'monospace',
                fontWeight: '900',
                fontSize: 15,
                color: '#fff',
                letterSpacing: 1,
              }}
              numberOfLines={1}
            >
              {selectedLeague.name.toUpperCase()}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.55)',
                marginTop: 1,
              }}
            >
              {beaten.size}/{selectedLeague.stops.length} arènes · {player.name} Lv {playerLevel}
            </Text>
          </View>
          <Text style={{ fontSize: 24 }}>{selectedLeague.bossBuildingEmoji}</Text>
        </View>

        {/* Map */}
        <LeagueMap
          league={selectedLeague}
          beaten={beaten}
          onNodeTap={handleNodeTap}
        />

        {/* Fight selection modal */}
        {selectedStopIdx !== null && (
          <FightModal
            league={selectedLeague}
            stopIdx={selectedStopIdx}
            onClose={() => setSelectedStopIdx(null)}
            onFight={handleStartFight}
          />
        )}
      </View>
    )
  }

  // ── League list ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: retro.paper }}>
      <View style={{ paddingTop: androidTop }}>
        {/* Header */}
        <View
          style={{
            paddingTop: 16,
            paddingHorizontal: 20,
            paddingBottom: 14,
            borderBottomWidth: 3,
            borderBottomColor: retro.line,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ marginBottom: 6 }}>
            <Text
              style={{
                color: retro.red,
                fontSize: 15,
                fontWeight: '900',
                fontFamily: 'monospace',
              }}
            >
              ‹ Retour
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: retro.ink,
              fontFamily: 'monospace',
            }}
          >
            AVENTURE
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: retro.muted,
              marginTop: 2,
              fontFamily: 'monospace',
            }}
          >
            {player.name} · Lv {playerLevel}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'monospace',
              fontWeight: '900',
              fontSize: 11,
              color: retro.muted,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            LIGUES DISPONIBLES
          </Text>
          <View style={{ flex: 1, height: 2, backgroundColor: retro.paper2 }} />
        </View>

        {LEAGUES.map((league) => (
          <LeagueCard
            key={league.id}
            league={league}
            beaten={progress[league.id] ?? []}
            playerLevel={playerLevel}
            onPress={() => setSelectedLeague(league)}
          />
        ))}

        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  )
}
