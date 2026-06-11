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
import { Creature, Crossing, CreatureType, SocialDial, SocialEvent, SocialEventType, SocialProfile, SocialRelation, SpellId, SpellLoadout } from '../types'
import {
  loadCrossings,
  loadSocialEvents,
  loadSocialProfile,
  loadSocialRelations,
  saveCrossings,
  saveSocialEvents,
  saveSocialProfile,
  saveSocialRelations,
} from '../utils/storage'
import CombatScreen, { CombatOpponent } from './CombatScreen'
import { DEFAULT_LOADOUTS, EvoStage, getEvoStage, SPELL_CATALOG } from '../utils/spells'
import AdventureScreen from './AdventureScreen'
import { retro, retroShadow, typeTheme } from '../styles/retro'
import { PixelButton, SectionTitle } from '../components/ui'

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

const DEFAULT_SOCIAL_PROFILE: SocialProfile = {
  sociability: 'mid',
  aggression: 'low',
  mischief: 'low',
  generosity: 'mid',
  loyalty: 'high',
  curiosity: 'mid',
  rules: {
    neverStealFriends: true,
    duelRivalsOnly: false,
    helpWeaker: true,
    avoidThieves: true,
    giftSadMonsters: true,
  },
}

const SOCIAL_DIALS: SocialDial[] = ['low', 'mid', 'high']
const SOCIAL_DIAL_LABELS: Record<SocialDial, string> = { low: 'Bas', mid: 'Moy', high: 'Fort' }

const PROFILE_DIALS: { key: keyof Omit<SocialProfile, 'rules'>; label: string; emoji: string; desc: string }[] = [
  { key: 'sociability', label: 'Sociabilité', emoji: '🤝', desc: 'Va vers les autres et crée des liens.' },
  { key: 'aggression',  label: 'Agressivité', emoji: '⚔️', desc: 'Provoque plus facilement des duels.' },
  { key: 'mischief',    label: 'Filouterie',  emoji: '🦝', desc: 'Tente des chapardages risqués.' },
  { key: 'generosity',  label: 'Générosité',  emoji: '🎁', desc: 'Offre et échange plus souvent.' },
  { key: 'loyalty',     label: 'Loyauté',     emoji: '🛡️', desc: 'Protège les amis et les pactes.' },
  { key: 'curiosity',   label: 'Curiosité',   emoji: '🧭', desc: 'Cherche skins, voyageurs et surprises.' },
]

const PROFILE_RULES: { key: keyof SocialProfile['rules']; label: string }[] = [
  { key: 'neverStealFriends', label: 'Ne vole jamais les amis' },
  { key: 'duelRivalsOnly', label: 'Défie surtout les rivaux' },
  { key: 'helpWeaker', label: 'Aide les plus faibles' },
  { key: 'avoidThieves', label: 'Se méfie des filous' },
  { key: 'giftSadMonsters', label: 'Console les monstres tristes' },
]

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

const EVENT_EMOJI: Record<SocialEventType, string> = {
  friendship: '🤝',
  duel: '⚔️',
  theft: '💰',
  gift: '🎁',
  mood: '💫',
  mentor: '🎓',
  skin: '🎨',
  traveler: '🧭',
}

// Personality dial value → filled dots count (0, 1, 2)
const DIAL_DOTS: Record<SocialDial, number> = { low: 0, mid: 1, high: 2 }
const DIAL_COLORS: { key: keyof Omit<SocialProfile, 'rules'>; color: string }[] = [
  { key: 'sociability', color: retro.mint   },
  { key: 'aggression',  color: retro.red    },
  { key: 'mischief',    color: retro.gold   },
  { key: 'generosity',  color: retro.blue   },
  { key: 'loyalty',     color: retro.purple },
  { key: 'curiosity',   color: retro.orange },
]

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

function dialWeight(value: SocialDial): number {
  if (value === 'high') return 2
  if (value === 'mid') return 1
  return 0
}

function chooseWeightedEvent(weights: Partial<Record<SocialEventType, number>>): SocialEventType {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0) as [SocialEventType, number][]
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [type, weight] of entries) {
    roll -= weight
    if (roll <= 0) return type
  }
  return 'friendship'
}

function deriveSocialArchetype(profile: SocialProfile): string {
  const brave = dialWeight(profile.aggression)
  const sly = dialWeight(profile.mischief)
  const warm = dialWeight(profile.sociability) + dialWeight(profile.generosity) + dialWeight(profile.loyalty)
  const explorer = dialWeight(profile.curiosity)
  if (sly >= 2 && brave >= 1) return 'Petit filou téméraire'
  if (brave >= 2 && profile.rules.duelRivalsOnly) return 'Rival discipliné'
  if (brave >= 2) return 'Bagarreur social'
  if (warm >= 5) return 'Protecteur attachant'
  if (explorer >= 2 && dialWeight(profile.sociability) >= 1) return 'Explorateur curieux'
  return 'Compagnon équilibré'
}

