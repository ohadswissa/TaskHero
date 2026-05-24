/**
 * Glow — radial-gradient halo rendered behind the creature body when the
 * EXCITED emotion is active (or as the soft EGG aura).
 *
 * The radial gradient must live inside <Defs> in the parent <Svg/>; this
 * component renders both the <Defs/> and the consuming <Circle/>. Pass a
 * unique `id` to avoid collisions when multiple creatures render in the
 * same parent <Svg/> (e.g. the gallery grid renders one <Svg/> per cell
 * so the default id is fine — collisions can't occur).
 */
import React from 'react';
import { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface GlowProps {
  cx: number;
  cy: number;
  /** outer radius of the glow */
  r: number;
  color: string;
  /** peak opacity at center (0–1) */
  intensity?: number;
  /** unique gradient id within the parent <Svg/> */
  id?: string;
}

export function Glow({ cx, cy, r, color, intensity = 0.55, id = 'creature-glow' }: GlowProps) {
  return (
    <>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={intensity} />
          <Stop offset="60%" stopColor={color} stopOpacity={intensity * 0.4} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </>
  );
}
