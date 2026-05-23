/**
 * TraitRadar — M7a.
 *
 * Custom-built triangle radar chart for the parent dashboard. Three axes:
 *   - Wisdom   — top              (blue)
 *   - Strength — bottom-left      (red)
 *   - Heart    — bottom-right     (orange)
 *
 * Composition:
 *   - 4 concentric triangular grid rings at 25/50/75/100% of `max`.
 *   - 3 spoke lines from center to each vertex.
 *   - Filled polygon connecting current values (semi-transparent amber).
 *   - Vertex dots in trait color + numeric value labels just outside.
 *
 * The radar auto-scales: if any trait exceeds the default max of 50, we
 * round up to the next multiple of 25 so the polygon fits.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { colors, fonts, traits } from '@/theme';

interface TraitRadarProps {
  strength: number;
  wisdom: number;
  heart: number;
  /** Suggested max for the axes (default 50). Auto-scales upward if exceeded. */
  max?: number;
  /** Square viewport size in px (default 280). */
  size?: number;
}

interface Vertex {
  x: number;
  y: number;
  angle: number; // radians from +x axis (math convention)
}

function effectiveMax(strength: number, wisdom: number, heart: number, suggested: number): number {
  const peak = Math.max(strength, wisdom, heart, 1);
  if (peak <= suggested) return suggested;
  // Round peak up to the next multiple of 25.
  return Math.ceil(peak / 25) * 25;
}

function vertexAt(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number,
  fraction: number,
): Vertex {
  const r = radius * fraction;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad), // SVG y goes down
    angle: angleRad,
  };
}

export function TraitRadar({
  strength,
  wisdom,
  heart,
  max = 50,
  size = 280,
}: TraitRadarProps) {
  const scale = effectiveMax(strength, wisdom, heart, max);
  const padding = 36; // room for labels outside the triangle
  const radius = (size - padding * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + 6; // nudge down to balance top label

  // Axis angles — Wisdom top (90°), Strength bottom-left (210°), Heart bottom-right (330°).
  const angleWisdom = (Math.PI / 180) * 90;
  const angleStrength = (Math.PI / 180) * 210;
  const angleHeart = (Math.PI / 180) * 330;

  // Grid rings at 0.25 / 0.5 / 0.75 / 1.0
  const rings = [0.25, 0.5, 0.75, 1.0].map((f) => {
    const a = vertexAt(cx, cy, radius, angleWisdom, f);
    const b = vertexAt(cx, cy, radius, angleStrength, f);
    const c = vertexAt(cx, cy, radius, angleHeart, f);
    return `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`;
  });

  // Spokes
  const wisdomOuter = vertexAt(cx, cy, radius, angleWisdom, 1);
  const strengthOuter = vertexAt(cx, cy, radius, angleStrength, 1);
  const heartOuter = vertexAt(cx, cy, radius, angleHeart, 1);

  // Value vertices (clamp to [0, scale])
  const wisdomFrac = Math.min(1, Math.max(0, wisdom / scale));
  const strengthFrac = Math.min(1, Math.max(0, strength / scale));
  const heartFrac = Math.min(1, Math.max(0, heart / scale));

  const wisdomPt = vertexAt(cx, cy, radius, angleWisdom, wisdomFrac);
  const strengthPt = vertexAt(cx, cy, radius, angleStrength, strengthFrac);
  const heartPt = vertexAt(cx, cy, radius, angleHeart, heartFrac);
  const fillPoints = `${wisdomPt.x},${wisdomPt.y} ${strengthPt.x},${strengthPt.y} ${heartPt.x},${heartPt.y}`;

  // Label offset — push 18px past the outer vertex along the axis direction.
  const labelOffset = 18;
  const labelPos = (outer: Vertex) => ({
    x: outer.x + Math.cos(outer.angle) * labelOffset,
    y: outer.y - Math.sin(outer.angle) * labelOffset,
  });
  const wisdomLabel = labelPos(wisdomOuter);
  const strengthLabel = labelPos(strengthOuter);
  const heartLabel = labelPos(heartOuter);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Grid rings */}
        {rings.map((pts, i) => (
          <Polygon
            key={i}
            points={pts}
            fill="none"
            stroke={colors.borderLight}
            strokeWidth={i === rings.length - 1 ? 1.5 : 1}
          />
        ))}
        {/* Spokes */}
        <Line x1={cx} y1={cy} x2={wisdomOuter.x} y2={wisdomOuter.y} stroke={colors.borderLight} strokeWidth={1} />
        <Line x1={cx} y1={cy} x2={strengthOuter.x} y2={strengthOuter.y} stroke={colors.borderLight} strokeWidth={1} />
        <Line x1={cx} y1={cy} x2={heartOuter.x} y2={heartOuter.y} stroke={colors.borderLight} strokeWidth={1} />

        {/* Filled value polygon */}
        <Polygon
          points={fillPoints}
          fill={colors.accent}
          fillOpacity={0.35}
          stroke={colors.primary}
          strokeWidth={2}
        />

        {/* Value dots */}
        <Circle cx={wisdomPt.x} cy={wisdomPt.y} r={5} fill={traits.wisdom} />
        <Circle cx={strengthPt.x} cy={strengthPt.y} r={5} fill={traits.strength} />
        <Circle cx={heartPt.x} cy={heartPt.y} r={5} fill={traits.heart} />

        {/* Numeric value labels next to each vertex */}
        <SvgText
          x={wisdomPt.x}
          y={wisdomPt.y - 10}
          fontSize={12}
          fontWeight="bold"
          fill={traits.wisdom}
          textAnchor="middle"
        >
          {wisdom}
        </SvgText>
        <SvgText
          x={strengthPt.x - 12}
          y={strengthPt.y + 4}
          fontSize={12}
          fontWeight="bold"
          fill={traits.strength}
          textAnchor="end"
        >
          {strength}
        </SvgText>
        <SvgText
          x={heartPt.x + 12}
          y={heartPt.y + 4}
          fontSize={12}
          fontWeight="bold"
          fill={traits.heart}
          textAnchor="start"
        >
          {heart}
        </SvgText>

        {/* Axis labels */}
        <SvgText
          x={wisdomLabel.x}
          y={wisdomLabel.y - 2}
          fontSize={11}
          fontWeight="bold"
          fill={traits.wisdom}
          textAnchor="middle"
        >
          WISDOM
        </SvgText>
        <SvgText
          x={strengthLabel.x}
          y={strengthLabel.y + 4}
          fontSize={11}
          fontWeight="bold"
          fill={traits.strength}
          textAnchor="middle"
        >
          STRENGTH
        </SvgText>
        <SvgText
          x={heartLabel.x}
          y={heartLabel.y + 4}
          fontSize={11}
          fontWeight="bold"
          fill={traits.heart}
          textAnchor="middle"
        >
          HEART
        </SvgText>
      </Svg>

      {/* Footer — peak scale + total */}
      <Text style={styles.footer}>
        Scale 0–{scale} · Total {strength + wisdom + heart}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: -2,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
});
