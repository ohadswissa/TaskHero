/**
 * StoneCub — warm tan & slate strength-trait creature with stocky build,
 * low-set ears, and a prominent chest stone (small at baby, full crack
 * pattern at adult).
 *
 * Stages:
 *   - EGG: sandy tan shell.
 *   - BABY: chubby stocky body, tiny ear tufts, small chest pebble.
 *   - ADOLESCENT: broader shoulders, visible chest stone with amber glow.
 *   - ADULT: noble stocky stance, square-ish but soft jaw, large cracked
 *           chest stone with light-pattern.
 */
import React from 'react';
import { G, Ellipse, Path, Circle, Rect } from 'react-native-svg';
import type { CreatureSpec, EmotionState } from '@/constants/creatureSpec';
import type { EvolutionStage } from '@/api/creatures.api';
import { Eye } from '../parts/Eye';
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

export function StoneCubBody({ spec, stage, emotion, blink = 1 }: SpeciesBodyProps) {
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
      <G transform={tx}>
        {stage === 'BABY' && <StoneCubBaby p={p} gaze={gaze} lid={lid} blink={blink} />}
        {stage === 'ADOLESCENT' && <StoneCubAdolescent p={p} gaze={gaze} lid={lid} blink={blink} />}
        {stage === 'ADULT' && <StoneCubAdult p={p} gaze={gaze} lid={lid} blink={blink} />}
      </G>
      <EmotionForeground emotion={emotion} palette={p} />
    </G>
  );
}

function StoneCubBaby({ p, gaze, lid, blink }: {
  p: CreatureSpec['palette']; gaze: 'forward' | 'down' | 'closed'; lid: number; blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      <Ellipse cx={cx} cy={174} rx={46} ry={6} fill="#000" opacity={0.14} />
      {/* Stocky body */}
      <Ellipse cx={cx} cy={144} rx={42} ry={34} fill={p.body} stroke={p.bodyDark} strokeWidth={1.2} />
      <Ellipse cx={cx} cy={154} rx={26} ry={14} fill={p.bodyLight} opacity={0.55} />
      {/* Thick stub legs */}
      <Ellipse cx={cx - 26} cy={170} rx={11} ry={9} fill={p.bodyDark} />
      <Ellipse cx={cx + 26} cy={170} rx={11} ry={9} fill={p.bodyDark} />
      {/* Small chest pebble */}
      <Circle cx={cx} cy={140} r={5} fill={p.glow} stroke={p.bodyDark} strokeWidth={0.6} />
      <Circle cx={cx - 1} cy={139} r={1.6} fill={p.sparkle} opacity={0.9} />
      {/* Head — wide, low */}
      <Ellipse cx={cx} cy={96} rx={48} ry={42} fill={p.body} stroke={p.bodyDark} strokeWidth={1.2} />
      {/* Low-set ear tufts */}
      <Path d={`M ${cx - 36} 78 q -14 -4 -14 -18 q 12 -2 18 12 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx + 36} 78 q 14 -4 14 -18 q -12 -2 -18 12 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx - 36} 74 q -6 -4 -8 -10`} stroke={p.accent} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 36} 74 q 6 -4 8 -10`} stroke={p.accent} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {/* Cheek */}
      <Ellipse cx={cx - 30} cy={110} rx={6} ry={3.5} fill={p.glow} opacity={0.45} />
      <Ellipse cx={cx + 30} cy={110} rx={6} ry={3.5} fill={p.glow} opacity={0.45} />
      {/* Eyes — amber-orange */}
      <G transform={`translate(${cx - 16} 94)`}>
        <Eye width={17} height={20 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 16} 94)`}>
        <Eye width={17} height={20 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      {/* Snout + smile */}
      <Ellipse cx={cx} cy={114} rx={8} ry={6} fill={p.bodyLight} stroke={p.bodyDark} strokeWidth={0.6} />
      <Ellipse cx={cx} cy={111} rx={2.6} ry={1.8} fill={p.pupil} />
      <Path d={`M ${cx - 6} 118 q 6 5 12 0`} stroke={p.pupil} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </G>
  );
}

