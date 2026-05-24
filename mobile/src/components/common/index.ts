/**
 * Legacy `common/*` barrel. Polish-B4 retired Button, Card, ScreenHeader,
 * Logo, and Input — all parent screens now consume primitives from
 * `@/components/ui` instead. The only file kept is `Gradient.tsx`,
 * which the creature `SpeciesBadge` still depends on for its species-
 * tinted halo. Re-export it here so existing imports keep resolving.
 */
export { Gradient } from './Gradient';
