/**
 * SkySprite — pale azure/lavender ethereal heart-trait creature with
 * wisp wings, almond-pointed ear tips, and a cyan inner glow.
 *
 * Stages:
 *   - EGG: pearlescent blue shell.
 *   - BABY: round, glowing, tiny ear points, no wings yet.
 *   - ADOLESCENT: first wisp wings sprouting at sides, taller silhouette.
 *   - ADULT: full ethereal wings, longer ears, trailing wisps.
 */
import React from 'react';
import { G, Ellipse, Path, Circle } from 'react-native-svg';
import type { CreatureSpec, EmotionState } from '@/constants/creatureSpec';
import type { EvolutionStage } from '@/api/creatures.api';
import { Eye } from '../parts/Eye';
import { Glow } from '../parts/Glow';
import {
  CENTER,
  EggDrawing,
  EmotionBackdrop,
  EmotionForeground,
  emotionBodyTransform,
  emotionGaze,
  emotionLidDrop,
} from './shared';
import type { SpeciesBodyProps } from './ForestPup';

export function SkySpriteBody({ spec, stage, emotion, blink = 1 }: SpeciesBodyProps) {
  if (stage === 'EGG') {
    return <EggDrawing palette={spec.palette} />;
  }
  const p = spec.palette;
  const tx = emotionBodyTransform(emotion);
  const gaze = emotionGaze(emotion);
  const lid = emotionLidDrop(emotion);

  return (
    <G>
      <EmotionBackdrop emotion={emotion} palette={p} />
      {/* Inner-glow halo always on for Sky Sprite, intensity varies a touch. */}
      <Glow cx={CENTER} cy={CENTER + 20} r={88} color={p.glow} intensity={0.35} id="sky-aura" />
      <G transform={tx}>
        {stage === 'BABY' && <SkySpriteBaby p={p} gaze={gaze} lid={lid} blink={blink} />}
        {stage === 'ADOLESCENT' && <SkySpriteAdolescent p={p} gaze={gaze} lid={lid} blink={blink} />}
        {stage === 'ADULT' && <SkySpriteAdult p={p} gaze={gaze} lid={lid} blink={blink} />}
      </G>
      <EmotionForeground emotion={emotion} palette={p} />
    </G>
  );
}

function SkySpriteBaby({ p, gaze, lid, blink }: {
  p: CreatureSpec['palette']; gaze: 'forward' | 'down' | 'closed'; lid: number; blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      <Ellipse cx={cx} cy={172} rx={36} ry={5} fill="#000" opacity={0.10} />
      {/* Body — small round teardrop */}
      <Path
        d={`M ${cx} 92 q -38 8 -34 60 q 8 28 34 28 q 26 0 34 -28 q 4 -52 -34 -60 z`}
        fill={p.body}
        stroke={p.bodyDark}
        strokeWidth={1}
      />
      <Ellipse cx={cx} cy={144} rx={22} ry={14} fill={p.bodyLight} opacity={0.7} />
      {/* Tiny arm wisps */}
      <Path d={`M ${cx - 30} 130 q -10 6 -6 18`} stroke={p.bodyDark} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />
      <Path d={`M ${cx + 30} 130 q 10 6 6 18`} stroke={p.bodyDark} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />
      {/* Almond-pointed ears */}
      <Path
        d={`M ${cx - 22} 70 q -10 -22 -20 -28 q 4 18 14 32 z`}
        fill={p.body}
        stroke={p.bodyDark}
        strokeWidth={0.8}
      />
      <Path
        d={`M ${cx + 22} 70 q 10 -22 20 -28 q -4 18 -14 32 z`}
        fill={p.body}
        stroke={p.bodyDark}
        strokeWidth={0.8}
      />
      {/* Inner ear lavender */}
      <Path d={`M ${cx - 24} 68 q -4 -12 -10 -18`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 24} 68 q 4 -12 10 -18`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Cheek lavender blush */}
      <Ellipse cx={cx - 24} cy={110} rx={6} ry={4} fill={p.accent} opacity={0.4} />
      <Ellipse cx={cx + 24} cy={110} rx={6} ry={4} fill={p.accent} opacity={0.4} />
      {/* Eyes — huge violet */}
      <G transform={`translate(${cx - 16} 96)`}>
        <Eye width={17} height={22 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 16} 96)`}>
        <Eye width={17} height={22 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      {/* Soft smile */}
      <Path d={`M ${cx - 6} 122 q 6 5 12 0`} stroke={p.pupil} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      {/* Floating shine dot above head */}
      <Circle cx={cx} cy={52} r={3} fill={p.sparkle} opacity={0.95} />
    </G>
  );
}

