import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function PremiumCard({ onPress }) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>Ya viste ahorro real</Text>
        <Text selectable style={styles.text}>Premium te avisa antes de comprar caro: alertas, historial y favoritos ilimitados.</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
        <Text style={styles.buttonText}>Activar alertas</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#05603A',
    fontSize: 16,
    fontWeight: '800',
  },
  text: {
    color: '#067647',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#101828',
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
