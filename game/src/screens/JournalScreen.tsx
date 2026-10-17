import React from 'react'
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { JournalEntry } from '../types'
import { font, retro } from '../styles/retro'

interface Props {
  entries: JournalEntry[]
  creatureName: string
}

function Entry({ item, index }: { item: JournalEntry; index: number }) {
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
    <View style={s.row}>
      {/* rail */}
      <View style={s.rail}>
        <View style={s.railNode} />
        <View style={s.railLine} />
      </View>
      {/* content */}
      <View style={s.card}>
        <View style={s.emojiSlot}>
          <Text style={s.emoji}>{item.emoji}</Text>
        </View>
        <View style={s.body}>
          <Text style={s.message}>{item.message}</Text>
          <Text style={s.time}>{timeStr}</Text>
        </View>
      </View>
    </View>
  )
}

function EmptyJournal({ name }: { name: string }) {
  return (
    <View style={s.empty}>
      <View style={s.emptySlot}><Text style={s.emptyEmoji}>📖</Text></View>
      <Text style={s.emptyTitle}>Journal vide</Text>
      <Text style={s.emptyText}>
        Les aventures de {name} apparaîtront ici au fil du temps.
      </Text>
    </View>
  )
}

export default function JournalScreen({ entries, creatureName }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.titleEcho}>Journal</Text>
          <Text style={s.title}>Journal</Text>
        </View>
        <View style={s.subChip}>
          <Text style={s.subChipTxt}>📝 {creatureName}</Text>
        </View>
      </View>

      <View style={s.sectionRow}>
        <Text style={s.sectionDiamond}>◆</Text>
        <Text style={s.sectionLabel}>CHRONOLOGIE</Text>
        <View style={s.sectionRule} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={({ item, index }) => <Entry item={item} index={index} />}
        ListEmptyComponent={<EmptyJournal name={creatureName} />}
        contentContainerStyle={s.list}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: retro.paper },

  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleEcho: {
    ...font.display,
    fontSize: 30,
    position: 'absolute',
    left: 2.5,
    top: 2.5,
    color: retro.gold,
    opacity: 0.5,
  },
  title: {
    ...font.display,
    fontSize: 30,
  },
  subChip: {
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 2,
  },
  subChipTxt: { ...font.mono, fontSize: 11, color: retro.muted },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionDiamond: { fontSize: 10, fontWeight: '900', color: retro.red },
  sectionLabel: {
    ...font.label,
    fontSize: 11,
    color: retro.red,
  },
  sectionRule: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: retro.red,
    borderStyle: 'dashed',
    opacity: 0.25,
    marginTop: 1,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  // timeline row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  rail: {
    width: 16,
    alignItems: 'center',
    paddingTop: 14,
    flexShrink: 0,
  },
  railNode: {
    width: 8,
    height: 8,
    borderRadius: 0,
    backgroundColor: retro.ink,
    borderWidth: 1.5,
    borderColor: retro.paper2,
    zIndex: 1,
  },
  railLine: {
    width: 2,
    flex: 1,
    backgroundColor: retro.paper3,
    marginTop: 2,
    minHeight: 12,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: retro.white,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 4,
    padding: 10,
    shadowColor: retro.line,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  emojiSlot: {
    width: 38,
    height: 38,
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 20 },
  body: { flex: 1, gap: 3 },
  message: { fontSize: 13, color: retro.ink2, lineHeight: 18 },
  time: { ...font.mono, fontSize: 10, color: retro.faded },

  // empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    gap: 14,
  },
  emptySlot: {
    width: 88,
    height: 88,
    backgroundColor: retro.paper2,
    borderWidth: 3,
    borderColor: retro.line,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: retro.line,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { ...font.title, fontSize: 18 },
  emptyText: { fontSize: 13, color: retro.muted, textAlign: 'center', lineHeight: 20 },
})