function SkySpriteAdolescent({ p, gaze, lid, blink }: {
  p: CreatureSpec['palette']; gaze: 'forward' | 'down' | 'closed'; lid: number; blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      <Ellipse cx={cx} cy={178} rx={40} ry={5} fill="#000" opacity={0.10} />
      {/* First wisp wings */}
      <Path
        d={`M ${cx - 38} 120 q -30 -12 -34 12 q -2 22 30 18 q -4 -16 4 -30 z`}
        fill={p.bodyLight}
        opacity={0.85}
        stroke={p.accent}
        strokeWidth={0.8}
      />
      <Path
        d={`M ${cx + 38} 120 q 30 -12 34 12 q 2 22 -30 18 q 4 -16 -4 -30 z`}
        fill={p.bodyLight}
        opacity={0.85}
        stroke={p.accent}
        strokeWidth={0.8}
      />
      {/* Body — taller teardrop */}
      <Path
        d={`M ${cx} 80 q -42 6 -38 70 q 8 30 38 30 q 30 0 38 -30 q 4 -64 -38 -70 z`}
        fill={p.body}
        stroke={p.bodyDark}
        strokeWidth={1}
      />
      <Ellipse cx={cx} cy={150} rx={26} ry={16} fill={p.bodyLight} opacity={0.6} />
      {/* Almond ears — taller */}
      <Path d={`M ${cx - 24} 68 q -14 -28 -26 -36 q 4 24 18 42 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx + 24} 68 q 14 -28 26 -36 q -4 24 -18 42 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx - 28} 62 q -6 -16 -14 -24`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 28} 62 q 6 -16 14 -24`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx={cx - 24} cy={108} rx={5} ry={3} fill={p.accent} opacity={0.4} />
      <Ellipse cx={cx + 24} cy={108} rx={5} ry={3} fill={p.accent} opacity={0.4} />
      {/* Eyes */}
      <G transform={`translate(${cx - 14} 94)`}>
        <Eye width={15} height={18 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 14} 94)`}>
        <Eye width={15} height={18 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <Path d={`M ${cx - 6} 118 q 6 6 12 0`} stroke={p.pupil} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      {/* Star dust */}
      <Circle cx={cx} cy={46} r={3} fill={p.sparkle} opacity={0.95} />
      <Circle cx={cx + 24} cy={56} r={1.5} fill={p.sparkle} opacity={0.7} />
    </G>
  );
}

function SkySpriteAdult({ p, gaze, lid, blink }: {
  p: CreatureSpec['palette']; gaze: 'forward' | 'down' | 'closed'; lid: number; blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      <Ellipse cx={cx} cy={184} rx={46} ry={6} fill="#000" opacity={0.12} />
      {/* Full ethereal wings */}
      <Path
        d={`M ${cx - 42} 110 q -54 -28 -56 26 q 4 36 60 22 q -10 -20 -4 -48 z`}
        fill={p.bodyLight}
        opacity={0.85}
        stroke={p.accent}
        strokeWidth={1}
      />
      <Path
        d={`M ${cx + 42} 110 q 54 -28 56 26 q -4 36 -60 22 q 10 -20 4 -48 z`}
        fill={p.bodyLight}
        opacity={0.85}
        stroke={p.accent}
        strokeWidth={1}
      />
      {/* Inner wing wisp lines */}
      <Path d={`M ${cx - 30} 116 q -22 -6 -36 12`} stroke={p.accent} strokeWidth={1.2} fill="none" opacity={0.7} />
      <Path d={`M ${cx + 30} 116 q 22 -6 36 12`} stroke={p.accent} strokeWidth={1.2} fill="none" opacity={0.7} />
      {/* Body */}
      <Path
        d={`M ${cx} 70 q -44 6 -40 74 q 8 34 40 34 q 32 0 40 -34 q 4 -68 -40 -74 z`}
        fill={p.body}
        stroke={p.bodyDark}
        strokeWidth={1.2}
      />
      <Ellipse cx={cx} cy={148} rx={28} ry={18} fill={p.bodyLight} opacity={0.6} />
      {/* Ears — long sweeping */}
      <Path d={`M ${cx - 26} 60 q -18 -34 -32 -44 q 4 30 22 50 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx + 26} 60 q 18 -34 32 -44 q -4 30 -22 50 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx - 30} 54 q -8 -18 -18 -30`} stroke={p.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 30} 54 q 8 -18 18 -30`} stroke={p.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      {/* Eyes — calm */}
      <G transform={`translate(${cx - 14} 88)`}>
        <Eye width={15} height={14 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 14} 88)`}>
        <Eye width={15} height={14 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <Path d={`M ${cx - 8} 114 q 8 6 16 0`} stroke={p.pupil} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      {/* Crown shine */}
      <Circle cx={cx} cy={42} r={4} fill={p.sparkle} opacity={1} />
      <Circle cx={cx - 18} cy={50} r={2} fill={p.sparkle} opacity={0.7} />
      <Circle cx={cx + 18} cy={50} r={2} fill={p.sparkle} opacity={0.7} />
      {/* Heart pendant */}
      <Path
        d={`M ${cx - 4} 132 q -6 -6 0 -10 q 4 0 4 4 q 0 -4 4 -4 q 6 4 0 10 q -4 4 -8 0 z`}
        fill={p.accent}
        stroke={p.bodyDark}
        strokeWidth={0.6}
      />
    </G>
  );
}
