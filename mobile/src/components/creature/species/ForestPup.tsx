/**
 * ForestPup — earthy-green wisdom-trait creature with rounded ears,
 * fluffy tail, and a moss tuft growing from the head/back over time.
 *
 * Stages:
 *   - EGG: shared egg drawing, greenish shell.
 *   - BABY: chubby round head, oversized eyes, tiny ear tufts curling
 *           forward, stubby fluffy tail.
 *   - ADOLESCENT: head + body more defined, moss tuft visible on head,
 *           tail fluffier, slimmer cheeks.
 *   - ADULT: noble standing posture, full moss mantle along back,
 *           plumed tail, intelligent narrower eyes.
 *
 * The body is drawn inside a 200x200 viewBox; the parent <Svg/> sets the
 * pixel size + applies stage scale via outer <G transform>.
 */
import React from 'react';
import { G, Ellipse, Path, Circle } from 'react-native-svg';
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
  VB,
} from './shared';

export interface SpeciesBodyProps {
  spec: CreatureSpec;
  stage: EvolutionStage;
  emotion: EmotionState;
  /** Override eye open height (0..1). Used by the wrapper for blink. */
  blink?: number;
}

export function ForestPupBody({ spec, stage, emotion, blink = 1 }: SpeciesBodyProps) {
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
        {stage === 'BABY' && <ForestPupBaby p={p} gaze={gaze} lid={lid} blink={blink} />}
        {stage === 'ADOLESCENT' && <ForestPupAdolescent p={p} gaze={gaze} lid={lid} blink={blink} />}
        {stage === 'ADULT' && <ForestPupAdult p={p} gaze={gaze} lid={lid} blink={blink} />}
      </G>
      <EmotionForeground emotion={emotion} palette={p} />
    </G>
  );
}

// ---------------------------------------------------------------------------
// BABY — chubby head, tiny stub limbs, huge eyes.
// ---------------------------------------------------------------------------
function ForestPupBaby({
  p,
  gaze,
  lid,
  blink,
}: {
  p: CreatureSpec['palette'];
  gaze: 'forward' | 'down' | 'closed';
  lid: number;
  blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      {/* Shadow */}
      <Ellipse cx={cx} cy={172} rx={42} ry={6} fill="#000" opacity={0.12} />
      {/* Body (slightly smaller than head) */}
      <Ellipse cx={cx} cy={140} rx={36} ry={32} fill={p.body} stroke={p.bodyDark} strokeWidth={1.2} />
      {/* Belly highlight */}
      <Ellipse cx={cx} cy={150} rx={22} ry={14} fill={p.bodyLight} opacity={0.6} />
      {/* Tiny stub legs */}
      <Ellipse cx={cx - 22} cy={166} rx={9} ry={7} fill={p.bodyDark} />
      <Ellipse cx={cx + 22} cy={166} rx={9} ry={7} fill={p.bodyDark} />
      {/* Fluffy tail */}
      <Circle cx={cx + 36} cy={140} r={10} fill={p.bodyLight} stroke={p.bodyDark} strokeWidth={0.8} />
      {/* Head — wider than body */}
      <Circle cx={cx} cy={92} r={46} fill={p.body} stroke={p.bodyDark} strokeWidth={1.2} />
      {/* Ear tufts — curl forward */}
      <Path
        d={`M ${cx - 32} 60 q -10 -18 4 -28 q 8 4 6 22 z`}
        fill={p.body}
        stroke={p.bodyDark}
        strokeWidth={0.8}
      />
      <Path
        d={`M ${cx + 32} 60 q 10 -18 -4 -28 q -8 4 -6 22 z`}
        fill={p.body}
        stroke={p.bodyDark}
        strokeWidth={0.8}
      />
      {/* Inner ear */}
      <Path d={`M ${cx - 28} 56 q -2 -10 2 -16`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 28} 56 q 2 -10 -2 -16`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Cheek blush */}
      <Ellipse cx={cx - 28} cy={104} rx={6} ry={4} fill={p.accent} opacity={0.45} />
      <Ellipse cx={cx + 28} cy={104} rx={6} ry={4} fill={p.accent} opacity={0.45} />
      {/* Eyes — huge */}
      <G transform={`translate(${cx - 16} 90)`}>
        <Eye width={16} height={20 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 16} 90)`}>
        <Eye width={16} height={20 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      {/* Nose + tiny smile */}
      <Ellipse cx={cx} cy={108} rx={3} ry={2.2} fill={p.pupil} />
      <Path d={`M ${cx - 6} 114 q 6 6 12 0`} stroke={p.pupil} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </G>
  );
}

