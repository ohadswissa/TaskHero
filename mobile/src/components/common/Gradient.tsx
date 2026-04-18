import React from 'react';
import { LinearGradientProps } from 'expo-linear-gradient';

// expo-linear-gradient exports a class component whose types are incompatible
// with TS 6.x's stricter JSX class constraint checking. We bypass this at a
// single point using require() (typed as any) and re-export as a proper FC.
// Runtime behaviour is identical — Metro uses Babel, not tsc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { LinearGradient: _LG } = require('expo-linear-gradient') as { LinearGradient: any };

export type GradientProps = LinearGradientProps & { children?: React.ReactNode };

export function Gradient(props: GradientProps) {
  return <_LG {...props} />;
}
