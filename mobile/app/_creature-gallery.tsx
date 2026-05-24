/**
 * /_creature-gallery — dev-only inspection page.
 *
 * Two tabs:
 *  1. Creatures — 3 species × 4 stages × 4 emotions = 48 cells (Polish-A).
 *  2. Design System — every Polish-B1 primitive at every meaningful variant.
 *
 * Not linked from anywhere in the production UI. Reach it by typing
 * `/_creature-gallery` in the Expo Router URL bar.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALL_SPECIES, SPECIES_DEFAULTS } from '@/constants/species';
import {
  ALL_EMOTIONS,
  ALL_EVOLUTION_STAGES,
  type EmotionState,
} from '@/constants/creatureSpec';
import { Creature } from '@/components/creature/Creature';
import { CreatureScene } from '@/components/creature/CreatureScene';
import { colors, fonts, spacing, traits, borderRadius } from '@/theme';
import type { CreatureSpecies, EvolutionStage } from '@/api/creatures.api';
import {
  AnimatedPressable,
  Body,
  Caption,
  Chip,
  Display,
  EmptyState,
  Eyebrow,
  GradientBackdrop,
  Heading,
  Icon,
  type IconName,
  OrbProgress,
  Scroll,
  ScrollCard,
  SectionHeader,
  Surface,
} from '@/components/ui';

type Tab = 'creatures' | 'system';

export default function CreatureGalleryScreen() {
  const [tab, setTab] = useState<Tab>('creatures');
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.tabs}>
        <TabButton label="Creatures" active={tab === 'creatures'} onPress={() => setTab('creatures')} />
        <TabButton label="Design System" active={tab === 'system'} onPress={() => setTab('system')} />
      </View>
      {tab === 'creatures' ? <CreatureTab /> : <DesignSystemTab />}
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// =====================================================================
// Tab 1: Creatures (unchanged from Polish-A)
// =====================================================================
function CreatureTab() {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Creature Gallery</Text>
      <Text style={styles.subtitle}>
        3 species × 4 stages × 4 emotions = 48 cells. Dev-only inspection page.
      </Text>

      <Text style={styles.section}>Habitats</Text>
      <View style={styles.habitatRow}>
        {ALL_SPECIES.map((sp) => (
          <View key={sp} style={styles.habitatCell}>
            <CreatureScene
              species={sp}
              stage="ADULT"
              emotion="HAPPY"
              size={140}
              showHabitat
              habitatVariant="full"
            />
            <Text style={styles.habitatLabel}>{SPECIES_DEFAULTS[sp].displayName}</Text>
          </View>
        ))}
      </View>

      {ALL_SPECIES.map((sp) => (
        <SpeciesSection key={sp} species={sp} />
      ))}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

function SpeciesSection({ species }: { species: CreatureSpecies }) {
  const meta = SPECIES_DEFAULTS[species];
  return (
    <View style={styles.speciesBlock}>
      <Text style={styles.section}>
        {meta.displayName}  ·  {meta.trait}
      </Text>
      {ALL_EVOLUTION_STAGES.map((stage) => (
        <View key={stage} style={styles.stageRow}>
          <Text style={styles.stageLabel}>{stage}</Text>
          <View style={styles.emotionRow}>
            {ALL_EMOTIONS.map((emo) => (
              <Cell key={emo} species={species} stage={stage} emotion={emo} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function Cell({
  species,
  stage,
  emotion,
}: {
  species: CreatureSpecies;
  stage: EvolutionStage;
  emotion: EmotionState;
}) {
  return (
    <View style={styles.cell}>
      <View style={styles.cellSprite}>
        <Creature species={species} stage={stage} emotion={emotion} size={84} />
      </View>
      <Text style={styles.cellLabel}>{emotion}</Text>
    </View>
  );
}

// =====================================================================
// Tab 2: Design System
// =====================================================================
const ALL_ICONS: IconName[] = [
  'strength', 'wisdom', 'heart', 'checkCircle',
  'camera', 'chevronLeft', 'chevronRight', 'sparkle',
  'mail', 'crown', 'scroll', 'bell',
];

function DesignSystemTab() {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 80, backgroundColor: colors.background }}>
      {/* Typography ladder */}
      <View style={dsStyles.section}>
        <SectionHeader
          eyebrow="01"
          title="Typography"
          subtitle="Fraunces (display, scroll) + Inter (UI workhorse)"
        />
        <Surface variant="card" padding="lg">
          <Display>Display 32</Display>
          <Heading level={1}>Heading 1 — Inter Bold 24</Heading>
          <Heading level={2}>Heading 2 — Inter Semibold 20</Heading>
          <Heading level={3}>Heading 3 — Inter Semibold 17</Heading>
          <Body>Body 15 / 22 — the workhorse line for instructions and copy.</Body>
          <Body emphasis>Body Emphasis — medium weight for stress.</Body>
          <Caption>Caption 12 — small helper text.</Caption>
          <Caption emphasis>Caption Emphasis — bolder small text.</Caption>
          <Eyebrow>Eyebrow Label</Eyebrow>
          <Scroll tone="primary">"A scroll line in Fraunces italic."</Scroll>
          <View style={{ height: 8 }} />
          <Caption tone="secondary">— Tones —</Caption>
          <Body tone="primary">primary</Body>
          <Body tone="secondary">secondary</Body>
          <Body tone="accent">accent</Body>
          <Body tone="success">success</Body>
          <Body tone="error">error</Body>
        </Surface>
      </View>

      {/* Surfaces */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="02" title="Surfaces" subtitle="Semantic card variants" />
        <View style={dsStyles.grid}>
          <Surface variant="card" style={dsStyles.surfaceTile}>
            <Body emphasis>card</Body>
            <Caption>White + soft navy shadow.</Caption>
          </Surface>
          <Surface variant="cardHover" style={dsStyles.surfaceTile}>
            <Body emphasis>cardHover</Body>
            <Caption>Lifted state.</Caption>
          </Surface>
          <Surface variant="parchment" style={dsStyles.surfaceTile} bordered>
            <Body emphasis tone="onParchment">parchment</Body>
            <Scroll tone="onParchment">Aged paper feel.</Scroll>
          </Surface>
          <Surface variant="navy" style={dsStyles.surfaceTile}>
            <Body emphasis tone="onNavy">navy</Body>
            <Caption tone="onNavy">For hero / splash blocks.</Caption>
          </Surface>
          <Surface variant="cream" style={dsStyles.surfaceTile}>
            <Body emphasis>cream</Body>
            <Caption>Warm soft section.</Caption>
          </Surface>
          <View style={dsStyles.surfaceTile}>
            <GradientBackdrop variant="magic" style={{ borderRadius: borderRadius.lg, overflow: 'hidden' }}>
              <Surface variant="glass" style={{ margin: spacing.md }}>
                <Body emphasis>glass</Body>
                <Caption>Over creature scenes.</Caption>
              </Surface>
            </GradientBackdrop>
          </View>
        </View>
      </View>

      {/* Gradients */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="03" title="Gradient Backdrops" />
        <View style={dsStyles.grid}>
          {(['navy', 'cream', 'parchment', 'magic', 'habitat-forest', 'habitat-sky', 'habitat-stone'] as const).map(
            (v) => (
              <View key={v} style={[dsStyles.surfaceTile, { overflow: 'hidden', borderRadius: borderRadius.lg }]}>
                <GradientBackdrop variant={v}>
                  <View style={{ flex: 1, padding: spacing.md, justifyContent: 'flex-end' }}>
                    <Text style={dsStyles.gradLabel}>{v}</Text>
                  </View>
                </GradientBackdrop>
              </View>
            ),
          )}
        </View>
      </View>

      {/* Chips */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="04" title="Chips" subtitle="Trait + status + neutral tones" />
        <Surface variant="card" padding="lg">
          <Caption tone="secondary" style={{ marginBottom: 6 }}>Filled · md</Caption>
          <View style={dsStyles.chipRow}>
            {(['neutral', 'accent', 'strength', 'wisdom', 'heart', 'success', 'error', 'warning', 'navy'] as const).map(
              (t) => (
                <Chip key={`f-${t}`} label={t} tone={t} />
              ),
            )}
          </View>
          <Caption tone="secondary" style={{ marginTop: spacing.md, marginBottom: 6 }}>Outline · md</Caption>
          <View style={dsStyles.chipRow}>
            {(['neutral', 'accent', 'strength', 'wisdom', 'heart', 'success', 'error', 'warning', 'navy'] as const).map(
              (t) => (
                <Chip key={`o-${t}`} label={t} tone={t} filled={false} />
              ),
            )}
          </View>
          <Caption tone="secondary" style={{ marginTop: spacing.md, marginBottom: 6 }}>Sizes · with icons</Caption>
          <View style={dsStyles.chipRow}>
            <Chip label="Strength" tone="strength" size="sm" icon={<Icon name="strength" size={10} color={colors.white} />} />
            <Chip label="Wisdom" tone="wisdom" size="md" icon={<Icon name="wisdom" size={12} color={colors.white} />} />
            <Chip label="Heart" tone="heart" size="md" icon={<Icon name="heart" size={12} color={colors.white} />} />
          </View>
        </Surface>
      </View>

      {/* Section header variants */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="05" title="Section Headers" />
        <Surface variant="card" padding="lg">
          <SectionHeader title="Title only" />
          <View style={{ height: spacing.md }} />
          <SectionHeader title="With subtitle" subtitle="Quick descriptor for context." />
          <View style={{ height: spacing.md }} />
          <SectionHeader
            eyebrow="Today"
            title="With eyebrow & action"
            subtitle="Optional secondary line."
            action={<Chip label="See all" tone="accent" size="sm" />}
          />
          <View style={{ height: spacing.md }} />
          <SectionHeader eyebrow="Centered" title="Center aligned" subtitle="Used for hero moments." align="center" />
        </Surface>
        <View style={{ height: spacing.sm }} />
        <Surface variant="navy" padding="lg">
          <SectionHeader eyebrow="On Navy" title="Hero block title" subtitle="High contrast on dark surfaces." tone="onNavy" />
        </Surface>
        <View style={{ height: spacing.sm }} />
        <Surface variant="parchment" padding="lg" bordered>
          <SectionHeader eyebrow="On Parchment" title="Mission detail" subtitle="Warm tones for narrative." tone="onParchment" />
        </Surface>
      </View>

      {/* Empty state */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="06" title="Empty State" />
        <Surface variant="cream" padding="none">
          <EmptyState
            title="No missions yet"
            body="Your parent will assign your first quest soon. Hang tight!"
            cta={{ label: 'Refresh', onPress: () => {} }}
          />
        </Surface>
      </View>

      {/* AnimatedPressable demo */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="07" title="Animated Pressable" subtitle="Spring scale + haptic on tap" />
        <Surface variant="card" padding="lg">
          <AnimatedPressable
            haptic="light"
            style={dsStyles.demoButton}
            accessibilityRole="button"
          >
            <Text style={dsStyles.demoButtonLabel}>Tap me</Text>
          </AnimatedPressable>
        </Surface>
      </View>

      {/* Icon grid */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="08" title="Icons" subtitle="Trait motifs + utility set" />
        <Surface variant="card" padding="lg">
          <View style={dsStyles.iconGrid}>
            {ALL_ICONS.map((name) => (
              <View key={name} style={dsStyles.iconCell}>
                <Icon name={name} size={28} color={colors.primary} />
                <Caption tone="secondary" align="center" style={{ marginTop: 4 }}>{name}</Caption>
              </View>
            ))}
          </View>
          <View style={[dsStyles.iconGrid, { marginTop: spacing.md }]}>
            <View style={dsStyles.iconCell}>
              <Icon name="strength" size={32} color={traits.strength} />
              <Caption align="center" style={{ marginTop: 4 }}>Strength</Caption>
            </View>
            <View style={dsStyles.iconCell}>
              <Icon name="wisdom" size={32} color={traits.wisdom} />
              <Caption align="center" style={{ marginTop: 4 }}>Wisdom</Caption>
            </View>
            <View style={dsStyles.iconCell}>
              <Icon name="heart" size={32} color={traits.heart} />
              <Caption align="center" style={{ marginTop: 4 }}>Heart</Caption>
            </View>
            <View style={dsStyles.iconCell}>
              <Icon name="sparkle" size={32} color={colors.amberDeep} />
              <Caption align="center" style={{ marginTop: 4 }}>Magic</Caption>
            </View>
          </View>
        </Surface>
      </View>

      {/* ScrollCard */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="09" title="Scroll Card" subtitle="Hero's Wisdom parchment" />
        <ScrollCard
          body={
            'True strength is not in never falling, but in rising every time you do. The smallest hero with the largest heart can move mountains.'
          }
        />
      </View>

      {/* OrbProgress */}
      <View style={dsStyles.section}>
        <SectionHeader eyebrow="10" title="Orb Progress" subtitle="Happiness visualization" />
        <Surface variant="card" padding="lg">
          <View style={dsStyles.orbRow}>
            <OrbProgress value={20} label="Low · 20" />
            <OrbProgress value={50} label="Mid · 50" />
            <OrbProgress value={85} label="High · 85" />
            <OrbProgress value={100} size={72} color={colors.magicViolet} label="100 · magic" />
          </View>
        </Surface>
      </View>
    </ScrollView>
  );
}

const dsStyles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  surfaceTile: {
    width: '48%',
    minHeight: 96,
    marginBottom: spacing.sm,
  },
  gradLabel: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  demoButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  demoButtonLabel: {
    color: colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  orbRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: { backgroundColor: colors.accent },
  tabLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  tabLabelActive: { color: colors.primaryDark },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.md,
  },
  section: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.accent,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  habitatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  habitatCell: { alignItems: 'center' },
  habitatLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  speciesBlock: { marginBottom: spacing.md },
  stageRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  stageLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  emotionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { alignItems: 'center', width: '24%' },
  cellSprite: {
    width: 88,
    height: 88,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
