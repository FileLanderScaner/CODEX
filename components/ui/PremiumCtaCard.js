import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GlowButton from './GlowButton';
import GradientBorderCard from './GradientBorderCard';
import TrustBadge from './TrustBadge';
import { ui } from '../../lib/ui';

export default function PremiumCtaCard({ onPress, savingsLabel = 'alertas y favoritos ilimitados' }) {
  return (
    <GradientBorderCard tone="premium" innerStyle={styles.inner}>
      <View style={styles.header}>
        <TrustBadge label="Premium" tone="premium" />
        <Text selectable style={styles.title}>Compra con alertas antes de pagar de mas</Text>
        <Text selectable style={styles.text}>
          Desbloquea {savingsLabel}, historial de precios y avisos cuando baje un producto.
        </Text>
      </View>
      <GlowButton variant="premium" onPress={onPress} style={styles.button}>
        Ver Premium
      </GlowButton>
    </GradientBorderCard>
  );
}

const styles = StyleSheet.create({
  inner: {
    backgroundColor: ui.colors.premiumBg,
    borderColor: 'rgba(255,255,255,0.22)',
    gap: 14,
  },
  header: {
    gap: 8,
  },
  title: {
    color: ui.colors.premiumInk,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  text: {
    color: '#C6D3E1',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  button: {
    alignSelf: 'stretch',
  },
});
