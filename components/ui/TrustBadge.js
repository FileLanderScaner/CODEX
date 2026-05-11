import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ui } from '../../lib/ui';

export default function TrustBadge({ label, tone = 'default' }) {
  const toneStyle = tone === 'premium' ? styles.premium : tone === 'safe' ? styles.safe : styles.default;
  const textStyle = tone === 'premium' ? styles.premiumText : tone === 'safe' ? styles.safeText : styles.defaultText;
  return (
    <View style={[styles.badge, toneStyle]}>
      <Text selectable style={[styles.text, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: ui.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    backgroundColor: ui.colors.secondarySoft,
    borderColor: '#C7D7FE',
  },
  safe: {
    backgroundColor: ui.colors.primarySoft,
    borderColor: '#ABEFC6',
  },
  premium: {
    backgroundColor: '#FFF7E5',
    borderColor: '#FED7AA',
  },
  text: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  defaultText: {
    color: ui.colors.secondary,
  },
  safeText: {
    color: ui.colors.primaryInk,
  },
  premiumText: {
    color: ui.colors.accentInk,
  },
});
