import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gradient } from '@/components/common/Gradient';
import { Card } from '@/components/common';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';

const AVAILABLE_REWARDS = [
  { id: '1', name: 'Indoor Playground Ticket', icon: '🎟️', description: '1 ticket to indoor playground', coinsRequired: 200, category: 'tickets', categoryColor: '#8B5CF6' },
  { id: '2', name: 'Ice Cream', icon: '🍦', description: 'One scoop of your favorite flavor', coinsRequired: 50, category: 'food', categoryColor: '#EC4899' },
  { id: '3', name: 'Playground Visit', icon: '🎡', description: 'Trip to the playground of your choice', coinsRequired: 150, category: 'activity', categoryColor: '#F59E0B' },
  { id: '4', name: '30 min Screen Time', icon: '📱', description: '30 minutes of extra screen time', coinsRequired: 80, category: 'digital', categoryColor: '#3B82F6' },
  { id: '5', name: 'Pizza Night', icon: '🍕', description: 'Choose pizza for dinner!', coinsRequired: 120, category: 'food', categoryColor: '#EC4899' },
  { id: '6', name: 'Trampoline Park', icon: '🤸', description: '1 hour bouncing fun!', coinsRequired: 250, category: 'tickets', categoryColor: '#8B5CF6' },
];

const CLAIMED_REWARDS = [
  { id: 'c1', name: 'Ice Cream', icon: '🍦', claimedAt: '2 days ago', status: 'ready' },
];

export default function ChildRewardsScreen() {
  const [coins] = useState(75);
  const [tab, setTab] = useState<'available' | 'claimed'>('available');

  const handleClaim = (reward: typeof AVAILABLE_REWARDS[0]) => {
    if (coins < reward.coinsRequired) {
      Alert.alert(
        'Not enough coins! 🪙',
        `You need ${reward.coinsRequired - coins} more coins. Keep completing missions!`,
        [{ text: 'OK, I will! 💪' }]
      );
    } else {
      Alert.alert(
        'Claim Reward? 🎉',
        `Spend ${reward.coinsRequired} coins on "${reward.name}"?`,
        [{ text: 'Not yet' }, { text: 'Claim it!' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Gradient colors={['#F59E0B', '#EC4899']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.headerTitle}>My Rewards 🎁</Text>
          <Text style={styles.headerSub}>Earn coins to unlock awesome prizes!</Text>

          {/* Coin balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceEmoji}>🪙</Text>
            <View>
              <Text style={styles.balanceValue}>{coins}</Text>
              <Text style={styles.balanceLabel}>My Coins</Text>
            </View>
          </View>
        </Gradient>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'available' && styles.tabBtnActive]}
            onPress={() => setTab('available')}
          >
            <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>🎯 Available</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'claimed' && styles.tabBtnActive]}
            onPress={() => setTab('claimed')}
          >
            <Text style={[styles.tabText, tab === 'claimed' && styles.tabTextActive]}>✅ Claimed</Text>
          </TouchableOpacity>
        </View>

        {tab === 'available' ? (
          <View style={styles.rewardList}>
            {AVAILABLE_REWARDS.map(reward => {
              const canAfford = coins >= reward.coinsRequired;
              const progress = Math.min(coins / reward.coinsRequired, 1);
              return (
                <TouchableOpacity key={reward.id} onPress={() => handleClaim(reward)} activeOpacity={0.7}>
                  <Card variant="elevated" style={styles.rewardCard}>
                    <View style={styles.rewardRow}>
                      <View style={[styles.rewardIconBox, { backgroundColor: reward.categoryColor + '20' }]}>
                        <Text style={{ fontSize: 32 }}>{reward.icon}</Text>
                      </View>
                      <View style={styles.rewardInfo}>
                        <Text style={styles.rewardName}>{reward.name}</Text>
                        <Text style={styles.rewardDesc}>{reward.description}</Text>

                        {/* Progress bar */}
                        <View style={styles.progressRow}>
                          <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: canAfford ? colors.success : reward.categoryColor }]} />
                          </View>
                          <Text style={[styles.progressText, canAfford && { color: colors.success }]}>
                            {canAfford ? '✓' : `${coins}/${reward.coinsRequired}`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Bottom action */}
                    <View style={[styles.rewardAction, canAfford ? { backgroundColor: '#D1FAE5' } : { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={styles.rewardCost}>🪙 {reward.coinsRequired} coins</Text>
                      {canAfford ? (
                        <View style={styles.claimBtn}>
                          <Text style={styles.claimBtnText}>Claim! 🎉</Text>
                        </View>
                      ) : (
                        <Text style={styles.needMore}>Need {reward.coinsRequired - coins} more</Text>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.rewardList}>
            {CLAIMED_REWARDS.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎁</Text>
                <Text style={styles.emptyText}>No claimed rewards yet</Text>
                <Text style={styles.emptySubtext}>Complete missions to earn coins!</Text>
              </View>
            ) : (
              CLAIMED_REWARDS.map(reward => (
                <Card key={reward.id} variant="elevated" style={styles.rewardCard}>
                  <View style={styles.rewardRow}>
                    <View style={styles.claimedIconBox}>
                      <Text style={{ fontSize: 28 }}>{reward.icon}</Text>
                    </View>
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardName}>{reward.name}</Text>
                      <Text style={styles.rewardDesc}>Claimed {reward.claimedAt}</Text>
                    </View>
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyText}>🎉 Ready!</Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        <View style={{ height: spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.white },
  headerSub: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  balanceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.xl, padding: spacing.md, marginTop: spacing.lg, gap: spacing.md,
  },
  balanceEmoji: { fontSize: 36 },
  balanceValue: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.white },
  balanceLabel: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  tabRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: -spacing.md, gap: spacing.sm,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: borderRadius.xl, backgroundColor: colors.white,
    alignItems: 'center', ...shadows.sm,
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  tabTextActive: { color: colors.white },

  rewardList: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  rewardCard: { marginBottom: spacing.md, padding: 0, overflow: 'hidden' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  rewardIconBox: {
    width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  rewardInfo: { flex: 1 },
  rewardName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  rewardDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  progressBg: { flex: 1, height: 6, backgroundColor: colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary, width: 50, textAlign: 'right' },

  rewardAction: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  rewardCost: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textSecondary },
  needMore: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.textTertiary },
  claimBtn: { backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full },
  claimBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },

  claimedIconBox: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  readyBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  readyText: { fontFamily: fonts.bold, fontSize: 12, color: colors.success },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  emptySubtext: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
});
