import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ui } from '../../lib/ui';

export default function PriceComparisonBadge({ savings = 0, best = false }) {
  const positive = Number(savings) > 0;
  return (
    <View style={[styles.badge, best && styles.best]}>
      <Text selectable style={[styles.label, best && styles.bestLabel]} numberOfLines={1}>
        {positive ? `Ahorras $${Number(savings).toFixed(0)}` : best ? 'Mejor precio' : 'Precio disponible'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 28,
    borderRadius: ui.radius.pill,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    backgroundColor: ui.colors.surfaceLow,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  best: {
    backgroundColor: ui.colors.primarySoft,
    borderColor: '#ABEFC6',
  },
  label: {
    color: ui.colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  bestLabel: {
    color: ui.colors.primaryInk,
  },
});
