/**
 * Shared helpers for the per-species SVG creatures.
 *
 * - VIEWBOX (200x200) — all species draw in the same coordinate system so
 *   the parent <Svg/> can simply forward width/height and stage scaling.
 * - Egg renderer — species-tinted oval shell, mottled spots, optional
 *   crack hint, soft outer aura.
 * - Emotion overlays — glow, sparkles, zzz, sad lid arc, sad tear.
 */
import React from 'react';
import { G, Ellipse, Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import type { CreaturePalette, EmotionState } from '@/constants/creatureSpec';
import { Glow } from '../parts/Glow';
import { Sparkle } from '../parts/Sparkle';
import { Zzz } from '../parts/Zzz';

export const VB = 200;
export const CENTER = VB / 2; // 100

/**
 * Egg — used as the EGG stage drawing for all 3 species. Differs only by
 * palette (shell + mottled spot tint). A subtle outer aura is always on,
 * plus a barely-visible vertical "crack hint" line.
 */
export function EggDrawing({ palette }: { palette: CreaturePalette }) {
  const cx = CENTER;
  const cy = CENTER + 6;
  const rx = 60;
  const ry = 78;
  return (
    <G>
      {/* Soft outer aura */}
      <Glow cx={cx} cy={cy} r={rx + 28} color={palette.glow} intensity={0.45} id="egg-aura" />
      <Defs>
        <LinearGradient id="egg-fill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={palette.eggSpot} stopOpacity={0.35} />
          <Stop offset="20%" stopColor={palette.egg} stopOpacity={1} />
          <Stop offset="100%" stopColor={palette.eggSpot} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      {/* Shell */}
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#egg-fill)" stroke={palette.bodyDark} strokeWidth={1.2} opacity={0.95} />
      {/* Highlight ellipse top-left */}
      <Ellipse cx={cx - rx * 0.35} cy={cy - ry * 0.42} rx={rx * 0.3} ry={ry * 0.22} fill="#FFFFFF" opacity={0.55} />
      {/* Mottled spots */}
      <Ellipse cx={cx - 12} cy={cy + 14} rx={9} ry={6} fill={palette.eggSpot} opacity={0.55} />
      <Ellipse cx={cx + 18} cy={cy - 4} rx={7} ry={5} fill={palette.eggSpot} opacity={0.5} />
      <Ellipse cx={cx + 8} cy={cy + 34} rx={6} ry={4} fill={palette.eggSpot} opacity={0.45} />
      {/* Crack hint */}
      <Path
        d={`M ${cx - 4} ${cy - 28} l 3 6 l -4 4 l 5 5 l -2 6`}
        stroke={palette.bodyDark}
        strokeWidth={1}
        fill="none"
        opacity={0.35}
        strokeLinecap="round"
      />
    </G>
  );
}

/**
 * Emotion-driven overlay container. Wrap a species body in this — the
 * overlay renders OVER the body (glow renders behind via the outer
 * `behindBody` slot, sparkles + zzz render in front).
 *
 * Use `<EmotionBackdrop/>` BEFORE the body and `<EmotionForeground/>` AFTER.
 */
export function EmotionBackdrop({
  emotion,
  palette,
}: {
  emotion: EmotionState;
  palette: CreaturePalette;
}) {
  if (emotion === 'EXCITED') {
    return <Glow cx={CENTER} cy={CENTER + 10} r={100} color={palette.glow} intensity={0.7} id="excited-glow" />;
  }
  return null;
}

export function EmotionForeground({
  emotion,
  palette,
}: {
  emotion: EmotionState;
  palette: CreaturePalette;
}) {
  if (emotion === 'EXCITED') {
    return (
      <G>
        <Sparkle x={60} y={50} size={14} color={palette.sparkle} />
        <Sparkle x={145} y={42} size={11} color={palette.sparkle} opacity={0.9} />
        <Sparkle x={160} y={120} size={9} color={palette.sparkle} opacity={0.85} />
        <Sparkle x={36} y={110} size={8} color={palette.sparkle} opacity={0.8} />
      </G>
    );
  }
  if (emotion === 'SLEEPING') {
    return <Zzz x={140} y={50} color={palette.pupil} size={11} />;
  }
  if (emotion === 'SAD') {
    // Tear from left eye corner.
    return (
      <G>
        <Path
          d={`M 85 110 q -2 6 0 10 q 3 -4 0 -10 z`}
          fill="#7CC4F2"
          opacity={0.9}
        />
        {/* Muted overlay across body */}
        <Circle cx={CENTER} cy={CENTER + 20} r={70} fill="#1B2A4E" opacity={0.08} />
      </G>
    );
  }
  return null;
}

/** Apply a soft tilt for sad / curl for sleeping at the species G level. */
export function emotionBodyTransform(emotion: EmotionState): string {
  if (emotion === 'SAD') return `rotate(2 ${CENTER} ${CENTER + 20})`;
  if (emotion === 'SLEEPING') return `rotate(-6 ${CENTER} ${CENTER + 30}) translate(-2 6)`;
  return '';
}

/** Eye gaze override per emotion. */
export function emotionGaze(emotion: EmotionState): 'forward' | 'down' | 'closed' {
  if (emotion === 'SAD') return 'down';
  if (emotion === 'SLEEPING') return 'closed';
  return 'forward';
}

/** Sad eyes get a half-lid drop. */
export function emotionLidDrop(emotion: EmotionState): number {
  return emotion === 'SAD' ? 0.45 : 0;
}
