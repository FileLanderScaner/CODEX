import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { gradientStyle, shadow, ui } from '../../lib/ui';

export default function GlowButton({
  children,
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
}) {
  const isPrimary = variant === 'primary';
  const isPremium = variant === 'premium';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof (children || label) === 'string' ? children || label : undefined)}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.primary,
        isPremium && styles.premium,
        variant === 'secondary' && styles.secondary,
        pressed && !disabled && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {isPrimary || isPremium ? <View pointerEvents="none" style={styles.glow} /> : null}
      {loading ? <ActivityIndicator color={isPrimary || isPremium ? '#FFFFFF' : ui.colors.primaryInk} /> : null}
      {!loading ? (
        <Text style={[styles.text, (isPrimary || isPremium) && styles.textOnDark, variant === 'secondary' && styles.textSecondary, textStyle]}>
          {children || label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: ui.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    ...gradientStyle('primary'),
    borderColor: 'rgba(255,255,255,0.34)',
    ...shadow(2),
  },
  premium: {
    ...gradientStyle('premium'),
    borderColor: 'rgba(255,255,255,0.26)',
    ...shadow(2),
  },
  secondary: {
    backgroundColor: ui.colors.surface,
    borderColor: ui.colors.outline,
    ...shadow(1),
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.62,
  },
  glow: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: -12,
    height: 28,
    borderRadius: ui.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  text: {
    color: ui.colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  textOnDark: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: ui.colors.primaryInk,
  },
});
