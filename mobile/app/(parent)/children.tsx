import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, ScreenHeader } from '@/components/common';
import { childrenApi } from '@/api/children.api';
import { familiesApi } from '@/api/families.api';
import { extractApiError } from '@/api/client';
import type { ChildProfile, CreateChildResponse } from '@/api/types';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';

interface CelebrationData {
  child: CreateChildResponse;
  inviteCode: string;
  familyName: string;
}

export default function ChildrenScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  // Add child form state
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState(8);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const childrenQ = useQuery({ queryKey: ['children'], queryFn: childrenApi.listChildren });
  const familyQ = useQuery({ queryKey: ['family', 'me'], queryFn: familiesApi.getMyFamily });

  const createMut = useMutation({
    mutationFn: childrenApi.createChild,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      if (familyQ.data) {
        setCelebration({
          child: data,
          inviteCode: familyQ.data.inviteCode,
          familyName: familyQ.data.name,
        });
      }
      setShowAdd(false);
      setDisplayName('');
      setAge(8);
      setAvatarUrl('');
      setFormError(null);
    },
    onError: (err) => setFormError(extractApiError(err)),
  });

  const resetPinMut = useMutation({
    mutationFn: (id: string) => childrenApi.resetPin(id),
    onSuccess: (data, id) => {
      const child = (childrenQ.data ?? []).find((c) => c.id === id);
      if (child && familyQ.data) {
        setCelebration({
          child: {
            id: child.id,
            userId: child.userId,
            displayName: child.displayName,
            pin: data.pin,
            hero: child.hero ?? null,
          },
          inviteCode: familyQ.data.inviteCode,
          familyName: familyQ.data.name,
        });
      }
    },
    onError: (err) => Alert.alert('Reset PIN failed', extractApiError(err)),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['children'] }),
      queryClient.invalidateQueries({ queryKey: ['family', 'me'] }),
    ]);
    setRefreshing(false);
  };

  const submit = () => {
    setFormError(null);
    const name = displayName.trim();
    if (name.length < 1 || name.length > 50) {
      setFormError('Name must be 1–50 characters.');
      return;
    }
    if (age < 4 || age > 17) {
      setFormError('Age must be between 4 and 17.');
      return;
    }
    // dateOfBirth derived from age (Jan 1 of computed birth year)
    const birthYear = new Date().getFullYear() - age;
    const dateOfBirth = new Date(birthYear, 0, 1).toISOString();
    createMut.mutate({
      displayName: name,
      dateOfBirth,
      avatarUrl: avatarUrl.trim() || undefined,
    });
  };

  const children: ChildProfile[] = childrenQ.data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Heroes" subtitle="Manage your family's children." />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {children.length === 0 && (
          <Card variant="outlined" padding="lg">
            <Text style={styles.emptyTitle}>No heroes yet</Text>
            <Text style={styles.emptySub}>
              Add your first hero to start assigning missions.
            </Text>
          </Card>
        )}

        {children.map((c) => (
          <Card key={c.id} variant="elevated" padding="md" style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{c.displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{c.displayName}</Text>
              {c.hero && (
                <Text style={styles.meta}>
                  Level {c.hero.level} · {c.hero.coins} 🪙 · {c.hero.currentStreak} 🔥
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() =>
                Alert.alert(
                  'Reset PIN?',
                  `Generate a new PIN for ${c.displayName}? The previous PIN will no longer work.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: () => resetPinMut.mutate(c.id),
                    },
                  ],
                )
              }
              disabled={resetPinMut.isPending}
            >
              <Ionicons name="key-outline" size={14} color={colors.primary} />
              <Text style={styles.resetBtnText}>Reset PIN</Text>
            </TouchableOpacity>
          </Card>
        ))}

        <TouchableOpacity style={styles.addCta} onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle" size={22} color={colors.surface} />
          <Text style={styles.addCtaText}>Add another Hero</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add child sheet */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowAdd(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a Hero</Text>
            <Text style={styles.sheetSub}>
              Create a child profile. A PIN will be generated — share it once.
            </Text>

            <Input
              label="Display name"
              placeholder="e.g., Alex"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
            />

            <Text style={styles.label}>Age</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setAge((a) => Math.max(4, a - 1))}
              >
                <Ionicons name="remove" size={18} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{age}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setAge((a) => Math.min(17, a + 1))}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.stepperHint}>(4–17)</Text>
            </View>

            <Input
              label="Avatar URL (optional)"
              placeholder="https://…"
              autoCapitalize="none"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
            />

            {formError && <Text style={styles.formError}>{formError}</Text>}

            <Button
              title="Create Hero"
              onPress={submit}
              loading={createMut.isPending}
              style={{ marginTop: spacing.sm }}
            />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setShowAdd(false)}
              style={{ marginTop: spacing.xs }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Celebration / PIN reveal sheet */}
      <Modal visible={!!celebration} animationType="fade" transparent onRequestClose={() => setCelebration(null)}>
        <View style={styles.modalRoot}>
          <View style={styles.modalBackdrop} />
          <View style={styles.celebrate}>
            <Text style={styles.celebrateEmoji}>🎉</Text>
            <Text style={styles.celebrateTitle}>
              {celebration?.child.displayName} is ready!
            </Text>
            <Text style={styles.celebrateSub}>
              Share these credentials with your hero. The PIN will not be shown again — write it down.
            </Text>

            <View style={styles.credentialBlock}>
              <Text style={styles.credentialLabel}>Family Code</Text>
              <Text style={styles.credentialValue}>{celebration?.inviteCode}</Text>
            </View>
            <View style={styles.credentialBlock}>
              <Text style={styles.credentialLabel}>PIN</Text>
              <Text style={[styles.credentialValue, styles.pinValue]}>
                {celebration?.child.pin}
              </Text>
            </View>

            <Button
              title="Copy both"
              variant="outline"
              onPress={async () => {
                if (!celebration) return;
                const text = `Family code: ${celebration.inviteCode}\nPIN: ${celebration.child.pin}`;
                try {
                  if (
                    Platform.OS === 'web' &&
                    typeof navigator !== 'undefined' &&
                    navigator.clipboard
                  ) {
                    await navigator.clipboard.writeText(text);
                  }
                  Alert.alert('Copied', text);
                } catch {
                  Alert.alert('Credentials', text);
                }
              }}
              style={{ marginTop: spacing.md }}
            />
            <Button
              title="Done"
              onPress={() => setCelebration(null)}
              style={{ marginTop: spacing.xs }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarInitial: { fontFamily: fonts.extraBold, fontSize: 20, color: colors.accent },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetBtnText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },

  addCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  addCtaText: { fontFamily: fonts.bold, fontSize: 15, color: colors.surface },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,27,61,0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.md,
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
  sheetTitle: { fontFamily: fonts.extraBold, fontSize: 22, color: colors.primary },
  sheetSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  label: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primary, marginBottom: 6 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperValue: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  stepperHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  formError: {
    color: colors.error,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: spacing.xs,
  },

  celebrate: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  celebrateEmoji: { fontSize: 48, marginBottom: spacing.sm },
  celebrateTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  celebrateSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.md,
  },
  credentialBlock: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  credentialLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  credentialValue: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: colors.primary,
    letterSpacing: 4,
    marginTop: 4,
  },
  pinValue: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '800' as const,
  },
});
