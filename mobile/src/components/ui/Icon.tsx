/**
 * Icon — Polish-B1 trait + utility iconography registry.
 *
 * Per PRD §7 motifs:
 *   Strength → clenched fist + flame above
 *   Wisdom   → eye + star above
 *   Heart    → heart + small leaf
 *
 * Plus utility icons consumed across the app:
 *   checkCircle, camera, chevronLeft, chevronRight, sparkle,
 *   mail, crown, scroll, bell, plus, eye
 *
 * All icons are stroke-based, 24×24 viewBox, rounded line caps,
 * 1.75 default stroke width. Each path under ~6 line segments.
 */
import React from 'react';
import Svg, { Path, Circle, Polyline, type SvgProps } from 'react-native-svg';
import { colors } from '@/theme';

export type IconName =
  | 'strength'
  | 'wisdom'
  | 'heart'
  | 'checkCircle'
  | 'camera'
  | 'chevronLeft'
  | 'chevronRight'
  | 'sparkle'
  | 'mail'
  | 'crown'
  | 'scroll'
  | 'bell'
  | 'plus'
  | 'eye'
  | 'image'
  | 'warning';

export interface IconProps extends Omit<SvgProps, 'children'> {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}

interface Glyph {
  /** primary stroke paths */
  paths: Array<string>;
  /** optional fill circles or small accents */
  extras?: React.ReactNode;
}

const GLYPHS: Record<IconName, Glyph> = {
  // Strength = fist with a flame above. Fist is a rounded rect with knuckle marks.
  strength: {
    paths: [
      // flame
      'M12 2.5c1.4 1.4 2 2.7 2 3.8 0 1.3-.9 2.2-2 2.2s-2-.9-2-2.2c0-1.1.6-2.4 2-3.8z',
      // fist body
      'M5 12.5c0-1.4 1.1-2.5 2.5-2.5h9c1.4 0 2.5 1.1 2.5 2.5V19c0 1.4-1.1 2.5-2.5 2.5h-9C6.1 21.5 5 20.4 5 19v-6.5z',
      // knuckle line
      'M8 13.5h8',
    ],
  },
  // Wisdom = eye with star above
  wisdom: {
    paths: [
      // star (4-point sparkle)
      'M12 1.5l1 2.2 2.2 1-2.2 1L12 8l-1-2.3-2.2-1 2.2-1z',
      // eye outline
      'M3 14.5c2.5-3.5 6-5.5 9-5.5s6.5 2 9 5.5c-2.5 3.5-6 5.5-9 5.5s-6.5-2-9-5.5z',
    ],
    extras: <Circle cx={12} cy={14.5} r={2.2} />,
  },
  // Heart = heart with leaf
  heart: {
    paths: [
      // heart
      'M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.85A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10z',
      // leaf accent
      'M14.5 6.5c1.5-.5 3-.2 3.8.6-.5 1.2-1.8 2.1-3.2 2.1',
    ],
  },
  checkCircle: {
    paths: [
      'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z',
      'M8 12.5l3 3 5-6',
    ],
  },
  camera: {
    paths: [
      'M4 8.5h3l1.5-2h7l1.5 2H20c.8 0 1.5.7 1.5 1.5v8c0 .8-.7 1.5-1.5 1.5H4c-.8 0-1.5-.7-1.5-1.5V10c0-.8.7-1.5 1.5-1.5z',
    ],
    extras: <Circle cx={12} cy={13.5} r={3.5} />,
  },
  chevronLeft: {
    paths: ['M15 5l-7 7 7 7'],
  },
  chevronRight: {
    paths: ['M9 5l7 7-7 7'],
  },
  sparkle: {
    paths: [
      'M12 2.5l1.7 4.3 4.3 1.7-4.3 1.7L12 14.5l-1.7-4.3L6 8.5l4.3-1.7z',
      'M19 15l.8 1.9 1.9.8-1.9.8L19 20.5l-.8-1.9-1.9-.8 1.9-.8z',
    ],
  },
  mail: {
    paths: [
      'M3 6.5h18v11H3z',
      'M3 7l9 6.5L21 7',
    ],
  },
  crown: {
    paths: [
      'M3 8l3.5 4L12 6l5.5 6L21 8l-1.5 10h-15z',
      'M5.5 18.5h13',
    ],
  },
  scroll: {
    paths: [
      'M5 5c0-1 .8-1.8 1.8-1.8h11c1 0 1.8.8 1.8 1.8v12.8c0 1.4-1.2 2.5-2.5 2.5H6.8C5.8 20.3 5 19.5 5 18.5V5z',
      'M8.5 7.5h7',
      'M8.5 11h7',
      'M8.5 14.5h5',
    ],
  },
  bell: {
    paths: [
      'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z',
      'M10 19.5a2 2 0 0 0 4 0',
    ],
  },
  plus: {
    paths: ['M12 5v14', 'M5 12h14'],
  },
  eye: {
    paths: ['M2.5 12c2.5-4 6-6.5 9.5-6.5S19 8 21.5 12c-2.5 4-6 6.5-9.5 6.5S5 16 2.5 12z'],
    extras: <Circle cx={12} cy={12} r={2.5} />,
  },
  image: {
    paths: [
      'M3.5 5.5h17v13h-17z',
      'M3.5 16l5-5 4 4 3-3 5 5',
    ],
    extras: <Circle cx={9} cy={9.5} r={1.5} />,
  },
  // Triangle with exclamation — used for error banners / urgent badges.
  warning: {
    paths: [
      'M12 3l9.5 17h-19z',
      'M12 10v4.5',
    ],
    extras: <Circle cx={12} cy={17.5} r={0.8} />,
  },
};

export function Icon({
  name,
  size = 24,
  color = colors.textPrimary,
  strokeWidth = 1.75,
  filled = false,
  ...rest
}: IconProps) {
  const glyph = GLYPHS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      {glyph.paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={filled ? color : 'none'}
        />
      ))}
      {glyph.extras
        ? React.Children.map(glyph.extras as React.ReactElement, (child) =>
            React.cloneElement(child as React.ReactElement<any>, {
              stroke: color,
              strokeWidth,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              fill: filled ? color : 'none',
            }),
          )
        : null}
    </Svg>
  );
}

// Polyline used implicitly via Path data; keep import alive for tree-shake safety.
void Polyline;
