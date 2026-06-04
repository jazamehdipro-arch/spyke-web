import React from 'react'
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { JournalEntry } from '../types'

interface Props {
  entries: JournalEntry[]
  creatureName: string
}

function Entry({ item }: { item: JournalEntry }) {
  const date = new Date(item.timestamp)
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  const timeStr = days > 0
    ? `il y a ${days}j`
    : hours > 0
    ? `il y a ${hours}h`
    : mins > 0
    ? `il y a ${mins}min`
    : 'à l\'instant'

  return (
    <View style={styles.entry}>
      <Text style={styles.entryEmoji}>{item.emoji}</Text>
      <View style={styles.entryContent}>
        <Text style={styles.entryText}>{item.message}</Text>
        <Text style={styles.entryTime}>{timeStr}</Text>
      </View>
    </View>
  )
}

function EmptyJournal({ name }: { name: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📖</Text>
      <Text style={styles.emptyTitle}>Journal vide</Text>
      <Text style={styles.emptyText}>
        Les aventures de {name} apparaîtront ici au fil du temps.
      </Text>
    </View>
  )
}

export default function JournalScreen({ entries, creatureName }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>
          La vie de {creatureName}
        </Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <Entry item={item} />}
        ListEmptyComponent={<EmptyJournal name={creatureName} />}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7FF' },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -1,
  },
  subtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 2,
    flexGrow: 1,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryEmoji: { fontSize: 22, width: 32, textAlign: 'center', marginTop: 1 },
  entryContent: { flex: 1 },
  entryText: { fontSize: 14, color: '#333', lineHeight: 20 },
  entryTime: { fontSize: 12, color: '#bbb', marginTop: 3 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },
})
