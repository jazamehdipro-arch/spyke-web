import React from 'react'
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Creature, InventoryItem } from '../types'
import { ITEM_CATALOG, SHOP_ITEMS } from '../utils/items'

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
  coins: number
  onUseItem: (item: InventoryItem) => void
  onBuyItem: (itemId: string, price: number) => void
  mode?: 'inventory' | 'shop'
}

function ItemCard({ item, creature, onUse }: { item: InventoryItem; creature: Creature; onUse: () => void }) {
  const color  = RARITY_COLORS[item.rarity]
  const canUse = item.id === 'medicine' ? creature.stats.isSick : true
  const label  = item.id === 'mystery_box' ? 'Ouvrir' : 'Utiliser'

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
          {item.effect.hunger    ? `🍖 +${item.effect.hunger}  ` : ''}
          {item.effect.happiness ? `⭐ +${item.effect.happiness}  ` : ''}
          {item.effect.energy    ? `⚡ +${item.effect.energy}  ` : ''}
          {item.effect.xp       ? `✨ +${item.effect.xp} XP  ` : ''}
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
          <Text style={styles.useBtnText}>{label}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function ShopItemRow({
  itemId,
  price,
  coins,
  onBuy,
}: {
  itemId: string
  price: number
  coins: number
  onBuy: () => void
}) {
  const def    = ITEM_CATALOG[itemId]
  if (!def) return null
  const color  = RARITY_COLORS[def.rarity]
  const canBuy = coins >= price

  return (
    <View style={styles.shopRow}>
      <Text style={styles.shopEmoji}>{def.emoji}</Text>
      <View style={styles.shopInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{def.name}</Text>
          <Text style={[styles.rarity, { color }]}>{RARITY_LABELS[def.rarity]}</Text>
        </View>
        <Text style={styles.itemDesc} numberOfLines={1}>{def.description}</Text>
      </View>
      <TouchableOpacity
        style={[styles.buyBtn, !canBuy && styles.buyBtnDisabled]}
        onPress={onBuy}
        disabled={!canBuy}
      >
        <Text style={styles.buyBtnText}>💰 {price}</Text>
      </TouchableOpacity>
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

export default function InventoryScreen({ inventory, creature, coins, onUseItem, onBuyItem, mode = 'inventory' }: Props) {
  if (mode === 'shop') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🛍️ Boutique</Text>
            <Text style={styles.subtitle}>Dépense tes pièces</Text>
          </View>
          <View style={styles.coinsDisplay}>
            <Text style={styles.coinsText}>💰 {coins} pièces</Text>
          </View>
        </View>
        <Text style={styles.sheetSub}>Aucun avantage au combat — objets cosmétiques & confort uniquement !</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
          {SHOP_ITEMS.map((s) => (
            <ShopItemRow
              key={s.itemId}
              itemId={s.itemId}
              price={s.price}
              coins={coins}
              onBuy={() => onBuyItem(s.itemId, s.price)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🎒 Inventaire</Text>
          <Text style={styles.subtitle}>
            {inventory.length > 0
              ? `${inventory.reduce((s, i) => s + i.quantity, 0)} objets`
              : 'Rien pour l\'instant'}
          </Text>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 2 },

  shopBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  shopBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  shopCoinsBadge: { color: '#FFD700', fontSize: 12, fontWeight: '700' },

  sickBanner: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sickText: { fontSize: 14, color: '#856404', fontWeight: '600' },
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
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 80, gap: 12,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },

  // Shop
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sheetTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a2e' },
  coinsDisplay: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  coinsText: { color: '#FFD700', fontSize: 13, fontWeight: '800' },
  sheetSub: { fontSize: 12, color: '#999', paddingHorizontal: 20, marginBottom: 12 },
  sheetScroll: { paddingHorizontal: 16 },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shopEmoji: { fontSize: 30, width: 42 },
  shopInfo: { flex: 1, gap: 2 },
  buyBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buyBtnDisabled: { backgroundColor: '#ddd' },
  buyBtnText: { color: '#FFD700', fontSize: 13, fontWeight: '800' },
})
