import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { gradientStyle, ui, shadow } from '../../lib/ui';

export default function TopBar({ locationLabel = 'Montevideo, UY', onPressLocation, onPressQr }) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Cambiar ubicacion, actual ${locationLabel}`}
        onPress={onPressLocation}
        style={styles.location}
      >
        <View style={styles.pin}>
          <View style={styles.pinDot} />
        </View>
        <Text selectable style={styles.locationText} numberOfLines={1}>
          {locationLabel}
        </Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="Escanear o abrir QR" onPress={onPressQr} style={styles.qr}>
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...gradientStyle('primary'),
    ...shadow(1),
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  locationText: {
    color: ui.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  qr: {
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.pill,
    backgroundColor: ui.colors.surfaceGlass,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    ...shadow(1),
  },
  qrText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 12,
  },
});
