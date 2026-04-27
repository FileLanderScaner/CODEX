import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SurfaceCard from '../ui/SurfaceCard';
import { ui } from '../../lib/ui';

export default function SupermarketMiniCard({ name, distanceLabel, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1 }}>
      <SurfaceCard style={styles.card}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>S</Text>
        </View>
        <Text selectable style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text selectable style={styles.distance} numberOfLines={1}>
          {distanceLabel}
        </Text>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 92,
    padding: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: ui.colors.secondary,
    fontWeight: '900',
  },
  name: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  distance: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
});
