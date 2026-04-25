import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient } from '@/components/common/Gradient';
import { Card } from '@/components/common';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';

const SKIN_TONES = ['🏻', '🏼', '🏽', '🏾', '🏿'];
const SKIN_COLORS = ['#FDEBD0', '#F5CBA7', '#D4A574', '#A0522D', '#6B3A2A'];

const HAIR_STYLES = [
  { id: 'short', label: '✂️ Short' },
  { id: 'long', label: '💇 Long' },
  { id: 'curly', label: '🦱 Curly' },
  { id: 'spiky', label: '💥 Spiky' },
  { id: 'ponytail', label: '🎀 Ponytail' },
  { id: 'mohawk', label: '🤘 Mohawk' },
];

const HAIR_COLORS = [
  { id: 'brown', color: '#8B4513', label: 'Brown' },
  { id: 'black', color: '#1a1a1a', label: 'Black' },
  { id: 'blonde', color: '#FFD700', label: 'Blonde' },
  { id: 'red', color: '#B22222', label: 'Red' },
  { id: 'blue', color: '#4169E1', label: 'Blue' },
  { id: 'purple', color: '#8B5CF6', label: 'Purple' },
  { id: 'pink', color: '#EC4899', label: 'Pink' },
  { id: 'green', color: '#22C55E', label: 'Green' },
];

const EYES = [
  { id: 'happy', emoji: '😊' },
  { id: 'cool', emoji: '😎' },
  { id: 'wink', emoji: '😉' },
  { id: 'star', emoji: '🤩' },
  { id: 'determined', emoji: '😤' },
  { id: 'sweet', emoji: '🥰' },
];

const OUTFITS = [
  { id: 'hero', label: 'Hero Cape', emoji: '🦸', cost: 0, unlocked: true },
  { id: 'knight', label: 'Knight Armor', emoji: '⚔️', cost: 50, unlocked: true },
  { id: 'wizard', label: 'Wizard Robe', emoji: '🧙', cost: 75, unlocked: true },
  { id: 'astronaut', label: 'Space Suit', emoji: '🧑‍🚀', cost: 100, unlocked: false },
  { id: 'ninja', label: 'Ninja Outfit', emoji: '🥷', cost: 120, unlocked: false },
  { id: 'pirate', label: 'Pirate', emoji: '🏴‍☠️', cost: 150, unlocked: false },
];

const ACCESSORIES = [
  { id: 'none', label: 'None', emoji: '❌', cost: 0, unlocked: true },
  { id: 'crown', label: 'Crown', emoji: '👑', cost: 30, unlocked: true },
  { id: 'glasses', label: 'Glasses', emoji: '👓', cost: 20, unlocked: true },
  { id: 'hat', label: 'Cap', emoji: '🧢', cost: 25, unlocked: true },
  { id: 'headband', label: 'Headband', emoji: '🎗️', cost: 40, unlocked: false },
  { id: 'mask', label: 'Mask', emoji: '🎭', cost: 60, unlocked: false },
];

type TabKey = 'skin' | 'hair' | 'eyes' | 'outfit' | 'accessory';

