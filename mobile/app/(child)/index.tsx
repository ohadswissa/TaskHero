import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <LinearGradient colors={['#F59E0B', '#EF4444', '#EC4899']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Decorative elements */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <View style={styles.heroTop}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity style={styles.avatarInner} onPress={() => router.push('/(child)/avatar' as any)}>
                <Text style={styles.avatarEmoji}>🦸</Text>
              </TouchableOpacity>
            </Animated.View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroLabel}>⚡ HERO</Text>
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
            <Text style={styles.xpText}>150 / 250 XP to Level 4 🚀</Text>
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
              <Text style={styles.chipLabel}>Streak</Text>
            </View>
            <View style={styles.chipDivider} />
            <View style={styles.chip}>
              <Text style={styles.chipEmoji}>🏆</Text>
              <Text style={styles.chipValue}>3</Text>
              <Text style={styles.chipLabel}>Badges</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(child)/missions')}>
              <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.quickActionEmoji}>🎯</Text>
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Missions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(child)/creature' as any)}>
              <LinearGradient colors={['#EC4899', '#8B5CF6']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.quickActionEmoji}>🐾</Text>
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Creature</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(child)/avatar' as any)}>
              <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.quickActionEmoji}>✨</Text>
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Avatar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(child)/rewards')}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.quickActionIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.quickActionEmoji}>🎁</Text>
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Rewards</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Today's Missions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Missions 🎯</Text>
            <TouchableOpacity onPress={() => router.push('/(child)/missions')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {[
            { emoji: '🛏️', title: 'Make the bed', xp: 20, coins: 10, bg: '#EDE9FE', priority: '🔴', time: '5m' },
            { emoji: '📚', title: 'Read for 20 minutes', xp: 30, coins: 15, bg: '#FEF3C7', priority: '🟡', time: '20m' },
            { emoji: '🧹', title: 'Clean your room', xp: 25, coins: 12, bg: '#D1FAE5', priority: '🟢', time: '15m' },
          ].map((m, i) => (
            <TouchableOpacity key={i} onPress={() => router.push('/(child)/missions')}>
              <Card variant="elevated" style={styles.missionCard}>
                <View style={styles.missionRow}>
                  <View style={[styles.missionIconBox, { backgroundColor: m.bg }]}>
                    <Text style={styles.missionIcon}>{m.emoji}</Text>
                  </View>
                  <View style={styles.missionInfo}>
                    <Text style={styles.missionTitle}>{m.title}</Text>
                    <Text style={styles.missionMeta}>+{m.xp} XP · +{m.coins} 🪙 · ⏱️ {m.time}</Text>
                  </View>
                  <Text style={{ fontSize: 16 }}>{m.priority}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rewards Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rewards to Earn 🎁</Text>
            <TouchableOpacity onPress={() => router.push('/(child)/rewards')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { emoji: '🍦', name: 'Ice Cream', coins: 50, progress: 1 },
              { emoji: '📱', name: 'Screen Time', coins: 80, progress: 0.94 },
              { emoji: '🎡', name: 'Playground', coins: 150, progress: 0.5 },
              { emoji: '🎟️', name: 'Jumburry', coins: 200, progress: 0.38 },
            ].map((r, i) => (
              <Card key={i} variant="elevated" style={styles.rewardPreviewCard}>
                <Text style={styles.rewardEmoji}>{r.emoji}</Text>
                <Text style={styles.rewardName}>{r.name}</Text>
                <View style={styles.rewardProgressBg}>
                  <View style={[styles.rewardProgressFill, { width: `${r.progress * 100}%` }]} />
                </View>
                <Text style={styles.rewardCoins}>🪙 {r.coins}</Text>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Badges 🏅</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  heroCard: {
    margin: spacing.lg, borderRadius: borderRadius.xxl, padding: spacing.lg,
    ...shadows.lg, overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -20, right: -20,
  },
  decorCircle2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: 10, left: -10,
  },
  signOutBtn: { alignSelf: 'flex-end', padding: spacing.xs },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, marginTop: -spacing.sm },
  avatarRing: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  avatarInner: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 32 },
  heroInfo: { flex: 1 },
  heroLabel: { fontFamily: fonts.bold, fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  heroName: { fontFamily: fonts.extraBold, fontSize: 24, color: colors.white, marginTop: 2 },
  levelBadge: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  levelNum: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.white, lineHeight: 24 },
  levelText: { fontFamily: fonts.bold, fontSize: 9, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  xpSection: { marginBottom: spacing.md },
  xpBarBg: { height: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden', marginBottom: spacing.xs },
  xpBarFill: { height: '100%', borderRadius: 6 },
  xpText: { fontFamily: fonts.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.9)', textAlign: 'right' },
  chips: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: borderRadius.xl, padding: spacing.md,
  },
  chip: { flex: 1, alignItems: 'center' },
  chipEmoji: { fontSize: 22 },
  chipValue: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.white, marginTop: 2 },
  chipLabel: { fontFamily: fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.75)' },
  chipDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  // Quick actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs, ...shadows.md,
  },
  quickActionEmoji: { fontSize: 24 },
  quickActionLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.textSecondary, textAlign: 'center' },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: spacing.md },
  seeAll: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.secondary },
  missionCard: { marginBottom: spacing.sm },
  missionRow: { flexDirection: 'row', alignItems: 'center' },
  missionIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  missionIcon: { fontSize: 24 },
  missionInfo: { flex: 1 },
  missionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  missionMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Reward preview
  rewardPreviewCard: { alignItems: 'center', marginRight: spacing.sm, width: 110, paddingVertical: spacing.lg },
  rewardEmoji: { fontSize: 32, marginBottom: spacing.sm },
  rewardName: { fontFamily: fonts.bold, fontSize: 13, color: colors.text, textAlign: 'center' },
  rewardProgressBg: { width: '80%', height: 4, backgroundColor: colors.backgroundSecondary, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' },
  rewardProgressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 2 },
  rewardCoins: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.secondary, marginTop: 4 },

  // Badges
  badgeCard: { alignItems: 'center', marginRight: spacing.sm, width: 110, paddingVertical: spacing.lg },
  badgeEmoji: { fontSize: 32, marginBottom: spacing.sm },
  badgeName: { fontFamily: fonts.bold, fontSize: 13, color: colors.text, textAlign: 'center' },
  badgeDesc: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
});
