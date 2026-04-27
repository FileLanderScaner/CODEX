import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '../lib/ui';
import { trackProductClick } from '../services/commerce-service';

export default function ProductLinks({ links = [] }) {
  if (!links.length) {
    return null;
  }

  const openLink = async (link) => {
    await trackProductClick(link, 'recommended_link');
    Linking.openURL(link.url);
  };

  return (
    <View style={styles.card}>
      <Text selectable style={styles.title}>Links recomendados</Text>
      {links.map((link) => (
        <Pressable key={link.id} accessibilityRole="link" onPress={() => openLink(link)} style={styles.row}>
          <View style={styles.copy}>
            <Text selectable style={styles.name}>{link.title}</Text>
            <Text selectable style={styles.meta}>
              {link.store} · {link.kind === 'sponsored' ? 'Patrocinado' : link.kind === 'affiliate' ? 'Afiliado' : 'Oferta'}
            </Text>
          </View>
          <Text style={styles.cta}>Ver</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ui.colors.surface,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    borderRadius: ui.radius.md,
    padding: 16,
    gap: 10,
  },
  title: {
    color: ui.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.colors.outline,
    paddingTop: 10,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  meta: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  cta: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
  },
});
