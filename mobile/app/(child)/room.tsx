import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient } from '@/components/common/Gradient';
import { Card } from '@/components/common';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fonts, shadows } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Creature Visual Components (Pure RN Views, no emojis) ───

function CreatureEye({ size = 22, x = 0, blink }: { size?: number; x?: number; blink: Animated.Value }) {
  return (
    <View style={[creatureStyles.eye, { width: size, height: size, transform: [{ translateX: x }] }]}>
      <View style={creatureStyles.eyeWhite}>
        <Animated.View style={[creatureStyles.eyePupil, { transform: [{ scaleY: blink }] }]} />
        <View style={creatureStyles.eyeShine} />
      </View>
    </View>
  );
}

function CreatureBody({ stage, color, blink, bounce }: { stage: number; color: string; blink: Animated.Value; bounce: Animated.Value }) {
  const bodySize = 100 + stage * 20;
  const headSize = 60 + stage * 8;
  const hasWings = stage >= 2;
  const hasTail = stage >= 1;
  const hasHorns = stage >= 3;
  const hasCrown = stage >= 4;

  return (
    <Animated.View style={[creatureStyles.creatureRoot, { transform: [{ translateY: bounce }] }]}>
      {/* Shadow underneath */}
      <View style={[creatureStyles.creatureShadow, { width: bodySize * 0.8, height: bodySize * 0.15 }]} />

      {/* Wings (behind body) */}
      {hasWings && (
        <>
          <Animated.View style={[creatureStyles.wing, creatureStyles.wingLeft, {
            backgroundColor: color,
            width: 40 + stage * 8,
            height: 55 + stage * 10,
            left: -20 - stage * 6,
            transform: [{ rotate: '-25deg' }, { scaleY: bounce.interpolate({ inputRange: [-8, 0, 8], outputRange: [1.1, 1, 0.9] }) }],
          }]}>
            <View style={[creatureStyles.wingInner, { backgroundColor: adjustColor(color, 20) }]} />
          </Animated.View>
          <Animated.View style={[creatureStyles.wing, creatureStyles.wingRight, {
            backgroundColor: color,
            width: 40 + stage * 8,
            height: 55 + stage * 10,
            right: -20 - stage * 6,
            transform: [{ rotate: '25deg' }, { scaleY: bounce.interpolate({ inputRange: [-8, 0, 8], outputRange: [0.9, 1, 1.1] }) }],
          }]}>
            <View style={[creatureStyles.wingInner, { backgroundColor: adjustColor(color, 20) }]} />
          </Animated.View>
        </>
      )}

      {/* Body */}
      <View style={[creatureStyles.body, {
        width: bodySize,
        height: bodySize * 1.1,
        backgroundColor: color,
        borderRadius: bodySize * 0.45,
      }]}>
        {/* Belly patch */}
        <View style={[creatureStyles.belly, {
          width: bodySize * 0.55,
          height: bodySize * 0.5,
          borderRadius: bodySize * 0.25,
          backgroundColor: adjustColor(color, 40),
        }]} />

        {/* Belly stripes */}
        {[0, 1, 2].map(i => (
          <View key={i} style={[creatureStyles.bellyStripe, {
            width: bodySize * 0.3 - i * 8,
            top: bodySize * 0.52 + i * 10,
            backgroundColor: adjustColor(color, 30),
          }]} />
        ))}
      </View>

      {/* Head */}
      <View style={[creatureStyles.head, {
        width: headSize,
        height: headSize,
        backgroundColor: color,
        borderRadius: headSize * 0.5,
        top: -headSize * 0.35,
      }]}>
        {/* Horns */}
        {hasHorns && (
          <>
            <View style={[creatureStyles.horn, creatureStyles.hornLeft, { borderBottomColor: adjustColor(color, -30) }]} />
            <View style={[creatureStyles.horn, creatureStyles.hornRight, { borderBottomColor: adjustColor(color, -30) }]} />
          </>
        )}

        {/* Crown for max level */}
        {hasCrown && (
          <View style={creatureStyles.crown}>
            <View style={creatureStyles.crownBase} />
            <View style={[creatureStyles.crownPoint, { left: 2 }]} />
            <View style={[creatureStyles.crownPoint, { left: 12 }]} />
            <View style={[creatureStyles.crownPoint, { left: 22 }]} />
          </View>
        )}

        {/* Cheeks */}
        <View style={[creatureStyles.cheek, creatureStyles.cheekLeft]} />
        <View style={[creatureStyles.cheek, creatureStyles.cheekRight]} />

        {/* Eyes */}
        <View style={creatureStyles.eyeContainer}>
          <CreatureEye size={18 + stage * 2} x={-4} blink={blink} />
          <CreatureEye size={18 + stage * 2} x={4} blink={blink} />
        </View>

        {/* Mouth */}
        <View style={creatureStyles.mouth}>
          <View style={creatureStyles.mouthCurve} />
        </View>

        {/* Ear/spikes on head */}
        <View style={[creatureStyles.earLeft, { backgroundColor: adjustColor(color, -15) }]} />
        <View style={[creatureStyles.earRight, { backgroundColor: adjustColor(color, -15) }]} />
      </View>

      {/* Tail */}
      {hasTail && (
        <Animated.View style={[creatureStyles.tail, {
          backgroundColor: color,
          width: 12 + stage * 3,
          height: 40 + stage * 10,
          right: -15 - stage * 5,
          transform: [{ rotate: bounce.interpolate({ inputRange: [-8, 0, 8], outputRange: ['-15deg', '10deg', '25deg'] }) }],
        }]}>
          <View style={[creatureStyles.tailTip, { backgroundColor: adjustColor(color, -20) }]} />
        </Animated.View>
      )}

      {/* Arms/paws */}
      <View style={[creatureStyles.paw, creatureStyles.pawLeft, { backgroundColor: adjustColor(color, -10) }]} />
      <View style={[creatureStyles.paw, creatureStyles.pawRight, { backgroundColor: adjustColor(color, -10) }]} />

      {/* Feet */}
      <View style={[creatureStyles.foot, creatureStyles.footLeft, { backgroundColor: adjustColor(color, -10) }]} />
      <View style={[creatureStyles.foot, creatureStyles.footRight, { backgroundColor: adjustColor(color, -10) }]} />
    </Animated.View>
  );
}

