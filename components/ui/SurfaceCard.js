import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ui, shadow } from '../../lib/ui';

export default function SurfaceCard({ children, style, elevated = true }) {
  return (
    <View style={[styles.card, elevated && styles.shadow, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ui.colors.surface,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    padding: ui.spacing.card,
  },
  shadow: {
    ...shadow(1),
  },
});

