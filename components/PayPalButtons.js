import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

export default function PayPalButtons({ onOpenWebCheckout }) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpenWebCheckout} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>Pagar en la web</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#101828',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
