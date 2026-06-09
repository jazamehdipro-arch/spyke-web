import React, { useEffect, useState } from 'react'
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
import { Creature, Crossing, CreatureType, SocialAttitude, SocialEvent, SocialEventType, SocialRelation, SpellId, SpellLoadout } from '../types'
import { CREATURE_COLORS } from '../utils/creature'
import {
  loadCrossings,
  loadSocialAttitude,
  loadSocialEvents,
  loadSocialRelations,
  saveCrossings,
  saveSocialAttitude,
  saveSocialEvents,
  saveSocialRelations,
} from '../utils/storage'
import CombatScreen, { CombatOpponent } from './CombatScreen'
import { DEFAULT_LOADOUTS, EvoStage, getEvoStage, SPELL_CATALOG } from '../utils/spells'
import AdventureScreen from './AdventureScreen'
import { retro, retroShadow } from '../styles/retro'

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

const BOT_OPPONENTS: CombatOpponent[] = [
  { username: 'IzunaBot',    creatureName: 'Pyra',   creatureType: 'ignis', level: 3  },
  { username: 'OcéanBot',    creatureName: 'Deeps',  creatureType: 'nemo',  level: 5  },
  { username: 'ForêtBot',    creatureName: 'Mossy',  creatureType: 'sylva', level: 4  },
  { username: 'TempêteBot',  creatureName: 'Bolt',   creatureType: 'zapp',  level: 6  },
  { username: 'IzunaMaster', creatureName: 'Vulcan', creatureType: 'ignis', level: 12 },
  { username: 'OcéanMaster', creatureName: 'Tidal',  creatureType: 'nemo',  level: 15 },
]

const BOT_CREATURE_NAMES: Record<CreatureType, Record<EvoStage, string[]>> = {
  ignis: { e1: ['Cinder', 'Ember', 'Pyra'],     e2: ['Blaze', 'Scorch', 'Inferno'],   e3: ['Vulcan', 'Magmus', 'Ignarok']   },
  nemo:  { e1: ['Ripple', 'Deeps', 'Coral'],    e2: ['Surge', 'Tidal', 'Torrent'],    e3: ['Abyss', 'Mareal', 'Levian']     },
  sylva: { e1: ['Mossy', 'Fern', 'Wisp'],       e2: ['Bramble', 'Grove', 'Shade'],    e3: ['Sylvane', 'Verdant', 'Nebula']  },
  zapp:  { e1: ['Bolt', 'Spark', 'Zara'],       e2: ['Flash', 'Static', 'Volt'],      e3: ['Thunder', 'Tempête', 'Stormix'] },
}

const BOT_USERNAMES: Record<CreatureType, string[]> = {
  ignis: ['FlameBattler', 'AshSeeker', 'PyraFan', 'HeatHunter'],
  nemo:  ['TidalWatcher', 'DeepDiver', 'CoralKeeper', 'WaveRider'],
  sylva: ['ForestRunner', 'MistWalker', 'LeafDancer', 'VineStalker'],
  zapp:  ['StormCatcher', 'VoltSeeker', 'BoltChaser', 'ZapMaster'],
}

const ATTITUDE_COPY: Record<SocialAttitude, { label: string; icon: string; desc: string }> = {
  pacifique: { label: 'Pacifique', icon: 'OK', desc: 'Amitie, cadeaux, evite les conflits.' },
  taquin:    { label: 'Taquin',    icon: '!',  desc: 'Duels amicaux, petites surprises.' },
  filou:     { label: 'Filou',     icon: '$',  desc: 'Vole parfois, reputation risquee.' },
}

const EVENT_COLORS: Record<SocialEventType, string> = {
  friendship: retro.mint,
  duel: retro.red,
  theft: retro.gold,
  gift: retro.blue,
  mood: retro.mint,
  mentor: retro.gold,
  skin: retro.blue,
  traveler: retro.ink,
}

function relationTags(relation: SocialRelation): string[] {
  const tags: string[] = []
  if (relation.friendshipLevel >= 4) tags.push('Vieil ami')
  else if (relation.friendshipLevel >= 2) tags.push('Ami')
  if (relation.filouReputation >= 3) tags.push('Filou')
  if (relation.rivalryWins + relation.rivalryLosses >= 3) tags.push('Rival')
  if (relation.mentorCount >= 2) tags.push('Mentor')
  return tags
}

