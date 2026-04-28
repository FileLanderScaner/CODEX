import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ui, shadow } from '../../lib/ui';

export default function OfferOfDayCard({ title, price, oldPrice, subtitle, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.left}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SUPER OFERTA</Text>
        </View>
        <Text selectable style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.priceRow}>
          <Text selectable style={styles.price}>{price}</Text>
          {oldPrice ? <Text selectable style={styles.oldPrice}>{oldPrice}</Text> : null}
        </View>
        {subtitle ? <Text selectable style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>
        <View style={styles.fakeImage} />
        <View style={styles.cartBtn}>
          <Text style={styles.cartIcon}>+</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: ui.radius.xl,
    backgroundColor: ui.colors.primary,
    minHeight: 150,
    ...shadow(2),
  },
  left: {
    flex: 1,
    padding: 18,
    gap: 6,
  },
  right: {
    width: 140,
    position: 'relative',
    backgroundColor: ui.colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeImage: {
    width: 92,
    height: 92,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cartBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ui.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(1),
  },
  cartIcon: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ui.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  title: {
    color: '#073D2C',
    fontSize: 22,
    fontWeight: '900',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  price: {
    color: '#073D2C',
    fontSize: 30,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  oldPrice: {
    color: 'rgba(7,61,44,0.7)',
    textDecorationLine: 'line-through',
    fontWeight: '800',
  },
  subtitle: {
    color: '#073D2C',
    fontSize: 13,
    fontWeight: '800',
  },
});

