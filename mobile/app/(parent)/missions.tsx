import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, ScreenHeader } from '@/components/common';
import { missionsApi } from '@/api/missions.api';
import { assignmentsApi } from '@/api/assignments.api';
import { childrenApi } from '@/api/children.api';
import { extractApiError } from '@/api/client';
import type {
  CreateMissionRequest,
  MissionCategory,
  MissionTemplate,
  TraitCategory,
} from '@/api/types';
import { colors, spacing, borderRadius, fonts, shadows, traits, traitColor, traitLabel } from '@/theme';

type TabKey = 'templates' | 'mine' | 'create';

const CATEGORIES: { id: MissionCategory; label: string }[] = [
  { id: 'DAILY_CHORE', label: 'Daily Chore' },
  { id: 'EDUCATIONAL', label: 'Learning' },
  { id: 'PHYSICAL', label: 'Exercise' },
  { id: 'CREATIVE', label: 'Creative' },
  { id: 'HABIT', label: 'Social/Habit' },
];

const TRAIT_BUTTONS: { id: TraitCategory; emoji: string }[] = [
  { id: 'STRENGTH', emoji: '💪' },
  { id: 'WISDOM', emoji: '🧠' },
  { id: 'HEART', emoji: '❤️' },
];

export default function MissionsScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('templates');
  const [refreshing, setRefreshing] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MissionCategory>('DAILY_CHORE');
  const [trait, setTrait] = useState<TraitCategory>('STRENGTH');
  const [heroWisdom, setHeroWisdom] = useState('');
  const [xpReward, setXpReward] = useState(10);
  const [coinReward, setCoinReward] = useState(5);
  const [childProfileId, setChildProfileId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedFromTemplateId, setSubmittedFromTemplateId] = useState<string | null>(null);

  const templatesQ = useQuery({
    queryKey: ['mission-templates', 'heros-path'],
    queryFn: () => missionsApi.listTemplates('heros-path'),
  });
  const myMissionsQ = useQuery({ queryKey: ['missions', 'mine'], queryFn: missionsApi.listMyMissions });
  const childrenQ = useQuery({ queryKey: ['children'], queryFn: childrenApi.listChildren });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mission-templates'] }),
      queryClient.invalidateQueries({ queryKey: ['missions', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['children'] }),
    ]);
    setRefreshing(false);
  };

  const createMissionMut = useMutation({
    mutationFn: async (payload: CreateMissionRequest & { childProfileId?: string | null }) => {
      const { childProfileId: cpid, ...missionPayload } = payload;
      const mission = await missionsApi.createMission(missionPayload);
      let assignment = null;
      if (cpid) {
        assignment = await assignmentsApi.createAssignment({
          missionId: mission.id,
          childProfileId: cpid,
        });
      }
      return { mission, assignment };
    },
    onSuccess: ({ mission, assignment }) => {
      queryClient.invalidateQueries({ queryKey: ['missions', 'mine'] });
      Alert.alert(
        'Mission created',
        assignment
          ? `"${mission.title}" was assigned successfully.`
          : `"${mission.title}" is saved. Assign it from a child profile later.`,
      );
      resetCreateForm();
      setTab('mine');
    },
    onError: (err) => setFormError(extractApiError(err)),
  });

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setCategory('DAILY_CHORE');
    setTrait('STRENGTH');
    setHeroWisdom('');
    setXpReward(10);
    setCoinReward(5);
    setChildProfileId(null);
    setFormError(null);
    setSubmittedFromTemplateId(null);
  };

  const applyTemplate = (t: MissionTemplate) => {
    setTitle(t.title);
    setDescription(t.description);
    setCategory(t.category);
    setTrait(t.traitCategory ?? 'STRENGTH');
    setHeroWisdom(t.heroWisdom ?? '');
    setXpReward(t.suggestedXp);
    setCoinReward(t.suggestedCoins);
    setSubmittedFromTemplateId(t.id);
    setTab('create');
  };

  const submitCreate = () => {
    setFormError(null);
    const t = title.trim();
    if (t.length < 1 || t.length > 120) {
      setFormError('Title must be 1–120 characters.');
      return;
    }
    if (description.length > 500) {
      setFormError('Description must be 500 characters or fewer.');
      return;
    }
    if (heroWisdom.length > 280) {
      setFormError("Hero's Wisdom must be 280 characters or fewer.");
      return;
    }
    if (xpReward < 1 || xpReward > 100) {
      setFormError('XP must be between 1 and 100.');
      return;
    }
    if (coinReward < 1 || coinReward > 50) {
      setFormError('Coins must be between 1 and 50.');
      return;
    }
    createMissionMut.mutate({
      title: t,
      description: description.trim() || t,
      category,
      traitCategory: trait,
      heroWisdom: heroWisdom.trim() || undefined,
      xpReward,
      coinReward,
      templateId: submittedFromTemplateId ?? undefined,
      childProfileId,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Missions"
        subtitle="Build missions with Hero's Wisdom and assign them to a hero."
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['templates', 'mine', 'create'] as TabKey[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'templates' ? 'Templates' : t === 'mine' ? 'My Missions' : 'Create'}
            </Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === 'templates' && (
          <TemplatesTab
            templates={templatesQ.data ?? []}
            isLoading={templatesQ.isLoading}
            onUse={applyTemplate}
          />
        )}

        {tab === 'mine' && (
          <MyMissionsTab missions={myMissionsQ.data ?? []} isLoading={myMissionsQ.isLoading} />
        )}

        {tab === 'create' && (
          <CreateTab
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            trait={trait}
            setTrait={setTrait}
            heroWisdom={heroWisdom}
            setHeroWisdom={setHeroWisdom}
            xpReward={xpReward}
            setXpReward={setXpReward}
            coinReward={coinReward}
            setCoinReward={setCoinReward}
            childProfileId={childProfileId}
            setChildProfileId={setChildProfileId}
            children={childrenQ.data ?? []}
            formError={formError}
            submitting={createMissionMut.isPending}
            onSubmit={submitCreate}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================================
// Templates tab
// =========================================================================

function TemplatesTab({
  templates,
  isLoading,
  onUse,
}: {
  templates: MissionTemplate[];
  isLoading: boolean;
  onUse: (t: MissionTemplate) => void;
}) {
  if (isLoading) {
    return <Text style={styles.empty}>Loading templates…</Text>;
  }
  if (templates.length === 0) {
    return <Text style={styles.empty}>No templates yet.</Text>;
  }
  return (
    <View>
      {templates.map((t) => (
        <Card key={t.id} variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
          <View style={styles.tplHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tplTitle}>{t.title}</Text>
              <View style={styles.tplChipRow}>
                <TraitChip trait={t.traitCategory} />
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>⚡ {t.suggestedXp}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>🪙 {t.suggestedCoins}</Text>
                </View>
              </View>
            </View>
          </View>
          {t.heroWisdom && (
            <View style={styles.wisdomBlock}>
              <Text style={styles.wisdomLabel}>Hero's Wisdom</Text>
              <Text style={styles.wisdomText} numberOfLines={2}>
                {t.heroWisdom}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.useBtn} onPress={() => onUse(t)}>
            <Text style={styles.useBtnText}>Use this →</Text>
          </TouchableOpacity>
        </Card>
      ))}
    </View>
  );
}

// =========================================================================
// My Missions tab
// =========================================================================

function MyMissionsTab({
  missions,
  isLoading,
}: {
  missions: { id: string; title: string; category: string; traitCategory: TraitCategory | null; status: string; _count?: { assignments: number } }[];
  isLoading: boolean;
}) {
  if (isLoading) return <Text style={styles.empty}>Loading…</Text>;
  if (missions.length === 0) {
    return <Text style={styles.empty}>No missions yet — create one from Templates or Create.</Text>;
  }
  return (
    <View>
      {missions.map((m) => (
        <Card key={m.id} variant="elevated" padding="md" style={{ marginBottom: spacing.sm }}>
          <Text style={styles.tplTitle}>{m.title}</Text>
          <View style={styles.tplChipRow}>
            <TraitChip trait={m.traitCategory} />
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{m.category}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{m.status}</Text>
            </View>
            {m._count && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{m._count.assignments} assigned</Text>
              </View>
            )}
          </View>
        </Card>
      ))}
    </View>
  );
}

// =========================================================================
// Create tab
// =========================================================================

interface CreateProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: MissionCategory;
  setCategory: (v: MissionCategory) => void;
  trait: TraitCategory;
  setTrait: (v: TraitCategory) => void;
  heroWisdom: string;
  setHeroWisdom: (v: string) => void;
  xpReward: number;
  setXpReward: (v: number) => void;
  coinReward: number;
  setCoinReward: (v: number) => void;
  childProfileId: string | null;
  setChildProfileId: (v: string | null) => void;
  children: { id: string; displayName: string }[];
  formError: string | null;
  submitting: boolean;
  onSubmit: () => void;
}

function CreateTab(p: CreateProps) {
  return (
    <View>
      <Input
        label="Title"
        placeholder="e.g., Tidy your room"
        value={p.title}
        onChangeText={p.setTitle}
        maxLength={120}
      />
      <Text style={styles.charCount}>{p.title.length}/120</Text>

      <Input
        label="Description (optional)"
        placeholder="Add detail your hero will see…"
        value={p.description}
        onChangeText={p.setDescription}
        multiline
        numberOfLines={3}
        maxLength={500}
        style={{ minHeight: 70, textAlignVertical: 'top' }}
      />

      <Text style={styles.fieldLabel}>Category</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.optChip, p.category === c.id && styles.optChipActive]}
            onPress={() => p.setCategory(c.id)}
          >
            <Text
              style={[styles.optChipText, p.category === c.id && styles.optChipTextActive]}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Trait</Text>
      <View style={styles.traitRow}>
        {TRAIT_BUTTONS.map((t) => {
          const active = p.trait === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.traitBtn,
                {
                  borderColor: traitColor(t.id),
                  backgroundColor: active ? traitColor(t.id) : colors.surface,
                },
              ]}
              onPress={() => p.setTrait(t.id)}
            >
              <Text style={styles.traitEmoji}>{t.emoji}</Text>
              <Text
                style={[
                  styles.traitBtnLabel,
                  { color: active ? colors.surface : traitColor(t.id) },
                ]}
              >
                {traitLabel(t.id)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>Hero's Wisdom</Text>
      <Text style={styles.helper}>A short lesson your child carries forward.</Text>
      <View style={styles.wisdomInputWrap}>
        <TextInput
          style={styles.wisdomInput}
          value={p.heroWisdom}
          onChangeText={p.setHeroWisdom}
          multiline
          maxLength={280}
          placeholder="e.g., Keeping your space tidy helps your mind focus."
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={styles.charCount}>{p.heroWisdom.length}/280</Text>
      </View>

      {/* Rewards */}
      <View style={styles.rewardRow}>
        <Stepper
          label="XP"
          value={p.xpReward}
          min={1}
          max={100}
          onChange={p.setXpReward}
          icon="⚡"
        />
        <Stepper
          label="Coins"
          value={p.coinReward}
          min={1}
          max={50}
          onChange={p.setCoinReward}
          icon="🪙"
        />
      </View>

      <Text style={styles.fieldLabel}>Assign to (optional)</Text>
      <View style={styles.chipWrap}>
        <TouchableOpacity
          style={[styles.optChip, p.childProfileId === null && styles.optChipActive]}
          onPress={() => p.setChildProfileId(null)}
        >
          <Text
            style={[
              styles.optChipText,
              p.childProfileId === null && styles.optChipTextActive,
            ]}
          >
            Unassigned
          </Text>
        </TouchableOpacity>
        {p.children.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.optChip, p.childProfileId === c.id && styles.optChipActive]}
            onPress={() => p.setChildProfileId(c.id)}
          >
            <Text
              style={[
                styles.optChipText,
                p.childProfileId === c.id && styles.optChipTextActive,
              ]}
            >
              {c.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {p.formError && <Text style={styles.formError}>{p.formError}</Text>}

      <Button
        title="Create Mission"
        onPress={p.onSubmit}
        loading={p.submitting}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
}

// =========================================================================
// Sub-components
// =========================================================================

function TraitChip({ trait }: { trait: TraitCategory | null | undefined }) {
  if (!trait) {
    return (
      <View style={[styles.traitChip, { backgroundColor: colors.background }]}>
        <Text style={[styles.traitChipText, { color: colors.textSecondary }]}>No trait</Text>
      </View>
    );
  }
  return (
    <View style={[styles.traitChip, { backgroundColor: traitColor(trait) }]}>
      <Text style={styles.traitChipText}>{traitLabel(trait)}</Text>
    </View>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  icon: string;
}) {
  return (
    <View style={styles.stepperBox}>
      <Text style={styles.stepperLabel}>
        {icon} {label}
      </Text>
      <View style={styles.stepperRowInner}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Ionicons name="remove" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { paddingVertical: 10, marginRight: spacing.md },
  tabActive: {},
  tabLabel: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textSecondary },
  tabLabelActive: { color: colors.primary },
  tabUnderline: {
    height: 3,
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginTop: 6,
  },

  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Template cards
  tplHead: { flexDirection: 'row', alignItems: 'flex-start' },
  tplTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  tplChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  traitChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.sm },
  traitChipText: { fontFamily: fonts.bold, fontSize: 11, color: colors.surface },
  metaChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaChipText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.primary },

  wisdomBlock: {
    backgroundColor: '#F4E9D0',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  wisdomLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  wisdomText: { fontFamily: fonts.regular, fontSize: 13, color: colors.primary },

  useBtn: { alignSelf: 'flex-end', marginTop: spacing.sm },
  useBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent },

  // Form
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  charCount: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  optChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optChipText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },
  optChipTextActive: { color: colors.surface },

  traitRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  traitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  traitEmoji: { fontSize: 22, marginBottom: 2 },
  traitBtnLabel: { fontFamily: fonts.bold, fontSize: 12 },

  wisdomInputWrap: {
    backgroundColor: '#F4E9D0',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    marginBottom: spacing.sm,
  },
  wisdomInput: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  rewardRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  stepperBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...shadows.sm,
  },
  stepperLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  stepperRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperValue: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.primary },

  formError: {
    color: colors.error,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
