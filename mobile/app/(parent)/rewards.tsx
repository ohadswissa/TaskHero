import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gradient } from '@/components/common/Gradient';
import { Card } from '@/components/common';
import { Button } from '@/components/common/Button';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';

const REWARD_CATEGORIES = [
  { id: 'tickets', label: 'Tickets', icon: '🎟️', color: '#8B5CF6' },
  { id: 'food', label: 'Food & Treats', icon: '🍦', color: '#EC4899' },
  { id: 'activity', label: 'Activities', icon: '🎪', color: '#F59E0B' },
  { id: 'digital', label: 'Screen Time', icon: '📱', color: '#3B82F6' },
  { id: 'other', label: 'Other', icon: '🎁', color: '#10B981' },
];

const SUGGESTED_REWARDS = [
  { name: 'Jumburry Ticket', category: 'tickets', icon: '🎟️', description: '1 ticket to Jumburry indoor playground', coinsRequired: 200 },
  { name: 'Playground Visit', category: 'activity', icon: '🎡', description: 'Trip to the playground of choice', coinsRequired: 150 },
  { name: 'Ice Cream', category: 'food', icon: '🍦', description: 'One scoop of ice cream', coinsRequired: 50 },
  { name: 'Movie Night', category: 'activity', icon: '🎬', description: 'Choose a family movie', coinsRequired: 100 },
  { name: '30 min Screen Time', category: 'digital', icon: '📱', description: '30 minutes of extra screen time', coinsRequired: 80 },
  { name: 'Pizza Party', category: 'food', icon: '🍕', description: 'Pizza for dinner', coinsRequired: 120 },
  { name: 'Toy Store Visit', category: 'other', icon: '🧸', description: 'Pick a small toy (up to ₪50)', coinsRequired: 300 },
  { name: 'Trampoline Park', category: 'tickets', icon: '🤸', description: '1 hour at trampoline park', coinsRequired: 250 },
];

interface Reward {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  coinsRequired: number;
  isActive: boolean;
}

