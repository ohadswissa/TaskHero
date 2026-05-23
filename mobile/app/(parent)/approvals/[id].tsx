/**
 * Parent Verify Detail — `/(parent)/approvals/[id]` (M6 marquee screen).
 *
 * Renders the child's submission for parental verification:
 *  - Header: child name + mission title
 *  - Trait + Hero's Wisdom parchment card (mirrors the child's screen — co-op design language)
 *  - Submission section: presigned photo, notes, timestamp; tap photo → full-screen modal
 *  - Verify Message editor: 3 quick-tap chips that APPEND to the textarea, free-text, char counter
 *  - Footer actions: amber "Verify ✨" + subtle "Send back to try again"
 *
 * On approve: calls `approvalsApi.verify({approved:true,parentMessage})`, then
 * shows a celebration overlay summarising the awarded/evolution/reward
 * payload before routing back to the list.
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalsApi, extractApiError, queryKeys, storageApi } from '@/api';
import type { PendingApprovalRow, VerifyResponse } from '@/api/types';
import {
  borderRadius,
  colors,
  fonts,
  shadows,
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

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? '' : 's'} ago`;
}

export default function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  // ----- Data -----
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
        // leave empty; placeholders shown
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row?.submission?.id]);

  // ----- Message editor -----
  const [message, setMessage] = useState('');
  const trimmed = message.trim();
  const canVerify = trimmed.length >= MIN_MESSAGE && trimmed.length <= MAX_MESSAGE;

  const appendChip = (chip: string) => {
    setMessage((prev) => {
      const next = prev.length === 0 ? chip + ' ' : `${prev.replace(/\s+$/, '')} ${chip} `;
      return next.slice(0, MAX_MESSAGE);
    });
  };

  // ----- Mutation -----
  const [overlay, setOverlay] = useState<VerifyResponse | null>(null);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const verifyM = useMutation({
    mutationFn: (approved: boolean) =>
      approvalsApi.verify({
        assignmentId: id!,
        approved,
        parentMessage: trimmed || undefined,
      }),
    onSuccess: async (res) => {
      setErrorMsg(null);
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.approvals.pending],
      });
      if (res.decision === 'APPROVED') {
        setOverlay(res);
        // Auto-dismiss after 2.5s
        setTimeout(() => {
          setOverlay(null);
          router.replace('/(parent)/approvals');
        }, 2500);
      } else {
        // Reject — toast + immediate return
        router.replace('/(parent)/approvals');
      }
    },
    onError: (err) => {
      setErrorMsg(extractApiError(err));
    },
  });

  // ----- Render -----
  if (pendingQ.isPending) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <BackBar />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!row) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <BackBar />
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>
            This submission is no longer pending. It may have already been reviewed.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.replace('/(parent)/approvals')}
          >
            <Text style={styles.retryTxt}>Back to list</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mission = row.mission;
  const submission = row.submission;
  const trait = mission.traitCategory;
  const tColor = traitColor(trait);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <BackBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.titleBlock, { borderLeftColor: tColor }]}>
            <Text style={styles.eyebrow}>
              {row.childProfile.displayName}&apos;s submission
            </Text>
            <Text style={styles.title}>{mission.title}</Text>
            {trait && (
              <View
                style={[
                  styles.traitChip,
                  { backgroundColor: tColor + '20', alignSelf: 'flex-start' },
                ]}
              >
                <View style={[styles.traitDot, { backgroundColor: tColor }]} />
                <Text style={[styles.traitChipTxt, { color: tColor }]}>
                  {traitLabel(trait)}
                </Text>
              </View>
            )}
          </View>

          {/* Hero's Wisdom mirror card (same parchment style as child) */}
          {mission.heroWisdom && (
            <View style={styles.wisdomCard}>
              <Text style={styles.wisdomEyebrow}>✦ Hero&apos;s Wisdom they carried ✦</Text>
              <Text style={styles.wisdomBody}>{mission.heroWisdom}</Text>
            </View>
          )}

          {/* Submission */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What they shared</Text>
            <Text style={styles.timestamp}>
              {relativeTime(submission?.submittedAt ?? row.completedAt)}
            </Text>

            {/* Photos */}
            {submission?.photoUrls?.length ? (
              <View style={styles.photoWrap}>
                {submission.photoUrls.map((orig, i) => {
                  const signed = signedPhotos[i];
                  return (
                    <Pressable
                      key={orig}
                      onPress={() => signed && setPhotoModalUri(signed)}
                      style={styles.photoFrame}
                    >
                      {signed ? (
                        <Image source={{ uri: signed }} style={styles.photo} />
                      ) : (
                        <View style={[styles.photo, styles.photoLoading]}>
                          <ActivityIndicator size="small" color={colors.textSecondary} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* Notes */}
            {submission?.notes ? (
              <View style={styles.notesBlock}>
                <Text style={styles.notesLabel}>Their note</Text>
                <Text style={styles.notesBody}>“{submission.notes}”</Text>
              </View>
            ) : null}

            {!submission?.photoUrls?.length && !submission?.notes && (
              <Text style={styles.timestamp}>(no photo or note attached)</Text>
            )}
          </View>

          {/* Hero Mail editor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send a Hero Mail back</Text>
            <Text style={styles.sectionSub}>
              What will your hero learn from this moment?
            </Text>

            <View style={styles.chipsRow}>
              {QUICK_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.suggestChip}
                  onPress={() => appendChip(chip)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestChipTxt}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, MAX_MESSAGE))}
              placeholder="A few words your hero will treasure…"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={styles.input}
              maxLength={MAX_MESSAGE}
            />
            <View style={styles.counterRow}>
              <Text style={styles.helper}>
                Your words travel back as Hero Mail — they&apos;ll see it next time they
                open their world.
              </Text>
              <Text style={styles.counter}>
                {message.length}/{MAX_MESSAGE}
              </Text>
            </View>
          </View>

          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorBannerTxt}>{errorMsg}</Text>
              <TouchableOpacity onPress={() => verifyM.mutate(true)}>
                <Text style={styles.errorBannerLink}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => setRejectConfirmOpen(true)}
            disabled={verifyM.isPending}
          >
            <Text style={styles.rejectTxt}>Send back to try again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              !canVerify && styles.verifyBtnDisabled,
            ]}
            onPress={() => verifyM.mutate(true)}
            disabled={!canVerify || verifyM.isPending}
          >
            {verifyM.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.verifyTxt}>Verify ✨</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Full-screen photo modal */}
      <Modal
        visible={!!photoModalUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalUri(null)}
      >
        <Pressable style={styles.photoModalBg} onPress={() => setPhotoModalUri(null)}>
          {photoModalUri && (
            <Image
              source={{ uri: photoModalUri }}
              style={styles.photoModalImg}
              resizeMode="contain"
            />
          )}
          <View style={styles.photoModalClose}>
            <Ionicons name="close" size={26} color={colors.white} />
          </View>
        </Pressable>
      </Modal>

      {/* Reject confirm modal */}
      <Modal
        visible={rejectConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectConfirmOpen(false)}
      >
        <View style={styles.confirmBg}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Send back to try again?</Text>
            <Text style={styles.confirmBody}>
              They&apos;ll see your message and can submit again.
            </Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setRejectConfirmOpen(false)}
              >
                <Text style={styles.confirmCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmGo}
                onPress={() => {
                  setRejectConfirmOpen(false);
                  verifyM.mutate(false);
                }}
              >
                <Text style={styles.confirmGoTxt}>Send back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Celebration overlay */}
      <Modal visible={!!overlay} transparent animationType="fade">
        <View style={styles.confirmBg}>
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIconWrap}>
              <Ionicons name="sparkles" size={32} color={colors.accent} />
            </View>
            <Text style={styles.celebrationTitle}>Verified ✨</Text>
            {overlay?.awarded && (
              <Text style={styles.celebrationLine}>
                +{overlay.awarded.xp} XP · +{overlay.awarded.coins} coins
              </Text>
            )}
            {overlay?.awarded?.trait && (
              <Text style={styles.celebrationLine}>
                Trait grown: {traitLabel(overlay.awarded.trait)}
              </Text>
            )}
            {overlay?.awarded?.careItemName && (
              <Text style={styles.celebrationLine}>
                Care item earned: {overlay.awarded.careItemName}
              </Text>
            )}
            {overlay?.evolution?.justEvolved && (
              <Text style={styles.celebrationLineBold}>
                Evolved to {overlay.evolution.stage}!
              </Text>
            )}
            {overlay?.reward && (
              <Text style={styles.celebrationLine}>
                Reward progress: {overlay.reward.progress}/{overlay.reward.target}
                {overlay.reward.unlocked ? '  🎉 Goal unlocked!' : ''}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BackBar() {
  return (
    <View style={styles.backBar}>
      <TouchableOpacity
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/(parent)/approvals')
        }
        style={styles.backBtn}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={26} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  backBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backBtn: { padding: spacing.xs, alignSelf: 'flex-start' },
  scroll: { paddingBottom: spacing.xl },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  errorText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  retryTxt: { fontFamily: fonts.bold, color: colors.primary },

  titleBlock: {
    marginHorizontal: spacing.lg,
    paddingLeft: spacing.md,
    borderLeftWidth: 4,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.primary,
    lineHeight: 30,
  },
  traitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  traitDot: { width: 8, height: 8, borderRadius: 4 },
  traitChipTxt: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },

  // Parchment Hero's Wisdom mirror card
  wisdomCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#F4E4C1',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#D8C396',
    ...shadows.sm,
  },
  wisdomEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#8A6B2A',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  wisdomBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: '#5A3F12',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  sectionSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timestamp: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  photoWrap: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  photoFrame: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  photo: { width: '100%', height: '100%' },
  photoLoading: { alignItems: 'center', justifyContent: 'center' },

  notesBlock: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  notesLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 20,
  },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  suggestChipTxt: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primary },

  input: {
    marginTop: spacing.sm,
    minHeight: 100,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.primary,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    fontStyle: 'italic',
  },
  counter: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.textSecondary },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.errorLight,
  },
  errorBannerTxt: { flex: 1, fontFamily: fonts.regular, color: colors.error, fontSize: 13 },
  errorBannerLink: { fontFamily: fonts.bold, color: colors.error, fontSize: 13 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  verifyBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyTxt: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.primary },
  rejectBtn: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  rejectTxt: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // Full-screen photo viewer
  photoModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalImg: { width: '100%', height: '85%' },
  photoModalClose: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Confirm modal
  confirmBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  confirmTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  confirmBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  confirmRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  confirmCancel: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  confirmCancelTxt: { fontFamily: fonts.bold, color: colors.primary, fontSize: 14 },
  confirmGo: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.warning,
  },
  confirmGoTxt: { fontFamily: fonts.bold, color: colors.surface, fontSize: 14 },

  // Celebration card
  celebrationCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  celebrationIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  celebrationTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  celebrationLine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  celebrationLineBold: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.accent,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
