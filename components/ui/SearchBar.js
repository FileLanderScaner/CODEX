import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { gradientStyle, ui, shadow } from '../../lib/ui';

export default function SearchBar({
  value,
  placeholder = 'Buscar producto',
  onChangeText,
  onSubmit,
  onPressBarcode,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <Text style={styles.icon}>S</Text>
      </View>
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
    backgroundColor: ui.colors.surfaceGlass,
    borderRadius: ui.radius.xl,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 58,
    ...shadow(2),
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: ui.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...gradientStyle('primary'),
  },
  icon: {
    color: '#FFFFFF',
    fontWeight: '900',
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
    backgroundColor: ui.colors.primarySoft,
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