function eventToInteraction(type: SocialEventType): Crossing['interactionType'] {
  if (type === 'duel') return 'battle'
  if (type === 'theft') return 'theft'
  if (type === 'mentor') return 'mentor'
  if (type === 'mood') return 'mood'
  if (type === 'skin') return 'skin'
  if (type === 'gift') return 'gift'
  return 'friendly'
}

function chooseSocialEvent(attitude: SocialAttitude, relation: SocialRelation, player: Creature, opponent: CombatOpponent): SocialEventType {
  const levelGap = player.stats.level - opponent.level
  if (Math.abs(levelGap) >= 7 && relation.crossings >= 1) return 'mentor'
  if (relation.crossings >= 5 && relation.friendshipLevel >= 3) return 'friendship'
  if (attitude === 'filou') return Math.random() < 0.55 ? 'theft' : 'duel'
  if (attitude === 'taquin') {
    if (Math.random() < 0.42) return 'duel'
    if (Math.random() < 0.18) return 'theft'
    return Math.random() < 0.5 ? 'gift' : 'mood'
  }
  if (Math.random() < 0.18) return 'skin'
  return Math.random() < 0.58 ? 'friendship' : 'mood'
}

function buildSocialEvent(type: SocialEventType, relation: SocialRelation, opponent: CombatOpponent): SocialEvent {
  const base = {
    id: Math.random().toString(36).slice(2),
    relationId: relation.id,
    type,
    createdAt: new Date().toISOString(),
    opponent: {
      username: opponent.username,
      creatureName: opponent.creatureName,
      creatureType: opponent.creatureType,
      level: opponent.level,
    },
  }
  switch (type) {
    case 'theft':
      return {
        ...base,
        emoji: '$',
        title: 'Tentative de vol',
        message: `${opponent.creatureName} tente de chaparder une petite recompense. Tu peux le repousser en combat.`,
        pendingCombat: true,
        rewardCoins: 8,
      }
    case 'duel':
      return {
        ...base,
        emoji: 'VS',
        title: 'Defi lance',
        message: `${opponent.creatureName} provoque ton monstre. Une revanche peut lancer une rivalite.`,
        pendingCombat: true,
        rewardCoins: 12,
      }
    case 'mentor':
      return {
        ...base,
        emoji: 'XP',
        title: 'Mentorat',
        message: 'Le plus experimente montre quelques astuces. Le lien mentor/disciple se renforce.',
        rewardCoins: 4,
      }
    case 'gift':
      return {
        ...base,
        emoji: 'BOX',
        title: 'Echange spontane',
        message: `${opponent.creatureName} laisse un petit souvenir apres le croisement.`,
        rewardCoins: 5,
      }
    case 'mood':
      return {
        ...base,
        emoji: '+',
        title: 'Contagion d humeur',
        message: 'L humeur des deux monstres se melange. Une bonne rencontre peut egayer la journee.',
        rewardCoins: 2,
      }
    case 'skin':
      return {
        ...base,
        emoji: 'ART',
        title: 'Inspiration de skin',
        message: `${opponent.creatureName} donne une idee de style a ton monstre.`,
        rewardCoins: 3,
      }
    default:
      return {
        ...base,
        emoji: 'AMI',
        title: 'Amitie fidele',
        message: `${opponent.creatureName} reconnait ton monstre. Les retrouvailles deviennent plus chaleureuses.`,
        rewardCoins: 4,
      }
  }
}

function generateAIOpponent(playerLevel: number): CombatOpponent {
  const types: CreatureType[] = ['ignis', 'nemo', 'sylva', 'zapp']
  const type = types[Math.floor(Math.random() * types.length)]
  const minLv = Math.max(1, playerLevel - 2)
  const maxLv = playerLevel + 5
  const level = Math.floor(Math.random() * (maxLv - minLv + 1)) + minLv
  const evo = getEvoStage(level)
  const names = BOT_CREATURE_NAMES[type][evo]
  const creatureName = names[Math.floor(Math.random() * names.length)]
  const usernames = BOT_USERNAMES[type]
  const username = usernames[Math.floor(Math.random() * usernames.length)] + (Math.floor(Math.random() * 900) + 100)
  return { username, creatureName, creatureType: type, level }
}

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
  onCombatEnd: (won: boolean, xpGained: number, coinsGained?: number) => void
}

