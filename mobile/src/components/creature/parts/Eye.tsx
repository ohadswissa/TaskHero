/**
 * Eye — a soft, oversized creature eye composed of:
 *   - white sclera (rounded rect / ellipse)
 *   - colored iris ellipse
 *   - dark pupil offset toward the gaze direction
 *   - small bright "shine" highlight
 *
 * `gaze: 'closed'` collapses the eye to a curved arc for sleeping/blinking.
 * `gaze: 'down'`  is the droopy/half-closed sad eye.
 *
 * All coordinates are local — the parent <G transform="translate(cx, cy)" />
 * positions the eye on the face.
 */
import React from 'react';
import { G, Ellipse, Path, Rect } from 'react-native-svg';

export type GazeDirection = 'forward' | 'down' | 'up' | 'closed';

interface EyeProps {
  /** total eye width (sclera) */
  width: number;
  /** total eye height (sclera) */
  height: number;
  iris: string;
  pupil: string;
  sparkle?: string;
  gaze?: GazeDirection;
  /** Render the bright shine highlight on the iris. */
  shine?: boolean;
  /** Optional half-lid drop (0–1) for sad emotion regardless of gaze. */
  lidDrop?: number;
}

export function Eye({
  width,
  height,
  iris,
  pupil,
  sparkle = '#FFFFFF',
  gaze = 'forward',
  shine = true,
  lidDrop = 0,
}: EyeProps) {
  const rx = width / 2;
  const ry = height / 2;
  const irisR = Math.min(rx, ry) * 0.72;
  const pupilR = irisR * 0.55;

  // Closed eye — render a soft downward arc.
  if (gaze === 'closed') {
    const w = width;
    const d = `M ${-w / 2} 0 Q 0 ${ry * 0.7} ${w / 2} 0`;
    return (
      <Path d={d} stroke={pupil} strokeWidth={Math.max(1.4, ry * 0.18)} fill="none" strokeLinecap="round" />
    );
  }

  // Gaze offset for the pupil.
  let pupilOffsetX = 0;
  let pupilOffsetY = 0;
  if (gaze === 'down') {
    pupilOffsetY = ry * 0.35;
  } else if (gaze === 'up') {
    pupilOffsetY = -ry * 0.25;
  }

  return (
    <G>
      {/* Sclera */}
      <Ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#FFFFFF" stroke={pupil} strokeWidth={0.6} />
      {/* Iris */}
      <Ellipse cx={pupilOffsetX} cy={pupilOffsetY * 0.5} rx={irisR} ry={irisR} fill={iris} />
      {/* Pupil */}
      <Ellipse
        cx={pupilOffsetX}
        cy={pupilOffsetY}
        rx={pupilR}
        ry={pupilR * 1.05}
        fill={pupil}
      />
      {/* Shine */}
      {shine && (
        <Ellipse
          cx={pupilOffsetX - pupilR * 0.5}
          cy={pupilOffsetY - pupilR * 0.6}
          rx={pupilR * 0.45}
          ry={pupilR * 0.55}
          fill={sparkle}
          opacity={0.95}
        />
      )}
      {/* Optional half-lid for sad — clip top via a sliding rect with the body color underneath. */}
      {lidDrop > 0 && (
        <Rect
          x={-rx - 1}
          y={-ry - 1}
          width={width + 2}
          height={ry + ry * lidDrop}
          fill="#FFFFFF"
          opacity={0}
        />
      )}
      {/* Drooping upper lid arc for sad. */}
      {lidDrop > 0 && (
        <Path
          d={`M ${-rx} ${-ry * (1 - lidDrop * 1.4)} Q 0 ${ry * (lidDrop * 0.3)} ${rx} ${-ry * (1 - lidDrop * 1.4)}`}
          stroke={pupil}
          strokeWidth={Math.max(1, ry * 0.16)}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </G>
  );
}
