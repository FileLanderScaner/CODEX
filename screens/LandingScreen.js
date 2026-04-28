import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import SurfaceCard from '../components/ui/SurfaceCard';
import { ui } from '../lib/ui';
import { buildShareText, filterMontevideoLaunchPrices, getPopularDeals } from '../services/price-service';
import { loadCloudPrices } from '../services/supabase-price-service';

export default function LandingScreen({ onOpenApp }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let alive = true;
    loadCloudPrices()
      .then((rows) => {
        if (!alive) return;
        const launchRows = filterMontevideoLaunchPrices(rows);
        setPrices(launchRows);
        setStatus(`${launchRows.length} precios reales activos`);
      })
      .catch((error) => {
        if (!alive) return;
        setStatus(error.message || 'No pudimos cargar precios reales');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const deals = useMemo(() => getPopularDeals(prices).slice(0, 3), [prices]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text selectable style={styles.brand}>AhorroYA</Text>
        <Text selectable style={styles.title}>Encontra el precio mas barato en 30 segundos</Text>
        <Text selectable style={styles.subtitle}>Montevideo, Uruguay. Disco, Tienda Inglesa, Devoto y Ta-Ta.</Text>
        <Pressable accessibilityRole="button" onPress={onOpenApp} style={styles.cta}>
          <Text style={styles.ctaText}>Abrir app</Text>
        </Pressable>
      </View>

      <SurfaceCard style={styles.proofCard}>
        <Text selectable style={styles.sectionTitle}>Ahorros detectados en Montevideo</Text>
        {loading ? <ActivityIndicator /> : null}
        <Text selectable style={styles.statusText}>{status}</Text>
      </SurfaceCard>

      <View style={{ gap: 12 }}>
        {deals.length ? deals.map((deal) => (
          <SurfaceCard key={deal.product} style={styles.dealCard}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={styles.dealTitle}>{deal.cheapest?.displayName || deal.product}</Text>
              <Text selectable style={styles.dealMeta}>
                ${Number(deal.cheapest?.price || 0)} en {deal.cheapest?.store} vs ${Number(deal.expensive?.price || 0)} en {deal.expensive?.store}
              </Text>
              <Text selectable style={styles.shareText}>{buildShareText([deal.cheapest, deal.expensive].filter(Boolean))}</Text>
            </View>
            <Text selectable style={styles.savings}>${deal.savings}</Text>
          </SurfaceCard>
        )) : (
          <SurfaceCard>
            <Text selectable style={styles.statusText}>Estamos cargando comparaciones reales para Montevideo.</Text>
          </SurfaceCard>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  header: {
    gap: 10,
    paddingTop: 10,
  },
  brand: {
    color: ui.colors.primaryInk,
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    color: ui.colors.text,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
  },
  subtitle: {
    color: '#667085',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  cta: {
    marginTop: 6,
    minHeight: 54,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  proofCard: {
    gap: 8,
  },
  sectionTitle: {
    color: ui.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statusText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  dealCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dealTitle: {
    color: ui.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  dealMeta: {
    color: ui.colors.primaryInk,
    fontSize: 13,
    fontWeight: '900',
  },
  shareText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  savings: {
    color: ui.colors.text,
    fontSize: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
