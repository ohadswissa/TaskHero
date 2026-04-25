import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient } from '@/components/common/Gradient';
import { Card } from '@/components/common';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ROOM_WIDTH = SCREEN_WIDTH - 32;
const ROOM_HEIGHT = 280;

// Furniture items with positions in the room
interface FurnitureItem {
  id: string;
  label: string;
  emoji: string;
  cost: number;
  unlocked: boolean;
  category: 'floor' | 'wall' | 'table' | 'special';
  size: 'sm' | 'md' | 'lg';
  // Position in room (percentage-based)
  defaultX: number;
  defaultY: number;
}

const ALL_FURNITURE: FurnitureItem[] = [
  // Floor items
  { id: 'bed', label: 'Cozy Bed', emoji: '🛏️', cost: 0, unlocked: true, category: 'floor', size: 'lg', defaultX: 10, defaultY: 55 },
  { id: 'desk', label: 'Study Desk', emoji: '📝', cost: 0, unlocked: true, category: 'table', size: 'md', defaultX: 60, defaultY: 50 },
  { id: 'plant', label: 'House Plant', emoji: '🪴', cost: 10, unlocked: true, category: 'floor', size: 'sm', defaultX: 85, defaultY: 65 },
  { id: 'rug', label: 'Cozy Rug', emoji: '🟤', cost: 20, unlocked: true, category: 'floor', size: 'lg', defaultX: 40, defaultY: 75 },
  { id: 'shelf', label: 'Bookshelf', emoji: '📚', cost: 25, unlocked: true, category: 'wall', size: 'md', defaultX: 35, defaultY: 15 },
  { id: 'lamp', label: 'Cool Lamp', emoji: '💡', cost: 15, unlocked: true, category: 'table', size: 'sm', defaultX: 78, defaultY: 42 },
  { id: 'chair', label: 'Gaming Chair', emoji: '🪑', cost: 30, unlocked: true, category: 'floor', size: 'sm', defaultX: 65, defaultY: 62 },
  { id: 'trophy', label: 'Trophy Case', emoji: '🏆', cost: 50, unlocked: false, category: 'wall', size: 'md', defaultX: 15, defaultY: 12 },
  { id: 'aquarium', label: 'Aquarium', emoji: '🐠', cost: 60, unlocked: false, category: 'table', size: 'md', defaultX: 50, defaultY: 20 },
  { id: 'console', label: 'Game Console', emoji: '🎮', cost: 80, unlocked: false, category: 'floor', size: 'md', defaultX: 42, defaultY: 58 },
  { id: 'telescope', label: 'Telescope', emoji: '🔭', cost: 100, unlocked: false, category: 'floor', size: 'md', defaultX: 80, defaultY: 30 },
  { id: 'pet', label: 'Pet Cat', emoji: '🐱', cost: 120, unlocked: false, category: 'floor', size: 'sm', defaultX: 25, defaultY: 72 },
  { id: 'robot', label: 'Robot Buddy', emoji: '🤖', cost: 150, unlocked: false, category: 'floor', size: 'sm', defaultX: 55, defaultY: 70 },
  { id: 'rocket', label: 'Rocket Model', emoji: '🚀', cost: 40, unlocked: false, category: 'wall', size: 'sm', defaultX: 70, defaultY: 10 },
];

const WALL_THEMES = [
  { id: 'default', label: 'White', wallColor: '#F0F0F5', floorColor: '#D4C4A8', accentColor: '#E0E0E8', cost: 0 },
  { id: 'ocean', label: 'Ocean', wallColor: '#B3D9FF', floorColor: '#C4B896', accentColor: '#8EC5FF', cost: 30 },
  { id: 'forest', label: 'Forest', wallColor: '#B8E6C8', floorColor: '#C4B896', accentColor: '#90D4A8', cost: 30 },
  { id: 'space', label: 'Space', wallColor: '#2D1B69', floorColor: '#1A1A2E', accentColor: '#4A2D8C', cost: 50 },
  { id: 'sunset', label: 'Sunset', wallColor: '#FFB88C', floorColor: '#D4A878', accentColor: '#FF9A76', cost: 50 },
  { id: 'candy', label: 'Candy', wallColor: '#FFB6C1', floorColor: '#F0D4DA', accentColor: '#FF91A4', cost: 60 },
  { id: 'royal', label: 'Royal', wallColor: '#DAA520', floorColor: '#8B7355', accentColor: '#FFD700', cost: 80 },
];

