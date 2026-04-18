import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Gradient as LinearGradient } from '@/components/common/Gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, gradients, borderRadius, shadows, fonts } from '@/theme';
import { Card } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';

export default function ChildDashboard() {
  const { logout, user } = useAuthStore();
  const heroName = user?.displayName || 'Hero';

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <LinearGradient colors={gradients.childHero} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <View style={styles.heroTop}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarEmoji}>🦸</Text>
              </View>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroLabel}>HERO</Text>
              <Text style={styles.heroName}>{heroName}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNum}>3</Text>
              <Text style={styles.levelText}>LVL</Text>
            </View>
          </View>

          {/* XP Bar */}
          <View style={styles.xpSection}>
            <View style={styles.xpBarBg}>
              <LinearGradient
                colors={['#FBBF24', '#FFF']}
                style={[styles.xpBarFill, { width: '60%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.xpText}>150 / 250 XP to Level 4</Text>
          </View>

          {/* Coins & Streak */}
          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipEmoji}>🪙</Text>
              <Text style={styles.chipValue}>75</Text>
              <Text style={styles.chipLabel}>Coins</Text>
            </View>
            <View style={styles.chipDivider} />
            <View style={styles.chip}>
              <Text style={styles.chipEmoji}>🔥</Text>
              <Text style={styles.chipValue}>5</Text>
              <Text style={styles.chipLabel}>Day Streak</Text>
            </View>
            <View style={styles.chipDivider} />
            <View style={styles.chip}>
              <Text style={styles.chipEmoji}>🏆</Text>
              <Text style={styles.chipValue}>3</Text>
              <Text style={styles.chipLabel}>Badges</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Today's Missions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Missions 🎯</Text>
            <TouchableOpacity onPress={() => router.push('/(child)/missions')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(child)/missions')}>
            <Card variant="elevated" style={styles.missionCard}>
              <View style={styles.missionRow}>
                <View style={[styles.missionIconBox, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={styles.missionIcon}>🛏️</Text>
                </View>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>Make the bed</Text>
                  <Text style={styles.missionMeta}>+20 XP · +10 🪙</Text>
                </View>
                <View style={styles.missionBadge}>
                  <Text style={styles.missionBadgeText}>Easy</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(child)/missions')}>
            <Card variant="elevated" style={styles.missionCard}>
              <View style={styles.missionRow}>
                <View style={[styles.missionIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.missionIcon}>📚</Text>
                </View>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>Read for 20 minutes</Text>
                  <Text style={styles.missionMeta}>+30 XP · +15 🪙</Text>
                </View>
                <View style={[styles.missionBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.missionBadgeText, { color: colors.secondaryDark }]}>Medium</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreMissions} onPress={() => router.push('/(child)/missions')}>
            <Text style={styles.moreMissionsText}>+1 more mission →</Text>
          </TouchableOpacity>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Badges 🏅</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
            {[
              { emoji: '🌟', name: 'First Mission', desc: 'Completed 1st task' },
              { emoji: '🔥', name: 'On Fire', desc: '5-day streak' },
              { emoji: '📚', name: 'Scholar', desc: 'Read 3 books' },
            ].map((b, i) => (
              <Card key={i} variant="elevated" style={styles.badgeCard}>
                <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                <Text style={styles.badgeName}>{b.name}</Text>
                <Text style={styles.badgeDesc}>{b.desc}</Text>
              </Card>
            ))}
          </ScrollView>
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
  heroCard: {
    margin: spacing.lg,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  signOutBtn: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  heroInfo: {
    flex: 1,
  },
  heroLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  heroName: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.white,
    marginTop: 2,
  },
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  levelNum: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.white,
    lineHeight: 22,
  },
  levelText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  xpSection: {
    marginBottom: spacing.md,
  },
  xpBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  xpText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
  },
  chips: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
  },
  chipEmoji: {
    fontSize: 20,
  },
  chipValue: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.white,
    marginTop: 2,
  },
  chipLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
  chipDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
    color: colors.secondary,
  },
  missionCard: {
    marginBottom: spacing.sm,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  missionIcon: {
    fontSize: 22,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  missionMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  missionBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  missionBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  moreMissions: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  moreMissionsText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.secondary,
  },
  badgeScroll: {
    marginHorizontal: -spacing.xs,
  },
  badgeCard: {
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    width: 110,
    paddingVertical: spacing.lg,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  badgeName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
  },
  badgeDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});