function CrossingCard({ item, onChallenge }: { item: Crossing; onChallenge: () => void }) {
  const color  = CREATURE_COLORS[item.creatureType]
  const sprite = SPRITES_E1[item.creatureType]

  const interactionLabel = {
    friendly: 'Amical',
    battle: 'Combat',
    gift: 'Cadeau',
    theft: 'Vol',
    mentor: 'Mentor',
    mood: 'Humeur',
    skin: 'Style',
  }[item.interactionType]

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

function SocialEventCard({ event, onCombat }: { event: SocialEvent; onCombat: () => void }) {
  const color = EVENT_COLORS[event.type]
  return (
    <View style={[styles.socialEventCard, { borderColor: color + 'AA' }]}>
      <View style={[styles.socialEventIcon, { backgroundColor: color + '22' }]}>
        <Text style={styles.socialEventEmoji}>{event.emoji}</Text>
      </View>
      <View style={styles.socialEventInfo}>
        <Text style={styles.socialEventTitle}>{event.title}</Text>
        <Text style={styles.socialEventText} numberOfLines={2}>{event.message}</Text>
      </View>
      {event.pendingCombat && (
        <TouchableOpacity style={[styles.socialFightBtn, { backgroundColor: color }]} onPress={onCombat}>
          <Text style={styles.socialFightText}>Fight</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

function RelationChip({ relation }: { relation: SocialRelation }) {
  const color = CREATURE_COLORS[relation.creatureType]
  const tag = relation.tags[0] ?? `Lien ${relation.friendshipLevel}`
  return (
    <View style={[styles.relationChip, { borderColor: color + '88' }]}>
      <Text style={styles.relationName}>{relation.creatureName}</Text>
      <Text style={styles.relationMeta}>{tag} - {relation.crossings}x</Text>
    </View>
  )
}

function BotCard({ bot, onChallenge }: { bot: CombatOpponent; onChallenge: () => void }) {
  const color  = CREATURE_COLORS[bot.creatureType]
  const sprite = getOpponentSprite(bot.creatureType, bot.level)
  const evo = getEvoStage(bot.level)
  const evoLabel = evo === 'e3' ? '★★★' : evo === 'e2' ? '★★' : '★'
  return (
    <View style={[styles.card, styles.botCard]}>
      <View style={[styles.avatarCircle, { backgroundColor: color + '22' }]}>
        <Image source={sprite} style={styles.avatarSprite} resizeMode="contain" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{bot.username}</Text>
        <Text style={styles.cardCreature}>{bot.creatureName}</Text>
        <Text style={styles.cardInteraction}>🤖 Lv {bot.level} · {evoLabel}</Text>
      </View>
      <TouchableOpacity style={[styles.challengeBtn, { backgroundColor: color }]} onPress={onChallenge}>
        <Text style={styles.challengeText}>⚔️ Défier</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function CrossingsScreen({ player, onCombatEnd }: Props) {
  const [crossings, setCrossings] = useState<Crossing[]>([])
  const [relations, setRelations] = useState<SocialRelation[]>([])
  const [events, setEvents] = useState<SocialEvent[]>([])
  const [attitude, setAttitude] = useState<SocialAttitude>('pacifique')
  const [loading, setLoading]     = useState(true)
  const [combat, setCombat]       = useState<CombatOpponent | null>(null)
  const [showCrossings, setShowCrossings] = useState(false)
  const [showAdventure, setShowAdventure] = useState(false)
  const [debugSetup, setDebugSetup] = useState(false)
  const [debugOverride, setDebugOverride] = useState<{
    playerType: CreatureType
    playerLevel: number
    playerLoadout: SpellLoadout
    playerEnergy: number
  } | undefined>(undefined)

  useEffect(() => {
    Promise.all([
      loadCrossings(),
      loadSocialRelations(),
      loadSocialEvents(),
      loadSocialAttitude(),
    ]).then(([crossData, relationData, eventData, attitudeData]) => {
      setCrossings(crossData ?? [])
      setRelations(relationData ?? [])
      setEvents(eventData ?? [])
      setAttitude(attitudeData ?? 'pacifique')
      setLoading(false)
    })
  }, [])

  const updateAttitude = async (next: SocialAttitude) => {
    setAttitude(next)
    await saveSocialAttitude(next)
  }

  const startCombat = (opponent: CombatOpponent) => {
    setShowCrossings(false)
    setDebugOverride(undefined)
    setCombat(opponent)
  }

  const handleQuickAI = () => {
    startCombat(generateAIOpponent(player.stats.level))
  }

  const handleSocialCrossing = async () => {
    const opponent = generateAIOpponent(player.stats.level)
    const relationId = `${opponent.username}:${opponent.creatureType}`
    const now = new Date().toISOString()
    const existing = relations.find(r => r.id === relationId)
    const baseRelation: SocialRelation = existing ?? {
      id: relationId,
      username: opponent.username,
      creatureName: opponent.creatureName,
      creatureType: opponent.creatureType,
      level: opponent.level,
      crossings: 0,
      friendshipLevel: 0,
      filouReputation: 0,
      rivalryWins: 0,
      rivalryLosses: 0,
      mentorCount: 0,
      tags: [],
      lastCrossedAt: now,
    }
    const eventType = chooseSocialEvent(attitude, baseRelation, player, opponent)
    const nextRelation: SocialRelation = {
      ...baseRelation,
      creatureName: opponent.creatureName,
      creatureType: opponent.creatureType,
      level: opponent.level,
      crossings: baseRelation.crossings + 1,
      friendshipLevel: Math.min(5, baseRelation.friendshipLevel + (eventType === 'theft' ? 0 : 1)),
      filouReputation: Math.max(0, baseRelation.filouReputation + (eventType === 'theft' ? 1 : attitude === 'pacifique' ? -1 : 0)),
      rivalryLosses: baseRelation.rivalryLosses + (eventType === 'duel' ? 1 : 0),
      mentorCount: baseRelation.mentorCount + (eventType === 'mentor' ? 1 : 0),
      lastCrossedAt: now,
      tags: [],
    }
    nextRelation.tags = relationTags(nextRelation)

    const socialEvent = buildSocialEvent(eventType, nextRelation, opponent)
    const crossing: Crossing = {
      id: socialEvent.id,
      playerId: relationId,
      username: opponent.username,
      creatureName: opponent.creatureName,
      creatureType: opponent.creatureType,
      level: opponent.level,
      crossedAt: now,
      latitude: 0,
      longitude: 0,
      interactionType: eventToInteraction(eventType),
      socialEventId: socialEvent.id,
      xpGained: socialEvent.rewardCoins ?? 0,
    }

    const nextRelations = [nextRelation, ...relations.filter(r => r.id !== relationId)].slice(0, 80)
    const nextEvents = [socialEvent, ...events].slice(0, 60)
    const nextCrossings = [crossing, ...crossings].slice(0, 50)
    setRelations(nextRelations)
    setEvents(nextEvents)
    setCrossings(nextCrossings)
    await Promise.all([
      saveSocialRelations(nextRelations),
      saveSocialEvents(nextEvents),
      saveCrossings(nextCrossings),
    ])
  }

  const startSocialCombat = (event: SocialEvent) => {
    if (!event.opponent) return
    setShowCrossings(false)
    setDebugOverride(undefined)
    setCombat(event.opponent)
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

  if (showAdventure) {
    return (
      <AdventureScreen
        player={player}
        onCombatEnd={(won, xp, coins) => {
          onCombatEnd(won, xp, coins)
        }}
        onClose={() => setShowAdventure(false)}
      />
    )
  }

  if (loading) return null

  const playerLevel = player.stats.level
  const minLv = Math.max(1, playerLevel - 2)
  const maxLv = playerLevel + 5

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Combats</Text>
            <Text style={styles.subtitle}>{player.name} · Lv {playerLevel}</Text>
          </View>
          <TouchableOpacity style={styles.debugBtn} onPress={() => setDebugSetup(true)}>
            <Text style={styles.debugBtnText}>🐛 Debug</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.socialPanel}>
        <Text style={styles.socialTitle}>Vie sociale</Text>
        <View style={styles.attitudeRow}>
          {(['pacifique', 'taquin', 'filou'] as SocialAttitude[]).map((key) => {
            const copy = ATTITUDE_COPY[key]
            const active = attitude === key
            return (
              <TouchableOpacity
                key={key}
                style={[styles.attitudeBtn, active && styles.attitudeBtnActive]}
                onPress={() => updateAttitude(key)}
              >
                <Text style={styles.attitudeIcon}>{copy.icon}</Text>
                <Text style={[styles.attitudeLabel, active && styles.attitudeLabelActive]}>{copy.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <Text style={styles.attitudeDesc}>{ATTITUDE_COPY[attitude].desc}</Text>
        <TouchableOpacity style={styles.crossingPulseBtn} onPress={handleSocialCrossing}>
          <Text style={styles.crossingPulseText}>Simuler un croisement</Text>
        </TouchableOpacity>
        {relations.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relationScroll}>
            {relations.slice(0, 8).map((relation) => (
              <RelationChip key={relation.id} relation={relation} />
            ))}
          </ScrollView>
        )}
        {events.length > 0 && (
          <View style={styles.eventStack}>
            {events.slice(0, 3).map((event) => (
              <SocialEventCard
                key={event.id}
                event={event}
                onCombat={() => startSocialCombat(event)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Mode cards */}
      <TouchableOpacity style={[styles.modeCardWide, styles.modeCardAdventure]} onPress={() => setShowAdventure(true)} activeOpacity={0.85}>
        <Text style={styles.modeEmoji}>🗺️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.modeTitle}>Aventure</Text>
          <Text style={styles.modeSub}>6 routes · PNJ · Récompenses</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: '900' }}>›</Text>
      </TouchableOpacity>
      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeCard, styles.modeCardAI]} onPress={handleQuickAI} activeOpacity={0.85}>
          <Text style={styles.modeEmoji}>🤖</Text>
          <Text style={styles.modeTitle}>Combat IA</Text>
          <Text style={styles.modeSub}>Aléatoire · Lv {minLv}–{maxLv}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeCard, styles.modeCardMP]} onPress={() => setShowCrossings(true)} activeOpacity={0.85}>
          <Text style={styles.modeEmoji}>👥</Text>
          <Text style={styles.modeTitle}>Multijoueur</Text>
          <Text style={styles.modeSub}>
            {crossings.length > 0
              ? `${crossings.length} croisement${crossings.length !== 1 ? 's' : ''}`
              : 'Bots disponibles'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Crossings / bots sheet */}
      <Modal visible={showCrossings} transparent animationType="slide">
        <TouchableOpacity style={styles.sheetOverlay} onPress={() => setShowCrossings(false)} activeOpacity={1}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>
              {crossings.length > 0 ? '⚔️ Tes croisements' : '🤖 Bots d\'entraînement'}
            </Text>
            {crossings.length === 0 && (
              <Text style={styles.sheetSub}>Entraîne-toi en attendant de vrais croisements !</Text>
            )}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
              {crossings.length > 0
                ? crossings.map((c) => (
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
                  ))
                : BOT_OPPONENTS.map((bot, i) => (
                    <BotCard key={i} bot={bot} onChallenge={() => startCombat(bot)} />
                  ))
              }
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {debugSetup && (
        <DebugSetupPanel
          onStart={handleDebugStart}
          onClose={() => setDebugSetup(false)}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: retro.paper },
  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '900', color: retro.ink, letterSpacing: 0, fontFamily: 'monospace' },
  subtitle: { fontSize: 14, color: retro.muted, marginTop: 2 },
  debugBtn: {
    backgroundColor: retro.ink,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    marginTop: 4,
  },
  debugBtnText: { color: retro.white, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },

  // Social
  socialPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: retro.white,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: retro.line,
    gap: 10,
    ...retroShadow,
  },
  socialTitle: { color: retro.ink, fontSize: 15, fontWeight: '900', fontFamily: 'monospace' },
  attitudeRow: { flexDirection: 'row', gap: 8 },
  attitudeBtn: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: retro.paper2,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: retro.line,
  },
  attitudeBtnActive: { backgroundColor: retro.gold },
  attitudeIcon: { fontSize: 13, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  attitudeLabel: { color: retro.ink, fontSize: 10, fontWeight: '900', fontFamily: 'monospace' },
  attitudeLabelActive: { color: retro.ink },
  attitudeDesc: { color: retro.muted, fontSize: 11 },
  crossingPulseBtn: {
    backgroundColor: retro.ink,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: retro.line,
    paddingVertical: 11,
    alignItems: 'center',
  },
  crossingPulseText: { color: retro.white, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  relationScroll: { marginHorizontal: -2 },
  relationChip: {
    minWidth: 92,
    marginRight: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: retro.paper2,
    borderRadius: 4,
    borderWidth: 2,
  },
  relationName: { color: retro.ink, fontSize: 11, fontWeight: '900' },
  relationMeta: { color: retro.muted, fontSize: 9, marginTop: 2 },
  eventStack: { gap: 8 },
  socialEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: retro.paper,
    borderRadius: 4,
    borderWidth: 2,
    padding: 9,
  },
  socialEventIcon: {
    width: 34,
    height: 34,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: retro.line,
  },
  socialEventEmoji: { fontSize: 10, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  socialEventInfo: { flex: 1 },
  socialEventTitle: { color: retro.ink, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  socialEventText: { color: retro.muted, fontSize: 10, lineHeight: 13 },
  socialFightBtn: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: retro.line,
    alignItems: 'center',
  },
  socialFightText: { color: retro.white, fontSize: 10, fontWeight: '900', fontFamily: 'monospace' },

  // Mode cards
  modeRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 10 },
  modeCard: {
    flex: 1,
    borderRadius: 4,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 3,
    borderColor: retro.line,
    ...retroShadow,
    elevation: 5,
  },
  modeCardWide: {
    marginHorizontal: 16,
    borderRadius: 4,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 3,
    borderColor: retro.line,
    ...retroShadow,
    elevation: 6,
  },
  modeCardAdventure: { backgroundColor: retro.blue },
  modeCardAI: { backgroundColor: retro.ink },
  modeCardMP: { backgroundColor: retro.red },
  modeEmoji: { fontSize: 36 },
  modeTitle: { fontSize: 16, fontWeight: '900', color: retro.white, fontFamily: 'monospace' },
  modeSub: { fontSize: 11, color: retro.paper, textAlign: 'center' },

  // Sheet modal
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetCard: {
    backgroundColor: retro.white,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    maxHeight: '80%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: retro.ink, textAlign: 'center', fontFamily: 'monospace' },
  sheetSub: { fontSize: 13, color: retro.muted, textAlign: 'center', marginTop: -6 },
  sheetScroll: { flexGrow: 0 },

  // Cards
  card: {
    backgroundColor: retro.white,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: retro.line,
    ...retroShadow,
    elevation: 2,
  },
  botCard: { borderWidth: 2, borderColor: retro.line },
  avatarCircle: { width: 52, height: 52, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: retro.line },
  avatarSprite: { width: 40, height: 40 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '900', color: retro.ink },
  cardCreature: { fontSize: 13, color: retro.ink2, marginTop: 1 },
  cardInteraction: { fontSize: 12, color: retro.muted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardTime: { fontSize: 12, color: retro.muted },
  challengeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 2, borderColor: retro.line },
  challengeText: { color: retro.white, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
})

const ds = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: retro.white,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    padding: 24,
    maxHeight: '85%',
    gap: 12,
  },
  title: { color: retro.red, fontSize: 20, fontWeight: '900', marginBottom: 8, fontFamily: 'monospace' },
  sectionTitle: { color: retro.ink, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  label: { color: retro.muted, fontSize: 12, marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 4, backgroundColor: retro.paper2,
    borderWidth: 2, borderColor: retro.line,
  },
  optBtnActive: { backgroundColor: retro.gold, borderColor: retro.line },
  optText: { color: retro.ink, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  optTextActive: { color: retro.ink },
  loadoutRow: { gap: 4, marginTop: 4 },
  loadoutSpell: { color: retro.ink, fontSize: 12 },
  startBtn: {
    backgroundColor: retro.gold,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 3,
    borderColor: retro.line,
  },
  startBtnText: { color: retro.ink, fontSize: 15, fontWeight: '900', fontFamily: 'monospace' },
  closeBtn: { alignItems: 'center', paddingVertical: 8 },
  closeBtnText: { color: retro.muted, fontSize: 13 },
})
