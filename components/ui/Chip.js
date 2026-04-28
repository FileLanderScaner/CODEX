import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ui } from '../../lib/ui';

export default function Chip({ label, active, onPress, leading }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {leading ? <Text style={[styles.leading, active && styles.leadingActive]}>{leading}</Text> : null}
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: ui.colors.outline,
  },
  chipActive: {
    backgroundColor: ui.colors.primaryInk,
    borderColor: ui.colors.primaryInk,
  },
  text: {
    color: ui.colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  textActive: {
    color: '#FFFFFF',
  },
  leading: {
    color: ui.colors.muted,
    fontWeight: '900',
  },
  leadingActive: {
    color: '#FFFFFF',
  },
});

