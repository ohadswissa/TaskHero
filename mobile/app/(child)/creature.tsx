import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient } from '@/components/common/Gradient';
import { Card } from '@/components/common';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fonts } from '@/theme';

const { width: SW } = Dimensions.get('window');

// ─── Activity state the creature can be in ───
type CreatureActivity = 'idle' | 'sleeping' | 'eating' | 'playing' | 'training' | 'bathing' | 'petting';

// ─── Creature Eye ───
function CreatureEye({ size = 22, x = 0, blink, activity }: { size?: number; x?: number; blink: Animated.Value; activity: CreatureActivity }) {
  const isSleeping = activity === 'sleeping';
  return (
    <View style={[cS.eye, { width: size, height: size, transform: [{ translateX: x }] }]}>
      <View style={cS.eyeWhite}>
        {isSleeping ? (
          // Sleeping: closed eyes (horizontal line)
          <View style={{ width: '60%', height: 2, backgroundColor: '#1E1B4B', borderRadius: 1 }} />
        ) : (
          <>
            <Animated.View style={[cS.eyePupil, { transform: [{ scaleY: blink }] }]} />
            <View style={cS.eyeShine} />
          </>
        )}
      </View>
    </View>
  );
}

// ─── Creature Body ───
function CreatureBody({ stage, color, blink, bounce, activity, reactionAnim }: {
  stage: number; color: string; blink: Animated.Value; bounce: Animated.Value;
  activity: CreatureActivity; reactionAnim: Animated.Value;
}) {
  const bodySize = 100 + stage * 20;
  const headSize = 60 + stage * 8;
  const hasWings = stage >= 2;
  const hasTail = stage >= 1;
  const hasHorns = stage >= 3;
  const hasCrown = stage >= 4;

  // Activity-based transforms
  const activityTransform = activity === 'playing'
    ? [{ translateY: reactionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -25, 0] }) },
       { rotate: reactionAnim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '-8deg', '0deg', '8deg', '0deg'] }) }]
    : activity === 'eating'
    ? [{ translateY: bounce }, { scaleY: reactionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1] }) }]
    : activity === 'sleeping'
    ? [{ translateY: bounce }, { rotate: '5deg' }]
    : activity === 'training'
    ? [{ translateY: reactionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -15, 0] }) },
       { scaleX: reactionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) }]
    : activity === 'bathing'
    ? [{ translateY: bounce }, { rotate: reactionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-3deg', '3deg', '-3deg'] }) }]
    : [{ translateY: bounce }];

  // Mouth shape based on activity
  const isEating = activity === 'eating';
  const isPlaying = activity === 'playing';

  return (
    <Animated.View style={[cS.creatureRoot, { transform: activityTransform }]}>
      {/* Shadow */}
      <View style={[cS.creatureShadow, { width: bodySize * 0.8, height: bodySize * 0.15 }]} />

      {/* Wings */}
      {hasWings && (
        <>
          <Animated.View style={[cS.wing, cS.wingLeft, {
            backgroundColor: color, width: 40 + stage * 8, height: 55 + stage * 10,
            left: -20 - stage * 6,
            transform: [{ rotate: '-25deg' }, { scaleY: bounce.interpolate({ inputRange: [-8, 0, 8], outputRange: [1.1, 1, 0.9] }) }],
          }]}>
            <View style={[cS.wingInner, { backgroundColor: adj(color, 20) }]} />
          </Animated.View>
          <Animated.View style={[cS.wing, cS.wingRight, {
            backgroundColor: color, width: 40 + stage * 8, height: 55 + stage * 10,
            right: -20 - stage * 6,
            transform: [{ rotate: '25deg' }, { scaleY: bounce.interpolate({ inputRange: [-8, 0, 8], outputRange: [0.9, 1, 1.1] }) }],
          }]}>
            <View style={[cS.wingInner, { backgroundColor: adj(color, 20) }]} />
          </Animated.View>
        </>
      )}

      {/* Body */}
      <View style={[cS.body, { width: bodySize, height: bodySize * 1.1, backgroundColor: color, borderRadius: bodySize * 0.45 }]}>
        <View style={[cS.belly, { width: bodySize * 0.55, height: bodySize * 0.5, borderRadius: bodySize * 0.25, backgroundColor: adj(color, 40) }]} />
        {[0, 1, 2].map(i => (
          <View key={i} style={[cS.bellyStripe, { width: bodySize * 0.3 - i * 8, top: bodySize * 0.52 + i * 10, backgroundColor: adj(color, 30) }]} />
        ))}
      </View>

      {/* Head */}
      <View style={[cS.head, { width: headSize, height: headSize, backgroundColor: color, borderRadius: headSize * 0.5, top: -headSize * 0.35 }]}>
        {hasHorns && (
          <>
            <View style={[cS.horn, cS.hornLeft, { borderBottomColor: adj(color, -30) }]} />
            <View style={[cS.horn, cS.hornRight, { borderBottomColor: adj(color, -30) }]} />
          </>
        )}
        {hasCrown && (
          <View style={cS.crown}>
            <View style={cS.crownBase} />
            {[2, 12, 22].map(l => <View key={l} style={[cS.crownPoint, { left: l }]} />)}
          </View>
        )}

        {/* Cheeks */}
        <View style={[cS.cheek, cS.cheekLeft]} />
        <View style={[cS.cheek, cS.cheekRight]} />

        {/* Eyes */}
        <View style={cS.eyeContainer}>
          <CreatureEye size={18 + stage * 2} x={-4} blink={blink} activity={activity} />
          <CreatureEye size={18 + stage * 2} x={4} blink={blink} activity={activity} />
        </View>

        {/* Mouth - changes based on activity */}
        <View style={cS.mouth}>
          {isEating ? (
            // Open mouth for eating
            <Animated.View style={[cS.mouthOpen, {
              transform: [{ scaleY: reactionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.2, 0.6] }) }],
            }]} />
          ) : isPlaying ? (
            // Big grin for playing
            <View style={cS.mouthGrin} />
          ) : activity === 'sleeping' ? (
            // Small 'o' for sleeping
            <View style={cS.mouthSleeping} />
          ) : (
            // Normal smile
            <View style={cS.mouthCurve} />
          )}
        </View>

        {/* Ears */}
        <View style={[cS.earLeft, { backgroundColor: adj(color, -15) }]} />
        <View style={[cS.earRight, { backgroundColor: adj(color, -15) }]} />
      </View>

      {/* Tail */}
      {hasTail && (
        <Animated.View style={[cS.tail, {
          backgroundColor: color, width: 12 + stage * 3, height: 40 + stage * 10,
          right: -15 - stage * 5,
          transform: [{ rotate: activity === 'playing'
            ? reactionAnim.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['-20deg', '30deg', '-20deg', '30deg', '-20deg'] })
            : bounce.interpolate({ inputRange: [-8, 0, 8], outputRange: ['-15deg', '10deg', '25deg'] }) }],
        }]}>
          <View style={[cS.tailTip, { backgroundColor: adj(color, -20) }]} />
        </Animated.View>
      )}

      {/* Paws & Feet */}
      <View style={[cS.paw, cS.pawLeft, { backgroundColor: adj(color, -10) }]} />
      <View style={[cS.paw, cS.pawRight, { backgroundColor: adj(color, -10) }]} />
      <View style={[cS.foot, cS.footLeft, { backgroundColor: adj(color, -10) }]} />
      <View style={[cS.foot, cS.footRight, { backgroundColor: adj(color, -10) }]} />
    </Animated.View>
  );
}

