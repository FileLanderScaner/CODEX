import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MetricCard({ label, value, tone = 'neutral' }) {
  return (
    <View style={styles.card}>
      <Text selectable style={styles.label}>{label}</Text>
      <Text selectable style={[styles.value, tone === 'good' && styles.good, tone === 'bad' && styles.bad]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  label: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    color: '#101828',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  good: {
    color: '#027A48',
  },
  bad: {
    color: '#B42318',
  },
});
