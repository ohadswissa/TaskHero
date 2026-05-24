/**
 * Zzz — three drifting "z" letters that hover above a sleeping creature.
 *
 * Implemented as SVG <Path/> data so we don't need a font in the <Svg/>;
 * three z's at staggered sizes/positions/opacities feel naturally floating.
 */
import React from 'react';
import { G, Path } from 'react-native-svg';

interface ZzzProps {
  /** anchor x in parent <Svg/> coords */
  x: number;
  /** anchor y in parent <Svg/> coords */
  y: number;
  color: string;
  /** base size of largest z */
  size?: number;
}

/** "Z" glyph as a path centered around (0,0), unit scale = `s`. */
function zPath(s: number): string {
  const w = s * 0.7;
  const h = s;
  // Top bar, diagonal, bottom bar — drawn with strokes by the caller.
  return `M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${-w / 2} ${h / 2} L ${w / 2} ${h / 2}`;
}

export function Zzz({ x, y, color, size = 8 }: ZzzProps) {
  const items = [
    { dx: 0, dy: 0, s: size, op: 0.95 },
    { dx: size * 1.0, dy: -size * 1.0, s: size * 0.75, op: 0.75 },
    { dx: size * 2.0, dy: -size * 2.0, s: size * 0.55, op: 0.5 },
  ];
  return (
    <G>
      {items.map((it, i) => (
        <G key={i} transform={`translate(${x + it.dx}, ${y + it.dy})`}>
          <Path
            d={zPath(it.s)}
            stroke={color}
            strokeWidth={Math.max(0.8, it.s * 0.18)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={it.op}
          />
        </G>
      ))}
    </G>
  );
}