export default function AvatarScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('skin');
  const [skinIndex, setSkinIndex] = useState(1);
  const [hairStyle, setHairStyle] = useState('short');
  const [hairColorIndex, setHairColorIndex] = useState(0);
  const [eyeStyle, setEyeStyle] = useState('happy');
  const [outfit, setOutfit] = useState('hero');
  const [accessory, setAccessory] = useState('crown');
  const coins = 75;

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'skin', label: 'Skin', icon: '🎨' },
    { key: 'hair', label: 'Hair', icon: '💇' },
    { key: 'eyes', label: 'Face', icon: '😊' },
    { key: 'outfit', label: 'Outfit', icon: '👕' },
    { key: 'accessory', label: 'Extras', icon: '👑' },
  ];

  const selectedEye = EYES.find(e => e.id === eyeStyle);
  const selectedOutfit = OUTFITS.find(o => o.id === outfit);
  const selectedAccessory = ACCESSORIES.find(a => a.id === accessory);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Gradient colors={['#8B5CF6', '#6366F1']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.headerTitle}>My Avatar ✨</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>🪙 {coins}</Text>
        </View>
      </Gradient>

      {/* Avatar Preview */}
      <View style={styles.previewSection}>
        <View style={[styles.avatarPreview, { backgroundColor: SKIN_COLORS[skinIndex] + '40' }]}>
          {/* Avatar body */}
          <View style={styles.avatarBody}>
            {/* Accessory on top */}
            {selectedAccessory && selectedAccessory.id !== 'none' && (
              <Text style={styles.avatarAccessory}>{selectedAccessory.emoji}</Text>
            )}
            {/* Hair */}
            <View style={[styles.avatarHair, { backgroundColor: HAIR_COLORS[hairColorIndex].color }]}>
              <Text style={styles.avatarHairLabel}>{HAIR_STYLES.find(h => h.id === hairStyle)?.label.split(' ')[0]}</Text>
            </View>
            {/* Face */}
            <View style={[styles.avatarFace, { backgroundColor: SKIN_COLORS[skinIndex] }]}>
              <Text style={styles.avatarFaceEmoji}>{selectedEye?.emoji}</Text>
            </View>
            {/* Outfit */}
            <Text style={styles.avatarOutfitEmoji}>{selectedOutfit?.emoji}</Text>
          </View>
          <Text style={styles.avatarName}>My Hero</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Options */}
      <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'skin' && (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Choose Skin Tone</Text>
            <View style={styles.colorRow}>
              {SKIN_COLORS.map((color, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.colorCircle, { backgroundColor: color }, skinIndex === i && styles.colorCircleActive]}
                  onPress={() => setSkinIndex(i)}
                />
              ))}
            </View>
          </View>
        )}

        {activeTab === 'hair' && (
          <>
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Hair Style</Text>
              <View style={styles.optionGrid}>
                {HAIR_STYLES.map(h => (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.optionChip, hairStyle === h.id && styles.optionChipActive]}
                    onPress={() => setHairStyle(h.id)}
                  >
                    <Text style={styles.optionChipText}>{h.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Hair Color</Text>
              <View style={styles.colorRow}>
                {HAIR_COLORS.map((hc, i) => (
                  <TouchableOpacity
                    key={hc.id}
                    style={[styles.colorCircle, { backgroundColor: hc.color }, hairColorIndex === i && styles.colorCircleActive]}
                    onPress={() => setHairColorIndex(i)}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'eyes' && (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Expression</Text>
            <View style={styles.emojiGrid}>
              {EYES.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.emojiChip, eyeStyle === e.id && styles.emojiChipActive]}
                  onPress={() => setEyeStyle(e.id)}
                >
                  <Text style={styles.emojiLarge}>{e.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'outfit' && (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Outfits</Text>
            <View style={styles.itemGrid}>
              {OUTFITS.map(o => (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.itemCard, outfit === o.id && styles.itemCardActive, !o.unlocked && styles.itemCardLocked]}
                  onPress={() => o.unlocked && setOutfit(o.id)}
                >
                  <Text style={styles.itemEmoji}>{o.emoji}</Text>
                  <Text style={styles.itemLabel}>{o.label}</Text>
                  {!o.unlocked && (
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockText}>🔒 {o.cost} 🪙</Text>
                    </View>
                  )}
                  {o.unlocked && outfit === o.id && (
                    <View style={styles.equippedBadge}>
                      <Text style={styles.equippedText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'accessory' && (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Accessories</Text>
            <View style={styles.itemGrid}>
              {ACCESSORIES.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.itemCard, accessory === a.id && styles.itemCardActive, !a.unlocked && styles.itemCardLocked]}
                  onPress={() => a.unlocked && setAccessory(a.id)}
                >
                  <Text style={styles.itemEmoji}>{a.emoji}</Text>
                  <Text style={styles.itemLabel}>{a.label}</Text>
                  {!a.unlocked && (
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockText}>🔒 {a.cost} 🪙</Text>
                    </View>
                  )}
                  {a.unlocked && accessory === a.id && (
                    <View style={styles.equippedBadge}>
                      <Text style={styles.equippedText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 24, color: colors.white },
  coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  coinText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },

  previewSection: { alignItems: 'center', marginTop: -spacing.md, marginBottom: spacing.md },
  avatarPreview: {
    width: 180, height: 200, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    ...shadows.lg, borderWidth: 3, borderColor: colors.white,
  },
  avatarBody: { alignItems: 'center' },
  avatarAccessory: { fontSize: 28, marginBottom: -10, zIndex: 10 },
  avatarHair: {
    width: 60, height: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    alignItems: 'center', justifyContent: 'center', marginBottom: -5,
  },
  avatarHairLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  avatarFace: {
    width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFaceEmoji: { fontSize: 38 },
  avatarOutfitEmoji: { fontSize: 36, marginTop: -5 },
  avatarName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginTop: spacing.sm },

  tabRow: {
    flexDirection: 'row', paddingHorizontal: spacing.md, gap: 4,
    backgroundColor: colors.white, paddingVertical: spacing.sm, ...shadows.sm,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.lg,
  },
  tabActive: { backgroundColor: '#EEF2FF' },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  tabLabelActive: { color: colors.primary },

  optionsScroll: { flex: 1 },
  optionSection: { padding: spacing.lg },
  optionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: spacing.md },

  colorRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  colorCircle: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: 'transparent',
    ...shadows.sm,
  },
  colorCircleActive: { borderColor: colors.primary, borderWidth: 3 },

  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.xl,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, ...shadows.sm,
  },
  optionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionChipText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.text },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  emojiChip: {
    width: 70, height: 70, borderRadius: 20, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, ...shadows.sm,
  },
  emojiChipActive: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
  emojiLarge: { fontSize: 36 },

  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  itemCard: {
    width: '30%', aspectRatio: 0.85, borderRadius: borderRadius.xl, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border,
    ...shadows.sm, padding: spacing.sm,
  },
  itemCardActive: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
  itemCardLocked: { opacity: 0.5 },
  itemEmoji: { fontSize: 32, marginBottom: 4 },
  itemLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.text, textAlign: 'center' },
  lockBadge: {
    position: 'absolute', bottom: 4, backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  lockText: { fontFamily: fonts.bold, fontSize: 9, color: colors.white },
  equippedBadge: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center',
  },
  equippedText: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
});
