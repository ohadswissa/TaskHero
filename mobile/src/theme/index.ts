// =====================================================================
// TaskHero Demo Visual System
// Source of truth: plans/demo-flow.md §7 — Navy + Amber palette
// Polish-B1: Extended with parchment / habitat / magic tokens + fonts ladder
// =====================================================================
//
// Legacy color keys (primaryLight, secondaryDark, etc.) are kept as
// aliases so older screens (child onboarding scaffolds, login hero
// gradient) continue to compile. New parent screens should consume the
// canonical names: primary, accent, background, surface, trait.*
//
// Polish-B1 additions are appended — none of the existing keys are
// removed. `colors.text` remains a flat string for legacy lookups;
// new code should consume `colors.textTokens.{primary|secondary|...}`.
// =====================================================================

const navy = '#1B2A4E';
const navyDeepLegacy = '#0F1B3D';
const navyMuted = '#6B7A99';
const amber = '#F4B860';
const amberDeepLegacy = '#D89B3F';
const amberSoftLegacy = '#FBE5BF';
const cream = '#FBF7F0';
const creamMuted = '#F0E9DC';

// Trait palette (Strength=red, Wisdom=blue, Heart=orange)
const traitStrength = '#C0392B';
const traitWisdom = '#2980B9';
const traitHeart = '#E67E22';

// Polish-B1 additions
const navyDeep = '#0F1A33';
const navyMid = '#243A66';
const amberDeep = '#D89A3B';
const amberSoft = '#FBE3B3';
const parchment = '#F4E4C1';
const parchmentDark = '#E1CCA1';
const parchmentInk = '#5C4023';
const creamSoft = '#FFFDF9';
const magicViolet = '#9B6CF0';
const magicCyan = '#7FD4F2';

export const colors = {
  // --- Demo canonical names ---
  primary: navy,
  accent: amber,
  background: cream,
  surface: '#FFFFFF',

  // text is a string for legacy `color: colors.text` usages; use
  // `colors.textSecondary` for the muted variant.
  text: navy,

  // --- Status ---
  success: '#2D9B4F',
  successLight: '#D6F0DE',
  error: traitStrength,
  errorLight: '#FADBD8',
  warning: amberDeepLegacy,
  warningLight: amberSoftLegacy,
  info: traitWisdom,
  infoLight: '#D4E6F1',

  // --- Neutral ---
  white: '#FFFFFF',
  black: '#000000',

  // --- Legacy aliases (DO NOT remove without auditing child + login screens) ---
  primaryLight: '#3A4D7A',
  primaryDark: navyDeepLegacy,
  secondary: amber,
  secondaryLight: amberSoftLegacy,
  secondaryDark: amberDeepLegacy,
  backgroundSecondary: creamMuted,
  textPrimary: navy,                  // flat alias for some legacy refs
  textSecondary: navyMuted,
  textTertiary: '#9CA3AF',
  border: '#E5DDD0',
  borderLight: creamMuted,

  // Gamification (legacy)
  xp: '#8B5CF6',
  coins: amber,
  streak: traitStrength,
  level: '#2D9B4F',

  // ============================
  // Polish-B1 extensions
  // ============================
  navyDeep,
  navyMid,
  amberDeep,
  amberSoft,
  parchment,
  parchmentDark,
  parchmentInk,
  cream,
  creamSoft,

  // Habitat tokens — sourced from CREATURE_SPECS palettes
  habitat: {
    forest: ['#E8F2D4', '#A8C97A'] as const,
    sky: ['#F2F6FF', '#BFD4F2'] as const,
    stone: ['#F0E2C6', '#C0A37A'] as const,
  },

  // Status tones (soft tinted backgrounds)
  successSoft: '#D7F0DD',
  errorSoft: '#FADEDB',
  warningSoft: '#FFF1D6',

  // Magic moment colors
  magicViolet,
  magicCyan,

  // Glassy surfaces
  glass: 'rgba(255,255,255,0.85)',
  glassNavy: 'rgba(27,42,78,0.85)',

  // Nested text tokens for new code (back-compat: colors.text still a string)
  textTokens: {
    primary: navy,
    secondary: navyMuted,
    tertiary: '#9CA3AF',
    onNavy: cream,
    onParchment: parchmentInk,
    accent: amberDeep,
    error: traitStrength,
    success: '#1F7A3A',
  },
};

// Spacing scale (per demo §7)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  // legacy aliases
  xxl: 40,
  xxxl: 56,
};

// Typography — legacy variants (size+weight) preserved as before.
// Polish-B1 ladder lives under `typographyTokens` (font-family aware).
export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
};

