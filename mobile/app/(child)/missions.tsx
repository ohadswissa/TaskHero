import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gradient } from '@/components/common/Gradient';
import { Card } from '@/components/common';
import { Button } from '@/components/common/Button';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';

const MOCK_MISSIONS = [
  { id: '1', title: 'Make the bed', description: 'Make your bed neatly', icon: '🛏️', xp: 20, coins: 10, priority: 'high', timeMinutes: 5, category: 'DAILY_CHORE', status: 'pending' },
  { id: '2', title: 'Read for 20 minutes', description: 'Read a book or educational material', icon: '📚', xp: 30, coins: 15, priority: 'medium', timeMinutes: 20, category: 'EDUCATIONAL', status: 'pending' },
  { id: '3', title: 'Clean your room', description: 'Tidy up and organize your room', icon: '🧹', xp: 25, coins: 12, priority: 'low', timeMinutes: 15, category: 'DAILY_CHORE', status: 'pending' },
  { id: '4', title: 'Practice piano', description: 'Practice your instrument', icon: '🎹', xp: 35, coins: 18, priority: 'medium', timeMinutes: 30, category: 'CREATIVE', status: 'pending' },
  { id: '5', title: 'Walk the dog', description: 'Take the dog for a walk', icon: '🐕', xp: 20, coins: 10, priority: 'high', timeMinutes: 15, category: 'OUTDOOR', status: 'completed' },
];

const priorityConfig: Record<string, { color: string; label: string; bg: string }> = {
  high: { color: '#EF4444', label: '🔴 High Priority', bg: '#FEE2E2' },
  medium: { color: '#F59E0B', label: '🟡 Medium', bg: '#FEF3C7' },
  low: { color: '#10B981', label: '🟢 Low', bg: '#D1FAE5' },
};

