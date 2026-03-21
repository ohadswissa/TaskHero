import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/common';

export default function ChildDashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back! 🦸</Text>
          <Text style={styles.heroName}>Super Alex</Text>
        </View>

        {/* Level & XP Section */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.levelCard}>
            <Text style={styles.levelLabel}>Level</Text>
            <Text style={styles.levelValue}>3</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: '60%' }]} />
            </View>
            <Text style={styles.xpText}>150 / 250 XP</Text>
          </Card>

          <View style={styles.smallStats}>
            <Card variant="outlined" style={styles.smallStatCard}>
              <Text style={styles.smallStatValue}>🪙 75</Text>
              <Text style={styles.smallStatLabel}>Coins</Text>
            </Card>
            <Card variant="outlined" style={styles.smallStatCard}>
              <Text style={styles.smallStatValue}>🔥 5</Text>
              <Text style={styles.smallStatLabel}>Streak</Text>
            </Card>
          </View>
        </View>

        {/* Today's Missions Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Missions</Text>
          <Card variant="outlined" style={styles.missionPreview}>
            <Text style={styles.missionCount}>3 missions available!</Text>
            <Text style={styles.missionHint}>Tap to see your adventures</Text>
          </Card>
        </View>

        {/* Achievements Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <Card variant="outlined" style={styles.achievementCard}>
            <Text style={styles.achievementEmoji}>🏆</Text>
            <Text style={styles.achievementName}>First Step</Text>
            <Text style={styles.achievementDesc}>Reached Level 2</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  heroName: {
    ...typography.h1,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  statsContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  levelCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  levelLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  levelValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.secondary,
    marginVertical: spacing.sm,
  },
  xpBar: {
    width: '80%',
    height: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.xp,
    borderRadius: 6,
  },
  xpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  smallStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  smallStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  smallStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  smallStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  missionPreview: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  missionCount: {
    ...typography.h3,
    color: colors.secondary,
  },
  missionHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  achievementCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  achievementName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  achievementDesc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
