import React from 'react';
import { StyleSheet, View } from 'react-native';
import { gradientStyle, shadow, ui } from '../../lib/ui';

export default function GradientBorderCard({ children, style, innerStyle, tone = 'savings' }) {
  return (
    <View style={[styles.outer, tone === 'premium' && gradientStyle('premium'), tone !== 'premium' && gradientStyle('savings'), style]}>
      <View style={[styles.inner, innerStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: ui.radius.xl,
    padding: 1,
    ...shadow(1),
  },
  inner: {
    borderRadius: ui.radius.xl - 1,
    backgroundColor: ui.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.64)',
    padding: ui.spacing.card,
  },
});
