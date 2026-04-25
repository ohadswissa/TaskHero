import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gradient } from './Gradient';
import { fonts } from '@/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ size = 'md' }: LogoProps) {
  const s = sizes[size];

  return (
    <View style={[styles.container, { width: s.container, height: s.container }]}>
      {/* Outer glow ring */}
      <View style={[styles.glowRing, { width: s.container, height: s.container, borderRadius: s.container / 2 }]}>
        {/* Shield shape */}
        <Gradient
          colors={['#6366F1', '#8B5CF6', '#A78BFA']}
          style={[styles.shield, { width: s.shield, height: s.shield, borderRadius: s.shieldRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Inner shield */}
          <View style={[styles.innerShield, { width: s.inner, height: s.inner, borderRadius: s.innerRadius }]}>
            {/* Star/Hero icon */}
            <Text style={[styles.heroIcon, { fontSize: s.icon }]}>⚡</Text>
          </View>
          {/* Small accent stars */}
          <View style={[styles.starTopRight, { top: s.starOffset, right: s.starOffset }]}>
            <Text style={{ fontSize: s.starSize }}>✦</Text>
          </View>
          <View style={[styles.starBottomLeft, { bottom: s.starOffset, left: s.starOffset }]}>
            <Text style={{ fontSize: s.starSize * 0.7 }}>✦</Text>
          </View>
        </Gradient>
      </View>
    </View>
  );
}

const sizes = {
  sm: { container: 56, shield: 48, shieldRadius: 16, inner: 32, innerRadius: 10, icon: 18, starOffset: 2, starSize: 8 },
  md: { container: 100, shield: 88, shieldRadius: 28, inner: 58, innerRadius: 18, icon: 32, starOffset: 4, starSize: 12 },
  lg: { container: 140, shield: 120, shieldRadius: 36, inner: 80, innerRadius: 24, icon: 44, starOffset: 6, starSize: 16 },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  shield: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  innerShield: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroIcon: {
    textAlign: 'center',
  },
  starTopRight: {
    position: 'absolute',
    opacity: 0.8,
  },
  starBottomLeft: {
    position: 'absolute',
    opacity: 0.6,
  },
});