function StoneCubAdolescent({ p, gaze, lid, blink }: {
  p: CreatureSpec['palette']; gaze: 'forward' | 'down' | 'closed'; lid: number; blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      <Ellipse cx={cx} cy={180} rx={52} ry={6} fill="#000" opacity={0.15} />
      {/* Body — broader shoulders */}
      <Ellipse cx={cx} cy={142} rx={48} ry={42} fill={p.body} stroke={p.bodyDark} strokeWidth={1.2} />
      <Ellipse cx={cx} cy={156} rx={28} ry={16} fill={p.bodyLight} opacity={0.55} />
      {/* Legs */}
      <Ellipse cx={cx - 28} cy={176} rx={12} ry={10} fill={p.bodyDark} />
      <Ellipse cx={cx + 28} cy={176} rx={12} ry={10} fill={p.bodyDark} />
      {/* Chest stone — larger */}
      <Path
        d={`M ${cx} 122 l -9 12 l 5 14 l 8 0 l 5 -14 z`}
        fill={p.glow}
        stroke={p.bodyDark}
        strokeWidth={0.8}
      />
      <Path d={`M ${cx - 2} 128 l 3 8`} stroke={p.bodyDark} strokeWidth={0.6} opacity={0.6} fill="none" />
      <Circle cx={cx - 2} cy={128} r={1.4} fill={p.sparkle} opacity={0.95} />
      {/* Head */}
      <Ellipse cx={cx} cy={88} rx={46} ry={42} fill={p.body} stroke={p.bodyDark} strokeWidth={1.2} />
      {/* Ears */}
      <Path d={`M ${cx - 38} 70 q -16 -8 -16 -24 q 14 -2 22 18 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx + 38} 70 q 16 -8 16 -24 q -14 -2 -22 18 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx - 38} 66 q -8 -4 -10 -14`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 38} 66 q 8 -4 10 -14`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Slate accent — forehead stone marking */}
      <Path d={`M ${cx - 6} 56 l 6 -10 l 6 10 z`} fill={p.accent} opacity={0.6} />
      {/* Eyes */}
      <G transform={`translate(${cx - 15} 90)`}>
        <Eye width={15} height={18 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 15} 90)`}>
        <Eye width={15} height={18 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      {/* Snout */}
      <Ellipse cx={cx} cy={110} rx={9} ry={6} fill={p.bodyLight} stroke={p.bodyDark} strokeWidth={0.6} />
      <Ellipse cx={cx} cy={107} rx={3} ry={2} fill={p.pupil} />
      <Path d={`M ${cx - 7} 115 q 7 6 14 0`} stroke={p.pupil} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </G>
  );
}

function StoneCubAdult({ p, gaze, lid, blink }: {
  p: CreatureSpec['palette']; gaze: 'forward' | 'down' | 'closed'; lid: number; blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      <Ellipse cx={cx} cy={184} rx={58} ry={7} fill="#000" opacity={0.16} />
      {/* Stocky athletic body */}
      <Ellipse cx={cx} cy={140} rx={54} ry={48} fill={p.body} stroke={p.bodyDark} strokeWidth={1.4} />
      <Ellipse cx={cx} cy={158} rx={32} ry={18} fill={p.bodyLight} opacity={0.55} />
      {/* Thick legs */}
      <Ellipse cx={cx - 30} cy={180} rx={14} ry={10} fill={p.bodyDark} />
      <Ellipse cx={cx + 30} cy={180} rx={14} ry={10} fill={p.bodyDark} />
      {/* Slate shoulder pads */}
      <Path d={`M ${cx - 48} 116 q -4 -12 8 -16 q 6 6 4 18 z`} fill={p.accent} opacity={0.85} />
      <Path d={`M ${cx + 48} 116 q 4 -12 -8 -16 q -6 6 -4 18 z`} fill={p.accent} opacity={0.85} />
      {/* Large cracked chest stone */}
      <Path
        d={`M ${cx} 118 l -14 16 l 6 22 l 16 0 l 6 -22 z`}
        fill={p.glow}
        stroke={p.bodyDark}
        strokeWidth={1}
      />
      {/* Crack-light pattern */}
      <Path d={`M ${cx} 122 l -4 12 l 5 6 l -2 10`} stroke={p.sparkle} strokeWidth={1.4} fill="none" opacity={0.95} />
      <Path d={`M ${cx + 4} 128 l 4 8`} stroke={p.sparkle} strokeWidth={1} fill="none" opacity={0.8} />
      <Circle cx={cx - 2} cy={134} r={2} fill={p.sparkle} opacity={1} />
      {/* Head — broader, square-ish jaw */}
      <Path
        d={`M ${cx - 46} 90 q 0 -50 46 -50 q 46 0 46 50 q 0 36 -46 38 q -46 -2 -46 -38 z`}
        fill={p.body}
        stroke={p.bodyDark}
        strokeWidth={1.4}
      />
      {/* Ears */}
      <Path d={`M ${cx - 40} 64 q -18 -10 -18 -28 q 16 -2 26 22 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx + 40} 64 q 18 -10 18 -28 q -16 -2 -26 22 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx - 40} 60 q -10 -4 -12 -18`} stroke={p.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 40} 60 q 10 -4 12 -18`} stroke={p.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      {/* Forehead stone marking — full crystal */}
      <Path d={`M ${cx - 8} 56 l 8 -14 l 8 14 l -8 6 z`} fill={p.glow} stroke={p.bodyDark} strokeWidth={0.6} />
      <Path d={`M ${cx - 4} 52 l 4 -6 l 4 6`} stroke={p.sparkle} strokeWidth={1} fill="none" opacity={0.9} />
      {/* Eyes — intelligent narrower */}
      <G transform={`translate(${cx - 16} 88)`}>
        <Eye width={16} height={14 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 16} 88)`}>
        <Eye width={16} height={14 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      {/* Snout + smile */}
      <Ellipse cx={cx} cy={110} rx={11} ry={7} fill={p.bodyLight} stroke={p.bodyDark} strokeWidth={0.6} />
      <Ellipse cx={cx} cy={107} rx={3.4} ry={2.4} fill={p.pupil} />
      <Path d={`M ${cx - 8} 116 q 8 6 16 0`} stroke={p.pupil} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </G>
  );
}
