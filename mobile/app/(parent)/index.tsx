import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Gradient as LinearGradient } from '@/components/common/Gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, gradients, borderRadius, shadows, fonts } from '@/theme';
import { Card } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';

export default function ParentDashboard() {
  const { user } = useAuthStore();
  const displayName = user?.displayName || 'Parent';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Gradient Header */}
        <LinearGradient colors={['#4F46E5', '#6366F1', '#818CF8']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.displayName}>{displayName}</Text>
            </View>
            <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/(parent)/settings' as any)}>
              <Text style={styles.avatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* Stat pills */}
          <View style={styles.statPills}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>5</Text>
              <Text style={styles.statPillLabel}>Active Missions</Text>
            </View>
            <View style={styles.statPillDivider} />
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>2</Text>
              <Text style={styles.statPillLabel}>Pending</Text>
            </View>
            <View style={styles.statPillDivider} />
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>4</Text>
              <Text style={styles.statPillLabel}>Rewards</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(parent)/missions')}>
              <LinearGradient colors={['#818CF8', '#6366F1']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="add-circle-outline" size={24} color={colors.white} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>New Mission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(parent)/rewards' as any)}>
              <LinearGradient colors={['#EC4899', '#8B5CF6']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="gift-outline" size={24} color={colors.white} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Rewards</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(parent)/approvals')}>
              <LinearGradient colors={['#34D399', '#10B981']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.white} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Approvals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(parent)/children')}>
              <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="people-outline" size={24} color={colors.white} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Children</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Children's Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Children's Progress</Text>
            <TouchableOpacity onPress={() => router.push('/(parent)/children')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {[
            { name: 'Alex', emoji: '🦸', level: 3, xp: '150/250', streak: 5, progress: 0.6, missions: 2 },
            { name: 'Maya', emoji: '🧚', level: 2, xp: '80/150', streak: 3, progress: 0.53, missions: 1 },
          ].map((child, i) => (
            <Card key={i} variant="elevated" style={styles.childCard}>
              <View style={styles.childCardInner}>
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarEmoji}>{child.emoji}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childLevel}>Level {child.level} Hero · {child.missions} missions today</Text>
                  <View style={styles.xpRow}>
                    <View style={styles.xpBarBg}>
                      <View style={[styles.xpBarFill, { width: `${child.progress * 100}%` }]} />
                    </View>
                    <Text style={styles.xpLabel}>{child.xp} XP</Text>
                  </View>
                </View>
                <View style={styles.childBadge}>
                  <Text style={styles.childBadgeText}>🔥{child.streak}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Active Rewards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Rewards 🎁</Text>
            <TouchableOpacity onPress={() => router.push('/(parent)/rewards' as any)}>
              <Text style={styles.seeAll}>Manage →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { emoji: '🎟️', name: 'Indoor Playground Ticket', coins: 200 },
              { emoji: '🍦', name: 'Ice Cream', coins: 50 },
              { emoji: '🎡', name: 'Playground', coins: 150 },
              { emoji: '📱', name: 'Screen Time', coins: 80 },
            ].map((r, i) => (
              <Card key={i} variant="elevated" style={styles.rewardCard}>
                <Text style={styles.rewardEmoji}>{r.emoji}</Text>
                <Text style={styles.rewardName}>{r.name}</Text>
                <Text style={styles.rewardCoins}>🪙 {r.coins}</Text>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card variant="elevated" style={styles.activityCard}>
            {[
              { dot: colors.success, title: 'Alex completed "Make the bed"', time: '2 hours ago · Awaiting approval', badge: null },
              { dot: colors.xp, title: 'Alex reached Level 3!', time: 'Yesterday', badge: '🏆' },
              { dot: colors.secondary, title: 'Maya earned 30 coins', time: 'Yesterday', badge: '🪙' },
            ].map((a, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.activityDivider} />}
                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: a.dot }]} />
                  <View style={styles.activityText}>
                    <Text style={styles.activityTitle}>{a.title}</Text>
                    <Text style={styles.activityTime}>{a.time}</Text>
                  </View>
                  {a.badge ? <Text style={styles.activityBadge}>{a.badge}</Text> : <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
                </View>
              </React.Fragment>
            ))}
          </Card>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl, overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -30, right: -40,
  },
  decorCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, left: -20,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  greeting: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  displayName: { fontFamily: fonts.extraBold, fontSize: 26, color: colors.white, marginTop: 2 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontFamily: fonts.bold, fontSize: 20, color: colors.white },
  statPills: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.xl, padding: spacing.md,
  },
  statPill: { flex: 1, alignItems: 'center' },
  statPillValue: { fontFamily: fonts.extraBold, fontSize: 24, color: colors.white },
  statPillLabel: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 2 },
  statPillDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: spacing.md },
  seeAll: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primary },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs, ...shadows.md,
  },
  quickActionLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.textSecondary, textAlign: 'center' },

  childCard: { marginBottom: spacing.sm },
  childCardInner: { flexDirection: 'row', alignItems: 'center' },
  childAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.secondaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  childAvatarEmoji: { fontSize: 30 },
  childInfo: { flex: 1 },
  childName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  childLevel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  xpRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  xpBarBg: { flex: 1, height: 6, backgroundColor: colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: colors.xp, borderRadius: 3 },
  xpLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textTertiary },
  childBadge: {
    backgroundColor: colors.warningLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, marginLeft: spacing.sm,
  },
  childBadgeText: { fontFamily: fonts.bold, fontSize: 14, color: colors.secondaryDark },

  rewardCard: { alignItems: 'center', marginRight: spacing.sm, width: 100, paddingVertical: spacing.lg },
  rewardEmoji: { fontSize: 28, marginBottom: 4 },
  rewardName: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.text, textAlign: 'center' },
  rewardCoins: { fontFamily: fonts.bold, fontSize: 11, color: colors.secondary, marginTop: 4 },

  activityCard: {},
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  activityText: { flex: 1 },
  activityTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.text },
  activityTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  activityDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  activityBadge: { fontSize: 18, marginLeft: spacing.sm },
});
