import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AdBanner() {
  return (
    <View style={styles.banner}>
      <Text selectable style={styles.label}>Publicidad</Text>
      <Text selectable style={styles.text}>Espacio reservado para comercios verificados.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  label: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  text: {
    color: '#7C2D12',
    fontSize: 14,
    fontWeight: '600',
  },
});
