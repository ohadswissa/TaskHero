import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gradient } from '@/components/common/Gradient';
import { Card } from '@/components/common';
import { Button } from '@/components/common/Button';
import { colors, spacing, borderRadius, fonts, shadows, gradients } from '@/theme';

const CATEGORIES = [
  { id: 'DAILY_CHORE', label: 'Daily Chore', icon: '🧹', color: '#818CF8' },
  { id: 'HABIT', label: 'Habit', icon: '⭐', color: '#10B981' },
  { id: 'EDUCATIONAL', label: 'Educational', icon: '📚', color: '#3B82F6' },
  { id: 'CREATIVE', label: 'Creative', icon: '🎨', color: '#EC4899' },
  { id: 'OUTDOOR', label: 'Outdoor', icon: '🌳', color: '#22C55E' },
  { id: 'PHYSICAL', label: 'Physical', icon: '🏃', color: '#F59E0B' },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#10B981', icon: '🟢' },
  { id: 'medium', label: 'Medium', color: '#F59E0B', icon: '🟡' },
  { id: 'high', label: 'High', color: '#EF4444', icon: '🔴' },
];

const TIME_OPTIONS = [
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 20, label: '20 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 0, label: 'No limit' },
];

const CHILDREN_MOCK = [
  { id: '1', name: 'Alex', emoji: '🦸' },
  { id: '2', name: 'Maya', emoji: '🧚' },
];

// Predefined mission suggestions
const MISSION_SUGGESTIONS = [
  { title: 'Make the bed', description: 'Make your bed neatly every morning', category: 'DAILY_CHORE', xp: 15, coins: 8, icon: '🛏️' },
  { title: 'Read for 20 minutes', description: 'Read a book or educational material', category: 'EDUCATIONAL', xp: 30, coins: 15, icon: '📖' },
  { title: 'Clean your room', description: 'Tidy up and organize your room', category: 'DAILY_CHORE', xp: 25, coins: 12, icon: '🧹' },
  { title: 'Practice piano', description: 'Practice your instrument for the session', category: 'CREATIVE', xp: 35, coins: 18, icon: '🎹' },
  { title: 'Walk the dog', description: 'Take the dog for a walk around the block', category: 'OUTDOOR', xp: 20, coins: 10, icon: '🐕' },
  { title: 'Do homework', description: 'Complete all homework assignments', category: 'EDUCATIONAL', xp: 40, coins: 20, icon: '✏️' },
];

