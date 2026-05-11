import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GradientBorderCard from './GradientBorderCard';
import TrustBadge from './TrustBadge';
import { ui } from '../../lib/ui';

export default function SavingsCard({ title, subtitle, amount, meta }) {
  return (
    <GradientBorderCard innerStyle={styles.inner}>
      <View style={styles.copy}>
        <TrustBadge label="Ahorro estimado" tone="safe" />
        <Text selectable style={styles.title}>{title}</Text>
        {subtitle ? <Text selectable style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.amountBox}>
        <Text selectable style={styles.amount}>{amount}</Text>
        {meta ? <Text selectable style={styles.meta}>{meta}</Text> : null}
      </View>
    </GradientBorderCard>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: ui.colors.text,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  subtitle: {
    color: ui.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  amountBox: {
    minWidth: 92,
    borderRadius: ui.radius.lg,
    backgroundColor: ui.colors.primarySoft,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  amount: {
    color: ui.colors.primaryInk,
    fontSize: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  meta: {
    color: ui.colors.primaryInk,
    fontSize: 11,
    fontWeight: '800',
  },
});
