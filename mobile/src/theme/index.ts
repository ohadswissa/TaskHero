// Color palette
export const colors = {
  // Primary colors
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Secondary colors (for child UI)
  secondary: '#F59E0B', // Amber
  secondaryLight: '#FCD34D',
  secondaryDark: '#D97706',

  // Success/Progress
  success: '#10B981',
  successLight: '#D1FAE5',

  // Error
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Warning
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Info
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',

  // Background
  background: '#F9FAFB',
  backgroundSecondary: '#F3F4F6',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Gamification colors
  xp: '#8B5CF6',
  coins: '#F59E0B',
  streak: '#EF4444',
  level: '#10B981',
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
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

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Shadows (single definition)
export const shadows = {
  sm: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Gradients
export const gradients = {
  primary: ['#6366F1', '#4F46E5'] as const,
  primaryLight: ['#818CF8', '#6366F1'] as const,
  secondary: ['#F59E0B', '#D97706'] as const,
  secondaryWarm: ['#FBBF24', '#F59E0B'] as const,
  hero: ['#7C3AED', '#6366F1', '#4F46E5'] as const,
  childHero: ['#F59E0B', '#EF4444'] as const,
  success: ['#10B981', '#059669'] as const,
};

// Font families (Nunito)
export const fonts = {
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
};