const DECORATIONS = [
  { id: 'stars', label: 'Stars', emoji: '⭐', cost: 0, position: 'ceiling' },
  { id: 'banner', label: 'Hero Banner', emoji: '🎪', cost: 15, position: 'wall' },
  { id: 'fairy', label: 'Fairy Lights', emoji: '✨', cost: 20, position: 'ceiling' },
  { id: 'poster', label: 'Hero Poster', emoji: '🖼️', cost: 25, position: 'wall' },
  { id: 'globe', label: 'Globe', emoji: '🌍', cost: 35, position: 'wall' },
  { id: 'flag', label: 'Hero Flag', emoji: '🚩', cost: 15, position: 'wall' },
];

type ShopTab = 'furniture' | 'walls' | 'decor';

export default function RoomScreen() {
  const [shopTab, setShopTab] = useState<ShopTab>('furniture');
  const [ownedItems, setOwnedItems] = useState<string[]>(['bed', 'desk', 'plant', 'rug', 'shelf', 'lamp', 'chair', 'stars']);
  const [placedItems, setPlacedItems] = useState<string[]>(['bed', 'desk', 'plant', 'shelf']);
  const [currentWall, setCurrentWall] = useState('default');
  const [placedDecor, setPlacedDecor] = useState<string[]>(['stars']);
  const [coins, setCoins] = useState(75);
  const [level] = useState(3);
  const [showShop, setShowShop] = useState(true);

  const bounceAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const theme = WALL_THEMES.find(w => w.id === currentWall) || WALL_THEMES[0];
  const isDarkTheme = currentWall === 'space';

  const buyItem = (id: string, cost: number) => {
    if (coins >= cost && !ownedItems.includes(id)) {
      setCoins(c => c - cost);
      setOwnedItems(prev => [...prev, id]);
      // Bounce animation
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 150, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 0, friction: 3, useNativeDriver: true }),
      ]).start();
    }
  };

  const togglePlaced = (id: string) => {
    if (ownedItems.includes(id)) {
      setPlacedItems(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const toggleDecor = (id: string) => {
    if (ownedItems.includes(id)) {
      setPlacedDecor(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Gradient colors={['#EC4899', '#8B5CF6', '#6366F1']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>My Room 🏠</Text>
            <Text style={styles.headerSub}>Level {level} · {placedItems.length} items placed</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.coinPill}>
              <Text style={styles.coinPillText}>🪙 {coins}</Text>
            </View>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>LVL {level}</Text>
            </View>
          </View>
        </View>
      </Gradient>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* THE ROOM - Isometric-ish 3D view */}
        <View style={styles.roomContainer}>
          <Animated.View style={[styles.roomWrapper, { transform: [{ translateY: bounceAnim }] }]}>
            {/* Back wall */}
            <View style={[styles.backWall, { backgroundColor: theme.wallColor }]}>
              {/* Wall pattern/texture */}
              <View style={[styles.wallMolding, { backgroundColor: theme.accentColor }]} />

              {/* Window */}
              <View style={styles.window}>
                <Gradient colors={['#87CEEB', '#B0E2FF']} style={styles.windowInner} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
                  <View style={styles.windowCross} />
                  <View style={[styles.windowCross, styles.windowCrossH]} />
                </Gradient>
                <View style={styles.windowSill} />
              </View>

              {/* Ceiling decorations */}
              <View style={styles.ceilingDecor}>
                {placedDecor.includes('stars') && (
                  <Animated.Text style={[styles.ceilingItem, { opacity: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]}>⭐</Animated.Text>
                )}
                {placedDecor.includes('fairy') && (
                  <Animated.Text style={[styles.ceilingItem, { opacity: sparkleAnim }]}>✨✨✨</Animated.Text>
                )}
              </View>

              {/* Wall items */}
              {placedItems.filter(id => ALL_FURNITURE.find(f => f.id === id)?.category === 'wall').map(id => {
                const item = ALL_FURNITURE.find(f => f.id === id);
                if (!item) return null;
                return (
                  <View key={id} style={[styles.wallItem, { left: `${item.defaultX}%`, top: `${item.defaultY}%` }]}>
                    <View style={styles.wallItemFrame}>
                      <Text style={styles.wallItemEmoji}>{item.emoji}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Wall decorations */}
              {placedDecor.includes('banner') && (
                <View style={[styles.wallItem, { left: '55%', top: '5%' }]}>
                  <Text style={{ fontSize: 28 }}>🎪</Text>
                </View>
              )}
              {placedDecor.includes('poster') && (
                <View style={[styles.wallItem, { right: '10%', top: '15%' }]}>
                  <View style={styles.posterFrame}>
                    <Text style={{ fontSize: 20 }}>🖼️</Text>
                  </View>
                </View>
              )}
              {placedDecor.includes('flag') && (
                <View style={[styles.wallItem, { left: '5%', top: '5%' }]}>
                  <Text style={{ fontSize: 22 }}>🚩</Text>
                </View>
              )}
            </View>

            {/* Floor */}
            <View style={[styles.floor, { backgroundColor: theme.floorColor }]}>
              {/* Floor grid pattern */}
              <View style={styles.floorGrid}>
                {[0, 1, 2, 3, 4].map(i => (
                  <View key={i} style={[styles.floorLine, { left: `${20 * i}%` }]} />
                ))}
                {[0, 1, 2].map(i => (
                  <View key={`h${i}`} style={[styles.floorLineH, { top: `${33 * i}%` }]} />
                ))}
              </View>

              {/* Rug if placed */}
              {placedItems.includes('rug') && (
                <View style={styles.rug}>
                  <Gradient colors={['#C4A882', '#B8956A']} style={styles.rugInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.rugPattern} />
                  </Gradient>
                </View>
              )}

              {/* Floor furniture */}
              {placedItems.filter(id => {
                const item = ALL_FURNITURE.find(f => f.id === id);
                return item && (item.category === 'floor' || item.category === 'table') && id !== 'rug';
              }).map(id => {
                const item = ALL_FURNITURE.find(f => f.id === id);
                if (!item) return null;
                const sizeMap = { sm: 36, md: 44, lg: 52 };
                const fontSize = sizeMap[item.size];
                return (
                  <View key={id} style={[styles.floorItem, {
                    left: `${item.defaultX - 5}%`,
                    top: `${item.defaultY - 40}%`,
                  }]}>
                    {/* Shadow */}
                    <View style={[styles.itemShadow, { width: fontSize * 0.8, height: fontSize * 0.3 }]} />
                    <Text style={[styles.floorItemEmoji, { fontSize }]}>{item.emoji}</Text>
                    {/* Subtle label */}
                  </View>
                );
              })}

              {/* Pet animation */}
              {placedItems.includes('pet') && (
                <Animated.View style={[styles.floorItem, {
                  left: '20%', top: '30%',
                  transform: [{ translateX: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) }],
                }]}>
                  <Text style={{ fontSize: 36 }}>🐱</Text>
                </Animated.View>
              )}
            </View>

            {/* Left wall edge (3D effect) */}
            <View style={[styles.leftEdge, { backgroundColor: theme.accentColor }]} />
            {/* Right wall edge */}
            <View style={[styles.rightEdge, { backgroundColor: theme.accentColor }]} />

            {/* Room level badge */}
            <View style={styles.roomBadge}>
              <Gradient colors={['#8B5CF6', '#6366F1']} style={styles.roomBadgeInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.roomBadgeText}>🏠 LVL {level}</Text>
              </Gradient>
            </View>
          </Animated.View>
        </View>

        {/* Room stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{placedItems.length}</Text>
            <Text style={styles.statLabel}>Placed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ownedItems.length}</Text>
            <Text style={styles.statLabel}>Owned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ALL_FURNITURE.length - ownedItems.length}</Text>
            <Text style={styles.statLabel}>Locked</Text>
          </View>
        </View>

        {/* Shop Tabs */}
        <View style={styles.shopTabs}>
          {([
            { key: 'furniture' as ShopTab, label: 'Furniture', icon: '🪑' },
            { key: 'walls' as ShopTab, label: 'Themes', icon: '🎨' },
            { key: 'decor' as ShopTab, label: 'Decor', icon: '✨' },
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.shopTab, shopTab === tab.key && styles.shopTabActive]}
              onPress={() => setShopTab(tab.key)}
            >
              <Text style={styles.shopTabIcon}>{tab.icon}</Text>
              <Text style={[styles.shopTabLabel, shopTab === tab.key && styles.shopTabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shop Content */}
        <View style={styles.shopContent}>
          {shopTab === 'furniture' && (
            <>
              {['floor', 'wall', 'table', 'special'].map(cat => {
                const items = ALL_FURNITURE.filter(f => f.category === cat);
                if (items.length === 0) return null;
                return (
                  <View key={cat} style={styles.shopCategory}>
                    <Text style={styles.shopCatTitle}>
                      {cat === 'floor' ? '🏠 Floor Items' : cat === 'wall' ? '🖼️ Wall Items' : cat === 'table' ? '🪑 Desk & Table' : '⭐ Special'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {items.map(item => {
                        const owned = ownedItems.includes(item.id);
                        const placed = placedItems.includes(item.id);
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.shopItem, placed && styles.shopItemPlaced, !item.unlocked && !owned && styles.shopItemLocked]}
                            onPress={() => {
                              if (owned) {
                                togglePlaced(item.id);
                              } else if (item.unlocked || coins >= item.cost) {
                                buyItem(item.id, item.cost);
                              }
                            }}
                          >
                            <Text style={styles.shopItemEmoji}>{item.emoji}</Text>
                            <Text style={styles.shopItemLabel}>{item.label}</Text>
                            {owned ? (
                              <View style={[styles.shopItemAction, placed ? styles.placedAction : styles.ownedAction]}>
                                <Text style={styles.shopItemActionText}>{placed ? '✓ Placed' : 'Place'}</Text>
                              </View>
                            ) : item.unlocked ? (
                              <View style={styles.buyAction}>
                                <Text style={styles.buyActionText}>🪙 {item.cost}</Text>
                              </View>
                            ) : (
                              <View style={styles.lockAction}>
                                <Text style={styles.lockActionText}>🔒 {item.cost}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              })}
            </>
          )}

          {shopTab === 'walls' && (
            <View style={styles.wallGrid}>
              {WALL_THEMES.map(wall => (
                <TouchableOpacity
                  key={wall.id}
                  style={[styles.wallOption, currentWall === wall.id && styles.wallOptionActive]}
                  onPress={() => {
                    if (wall.cost === 0 || ownedItems.includes(`wall_${wall.id}`)) {
                      setCurrentWall(wall.id);
                    } else if (coins >= wall.cost) {
                      setCoins(c => c - wall.cost);
                      setOwnedItems(prev => [...prev, `wall_${wall.id}`]);
                      setCurrentWall(wall.id);
                    }
                  }}
                >
                  <View style={styles.wallPreview}>
                    <View style={[styles.wallPreviewWall, { backgroundColor: wall.wallColor }]} />
                    <View style={[styles.wallPreviewFloor, { backgroundColor: wall.floorColor }]} />
                  </View>
                  <Text style={styles.wallOptionLabel}>{wall.label}</Text>
                  {wall.cost > 0 && !ownedItems.includes(`wall_${wall.id}`) && currentWall !== wall.id && (
                    <Text style={styles.wallCost}>🪙 {wall.cost}</Text>
                  )}
                  {currentWall === wall.id && (
                    <View style={styles.activeWallBadge}>
                      <Text style={styles.activeWallText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {shopTab === 'decor' && (
            <View style={styles.decorGrid}>
              {DECORATIONS.map(dec => {
                const owned = ownedItems.includes(dec.id);
                const placed = placedDecor.includes(dec.id);
                return (
                  <TouchableOpacity
                    key={dec.id}
                    style={[styles.decorItem, placed && styles.decorItemPlaced]}
                    onPress={() => {
                      if (owned) {
                        toggleDecor(dec.id);
                      } else if (coins >= dec.cost) {
                        buyItem(dec.id, dec.cost);
                      }
                    }}
                  >
                    <Text style={styles.decorEmoji}>{dec.emoji}</Text>
                    <Text style={styles.decorLabel}>{dec.label}</Text>
                    <Text style={styles.decorPos}>{dec.position}</Text>
                    {owned ? (
                      <View style={[styles.shopItemAction, placed ? styles.placedAction : styles.ownedAction]}>
                        <Text style={styles.shopItemActionText}>{placed ? '✓ Active' : 'Place'}</Text>
                      </View>
                    ) : (
                      <View style={styles.buyAction}>
                        <Text style={styles.buyActionText}>🪙 {dec.cost}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },

  // Header
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.white },
  headerSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  coinPill: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: borderRadius.full,
  },
  coinPillText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  levelPill: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.full,
  },
  levelPillText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },

  // Room
  roomContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  roomWrapper: {
    width: ROOM_WIDTH, height: ROOM_HEIGHT, position: 'relative',
    borderRadius: 8, overflow: 'hidden',
    ...shadows.lg,
  },

  // Back wall
  backWall: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
  },
  wallMolding: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
  },
  window: {
    position: 'absolute', top: '15%', right: '15%', width: 60, height: 50,
    borderRadius: 4, overflow: 'hidden', borderWidth: 3, borderColor: '#8B7355',
  },
  windowInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  windowCross: { position: 'absolute', width: 2, height: '100%', backgroundColor: '#8B7355' },
  windowCrossH: { width: '100%', height: 2 },
  windowSill: {
    position: 'absolute', bottom: -4, left: -4, right: -4, height: 6,
    backgroundColor: '#8B7355', borderRadius: 2,
  },

  ceilingDecor: {
    position: 'absolute', top: 4, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  ceilingItem: { fontSize: 16 },

  wallItem: { position: 'absolute' },
  wallItemFrame: {
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  wallItemEmoji: { fontSize: 22 },
  posterFrame: {
    backgroundColor: '#FFF', borderRadius: 4, padding: 4,
    borderWidth: 2, borderColor: '#8B7355',
  },

  // Floor
  floor: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  },
  floorGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 },
  floorLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#000' },
  floorLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#000' },

  rug: {
    position: 'absolute', left: '20%', top: '30%', width: '55%', height: '45%',
    borderRadius: 8, overflow: 'hidden',
  },
  rugInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  rugPattern: {
    width: '80%', height: '70%', borderRadius: 4,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },

  floorItem: { position: 'absolute', alignItems: 'center' },
  itemShadow: {
    position: 'absolute', bottom: -4, backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 100, alignSelf: 'center',
  },
  floorItemEmoji: { textAlign: 'center' },

  // 3D edges
  leftEdge: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
  },
  rightEdge: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 3,
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
  },

  roomBadge: { position: 'absolute', top: 8, left: 8 },
  roomBadgeInner: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roomBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },

  // Stats bar
  statsBar: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: '#2A2A4A', borderRadius: borderRadius.xl, padding: spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.white },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },

  // Shop
  shopTabs: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.lg,
    backgroundColor: '#2A2A4A', borderRadius: borderRadius.xl, padding: 4,
  },
  shopTab: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.lg,
  },
  shopTabActive: { backgroundColor: '#8B5CF6' },
  shopTabIcon: { fontSize: 18 },
  shopTabLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  shopTabLabelActive: { color: colors.white },

  shopContent: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  shopCategory: { marginBottom: spacing.lg },
  shopCatTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.white, marginBottom: spacing.md },

  shopItem: {
    width: 100, backgroundColor: '#2A2A4A', borderRadius: borderRadius.xl,
    alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    marginRight: spacing.sm, borderWidth: 2, borderColor: '#3A3A5A',
  },
  shopItemPlaced: { borderColor: '#8B5CF6', backgroundColor: '#2D1B69' },
  shopItemLocked: { opacity: 0.5 },
  shopItemEmoji: { fontSize: 32, marginBottom: 4 },
  shopItemLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.white, textAlign: 'center', marginBottom: 6 },
  shopItemAction: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  placedAction: { backgroundColor: '#8B5CF6' },
  ownedAction: { backgroundColor: '#3A3A5A' },
  shopItemActionText: { fontFamily: fonts.bold, fontSize: 10, color: colors.white },
  buyAction: { backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  buyActionText: { fontFamily: fonts.bold, fontSize: 10, color: '#000' },
  lockAction: { backgroundColor: '#3A3A5A', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  lockActionText: { fontFamily: fonts.bold, fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  // Wall themes
  wallGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  wallOption: {
    width: '31%', backgroundColor: '#2A2A4A', borderRadius: borderRadius.xl,
    alignItems: 'center', padding: spacing.sm, borderWidth: 2, borderColor: '#3A3A5A',
  },
  wallOptionActive: { borderColor: '#8B5CF6' },
  wallPreview: { width: 60, height: 50, borderRadius: 8, overflow: 'hidden', marginBottom: 4 },
  wallPreviewWall: { height: '55%' },
  wallPreviewFloor: { height: '45%' },
  wallOptionLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.white },
  wallCost: { fontFamily: fonts.bold, fontSize: 10, color: '#F59E0B', marginTop: 2 },
  activeWallBadge: {
    position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center',
  },
  activeWallText: { fontFamily: fonts.bold, fontSize: 10, color: colors.white },

  // Decorations
  decorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  decorItem: {
    width: '31%', backgroundColor: '#2A2A4A', borderRadius: borderRadius.xl,
    alignItems: 'center', padding: spacing.md, borderWidth: 2, borderColor: '#3A3A5A',
  },
  decorItemPlaced: { borderColor: '#8B5CF6', backgroundColor: '#2D1B69' },
  decorEmoji: { fontSize: 28, marginBottom: 4 },
  decorLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.white },
  decorPos: { fontFamily: fonts.regular, fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
});
