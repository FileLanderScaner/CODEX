import React, { useMemo } from 'react';
import { Alert, Linking, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import SurfaceCard from '../components/ui/SurfaceCard';
import { ui } from '../lib/ui';
import { buildShareText, getCheapest, getPriceStats, getSavingsText } from '../services/price-service';

export default function ProductDetailScreen({
  product,
  allPrices,
  onBack,
  onCreateAlert,
  onOpenQr,
  locationLabel = 'Montevideo, UY',
}) {
  const normalized = String(product || '').trim();
  const prices = useMemo(
    () => (allPrices || []).filter((p) => String(p.product || p.normalizedProduct || '').toLowerCase() === normalized.toLowerCase()),
    [allPrices, normalized],
  );
  const sorted = useMemo(() => [...prices].sort((a, b) => Number(a.price) - Number(b.price)), [prices]);
  const cheapest = useMemo(() => getCheapest(sorted), [sorted]);
  const stats = useMemo(() => getPriceStats(sorted), [sorted]);
  const savingsText = useMemo(() => (sorted.length ? getSavingsText(sorted) : 'Sin precios suficientes'), [sorted]);

  const shareMessage = useMemo(() => buildShareText(sorted), [sorted]);

  const handleShare = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch (_e) {
      Alert.alert('Compartir', shareMessage);
    }
  };

  const handleWhatsApp = async () => {
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`);
  };

  const openStoreMap = async (store) => {
    const query = `${store} ${locationLabel}`;
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>{"<"} Volver</Text>
      </Pressable>

      <SurfaceCard style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text selectable style={styles.title} numberOfLines={2}>
              {normalized || 'Producto'}
            </Text>
            <Text selectable style={styles.subTitle}>{savingsText}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>PRECIO VERIFICADO</Text>
          </View>
        </View>

        {cheapest ? (
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text selectable style={styles.metricLabel}>PRECIO MAS BARATO</Text>
              <Text selectable style={styles.metricValue}>${Number(cheapest.price)}</Text>
              <Text selectable style={styles.metricMeta}>en {cheapest.store}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text selectable style={styles.metricLabel}>TENDENCIA SEMANAL</Text>
              <Text selectable style={[styles.metricValue, { color: ui.colors.primaryInk }]}>
                {stats?.trend || 'estable'}
              </Text>
              <Text selectable style={styles.metricMeta}>{stats?.count || 0} precios</Text>
            </View>
          </View>
        ) : (
          <Text selectable style={styles.emptyText}>Todavia no hay precios para este producto.</Text>
        )}
      </SurfaceCard>

      <Text selectable style={styles.sectionTitle}>Comparativa de Precios</Text>
      <View style={{ gap: 12 }}>
        {sorted.map((row) => {
          const best = cheapest && row.id === cheapest.id;
          return (
            <Pressable key={row.id} accessibilityRole="button" onPress={() => openStoreMap(row.store)}>
              <SurfaceCard style={[styles.compareRow, best && styles.compareRowBest]}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>{String(row.store || 'S').slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={styles.storeName}>{row.store}</Text>
                  <Text selectable style={[styles.storeMeta, best && { color: ui.colors.primaryInk }]}>
                    {best ? 'El mejor precio' : 'Ver en el mapa'}
                  </Text>
                </View>
                <Text selectable style={styles.rowPrice}>${Number(row.price)}</Text>
                <Text style={styles.arrow}>{'>'}</Text>
              </SurfaceCard>
            </Pressable>
          );
        })}
      </View>

      <Pressable accessibilityRole="button" onPress={() => onCreateAlert?.(normalized)} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Crear alerta de precio</Text>
      </Pressable>

      <View style={styles.actionsRow}>
        <Pressable accessibilityRole="button" onPress={handleShare} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Compartir ahorro</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={handleWhatsApp} style={styles.whatsBtn}>
          <Text style={styles.whatsBtnText}>WhatsApp</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpenQr?.(shareMessage)}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>QR</Text>
        </Pressable>
      </View>

      {Platform.OS === 'web' ? (
        <Text selectable style={styles.hint}>Tip: podes copiar el link desde la pantalla QR.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  backBtn: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: ui.radius.pill,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    backgroundColor: ui.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  headerCard: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  title: {
    color: ui.colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    textTransform: 'capitalize',
  },
  subTitle: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
  },
  statusPill: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#073D2C',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: ui.colors.surfaceLow,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  metricValue: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  metricMeta: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  compareRowBest: {
    borderColor: ui.colors.primary,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: ui.colors.secondary,
    fontWeight: '900',
  },
  storeName: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  storeMeta: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  rowPrice: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  arrow: {
    color: '#98A2B3',
    fontWeight: '900',
    fontSize: 16,
  },
  primaryBtn: {
    minHeight: 54,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    backgroundColor: ui.colors.surface,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  whatsBtn: {
    minHeight: 44,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primary,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsBtnText: {
    color: '#073D2C',
    fontWeight: '900',
  },
  hint: {
    color: '#667085',
    fontSize: 13,
  },
});