// Color utility
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ─── Creature Stats ───
interface CreatureStats {
  name: string;
  happiness: number;  // 0-100
  energy: number;     // 0-100
  hunger: number;     // 0-100
  xp: number;
  level: number;
  stage: number;      // 0=egg, 1=baby, 2=child, 3=teen, 4=adult
}

const STAGE_NAMES = ['Egg', 'Hatchling', 'Young', 'Adolescent', 'Majestic'];
const CREATURE_COLORS = [
  { id: 'emerald', label: 'Emerald', color: '#34D399' },
  { id: 'sapphire', label: 'Sapphire', color: '#60A5FA' },
  { id: 'ruby', label: 'Ruby', color: '#F87171' },
  { id: 'amethyst', label: 'Amethyst', color: '#A78BFA' },
  { id: 'gold', label: 'Gold', color: '#FBBF24' },
  { id: 'coral', label: 'Coral', color: '#FB7185' },
];

const CARE_ACTIONS = [
  { id: 'feed', label: 'Feed', icon: 'nutrition' as const, stat: 'hunger', amount: 25, cooldown: 'Ready', color: '#F59E0B' },
  { id: 'play', label: 'Play', icon: 'game-controller' as const, stat: 'happiness', amount: 20, cooldown: 'Ready', color: '#EC4899' },
  { id: 'rest', label: 'Rest', icon: 'moon' as const, stat: 'energy', amount: 30, cooldown: 'Ready', color: '#8B5CF6' },
  { id: 'train', label: 'Train', icon: 'fitness' as const, stat: 'xp', amount: 15, cooldown: '2 missions', color: '#3B82F6' },
];

