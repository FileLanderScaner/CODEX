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
  const hasValue = String(value || '').trim().length > 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <Text style={styles.icon}>S</Text>
      </View>
      <TextInput
        accessibilityLabel="Buscar producto"
        autoCapitalize="none"
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasValue ? 'Buscar ahora' : 'Escanear codigo'}
        onPress={hasValue ? onSubmit : onPressBarcode}
        style={[styles.barcode, hasValue && styles.searchAction]}
      >
        <Text style={[styles.barcodeText, hasValue && styles.searchActionText]}>{hasValue ? 'Ir' : '|||'}</Text>
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
    paddingHorizontal: 12,
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
    minWidth: 34,
    height: 34,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.colors.primarySoft,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAction: {
    minWidth: 38,
    backgroundColor: ui.colors.primaryInk,
    borderColor: ui.colors.primaryInk,
    paddingHorizontal: 8,
  },
  barcodeText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 12,
  },
  searchActionText: {
    color: '#FFFFFF',
  },
});
