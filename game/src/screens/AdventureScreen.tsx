import React, { useCallback, useEffect, useState } from 'react'
import {
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
import { Creature, CreatureType } from '../types'
import { CREATURE_COLORS } from '../utils/creature'
import { loadAdventureProgress, saveAdventureProgress } from '../utils/storage'
import CombatScreen, { CombatOpponent } from './CombatScreen'
import { retro, retroShadow } from '../styles/retro'

const SPRITES_E1: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/D6038947-5173-4D54-85E3-4007B920C40D.png'),
  nemo:  require('../../assets/C06BC406-9648-4173-8C33-3F80A3902A64.png'),
  sylva: require('../../assets/9B470F66-3CF9-41D8-9965-E7EBB3F50C68.png'),
  zapp:  require('../../assets/883F1EC7-AEFA-412B-8E0C-72131D9D4F14.png'),
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

interface RouteOpponent extends CombatOpponent {}

interface AdventureRoute {
  id: string
  name: string
  emoji: string
  color: string
  description: string
  minLevel: number
  opponents: RouteOpponent[]
  bonusCoins: number
}

const ROUTES: AdventureRoute[] = [
  {
    id: 'plaine',
    name: 'Plaine des Débuts',
    emoji: '🌿',
    color: '#4CAF50',
    description: 'Terrain facile pour les débutants',
    minLevel: 1,
    bonusCoins: 20,
    opponents: [
      { username: 'Paysanne Rosa',   creatureName: 'Brindille', creatureType: 'sylva', level: 1  },
      { username: 'Gardien Félix',   creatureName: 'Flammy',    creatureType: 'ignis', level: 2  },
      { username: 'Pêcheur Malo',    creatureName: 'Splash',    creatureType: 'nemo',  level: 3  },
      { username: 'Voyageur Yann',   creatureName: 'Zara',      creatureType: 'zapp',  level: 4  },
      { username: 'Maître Herbe',    creatureName: 'Verdant',   creatureType: 'sylva', level: 5  },
      { username: 'Champion Rosa',   creatureName: 'Pyra',      creatureType: 'ignis', level: 6  },
    ],
  },
  {
    id: 'foret',
    name: 'Forêt des Murmures',
    emoji: '🌲',
    color: '#2E7D32',
    description: 'Les arbres cachent des secrets dangereux',
    minLevel: 4,
    bonusCoins: 35,
    opponents: [
      { username: 'Druide Kael',    creatureName: 'Mossy',   creatureType: 'sylva', level: 5  },
      { username: 'Chasseur Elin',  creatureName: 'Wisp',    creatureType: 'sylva', level: 6  },
      { username: 'Nomade Riku',    creatureName: 'Bolt',    creatureType: 'zapp',  level: 7  },
      { username: 'Garde Aria',     creatureName: 'Ember',   creatureType: 'ignis', level: 8  },
      { username: 'Ranger Soren',   creatureName: 'Bramble', creatureType: 'sylva', level: 9  },
      { username: 'Chef Myrddin',   creatureName: 'Grove',   creatureType: 'sylva', level: 10 },
    ],
  },
  {
    id: 'lac',
    name: 'Lac de Cristal',
    emoji: '💧',
    color: '#0288D1',
    description: 'Les eaux profondes abritent des créatures puissantes',
    minLevel: 8,
    bonusCoins: 50,
    opponents: [
      { username: 'Pêcheur Nael',  creatureName: 'Ripple',  creatureType: 'nemo',  level: 8  },
      { username: 'Sirène Lyra',   creatureName: 'Coral',   creatureType: 'nemo',  level: 9  },
      { username: 'Marin Tobias',  creatureName: 'Surge',   creatureType: 'nemo',  level: 10 },
      { username: 'Éclair Niko',   creatureName: 'Flash',   creatureType: 'zapp',  level: 11 },
      { username: 'Aqua Lena',     creatureName: 'Torrent', creatureType: 'nemo',  level: 12 },
      { username: 'Prêtre Mael',   creatureName: 'Abyss',   creatureType: 'nemo',  level: 14 },
    ],
  },
  {
    id: 'volcan',
    name: 'Volcan Ardent',
    emoji: '🌋',
    color: '#E64A19',
    description: 'Seuls les plus courageux survivent à la chaleur',
    minLevel: 12,
    bonusCoins: 70,
    opponents: [
      { username: 'Forgeron Aldric', creatureName: 'Scorch',  creatureType: 'ignis', level: 12 },
      { username: 'Pyro Kiran',      creatureName: 'Inferno', creatureType: 'ignis', level: 13 },
      { username: 'Cendreux Orion',  creatureName: 'Static',  creatureType: 'zapp',  level: 14 },
      { username: 'Flamme Sera',     creatureName: 'Blaze',   creatureType: 'ignis', level: 15 },
      { username: 'Maître Feu',      creatureName: 'Vulcan',  creatureType: 'ignis', level: 16 },
      { username: 'Gardien Lave',    creatureName: 'Magmus',  creatureType: 'ignis', level: 18 },
    ],
  },
  {
    id: 'tempete',
    name: 'Tempête Éternelle',
    emoji: '⚡',
    color: '#5C6BC0',
    description: 'La foudre frappe sans cesse ces terres maudites',
    minLevel: 16,
    bonusCoins: 90,
    opponents: [
      { username: 'Éclair Dain',   creatureName: 'Volt',    creatureType: 'zapp',  level: 16 },
      { username: 'Foudre Mira',   creatureName: 'Thunder', creatureType: 'zapp',  level: 17 },
      { username: 'Tempête Cael',  creatureName: 'Tempête', creatureType: 'zapp',  level: 18 },
      { username: 'Abyssal Nirel', creatureName: 'Mareal',  creatureType: 'nemo',  level: 19 },
      { username: 'Storm Krios',   creatureName: 'Stormix', creatureType: 'zapp',  level: 20 },
      { username: 'Grand Orage',   creatureName: 'Ignarok', creatureType: 'ignis', level: 22 },
    ],
  },
  {
    id: 'sanctuaire',
    name: 'Sanctuaire des Anciens',
    emoji: '🏛️',
    color: '#7C3AED',
    description: 'Le lieu ultime des champions légendaires',
    minLevel: 20,
    bonusCoins: 150,
    opponents: [
      { username: 'Sage Aelin',      creatureName: 'Levian',  creatureType: 'nemo',  level: 20 },
      { username: 'Oracle Verdant',  creatureName: 'Nebula',  creatureType: 'sylva', level: 21 },
      { username: 'Zéphyr Orage',    creatureName: 'Stormix', creatureType: 'zapp',  level: 22 },
      { username: 'Ancien Pyrex',    creatureName: 'Ignarok', creatureType: 'ignis', level: 23 },
      { username: 'Maître Océan',    creatureName: 'Levian',  creatureType: 'nemo',  level: 24 },
      { username: 'Champion Suprême',creatureName: 'Verdant', creatureType: 'sylva', level: 25 },
    ],
  },
]

interface Props {
  player: Creature
  onCombatEnd: (won: boolean, xpGained: number, coinsGained: number) => void
  onClose: () => void
}

function RouteCard({
  route,
  beaten,
  playerLevel,
  onPress,
}: {
  route: AdventureRoute
  beaten: number[]
  playerLevel: number
  onPress: () => void
}) {
  const locked = playerLevel < route.minLevel
  const count  = beaten.length
  const done   = count >= route.opponents.length

  return (
    <TouchableOpacity
      style={[s.routeCard, { borderColor: route.color + (locked ? '44' : 'BB') }, locked && s.routeCardLocked]}
      onPress={locked ? undefined : onPress}
      activeOpacity={locked ? 1 : 0.82}
    >
      <View style={[s.routeLeft, { backgroundColor: route.color + (locked ? '22' : '33') }]}>
        <Text style={s.routeEmoji}>{locked ? '🔒' : route.emoji}</Text>
      </View>
      <View style={s.routeMid}>
        <Text style={[s.routeName, locked && s.routeNameLocked]}>{route.name}</Text>
        <Text style={s.routeDesc} numberOfLines={1}>{route.description}</Text>
        <View style={s.progressRow}>
          <View style={s.progressBar}>
            <View
              style={[
                s.progressFill,
                { width: `${(count / route.opponents.length) * 100}%` as any, backgroundColor: route.color },
              ]}
            />
          </View>
          <Text style={s.progressText}>{count}/{route.opponents.length}</Text>
        </View>
      </View>
      <View style={s.routeRight}>
        {locked
          ? <Text style={s.lockLevel}>Lv {route.minLevel}</Text>
          : done
            ? <Text style={s.doneCheck}>✓</Text>
            : <Text style={[s.routeArrow, { color: route.color }]}>›</Text>
        }
      </View>
    </TouchableOpacity>
  )
}

function OpponentRow({
  opponent,
  idx,
  beaten,
  available,
  onFight,
}: {
  opponent: RouteOpponent
  idx: number
  beaten: boolean
  available: boolean
  onFight: () => void
}) {
  const color  = CREATURE_COLORS[opponent.creatureType]
  const sprite = getOpponentSprite(opponent.creatureType, opponent.level)

  return (
    <View style={[s.opRow, beaten && s.opRowBeaten, !available && !beaten && s.opRowLocked]}>
      <View style={[s.opAvatar, { backgroundColor: color + '22' }]}>
        <Image source={sprite} style={s.opSprite} resizeMode="contain" />
      </View>
      <View style={s.opInfo}>
        <Text style={s.opName} numberOfLines={1}>{opponent.username}</Text>
        <Text style={s.opCreature}>{opponent.creatureName} · Lv {opponent.level}</Text>
      </View>
      <View style={s.opAction}>
        {beaten ? (
          <View style={s.beatenBadge}><Text style={s.beatenText}>✓</Text></View>
        ) : available ? (
          <TouchableOpacity style={[s.fightBtn, { backgroundColor: color }]} onPress={onFight}>
            <Text style={s.fightBtnText}>⚔️</Text>
          </TouchableOpacity>
        ) : (
          <Text style={s.opLock}>🔒</Text>
        )}
      </View>
    </View>
  )
}

export default function AdventureScreen({ player, onCombatEnd, onClose }: Props) {
  const [progress, setProgress]         = useState<Record<string, number[]>>({})
  const [selectedRoute, setSelectedRoute] = useState<AdventureRoute | null>(null)
  const [activeCombat, setActiveCombat]  = useState<{ route: AdventureRoute; opponentIdx: number; opponent: RouteOpponent } | null>(null)

  useEffect(() => {
    loadAdventureProgress().then((p) => setProgress(p ?? {}))
  }, [])

  const handleCombatEnd = useCallback(async (won: boolean, xpGained: number) => {
    if (!activeCombat) return
    const { route, opponentIdx } = activeCombat
    const routeIdx = ROUTES.indexOf(route)

    let coinsGained = 0
    if (won) {
      const prev    = new Set(progress[route.id] ?? [])
      prev.add(opponentIdx)
      const updated = { ...progress, [route.id]: Array.from(prev) }
      setProgress(updated)
      await saveAdventureProgress(updated)

      const perOpponent = 10 + routeIdx * 5
      const isComplete  = prev.size === route.opponents.length
      coinsGained = perOpponent + (isComplete ? route.bonusCoins : 0)
    } else {
      coinsGained = 3
    }

    setActiveCombat(null)
    onCombatEnd(won, xpGained, coinsGained)
  }, [activeCombat, progress, onCombatEnd])

  if (activeCombat) {
    return (
      <CombatScreen
        player={player}
        opponent={activeCombat.opponent}
        onFinish={handleCombatEnd}
      />
    )
  }

  const playerLevel = player.stats.level

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.backBtn}>
          <Text style={s.backBtnText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Aventure</Text>
        <Text style={s.subtitle}>{player.name} · Lv {playerLevel}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {ROUTES.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            beaten={progress[route.id] ?? []}
            playerLevel={playerLevel}
            onPress={() => setSelectedRoute(route)}
          />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Route opponents sheet */}
      <Modal visible={selectedRoute !== null} transparent animationType="slide">
        <TouchableOpacity
          style={s.sheetOverlay}
          activeOpacity={1}
          onPress={() => setSelectedRoute(null)}
        >
          <View style={s.sheet}>
            {selectedRoute && (
              <>
                <View style={[s.sheetHeader, { backgroundColor: selectedRoute.color + '22' }]}>
                  <Text style={s.sheetEmoji}>{selectedRoute.emoji}</Text>
                  <View>
                    <Text style={[s.sheetTitle, { color: selectedRoute.color }]}>{selectedRoute.name}</Text>
                    <Text style={s.sheetDesc}>{selectedRoute.description}</Text>
                  </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={s.sheetScroll}>
                  {selectedRoute.opponents.map((op, idx) => {
                    const beaten    = (progress[selectedRoute.id] ?? []).includes(idx)
                    const prevBeaten = idx === 0 || (progress[selectedRoute.id] ?? []).includes(idx - 1)
                    const available  = !beaten && prevBeaten
                    return (
                      <OpponentRow
                        key={idx}
                        opponent={op}
                        idx={idx}
                        beaten={beaten}
                        available={available}
                        onFight={() => {
                          setSelectedRoute(null)
                          setActiveCombat({ route: selectedRoute, opponentIdx: idx, opponent: op })
                        }}
                      />
                    )
                  })}
                  <View style={s.bonusRow}>
                    <Text style={s.bonusText}>
                      🏆 Bonus de complétion : +{selectedRoute.bonusCoins} 💰
                    </Text>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: retro.paper },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: retro.line,
  },
  backBtn: { marginBottom: 6 },
  backBtnText: { color: retro.red, fontSize: 15, fontWeight: '900', fontFamily: 'monospace' },
  title: { fontSize: 28, fontWeight: '900', color: retro.ink, letterSpacing: 0, fontFamily: 'monospace' },
  subtitle: { fontSize: 13, color: retro.muted, marginTop: 2 },

  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  // Route card
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: retro.white,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: retro.line,
    overflow: 'hidden',
    gap: 12,
    ...retroShadow,
  },
  routeCardLocked: { opacity: 0.55 },
  routeLeft: {
    width: 68,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeEmoji: { fontSize: 32 },
  routeMid: { flex: 1, paddingVertical: 12 },
  routeName: { fontSize: 15, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  routeNameLocked: { color: retro.muted },
  routeDesc: { fontSize: 11, color: retro.muted, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressBar: {
    flex: 1,
    height: 7,
    backgroundColor: retro.paper2,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: retro.line,
  },
  progressFill: { height: '100%', borderRadius: 0 },
  progressText: { fontSize: 11, color: retro.ink, fontWeight: '900', fontFamily: 'monospace' },
  routeRight: { width: 40, alignItems: 'center' },
  routeArrow: { fontSize: 28, fontWeight: '900', marginRight: 4 },
  lockLevel: { fontSize: 11, color: '#555', fontWeight: '700', textAlign: 'center' },
  doneCheck: { fontSize: 22, color: '#4CAF50' },

  // Opponents sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: retro.white,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sheetEmoji: { fontSize: 36 },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  sheetDesc: { fontSize: 12, color: retro.muted, marginTop: 2 },
  sheetScroll: { paddingHorizontal: 16 },

  // Opponent row
  opRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: retro.paper2,
  },
  opRowBeaten: { opacity: 0.5 },
  opRowLocked: { opacity: 0.35 },
  opAvatar: {
    width: 48,
    height: 48,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: retro.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opSprite: { width: 40, height: 40 },
  opInfo: { flex: 1 },
  opName: { fontSize: 14, fontWeight: '900', color: retro.ink },
  opCreature: { fontSize: 12, color: retro.muted, marginTop: 2 },
  opAction: { width: 44, alignItems: 'center' },
  fightBtn: {
    width: 38,
    height: 38,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fightBtnText: { fontSize: 18 },
  beatenBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF5022',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beatenText: { color: '#4CAF50', fontWeight: '800', fontSize: 14 },
  opLock: { fontSize: 18 },

  bonusRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  bonusText: { color: retro.red, fontSize: 14, fontWeight: '900', fontFamily: 'monospace' },
})