const ACCESSORIES = [
  { id: 'bow', label: 'Red Bow', cost: 20, icon: 'ribbon' as const, unlocked: true },
  { id: 'hat', label: 'Wizard Hat', cost: 40, icon: 'flash' as const, unlocked: true },
  { id: 'scarf', label: 'Star Scarf', cost: 30, icon: 'star' as const, unlocked: false },
  { id: 'glasses', label: 'Cool Shades', cost: 50, icon: 'glasses' as const, unlocked: false },
  { id: 'cape', label: 'Hero Cape', cost: 80, icon: 'shield' as const, unlocked: false },
  { id: 'wings', label: 'Angel Wings', cost: 120, icon: 'sparkles' as const, unlocked: false },
];

export default function RoomScreen() {
  const [creature, setCreature] = useState<CreatureStats>({
    name: 'Sparky',
    happiness: 72,
    energy: 85,
    hunger: 45,
    xp: 320,
    level: 3,
    stage: 2,
  });
  const [creatureColor, setCreatureColor] = useState('#34D399');
  const [coins] = useState(75);
  const [activeTab, setActiveTab] = useState<'care' | 'style' | 'milestones'>('care');
  const [ownedAccessories, setOwnedAccessories] = useState<string[]>(['bow', 'hat']);
  const [equippedAccessories, setEquippedAccessories] = useState<string[]>(['bow']);

  // Animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Idle bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 1200, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Blink
    Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(blinkAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ])
    ).start();

    // Sparkle
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const doCareAction = (action: typeof CARE_ACTIONS[0]) => {
    setCreature(prev => {
      const updated = { ...prev };
      if (action.stat === 'xp') {
        updated.xp += action.amount;
        if (updated.xp >= (updated.level + 1) * 100) {
          updated.level += 1;
          if (updated.level >= 5 && updated.stage < 4) updated.stage += 1;
        }
      } else {
        (updated as any)[action.stat] = Math.min(100, (updated as any)[action.stat] + action.amount);
      }
      return updated;
    });

    // Heart burst animation
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(heartAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const overallMood = Math.round((creature.happiness + creature.energy + creature.hunger) / 3);
  const moodLabel = overallMood >= 80 ? 'Ecstatic' : overallMood >= 60 ? 'Happy' : overallMood >= 40 ? 'Content' : overallMood >= 20 ? 'Sad' : 'Distressed';
  const moodColor = overallMood >= 80 ? '#34D399' : overallMood >= 60 ? '#60A5FA' : overallMood >= 40 ? '#FBBF24' : '#F87171';
  const xpToNext = (creature.level + 1) * 100;
  const xpProgress = (creature.xp % 100) / 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Gradient colors={['#6366F1', '#8B5CF6', '#A78BFA']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>My Creature</Text>
            <Text style={styles.headerSub}>{creature.name} · {STAGE_NAMES[creature.stage]}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.coinBadge}>
              <Ionicons name="diamond" size={14} color="#FBBF24" />
              <Text style={styles.coinText}>{coins}</Text>
            </View>
            <View style={styles.moodBadge}>
              <View style={[styles.moodDot, { backgroundColor: moodColor }]} />
              <Text style={styles.moodText}>{moodLabel}</Text>
            </View>
          </View>
        </View>
      </Gradient>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Creature Display Arena */}
        <View style={styles.arenaContainer}>
          <Gradient colors={['#1E1B4B', '#312E81', '#3730A3']} style={styles.arena} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <Animated.View
                key={i}
                style={[styles.particle, {
                  left: `${15 + i * 14}%`,
                  top: `${10 + (i % 3) * 25}%`,
                  width: 4 + i % 3 * 2,
                  height: 4 + i % 3 * 2,
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: i % 2 === 0 ? [0.2, 0.8, 0.2] : [0.8, 0.2, 0.8],
                  }),
                }]}
              />
            ))}

            {/* Ground glow */}
            <View style={styles.groundGlow} />

            {/* The Creature */}
            <View style={styles.creatureStage}>
              <CreatureBody stage={creature.stage} color={creatureColor} blink={blinkAnim} bounce={bounceAnim} />

              {/* Heart reaction */}
              <Animated.View style={[styles.heartReaction, {
                opacity: heartAnim,
                transform: [{ translateY: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) },
                  { scale: heartAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.2, 1] }) }],
              }]}>
                <Ionicons name="heart" size={32} color="#F43F5E" />
              </Animated.View>
            </View>

            {/* Ground platform */}
            <View style={styles.platform}>
              <Gradient colors={['rgba(139,92,246,0.4)', 'rgba(99,102,241,0.2)']} style={styles.platformInner} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            </View>

            {/* Level badge */}
            <View style={styles.levelBadge}>
              <Gradient colors={['#F59E0B', '#D97706']} style={styles.levelBadgeInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.levelBadgeText}>LVL {creature.level}</Text>
              </Gradient>
            </View>
          </Gradient>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsContainer}>
          <StatBar label="Happiness" value={creature.happiness} color="#EC4899" icon="heart" />
          <StatBar label="Energy" value={creature.energy} color="#8B5CF6" icon="flash" />
          <StatBar label="Hunger" value={creature.hunger} color="#F59E0B" icon="nutrition" />
        </View>

        {/* XP Progress */}
        <View style={styles.xpContainer}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Experience</Text>
            <Text style={styles.xpValue}>{creature.xp % 100}/{100} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <Gradient
              colors={['#8B5CF6', '#6366F1']}
              style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.xpStage}>
            {STAGE_NAMES[creature.stage]} → {creature.stage < 4 ? STAGE_NAMES[creature.stage + 1] : 'MAX'}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['care', 'style', 'milestones'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={tab === 'care' ? 'heart-circle' : tab === 'style' ? 'color-palette' : 'trophy'}
                size={18}
                color={activeTab === tab ? '#FFF' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'care' ? 'Care' : tab === 'style' ? 'Style' : 'Growth'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'care' && (
            <View style={styles.careGrid}>
              {CARE_ACTIONS.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.careCard}
                  onPress={() => doCareAction(action)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.careIconCircle, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon} size={28} color={action.color} />
                  </View>
                  <Text style={styles.careLabel}>{action.label}</Text>
                  <Text style={styles.careEffect}>+{action.amount} {action.stat}</Text>
                  <View style={[styles.careBadge, { backgroundColor: action.color + '30' }]}>
                    <Text style={[styles.careBadgeText, { color: action.color }]}>{action.cooldown}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'style' && (
            <View>
              {/* Color Picker */}
              <Text style={styles.sectionTitle}>Creature Color</Text>
              <View style={styles.colorRow}>
                {CREATURE_COLORS.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.colorOption, creatureColor === c.color && styles.colorOptionActive]}
                    onPress={() => setCreatureColor(c.color)}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: c.color }]} />
                    <Text style={styles.colorLabel}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Accessories */}
              <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Accessories</Text>
              <View style={styles.accessoryGrid}>
                {ACCESSORIES.map(acc => {
                  const owned = ownedAccessories.includes(acc.id);
                  const equipped = equippedAccessories.includes(acc.id);
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.accessoryCard, equipped && styles.accessoryEquipped, !acc.unlocked && !owned && styles.accessoryLocked]}
                      onPress={() => {
                        if (equipped) {
                          setEquippedAccessories(prev => prev.filter(a => a !== acc.id));
                        } else if (owned) {
                          setEquippedAccessories(prev => [...prev, acc.id]);
                        }
                      }}
                    >
                      <View style={[styles.accessoryIcon, { backgroundColor: equipped ? '#8B5CF620' : '#2A2A4A' }]}>
                        <Ionicons name={acc.icon} size={24} color={equipped ? '#8B5CF6' : '#888'} />
                      </View>
                      <Text style={styles.accessoryLabel}>{acc.label}</Text>
                      {owned ? (
                        <View style={[styles.accessoryBadge, equipped ? styles.equippedBadge : styles.ownedBadge]}>
                          <Text style={styles.accessoryBadgeText}>{equipped ? 'Worn' : 'Equip'}</Text>
                        </View>
                      ) : (
                        <View style={styles.accessoryBadge}>
                          <Ionicons name="diamond" size={10} color="#FBBF24" />
                          <Text style={[styles.accessoryBadgeText, { color: '#FBBF24' }]}> {acc.cost}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {activeTab === 'milestones' && (
            <View>
              {[
                { stage: 0, title: 'Hatched!', desc: 'Your creature was born', xp: 0, done: creature.stage >= 1 },
                { stage: 1, title: 'First Steps', desc: 'Grew a tail and started walking', xp: 100, done: creature.stage >= 2 },
                { stage: 2, title: 'Taking Flight', desc: 'Sprouted wings and learned to glide', xp: 300, done: creature.stage >= 3 },
                { stage: 3, title: 'Coming of Age', desc: 'Grew mighty horns and doubled in size', xp: 600, done: creature.stage >= 4 },
                { stage: 4, title: 'Legendary Form', desc: 'Achieved the ultimate majestic form with a golden crown', xp: 1000, done: false },
              ].map((milestone, idx) => (
                <View key={idx} style={[styles.milestoneRow, milestone.done && styles.milestoneDone]}>
                  <View style={[styles.milestoneIcon, milestone.done ? styles.milestoneIconDone : styles.milestoneIconPending]}>
                    {milestone.done ? (
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    ) : (
                      <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.4)" />
                    )}
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text style={[styles.milestoneTitle, !milestone.done && styles.milestoneTitleLocked]}>
                      {milestone.title}
                    </Text>
                    <Text style={styles.milestoneDesc}>{milestone.desc}</Text>
                  </View>
                  <Text style={[styles.milestoneXp, milestone.done && { color: '#34D399' }]}>
                    {milestone.xp} XP
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: spacing.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Bar Component ───
function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={styles.statBar}>
      <View style={styles.statBarHeader}>
        <View style={styles.statBarLeft}>
          <Ionicons name={icon as any} size={14} color={color} />
          <Text style={styles.statBarLabel}>{label}</Text>
        </View>
        <Text style={[styles.statBarValue, { color }]}>{value}%</Text>
      </View>
      <View style={styles.statBarTrack}>
        <View style={[styles.statBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Creature Styles ───
const creatureStyles = StyleSheet.create({
  creatureRoot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  creatureShadow: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 100,
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  belly: {
    position: 'absolute',
    bottom: '15%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  bellyStripe: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
  },
  head: {
    position: 'absolute',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: -4,
  },
  eye: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeWhite: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eyePupil: {
    width: '55%',
    height: '55%',
    backgroundColor: '#1E1B4B',
    borderRadius: 100,
  },
  eyeShine: {
    position: 'absolute',
    top: '18%',
    right: '22%',
    width: '22%',
    height: '22%',
    backgroundColor: '#FFF',
    borderRadius: 100,
  },
  mouth: {
    marginTop: 2,
    width: 16,
    height: 8,
    overflow: 'hidden',
  },
  mouthCurve: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E1B4B',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -10,
  },
  cheek: {
    position: 'absolute',
    width: 10,
    height: 6,
    borderRadius: 5,
    backgroundColor: 'rgba(236,72,153,0.3)',
    top: '58%',
  },
  cheekLeft: { left: '8%' },
  cheekRight: { right: '8%' },
  earLeft: {
    position: 'absolute',
    top: -6,
    left: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    transform: [{ rotate: '-20deg' }],
  },
  earRight: {
    position: 'absolute',
    top: -6,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    transform: [{ rotate: '20deg' }],
  },
  horn: {
    position: 'absolute',
    top: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hornLeft: { left: 8 },
  hornRight: { right: 8 },
  crown: {
    position: 'absolute',
    top: -22,
    width: 32,
    height: 16,
  },
  crownBase: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 8,
    backgroundColor: '#FBBF24',
    borderRadius: 2,
  },
  crownPoint: {
    position: 'absolute',
    top: 0,
    width: 6,
    height: 10,
    backgroundColor: '#FBBF24',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  wing: {
    position: 'absolute',
    bottom: '30%',
    borderRadius: 30,
    zIndex: 1,
    opacity: 0.8,
  },
  wingLeft: {},
  wingRight: {},
  wingInner: {
    position: 'absolute',
    bottom: '20%',
    left: '20%',
    width: '60%',
    height: '50%',
    borderRadius: 20,
    opacity: 0.5,
  },
  tail: {
    position: 'absolute',
    bottom: '20%',
    borderRadius: 6,
    zIndex: 1,
  },
  tailTip: {
    position: 'absolute',
    bottom: -4,
    left: '10%',
    width: '80%',
    height: 10,
    borderRadius: 5,
  },
  paw: {
    position: 'absolute',
    width: 16,
    height: 20,
    borderRadius: 8,
    bottom: '35%',
    zIndex: 3,
  },
  pawLeft: { left: -10 },
  pawRight: { right: -10 },
  foot: {
    position: 'absolute',
    width: 22,
    height: 12,
    borderRadius: 6,
    bottom: -4,
    zIndex: 3,
  },
  footLeft: { left: '25%' },
  footRight: { right: '25%' },
});

// ─── Screen Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0D2E' },

  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 22, color: '#FFF' },
  headerSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  coinText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFF' },
  moodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  moodText: { fontFamily: fonts.semiBold, fontSize: 12, color: '#FFF' },

  // Arena
  arenaContainer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  arena: {
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#A78BFA',
    borderRadius: 10,
  },
  groundGlow: {
    position: 'absolute',
    bottom: 20,
    width: '60%',
    height: 40,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderRadius: 100,
  },
  creatureStage: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heartReaction: {
    position: 'absolute',
    top: -20,
    zIndex: 20,
  },
  platform: {
    position: 'absolute',
    bottom: 10,
    width: '50%',
    height: 20,
    borderRadius: 100,
    overflow: 'hidden',
  },
  platformInner: { flex: 1, borderRadius: 100 },
  levelBadge: { position: 'absolute', top: 12, right: 12, borderRadius: 12, overflow: 'hidden' },
  levelBadgeInner: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  levelBadgeText: { fontFamily: fonts.extraBold, fontSize: 12, color: '#FFF' },

  // Stats
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statBar: {},
  statBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statBarLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statBarValue: { fontFamily: fonts.bold, fontSize: 12 },
  statBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // XP
  xpContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontFamily: fonts.bold, fontSize: 14, color: '#FFF' },
  xpValue: { fontFamily: fonts.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  xpBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: { height: '100%', borderRadius: 5 },
  xpStage: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, textAlign: 'center' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.xl,
    padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: borderRadius.lg, gap: 6,
  },
  tabActive: { backgroundColor: '#8B5CF6' },
  tabText: { fontFamily: fonts.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  tabTextActive: { color: '#FFF' },

  // Tab content
  tabContent: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },

  // Care
  careGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  careCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  careIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  careLabel: { fontFamily: fonts.bold, fontSize: 14, color: '#FFF', marginBottom: 2 },
  careEffect: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  careBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  careBadgeText: { fontFamily: fonts.semiBold, fontSize: 10 },

  // Style
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#FFF', marginBottom: spacing.md },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  colorOption: {
    width: '30%', alignItems: 'center', padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.lg,
    borderWidth: 2, borderColor: 'transparent',
  },
  colorOptionActive: { borderColor: '#8B5CF6' },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, marginBottom: 4 },
  colorLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  accessoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  accessoryCard: {
    width: '31%', alignItems: 'center', padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.xl,
    borderWidth: 2, borderColor: 'transparent',
  },
  accessoryEquipped: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)' },
  accessoryLocked: { opacity: 0.4 },
  accessoryIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  accessoryLabel: { fontFamily: fonts.semiBold, fontSize: 10, color: '#FFF', textAlign: 'center', marginBottom: 4 },
  accessoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  equippedBadge: { backgroundColor: '#8B5CF630' },
  ownedBadge: { backgroundColor: 'rgba(255,255,255,0.1)' },
  accessoryBadgeText: { fontFamily: fonts.bold, fontSize: 9, color: '#FFF' },

  // Milestones
  milestoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  milestoneDone: {},
  milestoneIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneIconDone: { backgroundColor: '#34D399' },
  milestoneIconPending: { backgroundColor: 'rgba(255,255,255,0.1)' },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontFamily: fonts.bold, fontSize: 14, color: '#FFF' },
  milestoneTitleLocked: { color: 'rgba(255,255,255,0.4)' },
  milestoneDesc: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  milestoneXp: { fontFamily: fonts.bold, fontSize: 12, color: 'rgba(255,255,255,0.3)' },
});