export default function MissionsScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('DAILY_CHORE');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [selectedTime, setSelectedTime] = useState(15);
  const [xpReward, setXpReward] = useState('20');
  const [coinReward, setCoinReward] = useState('10');
  const [selectedChildren, setSelectedChildren] = useState<string[]>(['1']);
  const [missions, setMissions] = useState(MISSION_SUGGESTIONS.slice(0, 3).map((m, i) => ({
    ...m, id: String(i + 1), priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
    timeMinutes: [15, 20, 10][i], assignedTo: ['Alex'], status: 'active',
  })));

  const toggleChild = (id: string) => {
    setSelectedChildren(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a mission title');
      return;
    }
    const newMission = {
      id: String(missions.length + 1),
      title,
      description,
      category: selectedCategory,
      priority: selectedPriority,
      timeMinutes: selectedTime,
      xp: parseInt(xpReward) || 20,
      coins: parseInt(coinReward) || 10,
      assignedTo: selectedChildren.map(id => CHILDREN_MOCK.find(c => c.id === id)?.name || ''),
      status: 'active',
      icon: CATEGORIES.find(c => c.id === selectedCategory)?.icon || '🎯',
    };
    setMissions([newMission, ...missions]);
    setShowCreate(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedCategory('DAILY_CHORE');
    setSelectedPriority('medium');
    setSelectedTime(15);
    setXpReward('20');
    setCoinReward('10');
    setSelectedChildren(['1']);
  };

  const applySuggestion = (s: typeof MISSION_SUGGESTIONS[0]) => {
    setTitle(s.title);
    setDescription(s.description);
    setSelectedCategory(s.category);
    setXpReward(String(s.xp));
    setCoinReward(String(s.coins));
  };

  const priorityColor = (p: string) => PRIORITIES.find(pr => pr.id === p)?.color || '#F59E0B';

  if (showCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.createHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.createTitle}>Create Mission</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Quick suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Quick Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {MISSION_SUGGESTIONS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => applySuggestion(s)}>
                  <Text style={styles.suggestionIcon}>{s.icon}</Text>
                  <Text style={styles.suggestionText}>{s.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title & Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Mission Details</Text>
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Make the bed"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe what needs to be done..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textTertiary}
              />
            </Card>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryLabel, selectedCategory === cat.id && { color: '#fff' }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.priorityChip, selectedPriority === p.id && { backgroundColor: p.color, borderColor: p.color }]}
                  onPress={() => setSelectedPriority(p.id)}
                >
                  <Text style={styles.priorityIcon}>{p.icon}</Text>
                  <Text style={[styles.priorityLabel, selectedPriority === p.id && { color: '#fff' }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Limit */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>⏱️ Time Limit</Text>
            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map(t => (
                <TouchableOpacity
                  key={t.minutes}
                  style={[styles.timeChip, selectedTime === t.minutes && styles.timeChipActive]}
                  onPress={() => setSelectedTime(t.minutes)}
                >
                  <Text style={[styles.timeLabel, selectedTime === t.minutes && styles.timeLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rewards */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Rewards</Text>
            <Card variant="elevated" style={styles.formCard}>
              <View style={styles.rewardRow}>
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardEmoji}>⚡</Text>
                  <Text style={styles.rewardLabel}>XP</Text>
                  <TextInput
                    style={styles.rewardTextInput}
                    value={xpReward}
                    onChangeText={setXpReward}
                    keyboardType="numeric"
                    placeholder="20"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <View style={styles.rewardDivider} />
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardEmoji}>🪙</Text>
                  <Text style={styles.rewardLabel}>Coins</Text>
                  <TextInput
                    style={styles.rewardTextInput}
                    value={coinReward}
                    onChangeText={setCoinReward}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            </Card>
          </View>

          {/* Assign to children */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Assign To</Text>
            <View style={styles.childrenRow}>
              {CHILDREN_MOCK.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childChip, selectedChildren.includes(child.id) && styles.childChipActive]}
                  onPress={() => toggleChild(child.id)}
                >
                  <Text style={styles.childEmoji}>{child.emoji}</Text>
                  <Text style={[styles.childLabel, selectedChildren.includes(child.id) && styles.childLabelActive]}>{child.name}</Text>
                  {selectedChildren.includes(child.id) && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Create button */}
          <View style={styles.section}>
            <Button title="🚀 Create Mission" onPress={handleCreate} style={{ marginBottom: spacing.xxl }} />
          </View>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Gradient colors={gradients.primary} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Missions</Text>
              <Text style={styles.headerSubtitle}>{missions.length} active missions</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Gradient>

        {/* Mission List */}
        <View style={styles.missionList}>
          {missions.map((mission, idx) => (
            <Card key={mission.id} variant="elevated" style={styles.missionCard}>
              <View style={styles.missionHeader}>
                <View style={[styles.missionIconBox, { backgroundColor: CATEGORIES.find(c => c.id === mission.category)?.color + '20' }]}>
                  <Text style={styles.missionIcon}>{mission.icon || '🎯'}</Text>
                </View>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionMeta}>
                    Assigned to {mission.assignedTo.join(', ')}
                  </Text>
                </View>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor(mission.priority) }]}>
                  <Text style={styles.priorityDotText}>
                    {mission.priority === 'high' ? '!' : mission.priority === 'medium' ? '•' : '~'}
                  </Text>
                </View>
              </View>

              <View style={styles.missionFooter}>
                <View style={styles.missionChip}>
                  <Text style={styles.missionChipText}>⚡ {mission.xp} XP</Text>
                </View>
                <View style={styles.missionChip}>
                  <Text style={styles.missionChipText}>🪙 {mission.coins}</Text>
                </View>
                {mission.timeMinutes > 0 && (
                  <View style={styles.missionChip}>
                    <Text style={styles.missionChipText}>⏱️ {mission.timeMinutes}m</Text>
                  </View>
                )}
                <View style={[styles.missionChip, { backgroundColor: priorityColor(mission.priority) + '20' }]}>
                  <Text style={[styles.missionChipText, { color: priorityColor(mission.priority) }]}>
                    {mission.priority.charAt(0).toUpperCase() + mission.priority.slice(1)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },

  // List view
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.white },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', ...shadows.md,
  },
  missionList: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg },
  missionCard: { marginBottom: spacing.md },
  missionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  missionIconBox: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  missionIcon: { fontSize: 24 },
  missionInfo: { flex: 1 },
  missionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  missionMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  priorityDot: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  priorityDotText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.white },
  missionFooter: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  missionChip: {
    backgroundColor: colors.backgroundSecondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full,
  },
  missionChipText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSecondary },

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
  textArea: { height: 80, textAlignVertical: 'top' },

  // Category
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: borderRadius.xl, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    gap: 6, ...shadows.sm,
  },
  categoryIcon: { fontSize: 18 },
  categoryLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },

  // Priority
  priorityRow: { flexDirection: 'row', gap: spacing.md },
  priorityChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: borderRadius.xl, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.border, gap: 6, ...shadows.sm,
  },
  priorityIcon: { fontSize: 16 },
  priorityLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },

  // Time
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.xl,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, ...shadows.sm,
  },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },
  timeLabelActive: { color: colors.white },

  // Rewards
  rewardRow: { flexDirection: 'row', alignItems: 'center' },
  rewardInput: { flex: 1, alignItems: 'center', gap: 4 },
  rewardEmoji: { fontSize: 24 },
  rewardLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSecondary },
  rewardTextInput: {
    fontFamily: fonts.bold, fontSize: 24, color: colors.text, textAlign: 'center',
    width: 80, paddingVertical: 4,
  },
  rewardDivider: { width: 1, height: 60, backgroundColor: colors.border },

  // Children
  childrenRow: { flexDirection: 'row', gap: spacing.md },
  childChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: borderRadius.xl, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.border, gap: 8, ...shadows.sm,
  },
  childChipActive: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
  childEmoji: { fontSize: 22 },
  childLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  childLabelActive: { color: colors.primary },

  // Suggestions
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: borderRadius.xl, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.sm, gap: 6, ...shadows.sm,
  },
  suggestionIcon: { fontSize: 16 },
  suggestionText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },
});
