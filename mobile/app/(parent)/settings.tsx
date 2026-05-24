/**
 * Parent Settings — Polish-B4 rebuild.
 *
 * Three Surface sections + logout: Profile, Family, Account. Built from
 * design-system primitives only:
 *   GradientBackdrop · SectionHeader · Surface · Chip · AnimatedPressable ·
 *   Icon · Typography · Banner · Toast.
 *
 * Invite-code copy uses expo-clipboard (Clipboard.setStringAsync) then
 * surfaces a Toast via ToastStack ("Invite code copied"). Logout is a
 * destructive AnimatedPressable behind a confirmation modal that calls
 * authStore.logout() and routes to /(auth)/login.
 */
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { familiesApi } from '@/api';
import {
  AnimatedPressable,
  Banner,
  Chip,
  GradientBackdrop,
  Icon,
  SectionHeader,
  Surface,
  Typography,
  useToast,
} from '@/components/ui';
import { borderRadius, colors, spacing } from '@/theme';

export default function ParentSettingsScreen() {
  const { user, logout } = useAuthStore();
  const toast = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const familyQ = useQuery({
    queryKey: ['family', 'me'] as const,
    queryFn: familiesApi.getMyFamily,
  });

  const handleCopyInvite = async () => {
    const code = familyQ.data?.inviteCode;
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      toast.show('Invite code copied', { tone: 'success' });
    } catch {
      toast.show(`Code ${code} ready to share`, { tone: 'info' });
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GradientBackdrop
        variant="parentDashboard"
        intensity="subtle"
        style={StyleSheet.absoluteFill as any}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <SectionHeader
            eyebrow="SETTINGS"
            title="Account & family"
            subtitle="Profile, invite code, and sign-out."
          />
        </View>

        {/* Profile */}
        <View style={styles.section}>
          <Typography.Caption tone="secondary" emphasis style={styles.label}>
            PROFILE
          </Typography.Caption>
          <Surface variant="card" padding="lg" radius="lg" shadow="card">
            <Row label="Display name" value={user?.displayName || '—'} />
            <Divider />
            <Row label="Email" value={user?.email || '—'} />
            <Divider />
            <Row label="Role" value={(user?.role || 'PARENT').toLowerCase()} />
          </Surface>
        </View>

        {/* Family */}
        <View style={styles.section}>
          <Typography.Caption tone="secondary" emphasis style={styles.label}>
            FAMILY
          </Typography.Caption>
          <Surface variant="card" padding="lg" radius="lg" shadow="card">
            <Row label="Name" value={familyQ.data?.name || '—'} />
            <Divider />
            <Row label="Timezone" value={familyQ.data?.timezone || '—'} />
            <Divider />
            <View style={styles.inviteRow}>
              <View style={{ flex: 1 }}>
                <Typography.Caption tone="secondary" emphasis>
                  INVITE CODE
                </Typography.Caption>
                <Typography.Heading
                  level={2}
                  style={styles.inviteCode}
                  numberOfLines={1}
                >
                  {familyQ.data?.inviteCode || '—'}
                </Typography.Heading>
              </View>
              <AnimatedPressable
                onPress={handleCopyInvite}
                disabled={!familyQ.data?.inviteCode}
                accessibilityRole="button"
                accessibilityLabel="Copy invite code"
                style={
                  familyQ.data?.inviteCode
                    ? styles.copyBtn
                    : [styles.copyBtn, styles.copyBtnDisabled]
                }
              >
                <Icon name="scroll" size={14} color={colors.cream} />
                <Typography.Body
                  tone="onNavy"
                  emphasis
                  style={{ marginLeft: 6 }}
                >
                  Copy
                </Typography.Body>
              </AnimatedPressable>
            </View>
            <View style={{ marginTop: spacing.sm }}>
              <Typography.Caption tone="secondary">
                Share this code with a child to let them sign in with a PIN on
                this family.
              </Typography.Caption>
            </View>
          </Surface>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Typography.Caption tone="secondary" emphasis style={styles.label}>
            ACCOUNT
          </Typography.Caption>
          <Surface variant="card" padding="lg" radius="lg" shadow="card">
            <AnimatedPressable
              onPress={() => setConfirmLogout(true)}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={styles.destructiveBtn}
            >
              <Icon name="chevronLeft" size={16} color={colors.error} />
              <Typography.Body
                emphasis
                style={{ marginLeft: 6, color: colors.error }}
              >
                Sign out
              </Typography.Body>
            </AnimatedPressable>
          </Surface>
        </View>

        <View style={[styles.section, { alignItems: 'center' }]}>
          <Chip
            tone="neutral"
            label="TaskHero · Demo build"
            size="sm"
            filled={false}
          />
        </View>
      </ScrollView>

      {/* Logout confirmation */}
      <Modal
        visible={confirmLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLogout(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setConfirmLogout(false)}
          />
          <View style={styles.confirmCard}>
            <SectionHeader
              title="Sign out?"
              subtitle="You'll need to log in again to access your family."
            />
            <Banner
              tone="warning"
              icon="warning"
              message="You won't lose any progress — heroes and rewards stay safe."
            />
            <AnimatedPressable
              onPress={handleLogout}
              disabled={loggingOut}
              accessibilityRole="button"
              accessibilityLabel="Confirm sign out"
              style={
                loggingOut
                  ? [styles.confirmDestructive, styles.btnDisabled]
                  : styles.confirmDestructive
              }
            >
              <Typography.Body tone="onNavy" emphasis>
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Typography.Body>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setConfirmLogout(false)}
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
    </SafeAreaView>
  );
}

// =========================================================================
// Helpers
// =========================================================================

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Typography.Caption tone="secondary">{label}</Typography.Caption>
      <Typography.Body emphasis numberOfLines={1} style={styles.rowValue}>
        {value}
      </Typography.Body>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// =========================================================================
// Styles
// =========================================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingBottom: spacing.xl * 2 },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  label: { marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  inviteCode: {
    letterSpacing: 3,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
  },
  copyBtnDisabled: { opacity: 0.4 },
  destructiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalRoot: { flex: 1, justifyContent: 'center' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,27,61,0.45)',
  } as ViewStyle,
  confirmCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  confirmDestructive: {
    marginTop: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
  },
  btnDisabled: { opacity: 0.5 },
  sheetCancel: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