// Polish-B1: font-family aware typography ladder (consumed by Typography primitive).
export const typographyTokens = {
  display:           { fontFamily: 'Fraunces_600SemiBold',       fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  heading1:          { fontFamily: 'Inter_700Bold',              fontSize: 24, lineHeight: 30 },
  heading2:          { fontFamily: 'Inter_600SemiBold',          fontSize: 20, lineHeight: 26 },
  heading3:          { fontFamily: 'Inter_600SemiBold',          fontSize: 17, lineHeight: 22 },
  body:              { fontFamily: 'Inter_400Regular',           fontSize: 15, lineHeight: 22 },
  bodyEmphasis:      { fontFamily: 'Inter_500Medium',            fontSize: 15, lineHeight: 22 },
  caption:           { fontFamily: 'Inter_400Regular',           fontSize: 12, lineHeight: 16 },
  captionEmphasis:   { fontFamily: 'Inter_500Medium',            fontSize: 12, lineHeight: 16 },
  scroll:            { fontFamily: 'Fraunces_400Regular_Italic', fontSize: 17, lineHeight: 26 },
  button:            { fontFamily: 'Inter_600SemiBold',          fontSize: 16, lineHeight: 20, letterSpacing: 0.3 },
  eyebrow:           { fontFamily: 'Inter_600SemiBold',          fontSize: 11, lineHeight: 14, letterSpacing: 1.6 },
} as const;

// Border radius scale (sm 8 / md 12 / lg 20 / xl 28)
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
  // legacy aliases
  xxl: 32,
  full: 9999,
};

// Shadows — legacy keys preserved; Polish-B1 adds card / cardHover / parchment / navyGlow.
export const shadows = {
  sm: {
    shadowColor: navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  // Polish-B1 additions
  card: {
    shadowColor: navyDeep,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHover: {
    shadowColor: navyDeep,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  parchment: {
    shadowColor: '#8B6F3F',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  navyGlow: {
    shadowColor: navy,
    shadowOpacity: 0.30,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
};

// Gradients
export const gradients = {
  primary: [navy, '#2C3E6B'] as const,
  primaryLight: ['#3A4D7A', navy] as const,
  secondary: [amber, amberDeepLegacy] as const,
  secondaryWarm: [amber, '#E89744'] as const,
  hero: [navyDeepLegacy, navy, '#2C3E6B'] as const,
  childHero: [amber, traitHeart] as const,
  success: ['#36BB66', '#2D9B4F'] as const,
  // Polish-B1
  navy: [navyDeep, navyMid] as const,
  cream: [cream, creamSoft] as const,
  parchment: [parchment, cream] as const,
  magic: [magicViolet, magicCyan] as const,
  habitatForest: ['#E8F2D4', '#A8C97A'] as const,
  habitatSky: ['#F2F6FF', '#BFD4F2'] as const,
  habitatStone: ['#F0E2C6', '#C0A37A'] as const,
  // Polish-B3
  parentDashboard: ['#F2F6FF', '#FFFFFF'] as const,
  celebration: ['#F4B860', '#9B6CF0'] as const,
};

// Font families
// Legacy Nunito keys are retained because Logo/Button/etc still reference them.
// Polish-B1: serif=Fraunces (parchment & display); body=Inter (UI workhorse).
export const fonts = {
  // legacy (Nunito)
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  // Polish-B1 canonical
  serif: 'Fraunces_400Regular',
  serifBold: 'Fraunces_600SemiBold',
  serifItalic: 'Fraunces_400Regular_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

// Polish-B1 motion tokens.
export const durations = {
  fast: 150,
  base: 250,
  slow: 400,
  scene: 800,
};

export const easing = {
  outQuad: 'ease-out',
  inOutSine: 'ease-in-out',
  spring: { stiffness: 120, damping: 12, mass: 0.9 },
} as const;

// Convenience trait helpers
export type TraitKey = 'STRENGTH' | 'WISDOM' | 'HEART';

export const traits = {
  strength: traitStrength,
  wisdom: traitWisdom,
  heart: traitHeart,
};

export function traitColor(trait?: string | null): string {
  switch (trait) {
    case 'STRENGTH':
      return traits.strength;
    case 'WISDOM':
      return traits.wisdom;
    case 'HEART':
      return traits.heart;
    default:
      return colors.textSecondary;
  }
}

export function traitLabel(trait?: string | null): string {
  switch (trait) {
    case 'STRENGTH':
      return 'Strength';
    case 'WISDOM':
      return 'Wisdom';
    case 'HEART':
      return 'Heart';
    default:
      return '—';
  }
}

// Aggregated default export for ergonomic `import theme from '@/theme'` usage.
export const theme = {
  colors,
  spacing,
  typography,
  typographyTokens,
  borderRadius,
  radii: borderRadius,
  shadows,
  gradients,
  fonts,
  durations,
  easing,
  traits,
};

export default theme;
