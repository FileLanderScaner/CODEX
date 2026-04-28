import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SurfaceCard from '../ui/SurfaceCard';
import { ui } from '../../lib/ui';

function Sparkline({ tone = 'stable' }) {
  const color = tone === 'down' ? ui.colors.primary : tone === 'up' ? ui.colors.danger : ui.colors.secondary;
  const bars = useMemo(() => [6, 10, 14, 12, 9, 11, 8], []);
  return (
    <View style={styles.sparkWrap}>
      {bars.map((h, idx) => (
        <View key={idx} style={[styles.bar, { height: h, backgroundColor: color, opacity: idx === bars.length - 1 ? 1 : 0.6 }]} />
      ))}
    </View>
  );
}

export default function TrendDealCard({ category, title, priceLabel, badgeLabel, badgeTone, onPress }) {
  const badgeStyles =
    badgeTone === 'down'
      ? { backgroundColor: '#E9FBF2', color: ui.colors.primaryInk }
      : badgeTone === 'up'
        ? { backgroundColor: '#FFE4E1', color: ui.colors.danger }
        : { backgroundColor: '#EAF0FF', color: ui.colors.secondary };

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <SurfaceCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text selectable style={styles.category}>{category}</Text>
            <Text selectable style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Text selectable style={styles.price}>{priceLabel}</Text>
          </View>

          <View style={styles.right}>
            <Sparkline tone={badgeTone === 'down' ? 'down' : badgeTone === 'up' ? 'up' : 'stable'} />
            <View style={[styles.badge, { backgroundColor: badgeStyles.backgroundColor }]}>
              <Text style={[styles.badgeText, { color: badgeStyles.color }]} numberOfLines={1}>
                {badgeLabel}
              </Text>
            </View>
          </View>
        </View>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  category: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: {
    color: ui.colors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  price: {
    color: ui.colors.primaryInk,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
    width: 124,
  },
  sparkWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 22,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  badge: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: ui.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '900',
    fontSize: 12,
  },
});