// ─── Floating reaction icons ───
function FloatingReaction({ icon, color, anim }: { icon: string; color: string; anim: Animated.Value }) {
  return (
    <Animated.View style={[styles.floatingIcon, {
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
        { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.3, 1] }) },
      ],
    }]}>
      <Ionicons name={icon as any} size={28} color={color} />
    </Animated.View>
  );
}

// ─── Zzz bubbles for sleeping ───
function SleepBubbles({ anim }: { anim: Animated.Value }) {
  return (
    <View style={styles.zzzContainer}>
      {[0, 1, 2].map(i => (
        <Animated.Text key={i} style={[styles.zzzText, {
          fontSize: 14 + i * 6,
          opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: i === 0 ? [0.3, 0.8, 0.3] : i === 1 ? [0.8, 0.3, 0.8] : [0.5, 1, 0.5] }),
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-i * 18, -i * 18 - 10] }) },
            { translateX: i * 12 }],
        }]}>
          Z
        </Animated.Text>
      ))}
    </View>
  );
}

// ─── Water splash for bathing ───
function WaterSplash({ anim }: { anim: Animated.Value }) {
  return (
    <View style={styles.splashContainer}>
      {[0, 1, 2, 3, 4].map(i => (
        <Animated.View key={i} style={[styles.splashDrop, {
          left: 20 + i * 22,
          opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: i % 2 === 0 ? [0, 1, 0] : [1, 0, 1] }),
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) }],
        }]} />
      ))}
    </View>
  );
}

