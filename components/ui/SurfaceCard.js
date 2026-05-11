import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ui, shadow } from '../../lib/ui';

export default function SurfaceCard({ children, style, elevated = true, tone = 'default' }) {
  return (
    <View style={[styles.card, tone === 'soft' && styles.soft, tone === 'premium' && styles.premium, elevated && styles.shadow, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ui.colors.surface,
    borderRadius: ui.radius.lg,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    padding: ui.spacing.card,
  },
  soft: {
    backgroundColor: ui.colors.surfaceLow,
    borderColor: ui.colors.outlineStrong,
  },
  premium: {
    backgroundColor: ui.colors.premiumBg,
    borderColor: '#3157D5',
  },
  shadow: {
    ...shadow(1),
  },
});
