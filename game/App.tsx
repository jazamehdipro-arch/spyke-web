import React, { useCallback, useEffect, useState } from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import CrossingsScreen from './src/screens/CrossingsScreen'
import HomeScreen from './src/screens/HomeScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import { Creature, Crossing, CreatureType } from './src/types'
import { createNewCreature, decayStats, getMood } from './src/utils/creature'
import {
  loadCreature,
  loadCrossings,
  loadPlayer,
  saveCreature,
  savePlayer,
} from './src/utils/storage'

type Tab = 'home' | 'crossings' | 'profile'

export default function App() {
  const [ready, setReady] = useState(false)
  const [creature, setCreature] = useState<Creature | null>(null)
  const [username, setUsername] = useState<string>('')
  const [crossings, setCrossings] = useState<Crossing[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('home')

  useEffect(() => {
    const init = async () => {
      const [savedCreature, savedPlayer, savedCrossings] = await Promise.all([
        loadCreature(),
        loadPlayer(),
        loadCrossings(),
      ])

      if (savedCreature && savedPlayer) {
        const decayed = { ...savedCreature, stats: decayStats(savedCreature) }
        const withMood = { ...decayed, mood: getMood(decayed.stats) }
        setCreature(withMood)
        setUsername(savedPlayer.id)
        setCrossings(savedCrossings)
      }

      setReady(true)
    }

    init()
  }, [])

  const handleOnboardingComplete = useCallback(
    async (name: string, type: CreatureType) => {
      const newCreature = createNewCreature(type)
      await Promise.all([
        saveCreature(newCreature),
        savePlayer({ id: name, username: name }),
      ])
      setCreature(newCreature)
      setUsername(name)
    },
    []
  )

  if (!ready) return null

  if (!creature || !username) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'home',      icon: '🏠', label: 'Accueil'    },
    { key: 'crossings', icon: '🤝', label: 'Croisements' },
    { key: 'profile',   icon: '👤', label: 'Profil'      },
  ]

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen creature={creature} onUpdate={setCreature} />
        )}
        {activeTab === 'crossings' && <CrossingsScreen />}
        {activeTab === 'profile' && (
          <ProfileScreen
            creature={creature}
            username={username}
            crossingsCount={crossings.length}
          />
        )}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1a1a2e',
    fontWeight: '700',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a1a2e',
    marginTop: 2,
  },
})
