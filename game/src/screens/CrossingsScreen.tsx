import React, { useEffect, useState } from 'react'
import {
  FlatList,
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
import { Creature, Crossing, CreatureType, SpellId, SpellLoadout } from '../types'
import { CREATURE_COLORS } from '../utils/creature'
import { loadCrossings } from '../utils/storage'
import CombatScreen, { CombatOpponent } from './CombatScreen'
import { DEFAULT_LOADOUTS, getEvoStage, SPELL_CATALOG } from '../utils/spells'

const CROSSING_SPRITES: Record<CreatureType, ImageSourcePropType> = {
  ignis: require('../../assets/sprites/ignis_f0.png'),
  nemo:  require('../../assets/sprites/nemo_f0.png'),
  sylva: require('../../assets/sprites/sylva_f0.png'),
  zapp:  require('../../assets/sprites/zapp_f0.png'),
}

const BOT_OPPONENTS: CombatOpponent[] = [
  { username: 'IzunaBot',    creatureName: 'Pyra',   creatureType: 'ignis', level: 3  },
  { username: 'OcéanBot',    creatureName: 'Deeps',  creatureType: 'nemo',  level: 5  },
  { username: 'ForêtBot',    creatureName: 'Mossy',  creatureType: 'sylva', level: 4  },
  { username: 'TempêteBot',  creatureName: 'Bolt',   creatureType: 'zapp',  level: 6  },
  { username: 'IzunaMaster', creatureName: 'Vulcan', creatureType: 'ignis', level: 12 },
  { username: 'OcéanMaster', creatureName: 'Tidal',  creatureType: 'nemo',  level: 15 },
]

interface DebugConfig {
  playerType: CreatureType
  playerLevel: number
  playerLoadout: SpellLoadout
  playerEnergy: number
  opponentType: CreatureType
  opponentLevel: number
  opponentLoadout: SpellLoadout
}

// ─── DebugSetupPanel ─────────────────────────────────────
function DebugSetupPanel({ onStart, onClose }: { onStart: (cfg: DebugConfig) => void; onClose: () => void }) {
  const [playerType, setPlayerType] = useState<CreatureType>('ignis')
  const [playerLevel, setPlayerLevel] = useState<number>(1)
  const [playerEnergy, setPlayerEnergy] = useState<number>(0)
  const [opponentType, setOpponentType] = useState<CreatureType>('nemo')
  const [opponentLevel, setOpponentLevel] = useState<number>(5)

  const types: CreatureType[] = ['ignis', 'nemo', 'sylva', 'zapp']
  const levelOptions = [1, 5, 10, 15, 20, 25]
  const energyOptions = [0, 1, 2, 3, 4]

  const playerLoadout = DEFAULT_LOADOUTS[playerType][getEvoStage(playerLevel)]
  const opponentLoadout = DEFAULT_LOADOUTS[opponentType][getEvoStage(opponentLevel)]

  return (
    <Modal transparent animationType="slide">
      <View style={ds.overlay}>
        <View style={ds.panel}>
          <Text style={ds.title}>🐛 Mode Debug</Text>

          <ScrollView showsVerticalScrollIndicator={false}>

            <Text style={ds.sectionTitle}>Joueur</Text>

            <Text style={ds.label}>Créature</Text>
            <View style={ds.row}>
              {types.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[ds.optBtn, playerType === t && ds.optBtnActive]}
                  onPress={() => setPlayerType(t)}
                >
                  <Text style={[ds.optText, playerType === t && ds.optTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ds.label}>Niveau</Text>
            <View style={ds.row}>
              {levelOptions.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[ds.optBtn, playerLevel === l && ds.optBtnActive]}
                  onPress={() => setPlayerLevel(l)}
                >
                  <Text style={[ds.optText, playerLevel === l && ds.optTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ds.label}>Énergie départ</Text>
            <View style={ds.row}>
              {energyOptions.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[ds.optBtn, playerEnergy === e && ds.optBtnActive]}
                  onPress={() => setPlayerEnergy(e)}
                >
                  <Text style={[ds.optText, playerEnergy === e && ds.optTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ds.label}>Loadout ({getEvoStage(playerLevel)})</Text>
            <View style={ds.loadoutRow}>
              {playerLoadout.map((sid: SpellId) => (
                <Text key={sid} style={ds.loadoutSpell}>
                  {SPELL_CATALOG[sid].emoji} {SPELL_CATALOG[sid].name}
                </Text>
              ))}
            </View>

            <Text style={[ds.sectionTitle, { marginTop: 16 }]}>Adversaire</Text>

            <Text style={ds.label}>Créature</Text>
            <View style={ds.row}>
              {types.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[ds.optBtn, opponentType === t && ds.optBtnActive]}
                  onPress={() => setOpponentType(t)}
                >
                  <Text style={[ds.optText, opponentType === t && ds.optTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ds.label}>Niveau</Text>
            <View style={ds.row}>
              {levelOptions.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[ds.optBtn, opponentLevel === l && ds.optBtnActive]}
                  onPress={() => setOpponentLevel(l)}
                >
                  <Text style={[ds.optText, opponentLevel === l && ds.optTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>

          <TouchableOpacity
            style={ds.startBtn}
            onPress={() => onStart({
              playerType,
              playerLevel,
              playerLoadout,
              playerEnergy,
              opponentType,
              opponentLevel,
              opponentLoadout,
            })}
          >
            <Text style={ds.startBtnText}>⚔️ Lancer le combat debug</Text>
          </TouchableOpacity>

          <TouchableOpacity style={ds.closeBtn} onPress={onClose}>
            <Text style={ds.closeBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

interface Props {
  player: Creature
  onCombatEnd: (won: boolean, xpGained: number) => void
}

function CrossingCard({ item, onChallenge }: { item: Crossing; onChallenge: () => void }) {
  const color  = CREATURE_COLORS[item.creatureType]
  const sprite = CROSSING_SPRITES[item.creatureType]

  const interactionLabel = { friendly: '🤝 Amical', battle: '⚔️ Combat', gift: '🎁 Cadeau' }[item.interactionType]

  const timeAgo = () => {
    const diff = Date.now() - new Date(item.crossedAt).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `il y a ${days}j`
    if (hours > 0) return `il y a ${hours}h`
    return `il y a ${mins}min`
  }

  return (
    <View style={styles.card}>
      <View style={[styles.avatarCircle, { backgroundColor: color + '22' }]}>
        <Image source={sprite} style={styles.avatarSprite} resizeMode="contain" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.username}</Text>
        <Text style={styles.cardCreature}>{item.creatureName}</Text>
        <Text style={styles.cardInteraction}>{interactionLabel}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardTime}>{timeAgo()}</Text>
        <TouchableOpacity style={[styles.challengeBtn, { backgroundColor: color }]} onPress={onChallenge}>
          <Text style={styles.challengeText}>⚔️ Défier</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function BotCard({ bot, onChallenge }: { bot: CombatOpponent; onChallenge: () => void }) {
  const color  = CREATURE_COLORS[bot.creatureType]
  const sprite = CROSSING_SPRITES[bot.creatureType]
  return (
    <View style={[styles.card, styles.botCard]}>
      <View style={[styles.avatarCircle, { backgroundColor: color + '22' }]}>
        <Image source={sprite} style={styles.avatarSprite} resizeMode="contain" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{bot.username}</Text>
        <Text style={styles.cardCreature}>{bot.creatureName}</Text>
        <Text style={styles.cardInteraction}>🤖 Bot entraînement · Lv {bot.level}</Text>
      </View>
      <TouchableOpacity style={[styles.challengeBtn, { backgroundColor: color }]} onPress={onChallenge}>
        <Text style={styles.challengeText}>⚔️ Défier</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function CrossingsScreen({ player, onCombatEnd }: Props) {
  const [crossings, setCrossings] = useState<Crossing[]>([])
  const [loading, setLoading]     = useState(true)
  const [combat, setCombat]       = useState<CombatOpponent | null>(null)
  const [debugSetup, setDebugSetup] = useState(false)
  const [debugOverride, setDebugOverride] = useState<{
    playerType: CreatureType
    playerLevel: number
    playerLoadout: SpellLoadout
    playerEnergy: number
  } | undefined>(undefined)

  useEffect(() => {
    loadCrossings().then((data) => {
      setCrossings(data ?? [])
      setLoading(false)
    })
  }, [])

  const startCombat = (opponent: CombatOpponent) => {
    setDebugOverride(undefined)
    setCombat(opponent)
  }

  const handleDebugStart = (cfg: DebugConfig) => {
    setDebugSetup(false)
    setDebugOverride({
      playerType: cfg.playerType,
      playerLevel: cfg.playerLevel,
      playerLoadout: cfg.playerLoadout,
      playerEnergy: cfg.playerEnergy,
    })
    setCombat({
      username: 'DebugBot',
      creatureName: cfg.opponentType.charAt(0).toUpperCase() + cfg.opponentType.slice(1) + 'Bot',
      creatureType: cfg.opponentType,
      level: cfg.opponentLevel,
      loadout: cfg.opponentLoadout,
    })
  }

  const handleCombatEnd = (won: boolean, xpGained: number) => {
    setCombat(null)
    setDebugOverride(undefined)
    onCombatEnd(won, xpGained)
  }

  if (combat) {
    return (
      <CombatScreen
        player={player}
        opponent={combat}
        onFinish={handleCombatEnd}
        debugOverride={debugOverride}
      />
    )
  }

  if (loading) return null

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Croisements</Text>
            <Text style={styles.subtitle}>
              {crossings.length > 0
                ? `${crossings.length} rencontre${crossings.length > 1 ? 's' : ''}`
                : 'Bots d\'entraînement disponibles'}
            </Text>
          </View>
          <TouchableOpacity style={styles.debugBtn} onPress={() => setDebugSetup(true)}>
            <Text style={styles.debugBtnText}>🐛 Debug</Text>
          </TouchableOpacity>
        </View>
      </View>

      {debugSetup && (
        <DebugSetupPanel
          onStart={handleDebugStart}
          onClose={() => setDebugSetup(false)}
        />
      )}

      <FlatList
        data={crossings.length > 0 ? [] : BOT_OPPONENTS}
        keyExtractor={(_, i) => `bot-${i}`}
        renderItem={({ item }) => (
          <BotCard bot={item as CombatOpponent} onChallenge={() => startCombat(item as CombatOpponent)} />
        )}
        ListHeaderComponent={
          crossings.length > 0 ? (
            <>
              {crossings.map((c) => (
                <CrossingCard
                  key={c.id}
                  item={c}
                  onChallenge={() => startCombat({
                    username: c.username,
                    creatureName: c.creatureName,
                    creatureType: c.creatureType,
                    level: Math.max(1, c.xpGained > 0 ? 5 : 1),
                  })}
                />
              ))}
            </>
          ) : (
            <View style={styles.botHeader}>
              <Text style={styles.botHeaderText}>Entraîne-toi contre des bots en attendant tes vrais croisements !</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7FF' },
  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  debugBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 4,
  },
  debugBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 10, flexGrow: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  botCard: { borderWidth: 1, borderColor: '#f0f0f0' },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarSprite: { width: 40, height: 40 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  cardCreature: { fontSize: 13, color: '#666', marginTop: 1 },
  cardInteraction: { fontSize: 12, color: '#999', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardTime: { fontSize: 12, color: '#999' },
  challengeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  challengeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  botHeader: { paddingVertical: 12 },
  botHeaderText: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },
})

const ds = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    gap: 12,
  },
  title: { color: '#FFD700', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  sectionTitle: { color: '#aaa', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  label: { color: '#888', fontSize: 12, marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, backgroundColor: '#0D0D1A',
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  optBtnActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  optText: { color: '#888', fontSize: 12, fontWeight: '700' },
  optTextActive: { color: '#000' },
  loadoutRow: { gap: 4, marginTop: 4 },
  loadoutSpell: { color: '#ccc', fontSize: 12 },
  startBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: { color: '#000', fontSize: 15, fontWeight: '900' },
  closeBtn: { alignItems: 'center', paddingVertical: 8 },
  closeBtnText: { color: '#666', fontSize: 13 },
})