export default function ParentRewardsScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [rewardName, setRewardName] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardCategory, setRewardCategory] = useState('tickets');
  const [rewardCoins, setRewardCoins] = useState('100');
  const [rewards, setRewards] = useState<Reward[]>([
    { id: '1', name: 'Jumburry Ticket', category: 'tickets', icon: '🎟️', description: '1 ticket to Jumburry', coinsRequired: 200, isActive: true },
    { id: '2', name: 'Ice Cream', category: 'food', icon: '🍦', description: 'One scoop of ice cream', coinsRequired: 50, isActive: true },
    { id: '3', name: 'Playground Visit', category: 'activity', icon: '🎡', description: 'Trip to the playground', coinsRequired: 150, isActive: true },
    { id: '4', name: '30 min Screen Time', category: 'digital', icon: '📱', description: 'Extra screen time', coinsRequired: 80, isActive: true },
  ]);

  const handleCreate = () => {
    if (!rewardName.trim()) {
      Alert.alert('Missing Name', 'Please enter a reward name');
      return;
    }
    const cat = REWARD_CATEGORIES.find(c => c.id === rewardCategory);
    const newReward: Reward = {
      id: String(rewards.length + 1),
      name: rewardName,
      category: rewardCategory,
      icon: cat?.icon || '🎁',
      description: rewardDesc,
      coinsRequired: parseInt(rewardCoins) || 100,
      isActive: true,
    };
    setRewards([newReward, ...rewards]);
    setShowCreate(false);
    setRewardName('');
    setRewardDesc('');
    setRewardCoins('100');
  };

  const applySuggestion = (s: typeof SUGGESTED_REWARDS[0]) => {
    setRewardName(s.name);
    setRewardDesc(s.description);
    setRewardCategory(s.category);
    setRewardCoins(String(s.coinsRequired));
  };

  if (showCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.createHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.createTitle}>Add Reward</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🎯 Popular Rewards</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SUGGESTED_REWARDS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionCard} onPress={() => applySuggestion(s)}>
                  <Text style={styles.suggestionIcon}>{s.icon}</Text>
                  <Text style={styles.suggestionName}>{s.name}</Text>
                  <Text style={styles.suggestionCost}>🪙 {s.coinsRequired}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Form */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Reward Details</Text>
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput style={styles.textInput} placeholder="e.g., Jumburry Ticket" value={rewardName} onChangeText={setRewardName} placeholderTextColor={colors.textTertiary} />
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput style={[styles.textInput, { height: 60 }]} placeholder="What does the kid get?" value={rewardDesc} onChangeText={setRewardDesc} multiline placeholderTextColor={colors.textTertiary} />
            </Card>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.catGrid}>
              {REWARD_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, rewardCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setRewardCategory(cat.id)}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catLabel, rewardCategory === cat.id && { color: '#fff' }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Coins cost */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🪙 Coins Required</Text>
            <Card variant="elevated" style={styles.coinCard}>
              <Text style={styles.coinCardLabel}>How many coins should the child save?</Text>
              <View style={styles.coinInputRow}>
                {[50, 100, 150, 200, 300].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.coinPreset, rewardCoins === String(v) && styles.coinPresetActive]}
                    onPress={() => setRewardCoins(String(v))}
                  >
                    <Text style={[styles.coinPresetText, rewardCoins === String(v) && { color: '#fff' }]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.coinCustomRow}>
                <Text style={styles.coinCustomLabel}>Custom:</Text>
                <TextInput
                  style={styles.coinCustomInput}
                  value={rewardCoins}
                  onChangeText={setRewardCoins}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={styles.coinCustomLabel}>🪙</Text>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Button title="🎁 Add Reward" onPress={handleCreate} style={{ marginBottom: spacing.xxxl }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Gradient colors={['#8B5CF6', '#EC4899']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Rewards 🎁</Text>
              <Text style={styles.headerSub}>Physical prizes your kids can earn</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add" size={28} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.infoText}>Kids earn coins by completing missions. Set coin costs for real-world rewards!</Text>
          </View>
        </Gradient>

        {/* Reward list */}
        <View style={styles.rewardList}>
          {rewards.map(reward => {
            const cat = REWARD_CATEGORIES.find(c => c.id === reward.category);
            return (
              <Card key={reward.id} variant="elevated" style={styles.rewardCard}>
                <View style={styles.rewardRow}>
                  <View style={[styles.rewardIconBox, { backgroundColor: (cat?.color || '#8B5CF6') + '20' }]}>
                    <Text style={{ fontSize: 28 }}>{reward.icon}</Text>
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    <Text style={styles.rewardDesc}>{reward.description}</Text>
                    <View style={styles.rewardMeta}>
                      <View style={styles.rewardCoinBadge}>
                        <Text style={styles.rewardCoinText}>🪙 {reward.coinsRequired} coins</Text>
                      </View>
                      <View style={[styles.rewardCatBadge, { backgroundColor: (cat?.color || '#8B5CF6') + '20' }]}>
                        <Text style={[styles.rewardCatText, { color: cat?.color || '#8B5CF6' }]}>{cat?.label}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.white },
  headerSub: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  addBtn: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', ...shadows.md,
  },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.md, gap: spacing.sm,
  },
  infoText: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.9)', flex: 1 },

  rewardList: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  rewardCard: { marginBottom: spacing.md },
  rewardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  rewardIconBox: {
    width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  rewardInfo: { flex: 1 },
  rewardName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  rewardDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  rewardMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  rewardCoinBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full },
  rewardCoinText: { fontFamily: fonts.bold, fontSize: 12, color: '#D97706' },
  rewardCatBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full },
  rewardCatText: { fontFamily: fonts.semiBold, fontSize: 12 },

  // Create view
  createHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  createTitle: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.text },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: spacing.md },
  formCard: { padding: spacing.lg },
  inputLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  textInput: {
    fontFamily: fonts.regular, fontSize: 16, color: colors.text,
    backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: borderRadius.xl, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    gap: 6, ...shadows.sm,
  },
  catIcon: { fontSize: 18 },
  catLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },

  coinCard: { padding: spacing.lg },
  coinCardLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
  coinInputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  coinPreset: {
    flex: 1, paddingVertical: 10, borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundSecondary, alignItems: 'center',
  },
  coinPresetActive: { backgroundColor: colors.primary },
  coinPresetText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  coinCustomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  coinCustomLabel: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textSecondary },
  coinCustomInput: {
    fontFamily: fonts.bold, fontSize: 20, color: colors.text, textAlign: 'center',
    width: 80, borderBottomWidth: 2, borderBottomColor: colors.primary, paddingVertical: 4,
  },

  suggestionCard: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: borderRadius.xl, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.sm, width: 110, ...shadows.sm,
  },
  suggestionIcon: { fontSize: 24, marginBottom: 4 },
  suggestionName: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.text, textAlign: 'center' },
  suggestionCost: { fontFamily: fonts.bold, fontSize: 11, color: colors.secondary, marginTop: 4 },
});
