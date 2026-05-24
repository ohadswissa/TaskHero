/**
 * Parent Heroes — Polish-B4 rebuild.
 *
 * Roster + per-child detail surface, composed entirely of design-system
 * primitives:
 *   GradientBackdrop · SectionHeader · RosterRow · Surface · Chip ·
 *   AnimatedPressable · Avatar · Icon · Typography · Banner · EmptyState ·
 *   Toast (ToastStack mounted by _layout).
 *
 * Roster:
 *   • Stack of RosterRow primitives, one per child. Tap to expand a detail
 *     Surface inline. Happiness orb wired from /children.creature.happiness
 *     once Phase 3 lands.
 *
 * Detail Surface (per child):
 *   • PIN reset button (confirmation modal → childrenApi.resetPin →
 *     reveals new PIN in a celebration card).
 *   • Trait totals — 4-chip strip (Strength / Wisdom / Heart / total),
 *     fetched via progressionApi.traitSummary.
 *
 * Add Hero:
 *   • "+ Add hero" Surface CTA at top → modal with displayName + age inputs,
 *     calls childrenApi.create() with derived dateOfBirth. PIN revealed in
 *     a celebration card on success.
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
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  childrenApi,
  extractApiError,
  familiesApi,
  progressionApi,
  queryKeys,
} from '@/api';
import type { ChildProfile, CreateChildResponse } from '@/api/types';
import type { TraitSummary } from '@/api/progression.api';
import {
  AnimatedPressable,
  Avatar,
  Banner,
  Chip,
  EmptyState,
  FLOATING_TAB_BAR_SCREEN_PADDING,
  GradientBackdrop,
  Icon,
  RosterRow,
  SectionHeader,
  Surface,
  Typography,
  useToast,
} from '@/components/ui';
import { borderRadius, colors, spacing, typographyTokens } from '@/theme';

interface CelebrationData {
  displayName: string;
  pin: string;
  inviteCode: string;
  familyName: string;
  isReset: boolean;
}

export default function ParentChildrenScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [confirmResetChild, setConfirmResetChild] = useState<ChildProfile | null>(
    null,
  );

  // Add hero form state
  const [draftName, setDraftName] = useState('');
  const [draftAge, setDraftAge] = useState(8);
  const [formError, setFormError] = useState<string | null>(null);

  const childrenQ = useQuery({
    queryKey: [...queryKeys.children.list],
    queryFn: childrenApi.listChildren,
  });
  const familyQ = useQuery({
    queryKey: ['family', 'me'] as const,
    queryFn: familiesApi.getMyFamily,
  });

  const children: ChildProfile[] = childrenQ.data ?? [];
  const childIds = useMemo(() => children.map((c) => c.id), [children]);

  const traitQueries = useQueries({
    queries: childIds.map((cid) => ({
      queryKey: queryKeys.progression.summary(cid),
      queryFn: () => progressionApi.traitSummary(cid),
      staleTime: 1000 * 60,
      enabled: expandedId === cid,
    })),
  });
  const traitByChild = useMemo(() => {
    const map: Record<string, TraitSummary | undefined> = {};
    childIds.forEach((cid, i) => {
      map[cid] = traitQueries[i]?.data;
    });
    return map;
  }, [childIds, traitQueries]);

  const createMut = useMutation({
    mutationFn: childrenApi.createChild,
    onSuccess: (data: CreateChildResponse) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.children.list] });
      if (familyQ.data) {
        setCelebration({
          displayName: data.displayName,
          pin: data.pin,
          inviteCode: familyQ.data.inviteCode,
          familyName: familyQ.data.name,
          isReset: false,
        });
      }
      setShowAdd(false);
      setDraftName('');
      setDraftAge(8);
      setFormError(null);
      toast.show(`${data.displayName} added to your family`, { tone: 'success' });
    },
    onError: (err) => setFormError(extractApiError(err)),
  });

  const resetPinMut = useMutation({
    mutationFn: (id: string) => childrenApi.resetPin(id),
    onSuccess: (data, id) => {
      const child = children.find((c) => c.id === id);
      if (child && familyQ.data) {
        setCelebration({
          displayName: child.displayName,
          pin: data.pin,
          inviteCode: familyQ.data.inviteCode,
          familyName: familyQ.data.name,
          isReset: true,
        });
      }
      setConfirmResetChild(null);
      toast.show('New PIN generated', { tone: 'success' });
    },
    onError: (err) => {
      toast.show(extractApiError(err), { tone: 'error' });
      setConfirmResetChild(null);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKeys.children.list] }),
        queryClient.invalidateQueries({ queryKey: ['family', 'me'] }),
        ...childIds.map((cid) =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.progression.summary(cid),
          }),
        ),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, childIds]);

  const submitAdd = () => {
    setFormError(null);
    const name = draftName.trim();
    if (name.length < 1 || name.length > 50) {
      setFormError('Name must be 1–50 characters.');
      return;
    }
    if (draftAge < 4 || draftAge > 17) {
      setFormError('Age must be between 4 and 17.');
      return;
    }
    const birthYear = new Date().getFullYear() - draftAge;
    const dateOfBirth = new Date(birthYear, 0, 1).toISOString();
    createMut.mutate({ displayName: name, dateOfBirth });
  };

  const initialLoading = childrenQ.isPending;
  const hasError = !!childrenQ.error;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GradientBackdrop
        variant="parentDashboard"
        intensity="subtle"
        style={StyleSheet.absoluteFill as any}
      />

      {initialLoading ? (
        <View style={styles.loading} accessibilityLabel="Loading heroes">
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
                message="Couldn't load heroes. Pull to refresh."
              />
            </View>
          ) : null}

          <View style={styles.headerRow}>
            <SectionHeader
              eyebrow="HEROES"
              title="Your team"
              subtitle="Manage profiles, PINs, and trait progress."
            />
          </View>

          {/* Add hero CTA */}
          <View style={styles.section}>
            <AnimatedPressable
              onPress={() => setShowAdd(true)}
              accessibilityRole="button"
              accessibilityLabel="Add a Hero"
            >
              <Surface
                variant="cream"
                padding="md"
                radius="lg"
                shadow="card"
                bordered
              >
                <View style={styles.addCta}>
                  <View style={styles.addIcon}>
                    <Icon name="plus" size={20} color={colors.cream} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Typography.Heading level={3}>Add a Hero</Typography.Heading>
                    <Typography.Caption tone="secondary">
                      Create a child profile with a unique PIN.
                    </Typography.Caption>
                  </View>
                </View>
              </Surface>
            </AnimatedPressable>
          </View>

          {/* Roster */}
          <View style={styles.section}>
            {children.length === 0 ? (
              <Surface variant="cream" padding="lg" radius="lg">
                <EmptyState
                  title="No heroes yet"
                  body="Add your first Hero above to assign missions and rewards."
                />
              </Surface>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {children.map((c) => {
                  const expanded = expandedId === c.id;
                  return (
                    <View key={c.id} style={{ gap: spacing.sm }}>
                      <RosterRow
                        child={{
                          displayName: c.displayName,
                          avatarUrl: c.avatarUrl ?? undefined,
                        }}
                        creature={
                          c.creature
                            ? {
                                species: c.creature.species,
                                stage: c.creature.stage,
                                happiness: c.creature.happiness,
                                name: c.creature.name,
                              }
                            : undefined
                        }
                        onPress={() =>
                          setExpandedId(expanded ? null : c.id)
                        }
                      />
                      {expanded ? (
                        <ChildDetail
                          child={c}
                          traits={traitByChild[c.id]}
                          onRequestResetPin={() => setConfirmResetChild(c)}
                          resetting={
                            resetPinMut.isPending &&
                            resetPinMut.variables === c.id
                          }
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Add hero modal */}
      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowAdd(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <SectionHeader
              title="Add a Hero"
              subtitle="A unique PIN will be generated — share it once."
            />

            <Typography.Caption tone="secondary" emphasis style={styles.label}>
              DISPLAY NAME
            </Typography.Caption>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Alex"
                placeholderTextColor={colors.textTertiary}
                value={draftName}
                onChangeText={setDraftName}
                maxLength={50}
                autoCapitalize="words"
              />
            </View>

            <Typography.Caption tone="secondary" emphasis style={styles.label}>
              AGE
            </Typography.Caption>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setDraftAge((a) => Math.max(4, a - 1))}
                accessibilityRole="button"
                accessibilityLabel="Decrease age"
              >
                <Icon name="chevronLeft" size={16} color={colors.primary} />
              </Pressable>
              <Typography.Heading level={2} style={styles.stepperValue}>
                {draftAge}
              </Typography.Heading>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setDraftAge((a) => Math.min(17, a + 1))}
                accessibilityRole="button"
                accessibilityLabel="Increase age"
              >
                <Icon name="chevronRight" size={16} color={colors.primary} />
              </Pressable>
              <Typography.Caption tone="secondary" style={{ marginLeft: spacing.sm }}>
                4 – 17
              </Typography.Caption>
            </View>

            {formError ? (
              <View style={{ marginTop: spacing.sm }}>
                <Banner tone="error" icon="warning" message={formError} />
              </View>
            ) : null}

            <AnimatedPressable
              onPress={submitAdd}
              disabled={createMut.isPending}
              accessibilityRole="button"
              accessibilityLabel="Create hero"
              style={
                createMut.isPending
                  ? [styles.primaryBtn, styles.primaryBtnDisabled]
                  : styles.primaryBtn
              }
            >
              <Typography.Body tone="onNavy" emphasis>
                {createMut.isPending ? 'Creating…' : 'Create Hero'}
              </Typography.Body>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setShowAdd(false)}
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

      {/* Confirm PIN reset */}
      <Modal
        visible={!!confirmResetChild}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmResetChild(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setConfirmResetChild(null)}
          />
          <View style={styles.confirmCard}>
            <SectionHeader
              title="Reset PIN?"
              subtitle={`Generate a new PIN for ${confirmResetChild?.displayName}? The previous PIN will no longer work.`}
            />
            <AnimatedPressable
              onPress={() =>
                confirmResetChild && resetPinMut.mutate(confirmResetChild.id)
              }
              disabled={resetPinMut.isPending}
              style={[styles.dangerBtn]}
              accessibilityRole="button"
              accessibilityLabel="Confirm reset"
            >
              <Typography.Body tone="onNavy" emphasis>
                {resetPinMut.isPending ? 'Resetting…' : 'Reset PIN'}
              </Typography.Body>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setConfirmResetChild(null)}
              style={styles.sheetCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Typography.Body tone="secondary" emphasis>
                Cancel
              </Typography.Body>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      {/* Celebration / PIN reveal */}
      <Modal
        visible={!!celebration}
        transparent
        animationType="fade"
        onRequestClose={() => setCelebration(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCelebration(null)}
          />
          <View style={styles.celebrateCard}>
            <Typography.Display align="center">
              {celebration?.isReset ? 'New PIN ready' : '🎉'}
            </Typography.Display>
            <Typography.Heading
              level={2}
              align="center"
              style={{ marginTop: spacing.sm }}
            >
              {celebration?.displayName} is ready!
            </Typography.Heading>
            <Typography.Body
              tone="secondary"
              align="center"
              style={{ marginTop: 4 }}
            >
              Share these credentials with your hero. The PIN won't be shown
              again — write it down.
            </Typography.Body>

            <View style={styles.credentialBlock}>
              <Typography.Caption tone="secondary" emphasis align="center">
                FAMILY CODE
              </Typography.Caption>
              <Typography.Display
                align="center"
                style={styles.credentialValue}
              >
                {celebration?.inviteCode}
              </Typography.Display>
            </View>
            <View style={styles.credentialBlock}>
              <Typography.Caption tone="secondary" emphasis align="center">
                PIN
              </Typography.Caption>
              <Typography.Display align="center" style={styles.pinValue}>
                {celebration?.pin}
              </Typography.Display>
            </View>

            <AnimatedPressable
              onPress={() => setCelebration(null)}
              style={styles.primaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Typography.Body tone="onNavy" emphasis>
                Done
              </Typography.Body>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =========================================================================
// Child detail surface
// =========================================================================

interface ChildDetailProps {
  child: ChildProfile;
  traits?: TraitSummary;
  onRequestResetPin: () => void;
  resetting: boolean;
}

function ChildDetail({
  child,
  traits,
  onRequestResetPin,
  resetting,
}: ChildDetailProps) {
  return (
    <Surface variant="card" padding="lg" radius="lg" shadow="card">
      {/* Trait totals */}
      <Typography.Caption tone="secondary" emphasis>
        TRAIT TOTALS
      </Typography.Caption>
      <View style={styles.traitStrip}>
        <Chip
          tone="strength"
          label={`Strength · ${traits?.strength ?? 0}`}
          size="sm"
          filled={false}
        />
        <Chip
          tone="wisdom"
          label={`Wisdom · ${traits?.wisdom ?? 0}`}
          size="sm"
          filled={false}
        />
        <Chip
          tone="heart"
          label={`Heart · ${traits?.heart ?? 0}`}
          size="sm"
          filled={false}
        />
        <Chip
          tone="navy"
          label={`Total · ${traits?.total ?? 0}`}
          size="sm"
          filled={false}
        />
      </View>

      {/* Hero stats */}
      {child.hero ? (
        <View style={styles.heroStatsRow}>
          <Chip
            tone="accent"
            label={`Lv ${child.hero.level}`}
            size="sm"
            filled={false}
          />
          <Chip
            tone="warning"
            label={`${child.hero.coins} coins`}
            size="sm"
            filled={false}
          />
          <Chip
            tone="success"
            label={`${child.hero.currentStreak} day streak`}
            size="sm"
            filled={false}
          />
        </View>
      ) : null}

      {/* PIN reset */}
      <View style={{ marginTop: spacing.md }}>
        <AnimatedPressable
          onPress={onRequestResetPin}
          disabled={resetting}
          accessibilityRole="button"
          accessibilityLabel={`Reset PIN for ${child.displayName}`}
          style={styles.outlineBtn}
        >
          <Icon name="crown" size={14} color={colors.primary} />
          <Typography.Body emphasis style={{ marginLeft: 6 }}>
            {resetting ? 'Resetting…' : 'Reset PIN'}
          </Typography.Body>
        </AnimatedPressable>
      </View>
    </Surface>
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
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  addCta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traitStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
  },
  outlineBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.creamSoft,
  },
  primaryBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  dangerBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
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
  sheetCancel: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: { marginTop: spacing.sm, marginBottom: 4 },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.creamSoft,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typographyTokens.body,
    color: colors.primary,
    paddingVertical: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 40,
    textAlign: 'center',
  },
  confirmCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  celebrateCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'stretch',
  },
  credentialBlock: {
    backgroundColor: colors.creamSoft,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  credentialValue: {
    letterSpacing: 4,
    marginTop: 4,
  },
  pinValue: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    letterSpacing: 6,
    marginTop: 4,
  },
});