// ---------------------------------------------------------------------------
// ADOLESCENT — more defined, moss tuft on head, slimmer face.
// ---------------------------------------------------------------------------
function ForestPupAdolescent({
  p,
  gaze,
  lid,
  blink,
}: {
  p: CreatureSpec['palette'];
  gaze: 'forward' | 'down' | 'closed';
  lid: number;
  blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      <Ellipse cx={cx} cy={178} rx={48} ry={6} fill="#000" opacity={0.12} />
      {/* Body — taller oval */}
      <Ellipse cx={cx} cy={138} rx={40} ry={42} fill={p.body} stroke={p.bodyDark} strokeWidth={1.2} />
      <Ellipse cx={cx} cy={150} rx={26} ry={18} fill={p.bodyLight} opacity={0.55} />
      {/* Legs */}
      <Ellipse cx={cx - 22} cy={172} rx={10} ry={9} fill={p.bodyDark} />
      <Ellipse cx={cx + 22} cy={172} rx={10} ry={9} fill={p.bodyDark} />
      {/* Tail — fluffier */}
      <Path
        d={`M ${cx + 36} 130 q 22 -6 24 -22 q -10 -4 -22 6 z`}
        fill={p.bodyLight}
        stroke={p.bodyDark}
        strokeWidth={0.8}
      />
      {/* Moss tuft sprouting from back of head */}
      <Path
        d={`M ${cx - 18} 50 q -8 -16 0 -24 q 6 6 10 0 q 4 10 -2 18 q 8 0 12 -8 q 4 12 -6 22 z`}
        fill={p.bodyDark}
        opacity={0.85}
      />
      {/* Head */}
      <Ellipse cx={cx} cy={88} rx={40} ry={42} fill={p.body} stroke={p.bodyDark} strokeWidth={1.2} />
      {/* Ear tufts — taller arched forward */}
      <Path d={`M ${cx - 30} 56 q -14 -20 -2 -34 q 12 6 8 28 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx + 30} 56 q 14 -20 2 -34 q -12 6 -8 28 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx - 26} 50 q -4 -12 2 -22`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 26} 50 q 4 -12 -2 -22`} stroke={p.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Cheek */}
      <Ellipse cx={cx - 26} cy={102} rx={5} ry={3} fill={p.accent} opacity={0.4} />
      <Ellipse cx={cx + 26} cy={102} rx={5} ry={3} fill={p.accent} opacity={0.4} />
      {/* Eyes — slightly smaller (~22% head height) */}
      <G transform={`translate(${cx - 14} 88)`}>
        <Eye width={14} height={17 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 14} 88)`}>
        <Eye width={14} height={17 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      {/* Nose + smile */}
      <Ellipse cx={cx} cy={108} rx={3.2} ry={2.4} fill={p.pupil} />
      <Path d={`M ${cx - 7} 114 q 7 7 14 0`} stroke={p.pupil} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {/* Small accent collar bead */}
      <Circle cx={cx} cy={128} r={3} fill={p.accent} stroke={p.bodyDark} strokeWidth={0.6} />
    </G>
  );
}

// ---------------------------------------------------------------------------
// ADULT — noble bearing, full moss mantle, plumed tail.
// ---------------------------------------------------------------------------
function ForestPupAdult({
  p,
  gaze,
  lid,
  blink,
}: {
  p: CreatureSpec['palette'];
  gaze: 'forward' | 'down' | 'closed';
  lid: number;
  blink: number;
}) {
  const cx = CENTER;
  return (
    <G>
      <Ellipse cx={cx} cy={182} rx={52} ry={6} fill="#000" opacity={0.14} />
      {/* Moss mantle behind body */}
      <Path
        d={`M ${cx - 44} 110 q -14 30 4 60 q 30 14 80 0 q 22 -30 4 -60 q -32 -10 -88 0 z`}
        fill={p.bodyDark}
        opacity={0.85}
      />
      {/* Body */}
      <Ellipse cx={cx} cy={138} rx={44} ry={46} fill={p.body} stroke={p.bodyDark} strokeWidth={1.4} />
      <Ellipse cx={cx} cy={154} rx={28} ry={18} fill={p.bodyLight} opacity={0.55} />
      {/* Legs */}
      <Ellipse cx={cx - 24} cy={176} rx={12} ry={10} fill={p.bodyDark} />
      <Ellipse cx={cx + 24} cy={176} rx={12} ry={10} fill={p.bodyDark} />
      {/* Plumed tail */}
      <Path
        d={`M ${cx + 40} 124 q 28 -10 32 -32 q -14 -4 -26 8 q -2 -10 -10 -6 q -6 8 4 30 z`}
        fill={p.bodyLight}
        stroke={p.bodyDark}
        strokeWidth={0.8}
      />
      {/* Moss tuft on head */}
      <Path
        d={`M ${cx - 22} 50 q -10 -18 0 -28 q 8 6 12 0 q 4 8 -2 14 q 10 -2 14 -10 q 4 14 -6 26 z`}
        fill={p.bodyDark}
        opacity={0.9}
      />
      {/* Head — slightly taller */}
      <Ellipse cx={cx} cy={86} rx={42} ry={44} fill={p.body} stroke={p.bodyDark} strokeWidth={1.4} />
      {/* Ear tufts — long, sweeping */}
      <Path d={`M ${cx - 34} 54 q -16 -24 -4 -40 q 14 8 12 34 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx + 34} 54 q 16 -24 4 -40 q -14 8 -12 34 z`} fill={p.body} stroke={p.bodyDark} strokeWidth={0.8} />
      <Path d={`M ${cx - 30} 46 q -4 -14 0 -26`} stroke={p.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx + 30} 46 q 4 -14 0 -26`} stroke={p.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      {/* Eyes — intelligent, narrower */}
      <G transform={`translate(${cx - 14} 88)`}>
        <Eye width={14} height={14 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      <G transform={`translate(${cx + 14} 88)`}>
        <Eye width={14} height={14 * blink} iris={p.eye} pupil={p.pupil} sparkle={p.sparkle} gaze={gaze} lidDrop={lid} />
      </G>
      {/* Nose + dignified smile */}
      <Ellipse cx={cx} cy={106} rx={3.4} ry={2.6} fill={p.pupil} />
      <Path d={`M ${cx - 8} 114 q 8 6 16 0`} stroke={p.pupil} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      {/* Amber pendant */}
      <Circle cx={cx} cy={128} r={4} fill={p.accent} stroke={p.bodyDark} strokeWidth={0.8} />
      <Circle cx={cx - 1} cy={127} r={1.5} fill={p.sparkle} opacity={0.9} />
    </G>
  );
}