function chooseSocialEvent(profile: SocialProfile, relation: SocialRelation, player: Creature, opponent: CombatOpponent): SocialEventType {
  const levelGap = player.stats.level - opponent.level
  const isFriend = relation.friendshipLevel >= 3
  const isRival = relation.rivalryWins + relation.rivalryLosses >= 2
  const isThief = relation.filouReputation >= 3

  if (profile.rules.avoidThieves && isThief && Math.random() < 0.45) return 'mood'
  if (profile.rules.helpWeaker && levelGap >= 7 && relation.crossings >= 1) return 'mentor'
  if (relation.crossings >= 6 && isFriend && dialWeight(profile.loyalty) >= 1 && Math.random() < 0.36) return 'friendship'

  const sociability = dialWeight(profile.sociability)
  const aggression = dialWeight(profile.aggression)
  const mischief = dialWeight(profile.mischief)
  const generosity = dialWeight(profile.generosity)
  const loyalty = dialWeight(profile.loyalty)
  const curiosity = dialWeight(profile.curiosity)

  const weights: Partial<Record<SocialEventType, number>> = {
    friendship: 8 + sociability * 5 + loyalty * 4 + relation.friendshipLevel * 2,
    mood: 7 + sociability * 3 + (profile.rules.giftSadMonsters ? 3 : 0),
    gift: 3 + generosity * 5 + (isFriend ? 4 : 0),
    duel: 2 + aggression * 7 + (isRival ? 6 : 0),
    theft: 1 + mischief * 8,
    mentor: profile.rules.helpWeaker && Math.abs(levelGap) >= 5 ? 5 : 1,
    skin: 1 + curiosity * 5,
    traveler: 1 + curiosity * 3,
  }

  if (profile.rules.neverStealFriends && isFriend) weights.theft = 0
  if (profile.rules.duelRivalsOnly && !isRival) weights.duel = Math.max(0, (weights.duel ?? 0) - 8)
  if (profile.rules.avoidThieves && isThief) {
    weights.theft = 0
    weights.duel = (weights.duel ?? 0) + aggression * 3
  }

  return chooseWeightedEvent(weights)
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
      return { ...base, emoji: '💰', title: 'Tentative de vol',
        message: `${opponent.creatureName} tente de chaparder une petite récompense. Tu peux le repousser en combat.`,
        pendingCombat: true, rewardCoins: 8 }
    case 'duel':
      return { ...base, emoji: '⚔️', title: 'Défi lancé',
        message: `${opponent.creatureName} provoque ton monstre. Une revanche peut lancer une rivalité.`,
        pendingCombat: true, rewardCoins: 12 }
    case 'mentor':
      return { ...base, emoji: '🎓', title: 'Mentorat',
        message: 'Le plus expérimenté montre quelques astuces. Le lien mentor/disciple se renforce.',
        rewardCoins: 4 }
    case 'gift':
      return { ...base, emoji: '🎁', title: 'Échange spontané',
        message: `${opponent.creatureName} laisse un petit souvenir après le croisement.`,
        rewardCoins: 5 }
    case 'mood':
      return { ...base, emoji: '💫', title: "Contagion d'humeur",
        message: "L'humeur des deux monstres se mélange. Une bonne rencontre peut égayer la journée.",
        rewardCoins: 2 }
    case 'skin':
      return { ...base, emoji: '🎨', title: 'Inspiration de skin',
        message: `${opponent.creatureName} donne une idée de style à ton monstre.`,
        rewardCoins: 3 }
    default:
      return { ...base, emoji: '🤝', title: 'Amitié fidèle',
        message: `${opponent.creatureName} reconnaît ton monstre. Les retrouvailles deviennent plus chaleureuses.`,
        rewardCoins: 4 }
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}j`
  if (hours > 0) return `${hours}h`
  if (mins > 0) return `${mins}min`
  return "maintenant"
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
                <TouchableOpacity key={t} style={[ds.optBtn, playerType === t && ds.optBtnActive]} onPress={() => setPlayerType(t)}>
                  <Text style={[ds.optText, playerType === t && ds.optTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={ds.label}>Niveau</Text>
            <View style={ds.row}>
              {levelOptions.map(l => (
                <TouchableOpacity key={l} style={[ds.optBtn, playerLevel === l && ds.optBtnActive]} onPress={() => setPlayerLevel(l)}>
                  <Text style={[ds.optText, playerLevel === l && ds.optTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={ds.label}>Énergie départ</Text>
            <View style={ds.row}>
              {energyOptions.map(e => (
                <TouchableOpacity key={e} style={[ds.optBtn, playerEnergy === e && ds.optBtnActive]} onPress={() => setPlayerEnergy(e)}>
                  <Text style={[ds.optText, playerEnergy === e && ds.optTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={ds.label}>Loadout ({getEvoStage(playerLevel)})</Text>
            <View style={ds.loadoutRow}>
              {playerLoadout.map((sid: SpellId) => (
                <Text key={sid} style={ds.loadoutSpell}>{SPELL_CATALOG[sid].emoji} {SPELL_CATALOG[sid].name}</Text>
              ))}
            </View>
            <Text style={[ds.sectionTitle, { marginTop: 16 }]}>Adversaire</Text>
            <Text style={ds.label}>Créature</Text>
            <View style={ds.row}>
              {types.map(t => (
                <TouchableOpacity key={t} style={[ds.optBtn, opponentType === t && ds.optBtnActive]} onPress={() => setOpponentType(t)}>
                  <Text style={[ds.optText, opponentType === t && ds.optTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={ds.label}>Niveau</Text>
            <View style={ds.row}>
              {levelOptions.map(l => (
                <TouchableOpacity key={l} style={[ds.optBtn, opponentLevel === l && ds.optBtnActive]} onPress={() => setOpponentLevel(l)}>
                  <Text style={[ds.optText, opponentLevel === l && ds.optTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={ds.startBtn} onPress={() => onStart({ playerType, playerLevel, playerLoadout, playerEnergy, opponentType, opponentLevel, opponentLoadout })}>
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

// ── Encounter cinematic modal ──────────────────────────────
interface EncounterData {
  event: SocialEvent
  opponent: CombatOpponent
  relation: SocialRelation
}

function EncounterModal({ encounter, onFight, onDismiss }: {
  encounter: EncounterData | null
  onFight: () => void
  onDismiss: () => void
}) {
  const [phase, setPhase] = useState<'search' | 'reveal'>('search')
  const spriteScale = useRef(new Animated.Value(0)).current
  const cardSlide   = useRef(new Animated.Value(0)).current
  const searchPulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!encounter) return
    setPhase('search')
    spriteScale.setValue(0)
    cardSlide.setValue(0)
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(searchPulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(searchPulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    pulseAnim.start()
    const t = setTimeout(() => {
      pulseAnim.stop()
      setPhase('reveal')
      Animated.parallel([
        Animated.spring(spriteScale, { toValue: 1, bounciness: 13, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      ]).start()
    }, 1700)
    return () => { clearTimeout(t); pulseAnim.stop() }
  }, [encounter?.event.id])

  if (!encounter) return null
  const { event, opponent, relation } = encounter
  const theme = typeTheme[opponent.creatureType]
  const evColor = EVENT_COLORS[event.type]
  const sprite = getOpponentSprite(opponent.creatureType, opponent.level)
  const tags = relation.tags
  const nth = relation.crossings

  return (
    <Modal visible transparent animationType="fade">
      <View style={st.encOverlay}>
        {phase === 'search' ? (
          <View style={st.encSearchWrap}>
            <Animated.View style={[st.encSearchGlow, {
              opacity: searchPulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
              transform: [{ scale: searchPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
            }]} />
            <Animated.Text style={[st.encSearchMark, {
              opacity: searchPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            }]}>?</Animated.Text>
            <Text style={st.encSearchTxt}>CROISEMENT DÉTECTÉ</Text>
            <Text style={st.encSearchSub}>Un dresseur approche…</Text>
          </View>
        ) : (
          <View style={st.encRevealWrap}>
            <View style={st.encGlowAnchor} pointerEvents="none">
              <View style={[st.encGlow, { width: 240, height: 240, borderRadius: 120, left: -120, top: -120, backgroundColor: theme.main + '14' }]} />
              <View style={[st.encGlow, { width: 170, height: 170, borderRadius: 85,  left: -85,  top: -85,  backgroundColor: theme.main + '22' }]} />
              <View style={[st.encGlow, { width: 110, height: 110, borderRadius: 55,  left: -55,  top: -55,  backgroundColor: theme.main + '30' }]} />
            </View>
            <Text style={st.encKicker}>✦ CROISEMENT ✦</Text>
            <Animated.View style={{ transform: [{ scale: spriteScale }], alignItems: 'center' }}>
              <Image source={sprite} style={st.encSprite} resizeMode="contain" />
            </Animated.View>
            <View style={st.encIdentity}>
              <Text style={st.encCreatureName}>{opponent.creatureName}</Text>
              <View style={st.encIdentityRow}>
                <View style={[st.encChip, { backgroundColor: theme.main, borderColor: theme.dark }]}>
                  <Text style={st.encChipTxt}>Niv.{opponent.level}</Text>
                </View>
                <Text style={st.encUsername}>@{opponent.username}</Text>
              </View>
              {(tags.length > 0 || nth > 1) && (
                <View style={st.encTagRow}>
                  {tags.map((t) => <View key={t} style={st.encTag}><Text style={st.encTagTxt}>{t}</Text></View>)}
                  {nth > 1 && <View style={[st.encTag, { backgroundColor: 'transparent', borderColor: 'transparent' }]}><Text style={[st.encTagTxt, { color: retro.faded }]}>{nth}ᵉ rencontre</Text></View>}
                </View>
              )}
            </View>
            <Animated.View style={[st.encEventCard, { borderColor: evColor }, {
              opacity: cardSlide,
              transform: [{ translateY: cardSlide.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
            }]}>
              <View style={[st.encEventStrap, { backgroundColor: evColor }]}>
                <Text style={st.encEventStrapTxt}>{EVENT_EMOJI[event.type]} {event.title.toUpperCase()}</Text>
              </View>
              <Text style={st.encEventMsg}>{event.message}</Text>
              {(event.rewardCoins ?? 0) > 0 && (
                <View style={st.encRewardRow}>
                  <Text style={st.encRewardTxt}>RÉCOMPENSE</Text>
                  <Text style={st.encRewardVal}>+{event.rewardCoins} 💰</Text>
                </View>
              )}
            </Animated.View>
            <View style={st.encActions}>
              {event.pendingCombat ? (
                <>
                  <PixelButton title="COMBATTRE" icon="⚔️" color={retro.red} big onPress={onFight} style={{ alignSelf: 'stretch' }} />
                  <TouchableOpacity onPress={onDismiss} style={st.encGhostBtn}><Text style={st.encGhostTxt}>Plus tard</Text></TouchableOpacity>
                </>
              ) : (
                <PixelButton title="CONTINUER" color={retro.gold} textColor={retro.ink} big onPress={onDismiss} style={{ alignSelf: 'stretch' }} />
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  )
}

// ── Trainer identity card ──────────────────────────────────
function TrainerCard({ player, profile, archetype, onEdit }: {
  player: Creature
  profile: SocialProfile
  archetype: string
  onEdit: () => void
}) {
  const theme = typeTheme[player.type]
  const sprite = getOpponentSprite(player.type, player.stats.level)

  return (
    <TouchableOpacity style={[st.trainerCard, { borderColor: theme.dark }]} onPress={onEdit} activeOpacity={0.88}>
      {/* Top color stripe */}
      <View style={[st.trainerStripe, { backgroundColor: theme.main }]}>
        <View>
          <Text style={st.trainerStripeLbl}>CARTE DE DRESSEUR</Text>
          <Text style={st.trainerArchetype}>{archetype}</Text>
        </View>
        <Text style={st.trainerEditHint}>⚙ Modifier</Text>
      </View>

      {/* Body */}
      <View style={st.trainerBody}>
        {/* Left: stats */}
        <View style={st.trainerLeft}>
          <Text style={st.trainerCreatureName}>{player.name}</Text>
          <View style={[st.trainerLvlChip, { backgroundColor: theme.main, borderColor: theme.dark }]}>
            <Text style={st.trainerLvlTxt}>Niv.{player.stats.level}</Text>
          </View>
          {/* Personality dot-bars */}
          <View style={st.trainerDots}>
            {DIAL_COLORS.map(({ key, color }) => {
              const filled = DIAL_DOTS[profile[key] as SocialDial]
              return (
                <View key={key} style={st.trainerDotRow}>
                  {[0, 1].map((i) => (
                    <View key={i} style={[st.trainerDot, { backgroundColor: i < filled ? color : retro.paper3 }]} />
                  ))}
                </View>
              )
            })}
          </View>
        </View>

        {/* Right: sprite */}
        <View style={[st.trainerSpriteBox, { backgroundColor: theme.soft }]}>
          <Image source={sprite} style={st.trainerSprite} resizeMode="contain" />
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Empty state — no crossings yet ────────────────────────
function NoCrossingsState() {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <View style={st.emptyWrap}>
      {/* Pulsing broadcast icon */}
      <View style={st.emptyIconWrap}>
        <Animated.View style={[st.emptyPulse, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.12], outputRange: [0.25, 0.08] }) }]} />
        <View style={st.emptyIconBox}>
          <Text style={st.emptyIconEmoji}>📡</Text>
        </View>
      </View>
      <Text style={st.emptyTitle}>En attente de croisements</Text>
      <Text style={st.emptyText}>
        Quand tu croises un autre dresseur{'\n'}dans la vraie vie, la magie opère.
      </Text>
      <View style={st.emptyHintRow}>
        <Text style={st.emptyHint}>Ton monstre se comporte automatiquement{'\n'}selon son caractère.</Text>
      </View>
    </View>
  )
}

// ── Event history card ─────────────────────────────────────
function EventCard({ event, onCombat }: { event: SocialEvent; onCombat: () => void }) {
  const color = EVENT_COLORS[event.type]
  return (
    <View style={[st.evCard, { borderLeftColor: color }]}>
      <View style={[st.evSlot, { backgroundColor: color + '22', borderColor: color }]}>
        <Text style={st.evEmoji}>{EVENT_EMOJI[event.type]}</Text>
      </View>
      <View style={st.evBody}>
        <View style={st.evTitleRow}>
          <Text style={st.evTitle}>{event.title}</Text>
          <Text style={st.evTime}>{timeAgo(event.createdAt)}</Text>
        </View>
        <Text style={st.evMsg} numberOfLines={2}>{event.message}</Text>
      </View>
      {event.pendingCombat && (
        <TouchableOpacity style={[st.evFightBtn, { backgroundColor: color }]} onPress={onCombat}>
          <Text style={st.evFightTxt}>⚔️</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Relation card ──────────────────────────────────────────
function RelationCard({ relation }: { relation: SocialRelation }) {
  const theme = typeTheme[relation.creatureType]
  const sprite = getOpponentSprite(relation.creatureType, relation.level)
  const tag = relation.tags[0] ?? `Lien ${relation.friendshipLevel}`
  return (
    <View style={[st.relCard, { borderColor: theme.dark }]}>
      <View style={[st.relSpriteBox, { backgroundColor: theme.soft }]}>
        <Image source={sprite} style={st.relSprite} resizeMode="contain" />
      </View>
      <Text style={st.relName} numberOfLines={1}>{relation.creatureName}</Text>
      <View style={[st.relTagChip, { backgroundColor: theme.main }]}>
        <Text style={st.relTagTxt}>{tag}</Text>
      </View>
      <Text style={st.relHearts}>{'♥'.repeat(Math.min(5, relation.friendshipLevel))}{'♡'.repeat(Math.max(0, 5 - relation.friendshipLevel))}</Text>
      <Text style={st.relCount}>{relation.crossings}×</Text>
    </View>
  )
}

function BotCard({ bot, onChallenge }: { bot: CombatOpponent; onChallenge: () => void }) {
  const theme  = typeTheme[bot.creatureType]
  const sprite = getOpponentSprite(bot.creatureType, bot.level)
  const evo = getEvoStage(bot.level)
  const evoLabel = evo === 'e3' ? '★★★' : evo === 'e2' ? '★★' : '★'
  return (
    <View style={st.botCard}>
      <View style={[st.botAvatar, { backgroundColor: theme.soft, borderColor: theme.dark }]}>
        <Image source={sprite} style={st.botSprite} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.botName}>{bot.creatureName}</Text>
        <Text style={st.botUser}>@{bot.username}</Text>
        <Text style={st.botMeta}>🤖 Niv.{bot.level} · {evoLabel}</Text>
      </View>
      <TouchableOpacity style={[st.botFightBtn, { backgroundColor: theme.main, borderColor: theme.dark }]} onPress={onChallenge}>
        <Text style={st.botFightTxt}>⚔️ Défier</Text>
      </TouchableOpacity>
    </View>
  )
}

function CrossingCard({ item, onChallenge }: { item: Crossing; onChallenge: () => void }) {
  const theme  = typeTheme[item.creatureType]
  const sprite = SPRITES_E1[item.creatureType]
  const interactionLabel = {
    friendly: '🤝', battle: '⚔️', gift: '🎁', theft: '💰', mentor: '🎓', mood: '💫', skin: '🎨',
  }[item.interactionType] ?? '🤝'

  return (
    <View style={st.botCard}>
      <View style={[st.botAvatar, { backgroundColor: theme.soft, borderColor: theme.dark }]}>
        <Image source={sprite} style={st.botSprite} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.botName}>{item.creatureName}</Text>
        <Text style={st.botUser}>@{item.username}</Text>
        <Text style={st.botMeta}>{interactionLabel} {timeAgo(item.crossedAt)}</Text>
      </View>
      <TouchableOpacity style={[st.botFightBtn, { backgroundColor: theme.main, borderColor: theme.dark }]} onPress={onChallenge}>
        <Text style={st.botFightTxt}>⚔️ Défier</Text>
      </TouchableOpacity>
    </View>
  )
}

interface Props {
  player: Creature
  onCombatEnd: (won: boolean, xpGained: number, coinsGained?: number) => void
}

export default function CrossingsScreen({ player, onCombatEnd }: Props) {
  const [crossings, setCrossings] = useState<Crossing[]>([])
  const [relations, setRelations] = useState<SocialRelation[]>([])
  const [events, setEvents] = useState<SocialEvent[]>([])
  const [socialProfile, setSocialProfile] = useState<SocialProfile>(DEFAULT_SOCIAL_PROFILE)
  const [loading, setLoading]     = useState(true)
  const [combat, setCombat]       = useState<CombatOpponent | null>(null)
  const [showCrossings, setShowCrossings] = useState(false)
  const [showAdventure, setShowAdventure] = useState(false)
  const [showPersonality, setShowPersonality] = useState(false)
  const [encounter, setEncounter] = useState<EncounterData | null>(null)
  const [debugSetup, setDebugSetup] = useState(false)
  const [debugOverride, setDebugOverride] = useState<{
    playerType: CreatureType; playerLevel: number
    playerLoadout: SpellLoadout; playerEnergy: number
  } | undefined>(undefined)

  // Hidden tap counter on title for dev access
  const devTapCount = useRef(0)
  const devTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([loadCrossings(), loadSocialRelations(), loadSocialEvents(), loadSocialProfile()])
      .then(([crossData, relationData, eventData, profileData]) => {
        setCrossings(crossData ?? [])
        setRelations(relationData ?? [])
        setEvents(eventData ?? [])
        setSocialProfile(profileData
          ? { ...DEFAULT_SOCIAL_PROFILE, ...profileData, rules: { ...DEFAULT_SOCIAL_PROFILE.rules, ...profileData.rules } }
          : DEFAULT_SOCIAL_PROFILE)
        setLoading(false)
      })
  }, [])

  const updateSocialDial = async (key: keyof Omit<SocialProfile, 'rules'>, value: SocialDial) => {
    const next = { ...socialProfile, [key]: value }
    setSocialProfile(next)
    await saveSocialProfile(next)
  }

  const toggleSocialRule = async (key: keyof SocialProfile['rules']) => {
    const next = { ...socialProfile, rules: { ...socialProfile.rules, [key]: !socialProfile.rules[key] } }
    setSocialProfile(next)
    await saveSocialProfile(next)
  }

  const startCombat = (opponent: CombatOpponent) => {
    setShowCrossings(false)
    setDebugOverride(undefined)
    setCombat(opponent)
  }

  const handleQuickAI = () => startCombat(generateAIOpponent(player.stats.level))

  // Simulate a crossing — for dev/testing only
  const handleSocialCrossing = async () => {
    const opponent = generateAIOpponent(player.stats.level)
    const relationId = `${opponent.username}:${opponent.creatureType}`
    const now = new Date().toISOString()
    const existing = relations.find(r => r.id === relationId)
    const baseRelation: SocialRelation = existing ?? {
      id: relationId, username: opponent.username, creatureName: opponent.creatureName,
      creatureType: opponent.creatureType, level: opponent.level,
      crossings: 0, friendshipLevel: 0, filouReputation: 0,
      rivalryWins: 0, rivalryLosses: 0, mentorCount: 0, tags: [], lastCrossedAt: now,
    }
    const eventType = chooseSocialEvent(socialProfile, baseRelation, player, opponent)
    const nextRelation: SocialRelation = {
      ...baseRelation, creatureName: opponent.creatureName, creatureType: opponent.creatureType,
      level: opponent.level, crossings: baseRelation.crossings + 1,
      friendshipLevel: Math.min(5, baseRelation.friendshipLevel + (eventType === 'theft' ? 0 : 1)),
      filouReputation: Math.max(0, baseRelation.filouReputation + (eventType === 'theft' ? 1 : socialProfile.mischief === 'low' ? -1 : 0)),
      rivalryLosses: baseRelation.rivalryLosses + (eventType === 'duel' ? 1 : 0),
      mentorCount: baseRelation.mentorCount + (eventType === 'mentor' ? 1 : 0),
      lastCrossedAt: now, tags: [],
    }
    nextRelation.tags = relationTags(nextRelation)
    const socialEvent = buildSocialEvent(eventType, nextRelation, opponent)
    const crossing: Crossing = {
      id: socialEvent.id, playerId: relationId, username: opponent.username,
      creatureName: opponent.creatureName, creatureType: opponent.creatureType, level: opponent.level,
      crossedAt: now, latitude: 0, longitude: 0,
      interactionType: eventToInteraction(eventType),
      socialEventId: socialEvent.id, xpGained: socialEvent.rewardCoins ?? 0,
    }
    const nextRelations = [nextRelation, ...relations.filter(r => r.id !== relationId)].slice(0, 80)
    const nextEvents = [socialEvent, ...events].slice(0, 60)
    const nextCrossings = [crossing, ...crossings].slice(0, 50)
    setRelations(nextRelations)
    setEvents(nextEvents)
    setCrossings(nextCrossings)
    setEncounter({ event: socialEvent, opponent, relation: nextRelation })
    await Promise.all([saveSocialRelations(nextRelations), saveSocialEvents(nextEvents), saveCrossings(nextCrossings)])
  }

  const handleTitleTap = () => {
    devTapCount.current += 1
    if (devTapTimer.current) clearTimeout(devTapTimer.current)
    devTapTimer.current = setTimeout(() => { devTapCount.current = 0 }, 2000)
    if (devTapCount.current >= 5) { devTapCount.current = 0; setDebugSetup(true) }
  }

  const startSocialCombat = (event: SocialEvent) => {
    if (!event.opponent) return
    setEncounter(null)
    setDebugOverride(undefined)
    setCombat(event.opponent)
  }

  const handleDebugStart = (cfg: DebugConfig) => {
    setDebugSetup(false)
    setDebugOverride({ playerType: cfg.playerType, playerLevel: cfg.playerLevel, playerLoadout: cfg.playerLoadout, playerEnergy: cfg.playerEnergy })
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
    return <CombatScreen player={player} opponent={combat} onFinish={handleCombatEnd} debugOverride={debugOverride} />
  }

  if (showAdventure) {
    return <AdventureScreen player={player} onCombatEnd={(won, xp, coins) => { onCombatEnd(won, xp, coins) }} onClose={() => setShowAdventure(false)} />
  }

  if (loading) return null

  const playerLevel = player.stats.level
  const minLv = Math.max(1, playerLevel - 2)
  const maxLv = playerLevel + 5
  const archetype = deriveSocialArchetype(socialProfile)
  const hasCrossings = crossings.length > 0 || relations.length > 0 || events.length > 0

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity activeOpacity={1} onPress={handleTitleTap}>
            <Text style={st.titleEcho}>Croisements</Text>
            <Text style={st.title}>Croisements</Text>
          </TouchableOpacity>
          <Text style={st.subtitle}>{player.name} · Niv.{playerLevel}</Text>
        </View>

        {/* ── Trainer identity card ──────────────────────── */}
        <View style={st.section}>
          <TrainerCard
            player={player}
            profile={socialProfile}
            archetype={archetype}
            onEdit={() => setShowPersonality(true)}
          />
        </View>

        {/* ── Crossings history or empty state ──────────── */}
        {!hasCrossings ? (
          <NoCrossingsState />
        ) : (
          <>
            {/* Relations */}
            {relations.length > 0 && (
              <>
                <SectionTitle title="LIENS TISSÉS" color={retro.red} style={st.sectionTitle} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.relScroll}>
                  {relations.slice(0, 10).map((r) => <RelationCard key={r.id} relation={r} />)}
                </ScrollView>
              </>
            )}

            {/* Events history */}
            {events.length > 0 && (
              <>
                <SectionTitle title="DERNIERS CROISEMENTS" color={retro.red} style={st.sectionTitle} />
                <View style={st.evList}>
                  {events.slice(0, 5).map((event) => (
                    <EventCard key={event.id} event={event} onCombat={() => startSocialCombat(event)} />
                  ))}
                  {events.length > 5 && (
                    <Text style={st.evMore}>+{events.length - 5} dans l'historique</Text>
                  )}
                </View>
              </>
            )}
          </>
        )}

        {/* ── Simulate crossing — small dev button ──────── */}
        <TouchableOpacity style={st.simBtn} onPress={handleSocialCrossing}>
          <Text style={st.simBtnTxt}>⚡ Simuler un croisement</Text>
        </TouchableOpacity>

        {/* ── Combat modes ──────────────────────────────── */}
        <SectionTitle title="MODES COMBAT" color={retro.red} style={st.sectionTitle} />
        <TouchableOpacity style={[st.modeCardWide, { backgroundColor: retro.blue }]} onPress={() => setShowAdventure(true)} activeOpacity={0.85}>
          <Text style={st.modeEmoji}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.modeTitle}>AVENTURE</Text>
            <Text style={st.modeSub}>6 routes · PNJ · Récompenses</Text>
          </View>
          <Text style={st.modeArrow}>›</Text>
        </TouchableOpacity>
        <View style={st.modeRow}>
          <TouchableOpacity style={[st.modeCard, { backgroundColor: retro.ink }]} onPress={handleQuickAI} activeOpacity={0.85}>
            <Text style={st.modeEmoji}>🤖</Text>
            <Text style={st.modeTitle}>COMBAT IA</Text>
            <Text style={st.modeSub}>Niv {minLv}–{maxLv}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.modeCard, { backgroundColor: retro.red }]} onPress={() => setShowCrossings(true)} activeOpacity={0.85}>
            <Text style={st.modeEmoji}>👥</Text>
            <Text style={st.modeTitle}>MULTI</Text>
            <Text style={st.modeSub}>{crossings.length > 0 ? `${crossings.length} croisement${crossings.length !== 1 ? 's' : ''}` : 'Bots dispo'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Encounter cinematic */}
      <EncounterModal
        encounter={encounter}
        onFight={() => encounter && startSocialCombat(encounter.event)}
        onDismiss={() => setEncounter(null)}
      />

      {/* Personality sheet */}
      <Modal visible={showPersonality} transparent animationType="slide">
        <TouchableOpacity style={st.sheetOverlay} onPress={() => setShowPersonality(false)} activeOpacity={1}>
          <TouchableOpacity activeOpacity={1} style={st.sheetCard}>
            <View style={st.sheetHandle} />
            <Text style={st.sheetTitle}>Caractère de {player.name}</Text>
            <Text style={st.sheetSub}>Gouverne son comportement lors des croisements</Text>
            <View style={st.archetypeBanner}>
              <Text style={st.archetypeBannerTxt}>✦ {archetype}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {PROFILE_DIALS.map((dial) => (
                <View key={dial.key} style={st.dialRow}>
                  <View style={st.dialText}>
                    <Text style={st.dialLabel}>{dial.emoji} {dial.label}</Text>
                    <Text style={st.dialDesc}>{dial.desc}</Text>
                  </View>
                  <View style={st.dialSeg}>
                    {SOCIAL_DIALS.map((value, i) => {
                      const active = socialProfile[dial.key] === value
                      return (
                        <TouchableOpacity
                          key={value}
                          style={[
                            st.dialSegBtn,
                            i === SOCIAL_DIALS.length - 1 && st.dialSegLast,
                            active && st.dialSegActive,
                          ]}
                          onPress={() => updateSocialDial(dial.key, value)}
                        >
                          <Text style={[st.dialSegTxt, active && st.dialSegTxtActive]}>{SOCIAL_DIAL_LABELS[value]}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
              <Text style={st.rulesLabel}>◆ RÈGLES DE CONDUITE</Text>
              <View style={st.ruleGrid}>
                {PROFILE_RULES.map((rule) => {
                  const active = socialProfile.rules[rule.key]
                  return (
                    <TouchableOpacity
                      key={rule.key}
                      style={[st.rulePill, active && st.rulePillActive]}
                      onPress={() => toggleSocialRule(rule.key)}
                    >
                      <Text style={[st.ruleMark, active && st.ruleMarkActive]}>{active ? '✓' : '✗'}</Text>
                      <Text style={[st.ruleText, active && st.ruleTextActive]}>{rule.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>
            <PixelButton title="FERMER" color={retro.ink} onPress={() => setShowPersonality(false)} style={{ alignSelf: 'stretch', marginTop: 14 }} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Multi / bots sheet */}
      <Modal visible={showCrossings} transparent animationType="slide">
        <TouchableOpacity style={st.sheetOverlay} onPress={() => setShowCrossings(false)} activeOpacity={1}>
          <View style={st.sheetCard}>
            <View style={st.sheetHandle} />
            <Text style={st.sheetTitle}>{crossings.length > 0 ? '⚔️ Tes croisements' : "🤖 Bots d'entraînement"}</Text>
            {crossings.length === 0 && <Text style={st.sheetSub}>Entraîne-toi en attendant de vrais croisements !</Text>}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0, marginTop: 8 }}>
              {crossings.length > 0
                ? crossings.map((c) => (
                    <CrossingCard key={c.id} item={c} onChallenge={() => startCombat({
                      username: c.username, creatureName: c.creatureName,
                      creatureType: c.creatureType, level: Math.max(1, c.xpGained > 0 ? 5 : 1),
                    })} />
                  ))
                : BOT_OPPONENTS.map((bot, i) => <BotCard key={i} bot={bot} onChallenge={() => startCombat(bot)} />)
              }
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {debugSetup && <DebugSetupPanel onStart={handleDebugStart} onClose={() => setDebugSetup(false)} />}
    </SafeAreaView>
  )
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: retro.paper },
  scroll: { paddingBottom: 36 },

  header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16 },
  titleEcho: {
    fontSize: 30, fontWeight: '900', fontFamily: 'monospace', letterSpacing: -0.5,
    position: 'absolute', left: 2.5, top: 2.5, color: retro.gold, opacity: 0.5,
  },
  title: { fontSize: 30, fontWeight: '900', color: retro.ink, fontFamily: 'monospace', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: retro.muted, marginTop: 4 },

  section: { paddingHorizontal: 16, marginBottom: 4 },
  sectionTitle: { paddingHorizontal: 20, marginTop: 22, marginBottom: 10 },

  // ── Trainer identity card ────────────────────────────────
  trainerCard: {
    borderWidth: 3,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: retro.white,
    ...retroShadow,
  },
  trainerStripe: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trainerStripeLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1.5 },
  trainerArchetype: { color: retro.white, fontSize: 14, fontWeight: '900', fontFamily: 'monospace', marginTop: 2 },
  trainerEditHint: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },
  trainerBody: { flexDirection: 'row', padding: 14, alignItems: 'center', gap: 14 },
  trainerLeft: { flex: 1, gap: 6 },
  trainerCreatureName: { fontSize: 22, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  trainerLvlChip: {
    alignSelf: 'flex-start',
    borderRadius: 2,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 2,
  },
  trainerLvlTxt: { color: retro.white, fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },
  // Personality dots: 6 traits × 2 dots
  trainerDots: { flexDirection: 'row', gap: 5, marginTop: 4 },
  trainerDotRow: { gap: 3 },
  trainerDot: { width: 7, height: 7, borderRadius: 1 },
  trainerSpriteBox: {
    width: 86,
    height: 86,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: retro.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerSprite: { width: 72, height: 72 },

  // ── Empty state ──────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 36, gap: 14 },
  emptyIconWrap: { alignItems: 'center', justifyContent: 'center', width: 100, height: 100 },
  emptyPulse: {
    position: 'absolute',
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: retro.blue,
  },
  emptyIconBox: {
    width: 68, height: 68,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: retro.line,
    backgroundColor: retro.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...retroShadow,
  },
  emptyIconEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: retro.ink, fontFamily: 'monospace', textAlign: 'center' },
  emptyText: { fontSize: 13, color: retro.muted, textAlign: 'center', lineHeight: 20 },
  emptyHintRow: {
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: retro.blue,
  },
  emptyHint: { fontSize: 11, color: retro.ink2, textAlign: 'center', lineHeight: 17 },

  // ── Simulate button (dev) ────────────────────────────────
  simBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 9,
    borderWidth: 2,
    borderColor: retro.paper3,
    borderRadius: 4,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  simBtnTxt: { color: retro.faded, fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },

  // ── Relations shelf ──────────────────────────────────────
  relScroll: { paddingHorizontal: 16, gap: 10 },
  relCard: {
    width: 104, backgroundColor: retro.white, borderWidth: 2, borderRadius: 4,
    padding: 8, alignItems: 'center', gap: 4,
    shadowColor: retro.line, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  relSpriteBox: {
    width: 60, height: 60, borderRadius: 3, borderWidth: 2, borderColor: retro.line,
    alignItems: 'center', justifyContent: 'center',
  },
  relSprite: { width: 48, height: 48 },
  relName: { fontSize: 11, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  relTagChip: { borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5, borderColor: retro.line },
  relTagTxt: { fontSize: 8, fontWeight: '900', color: retro.white, fontFamily: 'monospace', textTransform: 'uppercase' },
  relHearts: { fontSize: 9, color: retro.red, letterSpacing: 1 },
  relCount: { fontSize: 8, color: retro.faded, fontFamily: 'monospace', fontWeight: '800' },

  // ── Event history ────────────────────────────────────────
  evList: { paddingHorizontal: 16, gap: 8 },
  evCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: retro.white, borderWidth: 2, borderColor: retro.line,
    borderLeftWidth: 5, borderRadius: 4, padding: 10,
    shadowColor: retro.line, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  evSlot: {
    width: 38, height: 38, borderRadius: 3, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  evEmoji: { fontSize: 18 },
  evBody: { flex: 1, gap: 2 },
  evTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evTitle: { fontSize: 12, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  evTime: { fontSize: 9, color: retro.faded, fontFamily: 'monospace', fontWeight: '800' },
  evMsg: { fontSize: 11, color: retro.muted, lineHeight: 15 },
  evFightBtn: {
    width: 38, height: 38, borderRadius: 3, borderWidth: 2, borderColor: retro.line,
    alignItems: 'center', justifyContent: 'center',
  },
  evFightTxt: { fontSize: 16 },
  evMore: { fontSize: 10, color: retro.faded, textAlign: 'center', fontWeight: '800', fontFamily: 'monospace', marginTop: 2 },

  // ── Mode cards ───────────────────────────────────────────
  modeRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 10 },
  modeCard: {
    flex: 1, borderRadius: 4, paddingVertical: 18, paddingHorizontal: 14,
    alignItems: 'center', gap: 5, borderWidth: 3, borderColor: retro.line, ...retroShadow,
  },
  modeCardWide: {
    marginHorizontal: 16, borderRadius: 4, paddingVertical: 16, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 3, borderColor: retro.line, ...retroShadow,
  },
  modeEmoji: { fontSize: 30 },
  modeTitle: { fontSize: 14, fontWeight: '900', color: retro.white, fontFamily: 'monospace', letterSpacing: 0.5 },
  modeSub: { fontSize: 10, color: retro.paper, textAlign: 'center', fontWeight: '700' },
  modeArrow: { color: retro.paper2, fontSize: 22, fontWeight: '900' },

  // ── Encounter modal ──────────────────────────────────────
  encOverlay: {
    flex: 1, backgroundColor: 'rgba(11,13,24,0.96)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  encSearchWrap: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  encSearchGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: retro.screenDark },
  encSearchMark: { fontSize: 84, fontWeight: '900', color: retro.screenSoft, fontFamily: 'monospace' },
  encSearchTxt: { color: retro.screenSoft, fontSize: 14, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 3, marginTop: 18 },
  encSearchSub: { color: retro.faded, fontSize: 12 },
  encRevealWrap: { alignItems: 'center', alignSelf: 'stretch', gap: 14 },
  encGlowAnchor: { position: 'absolute', top: 130, left: '50%', width: 0, height: 0 },
  encGlow: { position: 'absolute' },
  encKicker: { color: retro.gold, fontSize: 13, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 4 },
  encSprite: { width: 140, height: 154 },
  encIdentity: { alignItems: 'center', gap: 6 },
  encCreatureName: {
    color: retro.white, fontSize: 24, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0,
  },
  encIdentityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  encChip: { borderRadius: 2, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 2 },
  encChipTxt: { color: retro.white, fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },
  encUsername: { color: retro.faded, fontSize: 12, fontFamily: 'monospace', fontWeight: '800' },
  encTagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  encTag: {
    backgroundColor: retro.ink2, borderRadius: 2, paddingHorizontal: 7, paddingVertical: 2.5,
    borderWidth: 1.5, borderColor: retro.ink3,
  },
  encTagTxt: { color: retro.paper, fontSize: 9, fontWeight: '900', fontFamily: 'monospace', textTransform: 'uppercase' },
  encEventCard: {
    alignSelf: 'stretch', backgroundColor: retro.white, borderWidth: 3, borderRadius: 4,
    padding: 14, paddingTop: 20, marginTop: 8, gap: 10, ...retroShadow,
  },
  encEventStrap: {
    position: 'absolute', top: -12, alignSelf: 'center',
    borderRadius: 2, borderWidth: 2, borderColor: retro.line,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  encEventStrapTxt: { color: retro.white, fontSize: 11, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },
  encEventMsg: { color: retro.ink2, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  encRewardRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: retro.paper2, borderRadius: 3, borderWidth: 2, borderColor: retro.line,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  encRewardTxt: { color: retro.muted, fontSize: 9, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },
  encRewardVal: { color: retro.goldDark, fontSize: 14, fontWeight: '900', fontFamily: 'monospace' },
  encActions: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  encGhostBtn: { alignItems: 'center', paddingVertical: 8 },
  encGhostTxt: { color: retro.faded, fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },

  // ── Sheets ───────────────────────────────────────────────
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetCard: {
    backgroundColor: retro.white, borderTopLeftRadius: 6, borderTopRightRadius: 6,
    borderWidth: 3, borderColor: retro.line, padding: 20, paddingBottom: 36, maxHeight: '88%',
  },
  sheetHandle: { width: 44, height: 5, borderRadius: 2, backgroundColor: retro.paper3, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  sheetSub: { fontSize: 12, color: retro.muted, marginTop: 2, marginBottom: 10 },
  archetypeBanner: {
    backgroundColor: retro.paper2, borderWidth: 2, borderColor: retro.goldDark, borderRadius: 3,
    paddingVertical: 8, alignItems: 'center', marginTop: 8, marginBottom: 12,
  },
  archetypeBannerTxt: { color: retro.goldDark, fontSize: 13, fontWeight: '900', fontFamily: 'monospace' },

  dialRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1.5, borderBottomColor: retro.paper2,
  },
  dialText: { flex: 1 },
  dialLabel: { color: retro.ink, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  dialDesc: { color: retro.muted, fontSize: 9.5, marginTop: 2 },
  dialSeg: { flexDirection: 'row', borderWidth: 2, borderColor: retro.line, borderRadius: 3, overflow: 'hidden' },
  dialSegBtn: {
    paddingHorizontal: 9, paddingVertical: 7, backgroundColor: retro.white,
    borderRightWidth: 2, borderRightColor: retro.line,
  },
  dialSegLast: { borderRightWidth: 0 },
  dialSegActive: { backgroundColor: retro.gold },
  dialSegTxt: { color: retro.muted, fontSize: 9, fontWeight: '900', fontFamily: 'monospace' },
  dialSegTxtActive: { color: retro.ink },
  rulesLabel: { color: retro.red, fontSize: 10, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1, marginTop: 14, marginBottom: 8 },
  ruleGrid: { gap: 6 },
  rulePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 9,
    backgroundColor: retro.paper, borderRadius: 3, borderWidth: 2, borderColor: retro.paper3,
  },
  rulePillActive: { backgroundColor: retro.white, borderColor: retro.mintDark },
  ruleMark: { color: retro.faded, fontSize: 12, fontWeight: '900', fontFamily: 'monospace', width: 14, textAlign: 'center' },
  ruleMarkActive: { color: retro.mintDark },
  ruleText: { color: retro.muted, fontSize: 11, fontWeight: '800', flex: 1 },
  ruleTextActive: { color: retro.ink },

  // ── Bot / crossing cards ─────────────────────────────────
  botCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: retro.paper,
    borderWidth: 2, borderColor: retro.line, borderRadius: 4, padding: 10, marginBottom: 8,
  },
  botAvatar: { width: 52, height: 52, borderRadius: 3, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  botSprite: { width: 42, height: 42 },
  botName: { fontSize: 14, fontWeight: '900', color: retro.ink, fontFamily: 'monospace' },
  botUser: { fontSize: 10, color: retro.muted, fontFamily: 'monospace', marginTop: 1 },
  botMeta: { fontSize: 10, color: retro.faded, marginTop: 2, fontWeight: '700' },
  botFightBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 3, borderWidth: 2 },
  botFightTxt: { color: retro.white, fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },
})

const ds = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  panel: { backgroundColor: retro.white, borderTopLeftRadius: 6, borderTopRightRadius: 6, padding: 24, maxHeight: '85%', gap: 12 },
  title: { color: retro.red, fontSize: 20, fontWeight: '900', marginBottom: 8, fontFamily: 'monospace' },
  sectionTitle: { color: retro.ink, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  label: { color: retro.muted, fontSize: 12, marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: retro.paper2, borderWidth: 2, borderColor: retro.line },
  optBtnActive: { backgroundColor: retro.gold, borderColor: retro.line },
  optText: { color: retro.ink, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  optTextActive: { color: retro.ink },
  loadoutRow: { gap: 4, marginTop: 4 },
  loadoutSpell: { color: retro.ink, fontSize: 12 },
  startBtn: { backgroundColor: retro.gold, borderRadius: 4, paddingVertical: 14, alignItems: 'center', marginTop: 8, borderWidth: 3, borderColor: retro.line },
  startBtnText: { color: retro.ink, fontSize: 15, fontWeight: '900', fontFamily: 'monospace' },
  closeBtn: { alignItems: 'center', paddingVertical: 8 },
  closeBtnText: { color: retro.muted, fontSize: 13 },
})
