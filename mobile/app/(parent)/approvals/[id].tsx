/**
 * Parent Verify Detail — `/(parent)/approvals/[id]` (Polish-B3 marquee).
 *
 * Rebuilt against the design system:
 *   - GradientBackdrop(cream) outer + AnimatedPressable back chevron + Avatar.
 *   - SectionHeader for the mission title.
 *   - ScrollCard mirrors the child's Hero's Wisdom (parchment).
 *   - PhotoFrame for the submission photo with a tap-to-enlarge Modal.
 *   - Quick-tap Chip rows append to a TextInput (preserved logic).
 *   - Fixed-bottom verify footer with primary AnimatedPressable + reject link.
 *   - Awards parchment overlay + CelebrationBurst on approve.
 *   - Reject confirm modal with destructive primary action.
 *   - Toasts for success/error feedback via useToast.
 *
 * All mutations, query keys, and API payloads are preserved EXACTLY from
 * the M6 implementation — only the visual containers change.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approvalsApi,
  extractApiError,
  queryKeys,
  storageApi,
} from '@/api';
import type {
  PendingApprovalRow,
  TraitCategory,
  VerifyResponse,
} from '@/api/types';
import {
  AnimatedPressable,
  Avatar,
  Banner,
  CelebrationBurst,
  Chip,
  GradientBackdrop,
  Icon,
  PhotoFrame,
  relativeTime,
  ScrollCard,
  SectionHeader,
  Surface,
  Typography,
  useToast,
} from '@/components/ui';
import {
  borderRadius,
  colors,
  spacing,
  traitColor,
  traitLabel,
} from '@/theme';

const MAX_MESSAGE = 280;
const MIN_MESSAGE = 1;

const QUICK_CHIPS: string[] = [
  "I'm proud of you 💛",
  'You showed real courage 💪',
  'You taught me something today 🌱',
];

function traitChipTone(trait: TraitCategory | null | undefined):
  | 'strength'
  | 'wisdom'
  | 'heart'
  | 'neutral' {
  switch (trait) {
    case 'STRENGTH':
      return 'strength';
    case 'WISDOM':
      return 'wisdom';
    case 'HEART':
      return 'heart';
    default:
      return 'neutral';
  }
}

export default function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToast();

  // ----- Data (unchanged) -----
  const pendingQ = useQuery({
    queryKey: [...queryKeys.approvals.pending],
    queryFn: approvalsApi.listPending,
  });
  const row: PendingApprovalRow | undefined = useMemo(
    () => pendingQ.data?.find((r) => r.id === id),
    [pendingQ.data, id],
  );

  // ----- Photo presign -----
  const [signedPhotos, setSignedPhotos] = useState<string[]>([]);
  const [photoModalUri, setPhotoModalUri] = useState<string | null>(null);
  React.useEffect(() => {
    if (!row?.submission?.photoUrls?.length) return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await storageApi.presignRead(row.submission!.photoUrls);
        if (!cancelled) setSignedPhotos(items.map((i) => i.url));
      } catch {
        /* placeholders shown */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row?.submission?.id]);

  // ----- Editor state -----
  const [message, setMessage] = useState('');
  const trimmed = message.trim();
  const canVerify = trimmed.length >= MIN_MESSAGE && trimmed.length <= MAX_MESSAGE;

  const appendChip = (chip: string) => {
    setMessage((prev) => {
      const next =
        prev.length === 0 ? chip + ' ' : `${prev.replace(/\s+$/, '')} ${chip} `;
      return next.slice(0, MAX_MESSAGE);
    });
  };

  // ----- Mutation -----
  const [awardsResult, setAwardsResult] = useState<VerifyResponse | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const verifyM = useMutation({
    mutationFn: (approved: boolean) =>
      approvalsApi.verify({
        assignmentId: id!,
        approved,
        parentMessage: trimmed || undefined,
      }),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.approvals.pending],
      });
      if (res.decision === 'APPROVED') {
        setAwardsResult(res);
        toast.show('Hero Mail sent ✉', { tone: 'success' });
        setTimeout(() => {
          setAwardsResult(null);
          if (router.canGoBack()) router.back();
          else router.replace('/(parent)/approvals');
        }, 2500);
      } else {
        toast.show('Sent back to try again', { tone: 'info' });
        if (router.canGoBack()) router.back();
        else router.replace('/(parent)/approvals');
      }
    },
    onError: () => {
      toast.show("Couldn't send. Try again.", { tone: 'error' });
    },
  });

  // ----- Loading / not-found -----
  if (pendingQ.isPending) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GradientBackdrop
          variant="cream"
          style={StyleSheet.absoluteFill as any}
        />
        <BackHeader />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!row) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GradientBackdrop
          variant="cream"
          style={StyleSheet.absoluteFill as any}
        />
        <BackHeader />
        <View style={styles.centerFill}>
          <Banner
            tone="info"
            icon="checkCircle"
            message={
              pendingQ.error
                ? extractApiError(pendingQ.error)
                : 'This submission is no longer pending. It may have already been reviewed.'
            }
          />
          <AnimatedPressable
            onPress={() => router.replace('/(parent)/approvals')}
            accessibilityLabel="Back to list"
            style={styles.retryBtn}
          >
            <Typography.Body tone="onNavy" emphasis>
              Back to list
            </Typography.Body>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  const mission = row.mission;
  const submission = row.submission;
  const trait = mission.traitCategory;
  const submittedIso =
    submission?.submittedAt ?? row.completedAt ?? new Date().toISOString();
  const firstPhoto = signedPhotos[0];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GradientBackdrop variant="cream" style={StyleSheet.absoluteFill as any} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header row: back + Avatar */}
          <View style={styles.headerRow}>
            <AnimatedPressable
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace('/(parent)/approvals')
              }
              accessibilityLabel="Go back"
              style={styles.backBtn}
            >
              <Icon name="chevronLeft" size={24} color={colors.primary} />
            </AnimatedPressable>
            <Avatar
              size="md"
              initials={row.childProfile.displayName}
              uri={row.childProfile.avatarUrl ?? undefined}
            />
          </View>

          {/* Title */}
          <View style={styles.section}>
            <SectionHeader
              title={mission.title}
              subtitle={`${row.childProfile.displayName} · ${relativeTime(submittedIso)}`}
            />
            {trait ? (
              <Chip
                tone={traitChipTone(trait)}
                label={traitLabel(trait)}
                size="sm"
                style={{ marginTop: -spacing.sm }}
              />
            ) : null}
          </View>

          {/* Hero's Wisdom mirror */}
          {mission.heroWisdom ? (
            <View style={styles.section}>
              <ScrollCard
                title="The lesson they were carrying"
                body={mission.heroWisdom}
              />
            </View>
          ) : null}

          {/* Submission section */}
          <View style={styles.section}>
            <Typography.Eyebrow>WHAT THEY SHARED</Typography.Eyebrow>
            <View style={{ height: spacing.sm }} />

            {firstPhoto ? (
              <PhotoFrame
                uri={firstPhoto}
                aspectRatio={4 / 3}
                onFullscreenRequest={() => setPhotoModalUri(firstPhoto)}
                accessibilityLabel="Submission photo, tap to enlarge"
              />
            ) : submission?.photoUrls?.length ? (
              <View style={styles.photoLoading}>
                <ActivityIndicator size="small" color={colors.textSecondary} />
              </View>
            ) : null}

            {submission?.notes ? (
              <View style={{ marginTop: spacing.md }}>
                <Surface variant="parchment" padding="md" radius="lg" shadow="parchment">
                  <Typography.Body emphasis tone="onParchment">
                    “{submission.notes}”
                  </Typography.Body>
                </Surface>
              </View>
            ) : null}

            {!submission?.photoUrls?.length && !submission?.notes ? (
              <Typography.Caption tone="secondary">
                (no photo or note attached)
              </Typography.Caption>
            ) : null}
          </View>

          {/* Verify Message editor */}
          <View style={styles.section}>
            <Typography.Eyebrow>SEND A HERO MAIL BACK</Typography.Eyebrow>
            <Typography.Heading level={2} style={{ marginTop: 4 }}>
              What will your hero learn from this moment?
            </Typography.Heading>

            <View style={styles.chipsRow}>
              {QUICK_CHIPS.map((chip) => (
                <Chip
                  key={chip}
                  tone="navy"
                  filled={false}
                  label={chip}
                  onPress={() => appendChip(chip)}
                />
              ))}
            </View>

            <TextInput
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, MAX_MESSAGE))}
              placeholder="Your words become Hero Mail…"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={styles.input}
              maxLength={MAX_MESSAGE}
            />
            <View style={styles.counterRow}>
              <Typography.Caption tone="secondary" style={{ flex: 1 }}>
                Your words travel back as Hero Mail — they'll see it next time
                they open their world.
              </Typography.Caption>
              <Typography.Caption tone="secondary">
                {message.length}/{MAX_MESSAGE}
              </Typography.Caption>
            </View>
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* Fixed footer */}
        <View style={styles.footer}>
          <AnimatedPressable
            onPress={() => verifyM.mutate(true)}
            disabled={!canVerify || verifyM.isPending}
            accessibilityLabel="Verify mission"
            style={[
              styles.verifyBtn,
              {
                backgroundColor: canVerify ? colors.accent : colors.amberSoft,
                opacity: verifyM.isPending ? 0.7 : 1,
              } as ViewStyle,
            ]}
          >
            {verifyM.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Typography.Body tone="onNavy" emphasis>
                Verify ✨
              </Typography.Body>
            )}
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => setShowRejectConfirm(true)}
            disabled={verifyM.isPending}
            accessibilityLabel="Send back to try again"
            style={styles.rejectBtn}
          >
            <Typography.Caption tone="secondary">
              Send back to try again
            </Typography.Caption>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>

      {/* Photo fullscreen */}
      <Modal
        visible={!!photoModalUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalUri(null)}
      >
        <Pressable
          style={styles.photoModalBg}
          onPress={() => setPhotoModalUri(null)}
        >
          {photoModalUri ? (
            <Image
              source={{ uri: photoModalUri }}
              style={styles.photoModalImg}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          ) : null}
        </Pressable>
      </Modal>

      {/* Reject confirm */}
      <Modal
        visible={showRejectConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectConfirm(false)}
      >
        <View style={styles.scrim}>
          <Surface
            variant="card"
            padding="lg"
            radius="xl"
            shadow="cardHover"
            style={styles.modalCard}
          >
            <Typography.Display>Send back to try again?</Typography.Display>
            <Typography.Body tone="secondary" style={{ marginTop: spacing.sm }}>
              They'll see your note and can resubmit. No harm done.
            </Typography.Body>
            <View style={styles.confirmRow}>
              <AnimatedPressable
                onPress={() => setShowRejectConfirm(false)}
                accessibilityLabel="Cancel"
                style={[styles.confirmBtn, styles.confirmCancel]}
              >
                <Typography.Body emphasis>Cancel</Typography.Body>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => {
                  setShowRejectConfirm(false);
                  verifyM.mutate(false);
                }}
                accessibilityLabel="Send back"
                style={[styles.confirmBtn, styles.confirmDestructive]}
              >
                <Typography.Body tone="onNavy" emphasis>
                  Send back
                </Typography.Body>
              </AnimatedPressable>
            </View>
          </Surface>
        </View>
      </Modal>

      {/* Awards overlay */}
      <Modal visible={!!awardsResult} transparent animationType="fade">
        <Pressable
          style={styles.scrimDeep}
          onPress={() => setAwardsResult(null)}
        >
          <Surface
            variant="parchment"
            padding="lg"
            radius="xl"
            shadow="parchment"
            style={styles.modalCard}
          >
            <Typography.Display align="center" tone="onParchment">
              Sent!
            </Typography.Display>
            {awardsResult?.awarded ? (
              <View style={styles.awardsRow}>
                {awardsResult.awarded.trait ? (
                  <Chip
                    tone={traitChipTone(awardsResult.awarded.trait)}
                    label={traitLabel(awardsResult.awarded.trait)}
                    size="sm"
                    icon={
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: traitColor(awardsResult.awarded.trait),
                        }}
                      />
                    }
                  />
                ) : null}
                <Chip
                  tone="accent"
                  label={`+${awardsResult.awarded.xp} XP`}
                  size="sm"
                />
                <Chip
                  tone="warning"
                  label={`+${awardsResult.awarded.coins} coins`}
                  size="sm"
                />
                {awardsResult.awarded.careItemName ? (
                  <Chip
                    tone="success"
                    label={awardsResult.awarded.careItemName}
                    size="sm"
                  />
                ) : null}
              </View>
            ) : null}
            {awardsResult?.evolution?.justEvolved ? (
              <View style={{ marginTop: spacing.md }}>
                <Banner
                  tone="success"
                  icon="sparkle"
                  message={`Your hero's creature evolved into ${awardsResult.evolution.stage}!`}
                />
              </View>
            ) : null}
            {awardsResult?.reward?.unlocked ? (
              <View style={{ marginTop: spacing.sm }}>
                <Banner
                  tone="warning"
                  icon="crown"
                  message={`Reward unlocked! ${awardsResult.reward.progress}/${awardsResult.reward.target}`}
                />
              </View>
            ) : null}
          </Surface>
          <View
            pointerEvents="none"
            style={StyleSheet.absoluteFill as any}
            importantForAccessibility="no"
          >
            <CelebrationBurst active intensity="normal" />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function BackHeader() {
  return (
    <View style={styles.headerRow}>
      <AnimatedPressable
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/(parent)/approvals')
        }
        accessibilityLabel="Go back"
        style={styles.backBtn}
      >
        <Icon name="chevronLeft" size={24} color={colors.primary} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingBottom: 140 },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.creamSoft,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  photoLoading: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.creamSoft,
    borderRadius: borderRadius.lg,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    marginTop: spacing.md,
    minHeight: 120,
    backgroundColor: colors.cream,
    color: colors.parchmentInk,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.parchmentDark,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  verifyBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15,26,51,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  scrimDeep: {
    flex: 1,
    backgroundColor: 'rgba(15,26,51,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '88%',
    maxWidth: 360,
    gap: spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancel: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  confirmDestructive: {
    backgroundColor: colors.error,
  },
  awardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    justifyContent: 'center',
  },

  photoModalBg: {
    flex: 1,
    backgroundColor: 'rgba(15,26,51,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalImg: { width: '100%', height: '85%' },
});
