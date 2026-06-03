import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import ActionButtons from '../components/ActionButtons'
import CreatureDisplay from '../components/CreatureDisplay'
import StatsPanel from '../components/StatsPanel'
import { Creature } from '../types'
import { addXP, decayStats, getMood } from '../utils/creature'
import { loadCreature, saveCreature } from '../utils/storage'

interface Props {
  creature: Creature
  onUpdate: (creature: Creature) => void
}

export default function HomeScreen({ creature, onUpdate }: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const refreshStats = useCallback(async () => {
    const saved = await loadCreature()
    if (!saved) return
    const decayed = { ...saved, stats: decayStats(saved), mood: getMood(decayStats(saved)) }
    onUpdate(decayed)
  }, [onUpdate])

  useEffect(() => {
    const interval = setInterval(refreshStats, 60_000)
    return () => clearInterval(interval)
  }, [refreshStats])

  const handleFeed = async () => {
    if (creature.stats.hunger >= 95) {
      Alert.alert('Rassasié !', `${creature.name} n'a pas faim pour l'instant.`)
      return
    }
    const updated: Creature = {
      ...creature,
      lastFed: new Date().toISOString(),
      stats: {
        ...creature.stats,
        hunger: Math.min(100, creature.stats.hunger + 30),
        happiness: Math.min(100, creature.stats.happiness + 5),
      },
    }
    const withXP = addXP(updated, 10)
    const final = { ...withXP, mood: getMood(withXP.stats) }
    await saveCreature(final)
    onUpdate(final)
  }

  const handlePlay = async () => {
    if (creature.stats.energy < 20) {
      Alert.alert('Fatigué !', `${creature.name} est trop fatigué pour jouer.`)
      return
    }
    const updated: Creature = {
      ...creature,
      lastPlayed: new Date().toISOString(),
      stats: {
        ...creature.stats,
        happiness: Math.min(100, creature.stats.happiness + 25),
        energy: Math.max(0, creature.stats.energy - 15),
        hunger: Math.max(0, creature.stats.hunger - 10),
      },
    }
    const withXP = addXP(updated, 15)
    const final = { ...withXP, mood: getMood(withXP.stats) }
    await saveCreature(final)
    onUpdate(final)
  }

  const handleSleep = async () => {
    if (creature.stats.energy >= 95) {
      Alert.alert('Plein d\'énergie !', `${creature.name} n'est pas fatigué.`)
      return
    }
    const updated: Creature = {
      ...creature,
      stats: {
        ...creature.stats,
        energy: Math.min(100, creature.stats.energy + 40),
        hunger: Math.max(0, creature.stats.hunger - 5),
      },
    }
    const final = { ...updated, mood: getMood(updated.stats) }
    await saveCreature(final)
    onUpdate(final)
    Alert.alert('Dodo 💤', `${creature.name} s'est reposé et récupère de l'énergie !`)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refreshStats()
    setRefreshing(false)
  }, [refreshStats])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Croisio</Text>
          <Text style={styles.subtitle}>Ta créature t'attend</Text>
        </View>

        <CreatureDisplay creature={creature} />

        <StatsPanel stats={creature.stats} />

        <View style={styles.spacer} />

        <ActionButtons
          onFeed={handleFeed}
          onPlay={handlePlay}
          onSleep={handleSleep}
          hungerFull={creature.stats.hunger >= 95}
          energyFull={creature.stats.energy >= 95}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  scroll: {
    paddingBottom: 30,
    gap: 20,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  spacer: {
    height: 4,
  },
})