function Timer({ totalSeconds, onComplete }: { totalSeconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          Vibration.vibrate(500);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: remaining / totalSeconds,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    if (remaining <= 30 && remaining > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = remaining / totalSeconds;
  const isUrgent = remaining <= 30;
  const timerColor = isUrgent ? '#EF4444' : remaining <= 60 ? '#F59E0B' : colors.primary;

  return (
    <Animated.View style={[timerStyles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={timerStyles.circle}>
        <View style={[timerStyles.progressBg]}>
          <Animated.View
            style={[timerStyles.progressFill, {
              backgroundColor: timerColor,
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]}
          />
        </View>
        <Text style={[timerStyles.time, { color: timerColor }]}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </Text>
        <Text style={timerStyles.label}>{isUrgent ? '⚡ Hurry up!' : 'Time remaining'}</Text>
      </View>
    </Animated.View>
  );
}

const timerStyles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.lg },
  circle: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    ...shadows.lg, borderWidth: 4, borderColor: colors.backgroundSecondary,
  },
  progressBg: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
    backgroundColor: colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden',
    marginHorizontal: 20,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  time: { fontFamily: fonts.extraBold, fontSize: 36 },
  label: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});

export default function ChildMissionsScreen() {
  const [selectedMission, setSelectedMission] = useState<typeof MOCK_MISSIONS[0] | null>(null);
  const [missionStarted, setMissionStarted] = useState(false);
  const [missions, setMissions] = useState(MOCK_MISSIONS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const scaleAnim = useRef(new Animated.Value(0)).current;

  const startMission = () => {
    setMissionStarted(true);
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const completeMission = () => {
    if (selectedMission) {
      setMissions(prev => prev.map(m => m.id === selectedMission.id ? { ...m, status: 'completed' } : m));
      setMissionStarted(false);
      setSelectedMission(null);
    }
  };

  const filtered = missions.filter(m => filter === 'all' || m.status === filter);
  const sortedByPriority = [...filtered].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority as keyof typeof order] || 1) - (order[b.priority as keyof typeof order] || 1);
  });

  // Active mission view
  if (selectedMission && missionStarted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableOpacity style={styles.backRow} onPress={() => { setMissionStarted(false); setSelectedMission(null); }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={styles.backText}>Back to missions</Text>
          </TouchableOpacity>

          <View style={styles.activeCenter}>
            <Text style={styles.activeMissionEmoji}>{selectedMission.icon}</Text>
            <Text style={styles.activeMissionTitle}>{selectedMission.title}</Text>
            <Text style={styles.activeMissionDesc}>{selectedMission.description}</Text>

            {selectedMission.timeMinutes > 0 && (
              <Timer totalSeconds={selectedMission.timeMinutes * 60} onComplete={completeMission} />
            )}

            <View style={styles.activeRewards}>
              <View style={styles.activeRewardChip}>
                <Text style={styles.activeRewardText}>⚡ {selectedMission.xp} XP</Text>
              </View>
              <View style={styles.activeRewardChip}>
                <Text style={styles.activeRewardText}>🪙 {selectedMission.coins} Coins</Text>
              </View>
            </View>

            <Button title="✅ I'm Done!" onPress={completeMission} variant="secondary" style={{ marginTop: spacing.xl, width: '100%' }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Mission detail view
  if (selectedMission) {
    const pc = priorityConfig[selectedMission.priority];
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView>
          <TouchableOpacity style={styles.backRow} onPress={() => setSelectedMission(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.detailCenter}>
            <View style={styles.detailIconBox}>
              <Text style={{ fontSize: 48 }}>{selectedMission.icon}</Text>
            </View>
            <Text style={styles.detailTitle}>{selectedMission.title}</Text>
            <Text style={styles.detailDesc}>{selectedMission.description}</Text>

            <View style={styles.detailChips}>
              <View style={[styles.detailChip, { backgroundColor: pc.bg }]}>
                <Text style={[styles.detailChipText, { color: pc.color }]}>{pc.label}</Text>
              </View>
              {selectedMission.timeMinutes > 0 && (
                <View style={[styles.detailChip, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={[styles.detailChipText, { color: colors.primary }]}>⏱️ {selectedMission.timeMinutes} min</Text>
                </View>
              )}
            </View>

            <Card variant="elevated" style={styles.rewardCard}>
              <Text style={styles.rewardCardTitle}>Mission Rewards</Text>
              <View style={styles.rewardCardRow}>
                <View style={styles.rewardCardItem}>
                  <Text style={{ fontSize: 32 }}>⚡</Text>
                  <Text style={styles.rewardCardValue}>{selectedMission.xp}</Text>
                  <Text style={styles.rewardCardLabel}>XP Points</Text>
                </View>
                <View style={styles.rewardCardDivider} />
                <View style={styles.rewardCardItem}>
                  <Text style={{ fontSize: 32 }}>🪙</Text>
                  <Text style={styles.rewardCardValue}>{selectedMission.coins}</Text>
                  <Text style={styles.rewardCardLabel}>Coins</Text>
                </View>
              </View>
            </Card>

            <Button title="🚀 Start Mission" onPress={startMission} style={{ marginTop: spacing.xl, width: '100%' }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Gradient colors={['#F59E0B', '#EF4444']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.headerTitle}>My Missions 🎯</Text>
          <Text style={styles.headerSub}>{missions.filter(m => m.status === 'pending').length} missions waiting for you!</Text>
        </Gradient>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'completed'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? '📋 All' : f === 'pending' ? '⏳ Pending' : '✅ Done'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mission list */}
        <View style={styles.missionList}>
          {sortedByPriority.map(mission => {
            const pc = priorityConfig[mission.priority];
            const isDone = mission.status === 'completed';
            return (
              <TouchableOpacity
                key={mission.id}
                onPress={() => !isDone && setSelectedMission(mission)}
                activeOpacity={isDone ? 1 : 0.7}
              >
                <Card variant="elevated" style={isDone ? { ...styles.missionCard, ...styles.missionCardDone } : styles.missionCard}>
                  <View style={styles.missionRow}>
                    <View style={[styles.missionIconBox, isDone && { opacity: 0.5 }]}>
                      <Text style={{ fontSize: 28 }}>{mission.icon}</Text>
                    </View>
                    <View style={styles.missionInfo}>
                      <Text style={[styles.missionTitle, isDone && styles.missionTitleDone]}>{mission.title}</Text>
                      <View style={styles.missionMetaRow}>
                        <Text style={styles.missionReward}>+{mission.xp} XP · +{mission.coins} 🪙</Text>
                        {mission.timeMinutes > 0 && (
                          <Text style={styles.missionTime}>⏱️ {mission.timeMinutes}m</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      {isDone ? (
                        <View style={styles.doneCheck}>
                          <Ionicons name="checkmark" size={20} color={colors.white} />
                        </View>
                      ) : (
                        <View style={[styles.priorityBadge, { backgroundColor: pc.bg }]}>
                          <Text style={[styles.priorityBadgeText, { color: pc.color }]}>
                            {mission.priority === 'high' ? '!' : mission.priority === 'medium' ? '•' : '~'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
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
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.white },
  headerSub: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: -spacing.md, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full,
    backgroundColor: colors.white, ...shadows.sm,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },
  filterTextActive: { color: colors.white },

  missionList: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  missionCard: { marginBottom: spacing.md },
  missionCardDone: { opacity: 0.7 },
  missionRow: { flexDirection: 'row', alignItems: 'center' },
  missionIconBox: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  missionInfo: { flex: 1 },
  missionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  missionTitleDone: { textDecorationLine: 'line-through', color: colors.textTertiary },
  missionMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  missionReward: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  missionTime: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },
  doneCheck: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  priorityBadge: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  priorityBadgeText: { fontFamily: fonts.extraBold, fontSize: 18 },

  // Back row
  backRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  backText: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },

  // Detail view
  detailCenter: { alignItems: 'center', paddingHorizontal: spacing.xl },
  detailIconBox: {
    width: 100, height: 100, borderRadius: 30, backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center', ...shadows.md, marginBottom: spacing.lg,
  },
  detailTitle: { fontFamily: fonts.extraBold, fontSize: 24, color: colors.text, textAlign: 'center' },
  detailDesc: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  detailChips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  detailChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full },
  detailChipText: { fontFamily: fonts.semiBold, fontSize: 13 },
  rewardCard: { width: '100%', marginTop: spacing.xl },
  rewardCardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  rewardCardRow: { flexDirection: 'row', alignItems: 'center' },
  rewardCardItem: { flex: 1, alignItems: 'center' },
  rewardCardValue: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.text, marginTop: 4 },
  rewardCardLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  rewardCardDivider: { width: 1, height: 60, backgroundColor: colors.border },

  // Active mission
  activeCenter: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  activeMissionEmoji: { fontSize: 64, marginBottom: spacing.md },
  activeMissionTitle: { fontFamily: fonts.extraBold, fontSize: 26, color: colors.text, textAlign: 'center' },
  activeMissionDesc: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  activeRewards: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  activeRewardChip: {
    backgroundColor: colors.backgroundSecondary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  activeRewardText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
});
