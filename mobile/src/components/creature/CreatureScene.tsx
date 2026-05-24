/**
 * <CreatureScene /> — optional habitat wrapper for marquee screens.
 *
 * Renders a soft radial-gradient backdrop tinted by the species
 * `habitatGradient`, a couple of distant silhouette accents (forest
 * leaves / cloud wisps / cliff rocks), and 2–4 ambient particles that
 * drift gently upward.
 *
 * Used by the Hub centerpiece, the hatch overlay, and the evolution
 * overlay. The creature itself is rendered by <Creature/> on top.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { Creature, type CreatureProps } from './Creature';
import { CREATURE_SPECS } from '@/constants/creatureSpec';
import type { CreatureSpecies } from '@/api/creatures.api';

export interface CreatureSceneProps extends CreatureProps {
  /** Whether to render the habitat backdrop at all (default false). */
  showHabitat?: boolean;
  /** 'subtle' = quiet hub centerpiece; 'full' = denser for hatch + evolution. */
  habitatVariant?: 'subtle' | 'full';
}

export function CreatureScene({
  showHabitat = false,
  habitatVariant = 'subtle',
  ...creatureProps
}: CreatureSceneProps) {
  const size = creatureProps.size ?? 220;
  const sceneSize = size * 1.4;

  return (
    <View style={[styles.wrap, { width: sceneSize, height: sceneSize }]}>
      {showHabitat && (
        <View style={StyleSheet.absoluteFill}>
          <HabitatBackdrop
            species={creatureProps.species}
            size={sceneSize}
            variant={habitatVariant}
          />
          <AmbientParticles
            species={creatureProps.species}
            size={sceneSize}
            count={habitatVariant === 'full' ? 4 : 2}
          />
        </View>
      )}
      <View style={styles.center}>
        <Creature {...creatureProps} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Habitat backdrop — radial gradient + distant silhouette accents.
// ---------------------------------------------------------------------------
function HabitatBackdrop({
  species,
  size,
  variant,
}: {
  species: CreatureSpecies;
  size: number;
  variant: 'subtle' | 'full';
}) {
  const spec = CREATURE_SPECS[species];
  const [light, deep] = spec.habitatGradient;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`hab-${species}`} cx="50%" cy="55%" r="65%">
          <Stop offset="0%" stopColor={light} stopOpacity={variant === 'full' ? 0.95 : 0.7} />
          <Stop offset="80%" stopColor={deep} stopOpacity={variant === 'full' ? 0.65 : 0.35} />
          <Stop offset="100%" stopColor={deep} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={100} cy={110} r={100} fill={`url(#hab-${species})`} />

      {/* Species-specific silhouette accents */}
      {species === 'FOREST_PUP' && (
        <>
          <Path d="M -10 200 q 30 -40 60 -10 q 10 -30 50 -10 q 20 -40 60 -8 q 30 -30 50 8 L 210 220 L -10 220 z" fill={spec.palette.bodyDark} opacity={0.18} />
          <Ellipse cx={28} cy={64} rx={14} ry={9} fill={spec.palette.bodyDark} opacity={0.12} />
          <Ellipse cx={176} cy={50} rx={20} ry={12} fill={spec.palette.bodyDark} opacity={0.10} />
        </>
      )}
      {species === 'SKY_SPRITE' && (
        <>
          <Ellipse cx={42} cy={58} rx={36} ry={14} fill="#FFFFFF" opacity={0.55} />
          <Ellipse cx={158} cy={44} rx={28} ry={10} fill="#FFFFFF" opacity={0.45} />
          <Ellipse cx={180} cy={80} rx={20} ry={7} fill="#FFFFFF" opacity={0.4} />
        </>
      )}
      {species === 'STONE_CUB' && (
        <>
          <Path d="M -10 200 L 40 150 L 80 180 L 130 140 L 180 175 L 210 160 L 210 220 L -10 220 z" fill={spec.palette.bodyDark} opacity={0.22} />
          <Path d="M 20 200 L 50 170 L 70 200 z" fill={spec.palette.accent} opacity={0.25} />
          <Path d="M 150 200 L 170 175 L 195 200 z" fill={spec.palette.accent} opacity={0.22} />
        </>
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Ambient particles — small drifting dots animated upward in a loop.
// ---------------------------------------------------------------------------
function AmbientParticles({
  species,
  size,
  count,
}: {
  species: CreatureSpecies;
  size: number;
  count: number;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Particle key={i} index={i} species={species} parentSize={size} />
      ))}
    </View>
  );
}

function Particle({ index, species, parentSize }: { index: number; species: CreatureSpecies; parentSize: number }) {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0.3);
  const seed = (index * 137) % 100;
  const left = (parentSize * (0.15 + (seed % 70) / 100)) - parentSize / 2;
  const startTop = parentSize * 0.7;
  const dist = parentSize * 0.6;
  const duration = 4500 + (seed % 1500);

  useEffect(() => {
    ty.value = withRepeat(
      withTiming(-dist, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withTiming(0.8, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [ty, opacity, dist, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: opacity.value,
  }));

  const color = CREATURE_SPECS[species].palette.sparkle;
  const dotSize = species === 'SKY_SPRITE' ? 5 : 4;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: parentSize / 2 + left,
          top: startTop,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
