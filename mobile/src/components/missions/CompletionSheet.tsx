/**
 * Mission Completion Sheet — M5a.
 *
 * Three-state bottom sheet:
 *   1. COMPOSE   — optional photo + optional notes + "I did it!" submit.
 *   2. SUBMITTING — uploads photo (if any) then posts submission.
 *   3. SUCCESS   — happy confirmation; tap Done to dismiss.
 *
 * After a successful submission we invalidate `assignments.mine`,
 * `assignments.detail(id)`, and `creature.me` so the mission list, the
 * detail screen, and the Hub all reflect SUBMITTED.
 *
 * Errors at any step show an inline banner with a Retry button. The user
 * may dismiss the sheet at any time before the submission lands.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  extractApiError,
  queryKeys,
  storageApi,
  submissionsApi,
  uploadPhotoToPresignedUrl,
} from '@/api';
import { borderRadius, colors, fonts, shadows, spacing } from '@/theme';

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
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => state !== 'submitting' && resetAndClose()}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {state === 'compose' && (
            <>
              <Text style={styles.title}>Tell your hero about it</Text>
              <Text style={styles.subtitle}>
                Add a photo or a quick note — both are optional.
              </Text>

              {/* Photo picker */}
              {photoUri ? (
                <View style={styles.photoWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => setPhotoUri(null)}
                  >
                    <Ionicons name="close" size={18} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.photoPick} onPress={pickPhoto}>
                  <Ionicons name="camera-outline" size={26} color={colors.primary} />
                  <Text style={styles.photoPickTxt}>Add a photo</Text>
                </TouchableOpacity>
              )}

              {/* Notes */}
              <TextInput
                style={styles.notes}
                placeholder="What did you do? (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={NOTES_MAX}
                value={notes}
                onChangeText={setNotes}
              />
              <Text style={styles.charCount}>
                {notes.length}/{NOTES_MAX}
              </Text>

              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorTxt}>{error}</Text>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={resetAndClose}>
                  <Text style={styles.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitTxt}>I did it!</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {state === 'submitting' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.stageLabel}>
                {stage === 'uploading-photo'
                  ? 'Uploading photo…'
                  : 'Posting submission…'}
              </Text>
              <Text style={styles.stageHint}>
                {stage === 'uploading-photo'
                  ? 'Sending your photo to the vault'
                  : 'Almost there'}
              </Text>
            </View>
          )}

          {state === 'success' && (
            <View style={styles.centerState}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={42} color={colors.white} />
              </View>
              <Text style={styles.successTitle}>Sent to your hero!</Text>
              <Text style={styles.successHint}>
                Your hero awaits your parent&apos;s verification.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={resetAndClose}>
                <Text style={styles.doneTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + (Platform.OS === 'ios' ? spacing.md : 0),
    minHeight: 360,
    ...shadows.lg,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  // Photo picker
  photoPick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  photoPickTxt: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.primary,
  },
  photoWrap: {
    height: 140,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  photo: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Notes
  notes: {
    minHeight: 80,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.primary,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
  },
  errorTxt: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.error,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  cancelTxt: { fontFamily: fonts.bold, fontSize: 15, color: colors.textSecondary },
  submitBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    ...shadows.sm,
  },
  submitTxt: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.primary },

  // Submitting / success center state
  centerState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  stageLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
    marginTop: spacing.md,
  },
  stageHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  successTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.primary,
    marginTop: spacing.md,
  },
  successHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  doneBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  doneTxt: { fontFamily: fonts.extraBold, color: colors.primary, fontSize: 15 },
});
