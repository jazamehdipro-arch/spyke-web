import React from 'react'
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Creature, InventoryItem } from '../types'
import { getMood } from '../utils/creature'

const RARITY_COLORS = {
  common: '#888',
  rare:   '#3B82F6',
  epic:   '#A855F7',
}

const RARITY_LABELS = {
  common: 'Commun',
  rare:   'Rare',
  epic:   'Épique',
}

interface Props {
  inventory: InventoryItem[]
  creature: Creature
  onUseItem: (item: InventoryItem) => void
}

function ItemCard({ item, creature, onUse }: { item: InventoryItem; creature: Creature; onUse: () => void }) {
  const color = RARITY_COLORS[item.rarity]
  const canUse = item.id === 'medicine' ? creature.stats.isSick : true

  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.itemEmoji}>{item.emoji}</Text>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[styles.rarity, { color }]}>{RARITY_LABELS[item.rarity]}</Text>
        </View>
        <Text style={styles.itemDesc}>{item.description}</Text>
        <Text style={styles.itemEffect}>
          {item.effect.hunger ? `🍖 +${item.effect.hunger}  ` : ''}
          {item.effect.happiness ? `⭐ +${item.effect.happiness}  ` : ''}
          {item.effect.energy ? `⚡ +${item.effect.energy}  ` : ''}
          {item.effect.xp ? `✨ +${item.effect.xp} XP  ` : ''}
          {item.effect.healsSickness ? '💊 Guérit' : ''}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.quantity}>x{item.quantity}</Text>
        <TouchableOpacity
          style={[styles.useBtn, !canUse && styles.useBtnDisabled]}
          onPress={onUse}
          disabled={!canUse}
        >
          <Text style={styles.useBtnText}>Utiliser</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function EmptyInventory() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🎒</Text>
      <Text style={styles.emptyTitle}>Inventaire vide</Text>
      <Text style={styles.emptyText}>
        Vis des aventures et croise des joueurs pour trouver des objets !
      </Text>
    </View>
  )
}

export default function InventoryScreen({ inventory, creature, onUseItem }: Props) {
  const mood = getMood(creature.stats)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventaire</Text>
        <Text style={styles.subtitle}>
          {inventory.length > 0
            ? `${inventory.reduce((s, i) => s + i.quantity, 0)} objets`
            : 'Rien pour l\'instant'}
        </Text>
      </View>

      {creature.stats.isSick && (
        <View style={styles.sickBanner}>
          <Text style={styles.sickText}>
            🤒 {creature.name} est malade ! Utilise un médicament.
          </Text>
        </View>
      )}

      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard item={item} creature={creature} onUse={() => onUseItem(item)} />
        )}
        ListEmptyComponent={EmptyInventory}
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
  sickBanner: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sickText: { fontSize: 14, color: '#856404', fontWeight: '600' },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 10,
    flexGrow: 1,
  },
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
  itemEmoji: { fontSize: 34, width: 44 },
  itemInfo: { flex: 1, gap: 2 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  rarity: { fontSize: 11, fontWeight: '700' },
  itemDesc: { fontSize: 12, color: '#999' },
  itemEffect: { fontSize: 12, color: '#555', marginTop: 2 },
  itemRight: { alignItems: 'center', gap: 6 },
  quantity: { fontSize: 13, fontWeight: '700', color: '#666' },
  useBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  useBtnDisabled: { backgroundColor: '#ddd' },
  useBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
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
