import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/common';

export default function ParentDashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Text style={styles.title}>Family Dashboard</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <Card variant="elevated" style={styles.card}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Active Missions</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>2</Text>
                <Text style={styles.statLabel}>Pending Approval</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Progress</Text>
          <Card variant="outlined" style={styles.card}>
            <Text style={styles.placeholder}>
              Children progress cards will appear here
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card variant="outlined" style={styles.card}>
            <Text style={styles.placeholder}>
              Recent activity feed will appear here
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  section: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.primary,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  placeholder: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.lg,
  },
});
