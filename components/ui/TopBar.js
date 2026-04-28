import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '../../lib/ui';

export default function TopBar({ locationLabel = 'Montevideo, UY', onPressLocation, onPressQr }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" onPress={onPressLocation} style={styles.location}>
        <View style={styles.pin} />
        <Text selectable style={styles.locationText} numberOfLines={1}>
          {locationLabel}
        </Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onPressQr} style={styles.qr}>
        <Text style={styles.qrText}>QR</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minHeight: 34,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ui.colors.primary,
  },
  locationText: {
    color: ui.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  qr: {
    minWidth: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.pill,
    backgroundColor: ui.colors.surfaceLow,
    borderWidth: 1,
    borderColor: ui.colors.outline,
  },
  qrText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 12,
  },
});

