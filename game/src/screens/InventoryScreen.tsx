import React from 'react'
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Creature, InventoryItem, ItemRarity } from '../types'
import { ITEM_CATALOG, SHOP_ITEMS } from '../utils/items'
import { font, retro } from '../styles/retro'
import { Chip, Panel, PixelButton, ScreenTitle, SectionTitle } from '../components/ui'

const RARITY_STYLE: Record<ItemRarity, { chip: string; chipText: string; border: string }> = {
  common: { chip: retro.paper2, chipText: retro.muted, border: retro.line },
  rare:   { chip: retro.blue,   chipText: retro.white, border: retro.blue },
  epic:   { chip: retro.purple, chipText: retro.white, border: retro.purple },
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
  const rarity = RARITY_STYLE[item.rarity]
  const canUse = item.id === 'medicine' ? creature.stats.isSick : true
  const label  = item.id === 'mystery_box' ? 'Ouvrir' : 'Utiliser'

  return (
    <Panel
      shadow="sm"
      style={[styles.card, item.rarity !== 'common' ? { borderColor: rarity.border } : undefined]}
    >
      <View style={styles.emojiSlot}>
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Chip
            text={RARITY_LABELS[item.rarity]}
            color={rarity.chip}
            textColor={rarity.chipText}
          />
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
        <View style={styles.qtyBadge}>
          <Text style={styles.quantity}>×{item.quantity}</Text>
        </View>
        <PixelButton
          small
          title={label}
          color={retro.mint}
          textColor={retro.ink}
          onPress={onUse}
          disabled={!canUse}
        />
      </View>
    </Panel>
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
  const rarity = RARITY_STYLE[def.rarity]
  const canBuy = coins >= price

  return (
    <Panel
      shadow="sm"
      style={[styles.card, def.rarity !== 'common' ? { borderColor: rarity.border } : undefined]}
    >
      <View style={styles.emojiSlot}>
        <Text style={styles.itemEmoji}>{def.emoji}</Text>
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{def.name}</Text>
          <Chip
            text={RARITY_LABELS[def.rarity]}
            color={rarity.chip}
            textColor={rarity.chipText}
          />
        </View>
        <Text style={styles.itemDesc} numberOfLines={1}>{def.description}</Text>
      </View>
      <PixelButton
        small
        title={`💰 ${price}`}
        color={retro.gold}
        textColor={retro.ink}
        onPress={onBuy}
        disabled={!canBuy}
      />
    </Panel>
  )
}

function EmptyInventory() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptySlot}>
        <Text style={styles.emptyEmoji}>🎒</Text>
      </View>
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
          <ScreenTitle title="🛍️ Boutique" subtitle="Dépense tes pièces" style={{ flex: 1 }} />
          <Chip text={`💰 ${coins} pièces`} color={retro.gold} textColor={retro.ink} style={styles.coinsChip} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          <Panel shadow="sm" label="BOUTIQUE" labelColor={retro.gold} tint={retro.paper2} style={styles.noticePanel}>
            <Text style={styles.noticeText}>Aucun avantage au combat — objets cosmétiques & confort uniquement !</Text>
          </Panel>
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
        <ScreenTitle
          title="🎒 Inventaire"
          subtitle={
            inventory.length > 0
              ? `${inventory.reduce((s, i) => s + i.quantity, 0)} objets`
              : 'Rien pour l\'instant'
          }
          style={{ flex: 1 }}
        />
        <Chip text={`💰 ${coins}`} color={retro.gold} textColor={retro.ink} style={styles.coinsChip} />
      </View>

      {creature.stats.isSick && (
        <Panel shadow="sm" tint={retro.gold} style={styles.sickBanner}>
          <Text style={styles.sickText}>
            🤒 {creature.name} est malade ! Utilise un médicament.
          </Text>
        </Panel>
      )}

      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard item={item} creature={creature} onUse={() => onUseItem(item)} />
        )}
        ListHeaderComponent={
          inventory.length > 0 ? <SectionTitle title="SAC" style={styles.sectionGap} /> : null
        }
        ListEmptyComponent={EmptyInventory}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: retro.paper },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  coinsChip: { marginTop: 8 },

  sickBanner: {
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 10,
  },
  sickText: { ...font.mono, fontSize: 13, fontWeight: '900', color: retro.ink },

  sectionGap: { marginBottom: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 12, flexGrow: 1 },

  noticePanel: { padding: 10, marginTop: 6 },
  noticeText: { ...font.mono, fontSize: 11, color: retro.ink2 },

  card: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiSlot: {
    width: 52,
    height: 52,
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 28 },
  itemInfo: { flex: 1, gap: 3 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { ...font.title, fontSize: 14, flexShrink: 1 },
  itemDesc: { fontSize: 12, color: retro.muted },
  itemEffect: { ...font.mono, fontSize: 11, color: retro.ink2, marginTop: 1 },
  itemRight: { alignItems: 'center', gap: 8 },
  qtyBadge: {
    backgroundColor: retro.paper2,
    borderWidth: 1.5,
    borderColor: retro.line,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  quantity: { ...font.mono, fontSize: 12, fontWeight: '900', color: retro.ink },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 80, gap: 12,
  },
  emptySlot: {
    width: 96,
    height: 96,
    backgroundColor: retro.paper2,
    borderWidth: 2,
    borderColor: retro.line,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...font.title, fontSize: 20 },
  emptyText: { fontSize: 14, color: retro.muted, textAlign: 'center', lineHeight: 22 },
})