// ─── Sweat drops for training ───
function SweatDrops({ anim }: { anim: Animated.Value }) {
  return (
    <View style={styles.sweatContainer}>
      {[0, 1].map(i => (
        <Animated.View key={i} style={[styles.sweatDrop, {
          left: i === 0 ? -30 : 30,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-5, 15] }) }],
        }]} />
      ))}
    </View>
  );
}

// Color utility
function adj(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ─── Data ───
interface CreatureStats {
  name: string;
  happiness: number;
  energy: number;
  hunger: number;
  hygiene: number;
  xp: number;
  level: number;
  stage: number;
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
  { id: 'feed', label: 'Feed', icon: 'nutrition', stat: 'hunger', amount: 25, color: '#F59E0B', desc: 'Give a tasty treat', activity: 'eating' as CreatureActivity },
  { id: 'snack', label: 'Snack', icon: 'pizza', stat: 'hunger', amount: 12, color: '#FB923C', desc: 'Quick snack break', activity: 'eating' as CreatureActivity },
  { id: 'play', label: 'Play', icon: 'game-controller', stat: 'happiness', amount: 20, color: '#EC4899', desc: 'Have fun together!', activity: 'playing' as CreatureActivity },
  { id: 'pet', label: 'Pet', icon: 'heart', stat: 'happiness', amount: 10, color: '#F43F5E', desc: 'Show some love', activity: 'petting' as CreatureActivity },
  { id: 'rest', label: 'Sleep', icon: 'moon', stat: 'energy', amount: 30, color: '#8B5CF6', desc: 'Take a cozy nap', activity: 'sleeping' as CreatureActivity },
  { id: 'bath', label: 'Bath', icon: 'water', stat: 'hygiene', amount: 35, color: '#06B6D4', desc: 'Sparkly clean!', activity: 'bathing' as CreatureActivity },
  { id: 'train', label: 'Train', icon: 'fitness', stat: 'xp', amount: 15, color: '#3B82F6', desc: 'Get stronger!', activity: 'training' as CreatureActivity },
  { id: 'heal', label: 'Heal', icon: 'medkit', stat: 'energy', amount: 15, color: '#10B981', desc: 'Restore vitality', activity: 'idle' as CreatureActivity },
];

const FOOD_ITEMS = [
  { id: 'apple', label: 'Apple', icon: 'leaf', color: '#22C55E', hunger: 10, happiness: 5 },
  { id: 'cake', label: 'Cake', icon: 'sparkles', color: '#EC4899', hunger: 20, happiness: 15 },
  { id: 'fish', label: 'Fish', icon: 'fish', color: '#3B82F6', hunger: 25, happiness: 8 },
  { id: 'star', label: 'Star Fruit', icon: 'star', color: '#FBBF24', hunger: 15, happiness: 20 },
];

export default function CreatureScreen() {
  const [creature, setCreature] = useState<CreatureStats>({
    name: 'Sparky',
    happiness: 72,
    energy: 85,
    hunger: 45,
    hygiene: 60,
    xp: 320,
    level: 3,
    stage: 2,
  });
  const [creatureColor, setCreatureColor] = useState('#34D399');
  const [coins] = useState(75);
  const [activeTab, setActiveTab] = useState<'care' | 'feed' | 'style' | 'milestones'>('care');
  const [activity, setActivity] = useState<CreatureActivity>('idle');
  const [reactionIcon, setReactionIcon] = useState<{ icon: string; color: string } | null>(null);

  // Animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const reactionAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const activityLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Idle bounce
    Animated.loop(Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -8, duration: 1200, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();

    // Blink
    Animated.loop(Animated.sequence([
      Animated.delay(3000),
      Animated.timing(blinkAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
      Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ])).start();

    // Sparkle
    Animated.loop(Animated.sequence([
      Animated.timing(sparkleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(sparkleAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  const startActivity = useCallback((act: CreatureActivity, icon: string, color: string) => {
    // Stop previous activity loop
    if (activityLoopRef.current) activityLoopRef.current.stop();

    setActivity(act);
    setReactionIcon({ icon, color });

    // Start activity animation loop
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(reactionAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(reactionAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]));
    activityLoopRef.current = loop;
    loop.start();

    // Show icon burst
    iconAnim.setValue(0);
    Animated.sequence([
      Animated.timing(iconAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(iconAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    // Return to idle after 3 seconds
    setTimeout(() => {
      if (activityLoopRef.current) activityLoopRef.current.stop();
      reactionAnim.setValue(0);
      setActivity('idle');
      setReactionIcon(null);
    }, 3000);
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

    startActivity(action.activity, action.icon, action.color);
  };

  const doFeed = (food: typeof FOOD_ITEMS[0]) => {
    setCreature(prev => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + food.hunger),
      happiness: Math.min(100, prev.happiness + food.happiness),
    }));
    startActivity('eating', 'nutrition', food.color);
  };

  const overallMood = Math.round((creature.happiness + creature.energy + creature.hunger + creature.hygiene) / 4);
  const moodLabel = overallMood >= 80 ? 'Ecstatic' : overallMood >= 60 ? 'Happy' : overallMood >= 40 ? 'Content' : overallMood >= 20 ? 'Sad' : 'Distressed';
  const moodColor = overallMood >= 80 ? '#34D399' : overallMood >= 60 ? '#60A5FA' : overallMood >= 40 ? '#FBBF24' : '#F87171';
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
        {/* Creature Arena */}
        <View style={styles.arenaContainer}>
          <Gradient colors={['#1E1B4B', '#312E81', '#3730A3']} style={styles.arena} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
            {/* Particles */}
            {[...Array(6)].map((_, i) => (
              <Animated.View key={i} style={[styles.particle, {
                left: `${15 + i * 14}%`, top: `${10 + (i % 3) * 25}%`,
                width: 4 + i % 3 * 2, height: 4 + i % 3 * 2,
                opacity: sparkleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: i % 2 === 0 ? [0.2, 0.8, 0.2] : [0.8, 0.2, 0.8] }),
              }]} />
            ))}

            {/* Activity label */}
            {activity !== 'idle' && (
              <View style={styles.activityLabel}>
                <Gradient colors={[moodColor + '90', moodColor + '40']} style={styles.activityLabelInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.activityLabelText}>
                    {activity === 'sleeping' ? 'Sleeping...' : activity === 'eating' ? 'Eating...' : activity === 'playing' ? 'Playing!' : activity === 'training' ? 'Training!' : activity === 'bathing' ? 'Bath time!' : activity === 'petting' ? 'Purring...' : ''}
                  </Text>
                </Gradient>
              </View>
            )}

            {/* Ground glow */}
            <View style={styles.groundGlow} />

            {/* Activity effects */}
            {activity === 'sleeping' && <SleepBubbles anim={sparkleAnim} />}
            {activity === 'bathing' && <WaterSplash anim={reactionAnim} />}
            {activity === 'training' && <SweatDrops anim={reactionAnim} />}

            {/* The Creature */}
            <View style={styles.creatureStage}>
              <CreatureBody
                stage={creature.stage}
                color={creatureColor}
                blink={blinkAnim}
                bounce={bounceAnim}
                activity={activity}
                reactionAnim={reactionAnim}
              />

              {/* Floating reaction icon */}
              {reactionIcon && (
                <FloatingReaction icon={reactionIcon.icon} color={reactionIcon.color} anim={iconAnim} />
              )}
            </View>

            {/* Platform */}
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

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatBar label="Happiness" value={creature.happiness} color="#EC4899" icon="heart" />
          <StatBar label="Energy" value={creature.energy} color="#8B5CF6" icon="flash" />
          <StatBar label="Hunger" value={creature.hunger} color="#F59E0B" icon="nutrition" />
          <StatBar label="Hygiene" value={creature.hygiene} color="#06B6D4" icon="water" />
        </View>

        {/* XP */}
        <View style={styles.xpContainer}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Experience</Text>
            <Text style={styles.xpValue}>{creature.xp % 100}/{100} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <Gradient colors={['#8B5CF6', '#6366F1']} style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </View>
          <Text style={styles.xpStage}>{STAGE_NAMES[creature.stage]} → {creature.stage < 4 ? STAGE_NAMES[creature.stage + 1] : 'MAX'}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {([
            { key: 'care' as const, label: 'Care', icon: 'heart-circle' },
            { key: 'feed' as const, label: 'Feed', icon: 'nutrition' },
            { key: 'style' as const, label: 'Style', icon: 'color-palette' },
            { key: 'milestones' as const, label: 'Growth', icon: 'trophy' },
          ]).map(tab => (
            <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
              <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? '#FFF' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'care' && (
            <View style={styles.careGrid}>
              {CARE_ACTIONS.map(action => (
                <TouchableOpacity key={action.id} style={styles.careCard} onPress={() => doCareAction(action)} activeOpacity={0.7}>
                  <View style={[styles.careIconCircle, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon as any} size={26} color={action.color} />
                  </View>
                  <Text style={styles.careLabel}>{action.label}</Text>
                  <Text style={styles.careDesc}>{action.desc}</Text>
                  <View style={[styles.careBadge, { backgroundColor: action.color + '30' }]}>
                    <Text style={[styles.careBadgeText, { color: action.color }]}>+{action.amount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'feed' && (
            <View>
              <Text style={styles.sectionTitle}>Choose a treat</Text>
              <View style={styles.foodGrid}>
                {FOOD_ITEMS.map(food => (
                  <TouchableOpacity key={food.id} style={styles.foodCard} onPress={() => doFeed(food)} activeOpacity={0.7}>
                    <View style={[styles.foodIcon, { backgroundColor: food.color + '20' }]}>
                      <Ionicons name={food.icon as any} size={32} color={food.color} />
                    </View>
                    <Text style={styles.foodName}>{food.label}</Text>
                    <View style={styles.foodStats}>
                      <View style={styles.foodStat}>
                        <Ionicons name="nutrition" size={10} color="#F59E0B" />
                        <Text style={styles.foodStatText}>+{food.hunger}</Text>
                      </View>
                      <View style={styles.foodStat}>
                        <Ionicons name="heart" size={10} color="#EC4899" />
                        <Text style={styles.foodStatText}>+{food.happiness}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'style' && (
            <View>
              <Text style={styles.sectionTitle}>Creature Color</Text>
              <View style={styles.colorRow}>
                {CREATURE_COLORS.map(c => (
                  <TouchableOpacity key={c.id} style={[styles.colorOption, creatureColor === c.color && styles.colorOptionActive]} onPress={() => setCreatureColor(c.color)}>
                    <View style={[styles.colorSwatch, { backgroundColor: c.color }]} />
                    <Text style={styles.colorLabel}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
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
                { stage: 4, title: 'Legendary Form', desc: 'Achieved the ultimate majestic form', xp: 1000, done: false },
              ].map((m, idx) => (
                <View key={idx} style={[styles.milestoneRow, m.done && styles.milestoneDone]}>
                  <View style={[styles.milestoneIcon, m.done ? styles.milestoneIconDone : styles.milestoneIconPending]}>
                    {m.done ? <Ionicons name="checkmark" size={18} color="#FFF" /> : <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.4)" />}
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text style={[styles.milestoneTitle, !m.done && styles.milestoneTitleLocked]}>{m.title}</Text>
                    <Text style={styles.milestoneDesc}>{m.desc}</Text>
                  </View>
                  <Text style={[styles.milestoneXp, m.done && { color: '#34D399' }]}>{m.xp} XP</Text>
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

// ─── Stat Bar ───
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
const cS = StyleSheet.create({
  creatureRoot: { alignItems: 'center', justifyContent: 'flex-end' },
  creatureShadow: { position: 'absolute', bottom: -8, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 100 },
  body: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  belly: { position: 'absolute', bottom: '15%', backgroundColor: 'rgba(255,255,255,0.3)' },
  bellyStripe: { position: 'absolute', height: 3, borderRadius: 2, alignSelf: 'center' },
  head: { position: 'absolute', zIndex: 3, alignItems: 'center', justifyContent: 'center' },
  eyeContainer: { flexDirection: 'row', gap: 12, marginTop: -4 },
  eye: { alignItems: 'center', justifyContent: 'center' },
  eyeWhite: { width: '100%', height: '100%', backgroundColor: '#FFF', borderRadius: 100, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  eyePupil: { width: '55%', height: '55%', backgroundColor: '#1E1B4B', borderRadius: 100 },
  eyeShine: { position: 'absolute', top: '18%', right: '22%', width: '22%', height: '22%', backgroundColor: '#FFF', borderRadius: 100 },
  mouth: { marginTop: 2, alignItems: 'center' },
  mouthCurve: { width: 16, height: 8, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 2, borderTopWidth: 0, borderColor: '#1E1B4B' },
  mouthOpen: { width: 12, height: 10, backgroundColor: '#1E1B4B', borderRadius: 6 },
  mouthGrin: { width: 22, height: 10, borderBottomLeftRadius: 11, borderBottomRightRadius: 11, backgroundColor: '#1E1B4B' },
  mouthSleeping: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#1E1B4B' },
  cheek: { position: 'absolute', width: 10, height: 6, borderRadius: 5, backgroundColor: 'rgba(236,72,153,0.3)', top: '58%' },
  cheekLeft: { left: '8%' },
  cheekRight: { right: '8%' },
  earLeft: { position: 'absolute', top: -6, left: 4, width: 14, height: 14, borderRadius: 7, transform: [{ rotate: '-20deg' }] },
  earRight: { position: 'absolute', top: -6, right: 4, width: 14, height: 14, borderRadius: 7, transform: [{ rotate: '20deg' }] },
  horn: { position: 'absolute', top: -14, width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  hornLeft: { left: 8 },
  hornRight: { right: 8 },
  crown: { position: 'absolute', top: -22, width: 32, height: 16 },
  crownBase: { position: 'absolute', bottom: 0, width: 32, height: 8, backgroundColor: '#FBBF24', borderRadius: 2 },
  crownPoint: { position: 'absolute', top: 0, width: 6, height: 10, backgroundColor: '#FBBF24', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  wing: { position: 'absolute', bottom: '30%', borderRadius: 30, zIndex: 1, opacity: 0.8 },
  wingLeft: {},
  wingRight: {},
  wingInner: { position: 'absolute', bottom: '20%', left: '20%', width: '60%', height: '50%', borderRadius: 20, opacity: 0.5 },
  tail: { position: 'absolute', bottom: '20%', borderRadius: 6, zIndex: 1 },
  tailTip: { position: 'absolute', bottom: -4, left: '10%', width: '80%', height: 10, borderRadius: 5 },
  paw: { position: 'absolute', width: 16, height: 20, borderRadius: 8, bottom: '35%', zIndex: 3 },
  pawLeft: { left: -10 },
  pawRight: { right: -10 },
  foot: { position: 'absolute', width: 22, height: 12, borderRadius: 6, bottom: -4, zIndex: 3 },
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
  coinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  coinText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFF' },
  moodBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  moodText: { fontFamily: fonts.semiBold, fontSize: 12, color: '#FFF' },

  arenaContainer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  arena: { height: 300, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40 },
  particle: { position: 'absolute', backgroundColor: '#A78BFA', borderRadius: 10 },
  groundGlow: { position: 'absolute', bottom: 20, width: '60%', height: 40, backgroundColor: 'rgba(139,92,246,0.2)', borderRadius: 100 },
  creatureStage: { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  floatingIcon: { position: 'absolute', top: -20, zIndex: 20 },
  platform: { position: 'absolute', bottom: 10, width: '50%', height: 20, borderRadius: 100, overflow: 'hidden' },
  platformInner: { flex: 1, borderRadius: 100 },
  levelBadge: { position: 'absolute', top: 12, right: 12, borderRadius: 12, overflow: 'hidden' },
  levelBadgeInner: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  levelBadgeText: { fontFamily: fonts.extraBold, fontSize: 12, color: '#FFF' },

  activityLabel: { position: 'absolute', top: 12, left: 12, zIndex: 20, borderRadius: 12, overflow: 'hidden' },
  activityLabelInner: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  activityLabelText: { fontFamily: fonts.bold, fontSize: 11, color: '#FFF' },

  zzzContainer: { position: 'absolute', top: 40, right: 60, zIndex: 15 },
  zzzText: { fontFamily: fonts.extraBold, color: '#A78BFA', position: 'absolute' },

  splashContainer: { position: 'absolute', bottom: 50, left: 0, right: 0, zIndex: 5, height: 30 },
  splashDrop: { position: 'absolute', width: 6, height: 10, backgroundColor: '#67E8F9', borderRadius: 3 },

  sweatContainer: { position: 'absolute', top: 80, zIndex: 15, width: 100, alignItems: 'center' },
  sweatDrop: { position: 'absolute', width: 6, height: 8, backgroundColor: '#93C5FD', borderRadius: 3 },

  statsContainer: { paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  statBar: {},
  statBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statBarLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statBarValue: { fontFamily: fonts.bold, fontSize: 12 },
  statBarTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 4 },

  xpContainer: { marginHorizontal: spacing.lg, marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.xl, padding: spacing.md },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontFamily: fonts.bold, fontSize: 14, color: '#FFF' },
  xpValue: { fontFamily: fonts.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  xpBarBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 5 },
  xpStage: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, textAlign: 'center' },

  tabRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.xl, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: borderRadius.lg, gap: 4 },
  tabActive: { backgroundColor: '#8B5CF6' },
  tabText: { fontFamily: fonts.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  tabTextActive: { color: '#FFF' },

  tabContent: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },

  careGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  careCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.xl, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  careIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  careLabel: { fontFamily: fonts.bold, fontSize: 13, color: '#FFF', marginBottom: 2 },
  careDesc: { fontFamily: fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 6 },
  careBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  careBadgeText: { fontFamily: fonts.semiBold, fontSize: 10 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#FFF', marginBottom: spacing.md },

  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  foodCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  foodIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  foodName: { fontFamily: fonts.bold, fontSize: 14, color: '#FFF', marginBottom: 6 },
  foodStats: { flexDirection: 'row', gap: spacing.md },
  foodStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  foodStatText: { fontFamily: fonts.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.6)' },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  colorOption: { width: '30%', alignItems: 'center', padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.lg, borderWidth: 2, borderColor: 'transparent' },
  colorOptionActive: { borderColor: '#8B5CF6' },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, marginBottom: 4 },
  colorLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  milestoneDone: {},
  milestoneIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  milestoneIconDone: { backgroundColor: '#34D399' },
  milestoneIconPending: { backgroundColor: 'rgba(255,255,255,0.1)' },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontFamily: fonts.bold, fontSize: 14, color: '#FFF' },
  milestoneTitleLocked: { color: 'rgba(255,255,255,0.4)' },
  milestoneDesc: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  milestoneXp: { fontFamily: fonts.bold, fontSize: 12, color: 'rgba(255,255,255,0.3)' },
});
