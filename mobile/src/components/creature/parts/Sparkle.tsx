/**
 * Sparkle — 4-point star burst used to decorate EXCITED creatures and
 * scattered as ambient particles in <CreatureScene/>.
 */
import React from 'react';
import { Path } from 'react-native-svg';

interface SparkleProps {
  /** approximate width/height of the sparkle */
  size: number;
  color: string;
  opacity?: number;
  /** translate within parent <Svg/> coords */
  x?: number;
  y?: number;
}

export function Sparkle({ size, color, opacity = 1, x = 0, y = 0 }: SparkleProps) {
  const r = size / 2;
  const inner = r * 0.28;
  // 4-point star centered at (x,y).
  const d = [
    `M ${x} ${y - r}`,
    `Q ${x + inner * 0.5} ${y - inner * 0.5} ${x + r} ${y}`,
    `Q ${x + inner * 0.5} ${y + inner * 0.5} ${x} ${y + r}`,
    `Q ${x - inner * 0.5} ${y + inner * 0.5} ${x - r} ${y}`,
    `Q ${x - inner * 0.5} ${y - inner * 0.5} ${x} ${y - r}`,
    'Z',
  ].join(' ');
  return <Path d={d} fill={color} opacity={opacity} />;
}
