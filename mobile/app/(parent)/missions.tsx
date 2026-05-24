/**
 * Parent Missions — Polish-B4 rebuild.
 *
 * Two-segment library + live-assignment view, composed entirely of design
 * system primitives:
 *   GradientBackdrop · SectionHeader · Chip · Surface · ScrollCard ·
 *   EmptyState · AnimatedPressable · Avatar · Icon · Typography · Banner ·
 *   Toast (ToastStack mounted by _layout).
 *
 * Templates segment:
 *   • Templates fetched via `missionsApi.listTemplates()`, grouped by
 *     traitCategory (STRENGTH / WISDOM / HEART / OTHER).
 *   • Each template card shows title, hero-wisdom snippet, XP/coin chips,
 *     and "Assign…" → bottom sheet listing children Avatars. Selecting a
 *     child creates a mission from the template + assigns in one
 *     mutation (existing missionsApi.createMission +
 *     assignmentsApi.createAssignment).
 *
 * Assignments segment:
 *   • Currently-pending verifications across the family
 *     (approvalsApi.listPending) shown grouped per child with status chips
 *     and submitted-time.
 *   • Below that, the parent's recently-created missions
 *     (missionsApi.listMyMissions) with assignment-count chips.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approvalsApi,
  assignmentsApi,
  childrenApi,
  extractApiError,
  missionsApi,
  queryKeys,
} from '@/api';
import type {
  ChildProfile,
  Mission,
  MissionTemplate,
  PendingApprovalRow,
  TraitCategory,
} from '@/api/types';
import {
  AnimatedPressable,
  Avatar,
  Banner,
  Chip,
  EmptyState,
  FLOATING_TAB_BAR_SCREEN_PADDING,
  GradientBackdrop,
  Icon,
  ScrollCard,
  SectionHeader,
  Surface,
  Typography,
  useToast,
  type ChipTone,
} from '@/components/ui';
import { borderRadius, colors, spacing, traitColor, traitLabel } from '@/theme';

type Segment = 'templates' | 'assignments';

const TRAIT_TONE: Record<TraitCategory, ChipTone> = {
  STRENGTH: 'strength',
  WISDOM: 'wisdom',
  HEART: 'heart',
};

const TRAIT_ORDER: TraitCategory[] = ['STRENGTH', 'WISDOM', 'HEART'];

export default function ParentMissionsScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [segment, setSegment] = useState<Segment>('templates');
  const [refreshing, setRefreshing] = useState(false);
  const [assignTemplate, setAssignTemplate] = useState<MissionTemplate | null>(null);

  const templatesQ = useQuery({
    queryKey: [...queryKeys.missionTemplates.list],
    queryFn: () => missionsApi.listTemplates(),
  });
  const myMissionsQ = useQuery({
    queryKey: [...queryKeys.missions.list],
    queryFn: missionsApi.listMyMissions,
  });
  const childrenQ = useQuery({
    queryKey: [...queryKeys.children.list],
    queryFn: childrenApi.listChildren,
  });
  const pendingQ = useQuery({
    queryKey: [...queryKeys.approvals.pending],
    queryFn: approvalsApi.listPending,
  });

  const templates = templatesQ.data ?? [];
  const missions = myMissionsQ.data ?? [];
  const children = childrenQ.data ?? [];
  const pending = pendingQ.data ?? [];

  const templatesByTrait = useMemo(() => {
    const map: Record<string, MissionTemplate[]> = {
      STRENGTH: [],
      WISDOM: [],
      HEART: [],
      OTHER: [],
    };
    for (const t of templates) {
      const key = t.traitCategory ?? 'OTHER';
      (map[key] ??= []).push(t);
    }
    return map;
  }, [templates]);

  const pendingByChild = useMemo(() => {
    const map = new Map<string, PendingApprovalRow[]>();
    for (const row of pending) {
      const arr = map.get(row.childProfileId) ?? [];
      arr.push(row);
      map.set(row.childProfileId, arr);
    }
    return map;
  }, [pending]);

  const assignMut = useMutation({
    mutationFn: async (vars: {
      template: MissionTemplate;
      childProfileId: string;
    }) => {
      const { template, childProfileId } = vars;
      const mission = await missionsApi.createMission({
        title: template.title,
        description: template.description,
        category: template.category,
        traitCategory: template.traitCategory ?? undefined,
        heroWisdom: template.heroWisdom ?? undefined,
        xpReward: template.suggestedXp,
        coinReward: template.suggestedCoins,
        templateId: template.id,
      });
      const assignment = await assignmentsApi.createAssignment({
        missionId: mission.id,
        childProfileId,
      });
      return { mission, assignment };
    },
    onSuccess: ({ mission }, vars) => {
      const childName =
        children.find((c) => c.id === vars.childProfileId)?.displayName ?? 'your Hero';
      queryClient.invalidateQueries({ queryKey: [...queryKeys.missions.list] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.approvals.pending] });
      toast.show(`"${mission.title}" assigned to ${childName}`, { tone: 'success' });
      setAssignTemplate(null);
    },
    onError: (err) => {
      toast.show(extractApiError(err), { tone: 'error' });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKeys.missionTemplates.list] }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.missions.list] }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.children.list] }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.approvals.pending] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const initialLoading =
    templatesQ.isPending && myMissionsQ.isPending && childrenQ.isPending;
  const hasError =
    !!templatesQ.error ||
    !!myMissionsQ.error ||
    !!childrenQ.error ||
    !!pendingQ.error;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GradientBackdrop
        variant="parentDashboard"
        intensity="subtle"
        style={StyleSheet.absoluteFill as any}
      />

      {initialLoading ? (
        <View style={styles.loading} accessibilityLabel="Loading missions">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {hasError ? (
            <View style={styles.bannerWrap}>
              <Banner
                tone="error"
                icon="warning"
                message="Couldn't load missions. Pull to refresh."
              />
            </View>
          ) : null}

          <View style={styles.headerRow}>
            <SectionHeader
              eyebrow="MISSIONS"
              title="Mission library"
              subtitle="Assign quests that grow your Hero's traits."
            />
          </View>

          {/* Segment switcher */}
          <View style={styles.segmentWrap}>
            <View style={styles.segmentRow}>
              <SegmentChip
                label="Templates"
                active={segment === 'templates'}
                count={templates.length}
                onPress={() => setSegment('templates')}
              />
              <SegmentChip
                label="Assignments"
                active={segment === 'assignments'}
                count={pending.length}
                tone="warning"
                onPress={() => setSegment('assignments')}
              />
            </View>
          </View>

          {segment === 'templates' ? (
            templates.length === 0 ? (
              <View style={styles.section}>
                <Surface variant="cream" padding="lg" radius="lg">
                  <EmptyState
                    title="No templates yet"
                    body="Check back soon — your library will populate with curated quests."
                  />
                </Surface>
              </View>
            ) : (
              <View style={styles.section}>
                {TRAIT_ORDER.map((trait) => {
                  const list = templatesByTrait[trait] ?? [];
                  if (list.length === 0) return null;
                  return (
                    <View key={trait} style={styles.traitBlock}>
                      <View style={styles.traitHeader}>
                        <View
                          style={[
                            styles.traitSwatch,
                            { backgroundColor: traitColor(trait) },
                          ]}
                        />
                        <Typography.Heading level={3}>
                          {traitLabel(trait)} quests
                        </Typography.Heading>
                      </View>
                      <View style={{ gap: spacing.sm }}>
                        {list.map((t) => (
                          <TemplateCard
                            key={t.id}
                            template={t}
                            disabled={children.length === 0}
                            onAssign={() => setAssignTemplate(t)}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
                {(templatesByTrait.OTHER ?? []).length > 0 ? (
                  <View style={styles.traitBlock}>
                    <View style={styles.traitHeader}>
                      <View
                        style={[
                          styles.traitSwatch,
                          { backgroundColor: colors.textSecondary },
                        ]}
                      />
                      <Typography.Heading level={3}>Other</Typography.Heading>
                    </View>
                    <View style={{ gap: spacing.sm }}>
                      {(templatesByTrait.OTHER ?? []).map((t) => (
                        <TemplateCard
                          key={t.id}
                          template={t}
                          disabled={children.length === 0}
                          onAssign={() => setAssignTemplate(t)}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}

                {children.length === 0 ? (
                  <View style={{ marginTop: spacing.md }}>
                    <Banner
                      tone="info"
                      icon="crown"
                      message="Add a Hero first before assigning a quest."
                    />
                  </View>
                ) : null}
              </View>
            )
          ) : (
            <AssignmentsTab
              pendingByChild={pendingByChild}
              children={children}
              missions={missions}
            />
          )}
        </ScrollView>
      )}

      <AssignSheet
        template={assignTemplate}
        children={children}
        onClose={() => setAssignTemplate(null)}
        onConfirm={(childProfileId) =>
          assignTemplate &&
          assignMut.mutate({ template: assignTemplate, childProfileId })
        }
        submitting={assignMut.isPending}
      />
    </SafeAreaView>
  );
}

// =========================================================================
// Segment chip
// =========================================================================

interface SegmentChipProps {
  label: string;
  active: boolean;
  count?: number;
  tone?: 'navy' | 'warning';
  onPress: () => void;
}

function SegmentChip({
  label,
  active,
  count,
  tone = 'navy',
  onPress,
}: SegmentChipProps) {
  const display =
    typeof count === 'number' && count > 0 ? `${label} · ${count}` : label;
  return (
    <View style={styles.segmentSlot}>
      <Chip
        tone={active ? tone : 'neutral'}
        filled={active}
        label={display}
        size="md"
        onPress={onPress}
        style={styles.segmentChip}
      />
    </View>
  );
}

// =========================================================================
// Template card
// =========================================================================

interface TemplateCardProps {
  template: MissionTemplate;
  disabled: boolean;
  onAssign: () => void;
}

function TemplateCard({ template, disabled, onAssign }: TemplateCardProps) {
  return (
    <Surface variant="card" padding="lg" radius="lg" shadow="card">
      <View style={styles.templateHead}>
        <View style={{ flex: 1 }}>
          <Typography.Heading level={3} numberOfLines={2}>
            {template.title}
          </Typography.Heading>
          {template.description ? (
            <Typography.Body
              tone="secondary"
              numberOfLines={2}
              style={{ marginTop: 4 }}
            >
              {template.description}
            </Typography.Body>
          ) : null}
        </View>
      </View>

      <View style={styles.chipRow}>
        {template.traitCategory ? (
          <Chip
            tone={TRAIT_TONE[template.traitCategory]}
            label={traitLabel(template.traitCategory)}
            size="sm"
            filled
          />
        ) : null}
        <Chip
          tone="accent"
          label={`+${template.suggestedXp} XP`}
          size="sm"
          filled={false}
        />
        <Chip
          tone="warning"
          label={`+${template.suggestedCoins} coins`}
          size="sm"
          filled={false}
        />
      </View>

      {template.heroWisdom ? (
        <View style={{ marginTop: spacing.md }}>
          <ScrollCard body={template.heroWisdom} align="left" />
        </View>
      ) : null}

      <View style={styles.templateActionRow}>
        <AnimatedPressable
          onPress={onAssign}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Assign ${template.title}`}
          style={
            disabled
              ? [styles.assignBtn, styles.assignBtnDisabled]
              : styles.assignBtn
          }
        >
          <Icon name="plus" size={16} color={colors.cream} />
          <Typography.Body tone="onNavy" emphasis style={{ marginLeft: 6 }}>
            Assign…
          </Typography.Body>
        </AnimatedPressable>
      </View>
    </Surface>
  );
}

// =========================================================================
// Assignments tab
// =========================================================================

interface AssignmentsTabProps {
  pendingByChild: Map<string, PendingApprovalRow[]>;
  children: ChildProfile[];
  missions: Mission[];
}

function AssignmentsTab({
  pendingByChild,
  children,
  missions,
}: AssignmentsTabProps) {
  const hasPending = pendingByChild.size > 0;
  const recentMissions = missions.slice(0, 6);

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Awaiting verification"
        subtitle="Submissions sitting in your inbox."
      />
      {!hasPending ? (
        <Surface variant="cream" padding="lg" radius="lg">
          <EmptyState
            title="Inbox is clear"
            body="No submissions waiting for your review."
          />
        </Surface>
      ) : (
        <View style={{ gap: spacing.md }}>
          {children.map((c) => {
            const rows = pendingByChild.get(c.id) ?? [];
            if (rows.length === 0) return null;
            return (
              <Surface
                key={c.id}
                variant="card"
                padding="md"
                radius="lg"
                shadow="card"
              >
                <View style={styles.childHeader}>
                  <Avatar
                    initials={c.displayName.charAt(0)}
                    size="sm"
                    tone="navy"
                  />
                  <Typography.Heading level={3} style={{ marginLeft: spacing.sm }}>
                    {c.displayName}
                  </Typography.Heading>
                  <View style={{ flex: 1 }} />
                  <Chip
                    tone="warning"
                    label={`${rows.length} pending`}
                    size="sm"
                    filled
                  />
                </View>
                <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
                  {rows.map((row) => (
                    <View key={row.id} style={styles.assignmentRow}>
                      <Icon name="mail" size={14} color={colors.amberDeep} />
                      <Typography.Body
                        numberOfLines={1}
                        style={{ flex: 1, marginLeft: 8 }}
                      >
                        {row.mission.title}
                      </Typography.Body>
                      <Chip
                        tone="warning"
                        label="SUBMITTED"
                        size="sm"
                        filled={false}
                      />
                    </View>
                  ))}
                </View>
              </Surface>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader
          title="Recent missions"
          subtitle="Quests you've created or assigned."
        />
        {recentMissions.length === 0 ? (
          <Surface variant="cream" padding="lg" radius="lg">
            <EmptyState
              title="No missions yet"
              body="Pick a template and assign your first quest above."
            />
          </Surface>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {recentMissions.map((m) => (
              <Surface
                key={m.id}
                variant="card"
                padding="md"
                radius="lg"
                shadow="card"
              >
                <View style={styles.missionRow}>
                  <View style={{ flex: 1 }}>
                    <Typography.Body emphasis numberOfLines={1}>
                      {m.title}
                    </Typography.Body>
                    <View style={[styles.chipRow, { marginTop: 6 }]}>
                      {m.traitCategory ? (
                        <Chip
                          tone={TRAIT_TONE[m.traitCategory]}
                          label={traitLabel(m.traitCategory)}
                          size="sm"
                          filled
                        />
                      ) : null}
                      <Chip
                        tone="neutral"
                        label={(m._count?.assignments ?? 0) === 1
                          ? '1 assignment'
                          : `${m._count?.assignments ?? 0} assignments`}
                        size="sm"
                        filled={false}
                      />
                    </View>
                  </View>
                </View>
              </Surface>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// =========================================================================
// Assign-to-child bottom sheet
// =========================================================================

interface AssignSheetProps {
  template: MissionTemplate | null;
  children: ChildProfile[];
  onClose: () => void;
  onConfirm: (childProfileId: string) => void;
  submitting: boolean;
}

function AssignSheet({
  template,
  children,
  onClose,
  onConfirm,
  submitting,
}: AssignSheetProps) {
  return (
    <Modal
      visible={!!template}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <SectionHeader
            title="Assign to a Hero"
            subtitle={template?.title}
          />
          {children.length === 0 ? (
            <Banner
              tone="info"
              icon="crown"
              message="Add a Hero first from the Heroes tab."
            />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {children.map((c) => (
                <AnimatedPressable
                  key={c.id}
                  onPress={() => onConfirm(c.id)}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel={`Assign to ${c.displayName}`}
                >
                  <Surface
                    variant="cream"
                    padding="md"
                    radius="lg"
                    shadow="card"
                  >
                    <View style={styles.heroPickRow}>
                      <Avatar
                        initials={c.displayName.charAt(0)}
                        size="md"
                        tone="navy"
                      />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Typography.Heading level={3} numberOfLines={1}>
                          {c.displayName}
                        </Typography.Heading>
                        {c.hero ? (
                          <Typography.Caption tone="secondary">
                            Level {c.hero.level} · {c.hero.coins} coins
                          </Typography.Caption>
                        ) : null}
                      </View>
                      <Icon
                        name="chevronRight"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </View>
                  </Surface>
                </AnimatedPressable>
              ))}
            </View>
          )}
          <AnimatedPressable
            onPress={onClose}
            style={styles.sheetCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Typography.Body tone="secondary" emphasis>
              Cancel
            </Typography.Body>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =========================================================================
// Styles
// =========================================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: FLOATING_TAB_BAR_SCREEN_PADDING },
  bannerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  segmentWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentSlot: { flexShrink: 0 },
  segmentChip: { paddingVertical: 8, paddingHorizontal: spacing.md },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  traitBlock: { marginBottom: spacing.lg },
  traitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  traitSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  templateHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  templateActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
  },
  assignBtnDisabled: { opacity: 0.4 },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,27,61,0.45)',
  } as ViewStyle,
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  heroPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetCancel: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
