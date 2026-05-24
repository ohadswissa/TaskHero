/**
 * Polish-B1 design system barrel.
 * Consume with `import { Surface, Typography, Chip, ... } from '@/components/ui'`.
 *
 * Polish-B2 additions: Avatar, PinDots, PinKeypad, Banner.
 */
export {
  Typography,
  Display,
  Heading,
  Body,
  Caption,
  Scroll,
  Eyebrow,
  type Tone,
  type Align,
} from './Typography';

export { Surface, type SurfaceProps, type SurfaceVariant } from './Surface';
export {
  GradientBackdrop,
  type GradientBackdropProps,
  type GradientVariant,
  type GradientDirection,
  type GradientIntensity,
} from './GradientBackdrop';
export { Chip, type ChipProps, type ChipTone, type ChipSize } from './Chip';
export { SectionHeader, type SectionHeaderProps, type SectionHeaderTone } from './SectionHeader';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { AnimatedPressable, type AnimatedPressableProps, type HapticStrength } from './AnimatedPressable';
export { Icon, type IconProps, type IconName } from './Icon';
export { ScrollCard, type ScrollCardProps } from './ScrollCard';
export { OrbProgress, type OrbProgressProps } from './OrbProgress';

// Polish-B2 promoted primitives
export { Avatar, type AvatarProps, type AvatarSize, type AvatarTone } from './Avatar';
export { PinDots, type PinDotsProps, type PinDotsTone } from './PinDots';
export { PinKeypad, type PinKeypadProps, type PinKeypadTone } from './PinKeypad';
export { Banner, type BannerProps, type BannerTone } from './Banner';

// Polish-B3 promoted primitives
export { StatCard, type StatCardProps, type StatCardTrendTone } from './StatCard';
export {
  RosterRow,
  stageLevel,
  type RosterRowProps,
  type RosterRowChild,
  type RosterRowCreature,
} from './RosterRow';
export {
  ApprovalCardFrame,
  relativeTime,
  type ApprovalCardFrameProps,
  type ApprovalCardSize,
} from './ApprovalCardFrame';
export { MailScroll, type MailScrollProps } from './MailScroll';
export {
  CelebrationBurst,
  type CelebrationBurstProps,
  type CelebrationIntensity,
} from './CelebrationBurst';
export { PhotoFrame, type PhotoFrameProps } from './PhotoFrame';
export {
  ToastStack,
  useToast,
  useToastStore,
  type Toast,
  type ToastTone,
} from './Toast';

// Floating pill tab bar (used as `tabBar` prop on parent + child Tabs).
export {
  default as FloatingTabBar,
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_SCREEN_PADDING,
} from './FloatingTabBar';
