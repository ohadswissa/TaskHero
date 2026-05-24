/**
 * Mission Completion Sheet — Polish-B2.
 *
 * Functional flow preserved (compose → submitting → success). Visual
 * upgrades:
 *  - Sheet content wrapped in Surface(cream) with navyGlow shadow.
 *  - Display heading "I did it!".
 *  - Photo preview framed by a parchment Surface ("golden frame").
 *  - "Tap to retake" AnimatedPressable with camera Icon when no photo.
 *  - Notes use Inter body font; char counter Caption.
 *  - Submit is amber full-width pill.
 *  - Success state: parchment Surface + checkCircle + Scroll line.
 *  - Errors surface via <Banner tone="error"/>.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  extractApiError,
  queryKeys,
  storageApi,
  submissionsApi,
  uploadPhotoToPresignedUrl,
} from '@/api';
import {
  AnimatedPressable,
  Banner,
  Caption,
  Display,
  Icon,
  Surface,
  Typography,
} from '@/components/ui';
import {
  borderRadius,
  colors,
  spacing,
  typographyTokens,
} from '@/theme';

type SheetState = 'compose' | 'submitting' | 'success';
type Stage = 'idle' | 'uploading-photo' | 'posting-submission';

interface CompletionSheetProps {
  visible: boolean;
  assignmentId: string;
  onClose: () => void;
}

const NOTES_MAX = 280;

export function CompletionSheet({ visible, assignmentId, onClose }: CompletionSheetProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SheetState>('compose');
  const [stage, setStage] = useState<Stage>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function resetAndClose() {
    setState('compose');
    setStage('idle');
    setPhotoUri(null);
    setNotes('');
    setError(null);
    onClose();
  }

  async function pickPhoto() {
    setError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('We need permission to access your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      setError(extractApiError(e, 'Could not open photo picker'));
    }
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      let photoUrls: string[] | undefined = undefined;
      if (photoUri) {
        setStage('uploading-photo');
        const presign = await storageApi.presign({ contentType: 'image/jpeg', ext: 'jpg' });
        await uploadPhotoToPresignedUrl({
          uri: photoUri,
          uploadUrl: presign.uploadUrl,
          publicUrl: presign.publicUrl,
          contentType: 'image/jpeg',
        });
        photoUrls = [presign.publicUrl];
      }
      setStage('posting-submission');
      return submissionsApi.createSubmission({
        assignmentId,
        notes: notes.trim() || undefined,
        photoUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.detail(assignmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.creature.me });
      setStage('idle');
      setState('success');
    },
    onError: (e) => {
      setError(extractApiError(e, 'Submission failed'));
      setStage('idle');
      setState('compose');
    },
  });

  function handleSubmit() {
    setError(null);
    setState('submitting');
    submitMutation.mutate();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={resetAndClose}
    >
      <View style={styles.backdrop}>
        <AnimatedPressable
          style={StyleSheet.absoluteFill as any}
          onPress={() => state !== 'submitting' && resetAndClose()}
          haptic={null}
          accessibilityLabel="Dismiss sheet"
          accessibilityRole="button"
        >
          <View />
        </AnimatedPressable>

        <Surface variant="cream" radius="xl" padding="lg" shadow="navyGlow" style={styles.sheet as any}>
          <View style={styles.handle} />

          {state === 'compose' && (
            <>
              <Display tone="primary" align="center" style={styles.title}>I did it!</Display>
              <Caption tone="secondary" align="center" style={styles.subtitle}>
                Add a photo or a quick note — both are optional.
              </Caption>

              {photoUri ? (
                <Surface variant="parchment" radius="md" padding="sm" shadow="parchment" bordered style={styles.photoFrame as any}>
                  <Image source={{ uri: photoUri }} style={styles.photo} accessibilityIgnoresInvertColors />
                  <View style={styles.photoActions}>
                    <AnimatedPressable
                      onPress={pickPhoto}
                      style={styles.photoActionBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Retake photo"
                    >
                      <Icon name="camera" size={16} color={colors.parchmentInk} />
                      <Caption emphasis tone="onParchment">Retake</Caption>
                    </AnimatedPressable>
                    <AnimatedPressable
                      onPress={() => setPhotoUri(null)}
                      style={styles.photoActionBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                    >
                      <Caption emphasis tone="onParchment">Remove</Caption>
                    </AnimatedPressable>
                  </View>
                </Surface>
              ) : (
                <AnimatedPressable
                  onPress={pickPhoto}
                  style={styles.photoPick}
                  accessibilityRole="button"
                  accessibilityLabel="Add a photo"
                >
                  <Icon name="camera" size={24} color={colors.primary} />
                  <Typography.Body emphasis tone="primary">Add a photo</Typography.Body>
                </AnimatedPressable>
              )}

              <TextInput
                style={styles.notes}
                placeholder="What did you do? (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={NOTES_MAX}
                value={notes}
                onChangeText={setNotes}
                accessibilityLabel="Notes"
              />
              <Caption tone="secondary" align="right" style={styles.charCount}>
                {notes.length}/{NOTES_MAX}
              </Caption>

              {error && (
                <View style={styles.bannerWrap}>
                  <Banner tone="error" message={error} />
                </View>
              )}

              <View style={styles.actionRow}>
                <AnimatedPressable
                  onPress={resetAndClose}
                  style={styles.cancelBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Typography.Heading level={3} tone="secondary">Not yet</Typography.Heading>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={handleSubmit}
                  style={styles.submitBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Submit"
                >
                  <Icon name="sparkle" size={18} color={colors.navyDeep} />
                  <Typography.Heading level={2} tone="primary" style={styles.submitLabel}>
                    I did it!
                  </Typography.Heading>
                </AnimatedPressable>
              </View>
            </>
          )}

          {state === 'submitting' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.amberDeep} />
              <Typography.Heading level={2} tone="primary" style={styles.stageLabel}>
                {stage === 'uploading-photo' ? 'Uploading photo…' : 'Sending to your hero…'}
              </Typography.Heading>
              <Caption tone="secondary" align="center">
                {stage === 'uploading-photo'
                  ? 'Holding your photo safe.'
                  : 'Almost there.'}
              </Caption>
            </View>
          )}

          {state === 'success' && (
            <Surface variant="parchment" radius="lg" padding="lg" shadow="parchment" bordered style={styles.successCard as any}>
              <View style={styles.successIconRow}>
                <Icon name="checkCircle" size={56} color={colors.success} />
              </View>
              <Typography.Scroll align="center" tone="onParchment" style={styles.successCopy}>
                Your hero awaits your parent&apos;s verification.
              </Typography.Scroll>
              <AnimatedPressable
                onPress={resetAndClose}
                style={styles.doneBtn}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Typography.Heading level={2} tone="primary" style={styles.submitLabel}>Done</Typography.Heading>
              </AnimatedPressable>
            </Surface>
          )}
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 61, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + (Platform.OS === 'ios' ? spacing.md : 0),
    minHeight: 380,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 28 },
  subtitle: { marginTop: 4, marginBottom: spacing.md },

  // Photo picker
  photoPick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.creamSoft,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.amberSoft,
    marginBottom: spacing.md,
  },
  photoFrame: {
    marginBottom: spacing.md,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.sm,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },

  notes: {
    minHeight: 80,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typographyTokens.body,
    color: colors.primary,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  charCount: { marginTop: 4 },

  bannerWrap: { marginTop: spacing.sm },

  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.amberDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: { fontSize: 17, color: colors.navyDeep },

  centerState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  stageLabel: { marginTop: spacing.md },

  successCard: { alignItems: 'center' },
  successIconRow: { marginBottom: spacing.sm },
  successCopy: { marginTop: spacing.xs, marginBottom: spacing.md, fontSize: 17 },
  doneBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.amberDeep,
    alignItems: 'center',
  },
});
