import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AnimatedSection from '../components/ui/AnimatedSection';
import GlowButton from '../components/ui/GlowButton';
import SavingsCard from '../components/ui/SavingsCard';
import SurfaceCard from '../components/ui/SurfaceCard';
import TrustBadge from '../components/ui/TrustBadge';
import { gradientStyle, ui } from '../lib/ui';
import { buildShareText, filterMontevideoLaunchPrices, getPopularDeals } from '../services/price-service';
import { loadGrowthMetrics } from '../services/growth-service';
import { loadCloudPrices } from '../services/supabase-price-service';
import { trackEvent } from '../services/tracking-service';

export default function LandingScreen({ onOpenApp }) {
  const [prices, setPrices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let alive = true;
    const startedAt = Date.now();
    trackEvent('landing_viewed', { city: 'Montevideo', source: 'landing' }).catch(() => null);
    trackEvent('landing_view', { city: 'Montevideo', source: 'landing' }).catch(() => null);
    Promise.all([
      loadCloudPrices(),
      loadGrowthMetrics().catch(() => null),
    ])
      .then(([rows, growthMetrics]) => {
        if (!alive) return;
        const launchRows = filterMontevideoLaunchPrices(rows);
        setPrices(launchRows);
        setMetrics(growthMetrics);
        setStatus(`${launchRows.length} precios reales activos`);
        trackEvent('landing_viewed', {
          city: 'Montevideo',
          source: 'landing_prices_loaded',
          prices: launchRows.length,
          load_ms: Date.now() - startedAt,
        }).catch(() => null);
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

  const handleOpenApp = async () => {
    await trackEvent('open_app', {
      city: 'Montevideo',
      source: 'landing_cta',
      examples_visible: deals.length,
    }).catch(() => null);
    onOpenApp?.();
  };

  return (
    <View style={styles.wrapper}>
      <AnimatedSection>
        <View style={styles.header}>
          <TrustBadge label="Montevideo beta" tone="safe" />
          <Text selectable style={styles.brand}>AhorroYA</Text>
          <Text selectable style={styles.title}>Compra mas inteligente antes de salir al super</Text>
          <Text selectable style={styles.subtitle}>Compara precios disponibles, ve el ahorro estimado y comparte el resultado por WhatsApp en segundos.</Text>
          <GlowButton onPress={handleOpenApp}>Abrir app y comparar</GlowButton>
        </View>
      </AnimatedSection>

      <AnimatedSection delay={60}>
        <SurfaceCard style={styles.proofCard}>
          <Text selectable style={styles.sectionTitle}>Ahorros detectados en Montevideo</Text>
          {loading ? <ActivityIndicator /> : null}
          <Text selectable style={styles.statusText}>{status}</Text>
          <View style={styles.metricRow}>
            <TrustBadge label={`${metrics?.funnel?.searches ?? 0} comparaciones hoy`} />
            <TrustBadge label={`${metrics?.funnel?.shares ?? 0} shares`} tone="safe" />
          </View>
        </SurfaceCard>
      </AnimatedSection>

      <View style={{ gap: 12 }}>
        {deals.length ? deals.map((deal) => (
          <AnimatedSection key={deal.product} delay={90}>
            <SavingsCard
              title={deal.cheapest?.displayName || deal.product}
              subtitle={`$${Number(deal.cheapest?.price || 0)} en ${deal.cheapest?.store} vs $${Number(deal.expensive?.price || 0)} en ${deal.expensive?.store}`}
              amount={`$${deal.savings}`}
              meta="menos"
            />
            <Text selectable style={styles.shareText}>{buildShareText([deal.cheapest, deal.expensive].filter(Boolean))}</Text>
          </AnimatedSection>
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
    gap: 12,
    padding: 18,
    borderRadius: ui.radius.xl,
    ...gradientStyle('savings'),
  },
  brand: {
    color: ui.colors.primaryInk,
    fontSize: 20,
    fontWeight: '900',
  },
  title: {
    color: ui.colors.text,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
  },
  subtitle: {
    color: '#667085',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  proofCard: {
    gap: 8,
    backgroundColor: ui.colors.surfaceGlass,
    borderColor: '#FFFFFF',
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
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shareText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
    marginTop: 6,
  },
});
