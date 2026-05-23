// =====================================================================
// TaskHero Demo Visual System
// Source of truth: plans/demo-flow.md §7 — Navy + Amber palette
// =====================================================================
//
// Legacy color keys (primaryLight, secondaryDark, etc.) are kept as
// aliases so older screens (child onboarding scaffolds, login hero
// gradient) continue to compile. New parent screens should consume the
// canonical names: primary, accent, background, surface, trait.*
// =====================================================================

const navy = '#1B2A4E';
const navyDeep = '#0F1B3D';
const navyMuted = '#6B7A99';
const amber = '#F4B860';
const amberDeep = '#D89B3F';
const amberSoft = '#FBE5BF';
const cream = '#FBF7F0';
const creamMuted = '#F0E9DC';

// Trait palette (Strength=red, Wisdom=blue, Heart=orange)
const traitStrength = '#C0392B';
const traitWisdom = '#2980B9';
const traitHeart = '#E67E22';

export const colors = {
  // --- Demo canonical names ---
  primary: navy,
  accent: amber,
  background: cream,
  surface: '#FFFFFF',

  // text is a string for legacy `color: colors.text` usages; use
  // `colors.textSecondary` for the muted variant. New code may use the
  // `palette.text.primary/secondary` accessor below for clarity.
  text: navy,

  // --- Status ---
  success: '#2D9B4F',
  successLight: '#D6F0DE',
  error: traitStrength,
  errorLight: '#FADBD8',
  warning: amberDeep,
  warningLight: amberSoft,
  info: traitWisdom,
  infoLight: '#D4E6F1',

  // --- Neutral ---
  white: '#FFFFFF',
  black: '#000000',

  // --- Legacy aliases (DO NOT remove without auditing child + login screens) ---
  primaryLight: '#3A4D7A',
  primaryDark: navyDeep,
  secondary: amber,
  secondaryLight: amberSoft,
  secondaryDark: amberDeep,
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

// Typography
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

// Border radius scale (sm 8 / md 12 / lg 20 / xl 28)
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  // legacy aliases
  xxl: 32,
  full: 9999,
};

// Shadows tuned to navy primary
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
};

// Gradients
export const gradients = {
  primary: [navy, '#2C3E6B'] as const,
  primaryLight: ['#3A4D7A', navy] as const,
  secondary: [amber, amberDeep] as const,
  secondaryWarm: [amber, '#E89744'] as const,
  hero: [navyDeep, navy, '#2C3E6B'] as const,
  childHero: [amber, traitHeart] as const,
  success: ['#36BB66', '#2D9B4F'] as const,
};

// Font families (Nunito)
export const fonts = {
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
};

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
