import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Gradient Header */}
        <LinearGradient colors={gradients.primary} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.displayName}>{displayName}</Text>
            </View>
            <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/(parent)/settings')}>
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
              <Text style={styles.statPillLabel}>Pending Approvals</Text>
            </View>
            <View style={styles.statPillDivider} />
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>1</Text>
              <Text style={styles.statPillLabel}>Children</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(parent)/missions')}>
              <LinearGradient colors={['#818CF8', '#6366F1']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="add-circle-outline" size={22} color={colors.white} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>New Mission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(parent)/approvals')}>
              <LinearGradient colors={['#34D399', '#10B981']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.white} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Approvals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(parent)/children')}>
              <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="people-outline" size={22} color={colors.white} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Children</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(parent)/settings')}>
              <LinearGradient colors={['#A78BFA', '#7C3AED']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="settings-outline" size={22} color={colors.white} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Children's Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Children's Progress</Text>
            <TouchableOpacity onPress={() => router.push('/(parent)/children')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <Card variant="elevated" style={styles.childCard}>
            <View style={styles.childCardInner}>
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarEmoji}>🦸</Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>Super Alex</Text>
                <Text style={styles.childLevel}>Level 3 Hero</Text>
                <View style={styles.xpRow}>
                  <View style={styles.xpBarBg}>
                    <View style={[styles.xpBarFill, { width: '60%' }]} />
                  </View>
                  <Text style={styles.xpLabel}>150/250 XP</Text>
                </View>
              </View>
              <View style={styles.childBadge}>
                <Text style={styles.childBadgeText}>🔥5</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card variant="elevated" style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Alex completed "Make the bed"</Text>
                <Text style={styles.activityTime}>2 hours ago · Awaiting approval</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.xp }]} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Alex reached Level 3!</Text>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
              <Text style={styles.activityBadge}>🏆</Text>
            </View>
          </Card>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  displayName: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.white,
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.white,
  },
  statPills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
  },
  statPillValue: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.white,
  },
  statPillLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 2,
  },
  statPillDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.md,
  },
  quickActionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  childCard: {
    marginBottom: spacing.sm,
  },
  childCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  childAvatarEmoji: {
    fontSize: 28,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  childLevel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  xpBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.xp,
    borderRadius: 3,
  },
  xpLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textTertiary,
  },
  childBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  childBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.secondaryDark,
  },
  activityCard: {},
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  activityTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  activityBadge: {
    fontSize: 18,
    marginLeft: spacing.sm,
  },
});


