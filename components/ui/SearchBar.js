import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ui, shadow } from '../../lib/ui';

export default function SearchBar({
  value,
  placeholder = 'Buscar producto',
  onChangeText,
  onSubmit,
  onPressBarcode,
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>S</Text>
      <TextInput
        autoCapitalize="none"
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        style={styles.input}
      />
      <Pressable accessibilityRole="button" onPress={onPressBarcode} style={styles.barcode}>
        <Text style={styles.barcodeText}>|||</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ui.colors.surface,
    borderRadius: ui.radius.lg,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    paddingHorizontal: 14,
    minHeight: 54,
    ...shadow(1),
  },
  icon: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    width: 18,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    color: ui.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  barcode: {
    width: 34,
    height: 34,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.colors.surfaceLow,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 12,
  },
});
