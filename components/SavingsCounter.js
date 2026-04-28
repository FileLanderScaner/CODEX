// components/SavingsCounter.js
// Contador de ahorros acumulados en sesión actual

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SurfaceCard from './ui/SurfaceCard';
import { ui } from '../lib/ui';

/**
 * SavingsCounter
 * Props:
 * - monthlyTotal: número de ahorro acumulado
 * - thisSearchSavings: ahorro de esta búsqueda
 * - trend: 'up' | 'down' | null
 * - currency: string (default 'UYU')
 */
export default function SavingsCounter({ monthlyTotal = 0, thisSearchSavings = 0, trend = null, currency = 'UYU' }) {
  const formattedTotal = useMemo(() => {
    return Number(monthlyTotal).toFixed(0);
  }, [monthlyTotal]);

  const formattedSearch = useMemo(() => {
    return Number(thisSearchSavings).toFixed(0);
  }, [thisSearchSavings]);

  const trendEmoji = useMemo(() => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '💰';
  }, [trend]);

  return (
    <SurfaceCard style={styles.container} elevated>
      <View style={styles.innerRow}>
        <View style={styles.col1}>
          <Text selectable style={styles.label}>Ahorro del mes</Text>
          <View style={styles.row}>
            <Text selectable style={styles.trendEmoji}>{trendEmoji}</Text>
            <Text selectable style={styles.mainAmount}>{currency} {formattedTotal}</Text>
          </View>
        </View>

        {thisSearchSavings > 0 && (
          <View style={styles.divider} />
        )}

        {thisSearchSavings > 0 && (
          <View style={styles.col2}>
            <Text selectable style={styles.label}>Justo ahora</Text>
            <View style={styles.row}>
              <Text selectable style={styles.trendEmoji}>+</Text>
              <Text selectable style={styles.searchAmount}>{currency} {formattedSearch}</Text>
            </View>
          </View>
        )}
      </View>

      {monthlyTotal > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (monthlyTotal / 100) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text selectable style={styles.progressText}>
            {monthlyTotal > 100 ? '✅ Meta alcanzada' : `${Math.round((monthlyTotal / 100) * 100)}% hacia $100`}
          </Text>
        </View>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 12,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  col1: {
    flex: 1,
    gap: 4,
  },
  col2: {
    flex: 0,
    gap: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: ui.colors.outline,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: ui.colors.textSecondary,
    textTransform: 'uppercase',
  },
  mainAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: ui.colors.successGreen || '#10b981',
  },
  searchAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: ui.colors.successGreen || '#10b981',
  },
  trendEmoji: {
    fontSize: 16,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: ui.colors.outline,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ui.colors.successGreen || '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: ui.colors.textSecondary,
  },
});
