import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import ProductLinks from '../components/ProductLinks';
import Chip from '../components/ui/Chip';
import SurfaceCard from '../components/ui/SurfaceCard';
import { ui } from '../lib/ui';
import { buildShareText, getCheapest, getPriceStats, getSavingsOpportunity, getSavingsText } from '../services/price-service';

function stableDistanceKm(seed) {
  return null;
}

function sortResults(results, sortKey) {
  const list = [...(results || [])];
  if (sortKey === 'price') {
    return list.sort((a, b) => Number(a.price) - Number(b.price));
  }
  if (sortKey === 'distance') {
    return list.sort((a, b) => String(a.neighborhood || '').localeCompare(String(b.neighborhood || '')));
  }
  return list;
}

export default function ResultsScreen({
  searchedQuery,
  results,
  favorites,
  onFavorite,
  onSharePoints,
  onReportPrice,
  onCreateAlert,
  productLinks,
  sortKey = 'relevance',
  selectedNeighborhood,
  onNeighborhood,
  onOpenMap,
  onOpenDetail,
}) {
  const [selected, setSelected] = useState(null);
  const sorted = useMemo(() => sortResults(results, sortKey), [results, sortKey]);
  const cheapest = useMemo(() => getCheapest(sorted), [sorted]);
  const stats = useMemo(() => getPriceStats(sorted), [sorted]);
  const isFavorite = Boolean(searchedQuery && favorites.includes(String(searchedQuery).toLowerCase()));

  const handleShare = async () => {
    const message = buildShareText(sorted);
    try {
      await Share.share({ message });
    } catch (_error) {
      Alert.alert('Compartir', message);
    } finally {
      onSharePoints(cheapest, 'native', { savings: getSavingsOpportunity(sorted), url: message.match(/https?:\/\/\S+/)?.[0] || '' });
    }
  };

  const handleWhatsApp = async () => {
    const message = buildShareText(sorted);
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    onSharePoints(cheapest, 'whatsapp', { savings: getSavingsOpportunity(sorted), url: message.match(/https?:\/\/\S+/)?.[0] || '' });
  };

  const handleCopy = async () => {
    const message = buildShareText(sorted);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      Alert.alert('Copiado', 'Texto copiado para compartir.');
    } else {
      Alert.alert('Copiar ahorro', message);
    }
  };

  if (!searchedQuery) {
    return (
      <SurfaceCard>
        <Text selectable style={styles.emptyTitle}>Busca un producto</Text>
        <Text selectable style={styles.emptyText}>Escribe “leche” o toca una busqueda rapida para ver precios cercanos.</Text>
      </SurfaceCard>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.resultsHeader}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={styles.sectionTitle}>Resultados</Text>
          <Text selectable style={styles.savings}>
            {sorted.length ? getSavingsText(sorted) : 'Sin resultados en la base actual'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => onFavorite(String(searchedQuery).toLowerCase())}
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
        >
          <Text style={[styles.favoriteButtonText, isFavorite && styles.favoriteButtonTextActive]}>
            {isFavorite ? 'Guardado' : 'Favorito'}
          </Text>
        </Pressable>
      </View>

      {selectedNeighborhood ? (
        <View style={{ gap: 10 }}>
          <Text selectable style={styles.filterLabel}>Barrio</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {['Todos', 'Centro', 'Cordón', 'Pocitos', 'Carrasco'].map((name) => (
              <Chip
                key={name}
                label={name}
                active={selectedNeighborhood === name}
                onPress={() => onNeighborhood?.(name)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {sorted.length ? (
        <View style={styles.list}>
          {sorted.map((item, index) => {
            const diff = Number(item.price) - Number(cheapest?.price || item.price);
            const best = index === 0;
            const regionLabel = item.neighborhood || item.region || 'Zona no informada';

            return (
              <SurfaceCard key={item.id} style={[styles.storeCard, best && styles.bestCard]}>
                <View style={styles.storeTop}>
                  <View style={styles.storeLogo}>
                    <Text style={styles.storeLogoText}>{String(item.store || 'S').slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text selectable style={styles.storeName} numberOfLines={1}>{item.store}</Text>
                    <Text selectable style={styles.productName} numberOfLines={1}>{item.displayName}</Text>
                  </View>
                  <Text selectable style={styles.distance}>{regionLabel}</Text>
                </View>

                <View style={styles.storeBottom}>
                  <View style={{ gap: 8 }}>
                    <Text selectable style={styles.price}>${Number(item.price)}</Text>
                    <View style={styles.badgeRow}>
                      {best ? (
                        <>
                          <View style={styles.badgeBest}><Text style={styles.badgeBestText}>MAS BARATO</Text></View>
                          <Text selectable style={styles.savingsInline}>AHORRAS ${Math.max(0, Math.round(diff * -1))}</Text>
                        </>
                      ) : (
                        <Text selectable style={styles.metaInline}>
                          {diff > 0 ? `+$${Math.round(diff)}` : 'Precio competitivo'}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setSelected(item);
                      onOpenDetail?.(item);
                    }}
                    style={[styles.detailBtn, best && styles.detailBtnBest]}
                  >
                    <Text style={[styles.detailBtnText, best && styles.detailBtnTextBest]}>Ver detalle</Text>
                  </Pressable>
                </View>
              </SurfaceCard>
            );
          })}
        </View>
      ) : (
        <SurfaceCard>
          <Text selectable style={styles.emptyTitle}>No encontramos ese producto.</Text>
          <Text selectable style={styles.emptyText}>Agrega un precio abajo y quedara guardado para todos.</Text>
        </SurfaceCard>
      )}

      <SurfaceCard style={styles.mapCard}>
        <View style={styles.mapPreview} />
        <Pressable
          accessibilityRole="button"
          onPress={() => (onOpenMap ? onOpenMap() : Alert.alert('Mapa', 'Proximo paso: mapa real con sucursales cercanas.'))}
          style={styles.mapBtn}
        >
          <Text style={styles.mapBtnText}>Ver en el mapa</Text>
        </Pressable>
        <Text selectable style={styles.mapHint}>Ubicacion basada en region informada por la fuente oficial.</Text>
      </SurfaceCard>

      {selected ? (
        <SurfaceCard style={{ gap: 12 }}>
          <View style={styles.rowBetween}>
            <Text selectable style={styles.detailTitle}>{selected.displayName}</Text>
            <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>X</Text>
            </Pressable>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailMetric}>
              <Text selectable style={styles.metricLabel}>Precio mas barato</Text>
              <Text selectable style={styles.metricValue}>${Number(cheapest?.price || 0)}</Text>
              <Text selectable style={styles.metricMeta}>en {cheapest?.store || '-'}</Text>
            </View>
            <View style={styles.detailMetric}>
              <Text selectable style={styles.metricLabel}>Tendencia semanal</Text>
              <Text selectable style={[styles.metricValue, { color: ui.colors.primaryInk }]}>
                {stats?.trend ? String(stats.trend) : 'estable'}
              </Text>
              <Text selectable style={styles.metricMeta}>{stats?.count || 0} precios</Text>
            </View>
          </View>

          <Pressable accessibilityRole="button" onPress={() => onCreateAlert(String(searchedQuery))} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Crear alerta de precio</Text>
          </Pressable>

          <View style={styles.shareRow}>
            <Pressable accessibilityRole="button" onPress={handleShare} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Compartir ahorro</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleWhatsApp} style={styles.whatsBtn}>
              <Text style={styles.whatsBtnText}>WhatsApp</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Copiar</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" onPress={() => onReportPrice(selected)} style={styles.reportBtn}>
            <Text style={styles.reportBtnText}>Reportar precio</Text>
          </Pressable>
        </SurfaceCard>
      ) : null}

      <ProductLinks links={productLinks} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: ui.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  savings: {
    color: ui.colors.primaryInk,
    fontSize: 14,
    fontWeight: '900',
  },
  favoriteButton: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: ui.radius.pill,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    paddingHorizontal: 14,
    backgroundColor: ui.colors.surface,
  },
  favoriteButtonActive: {
    backgroundColor: ui.colors.badgeBg,
    borderColor: '#CFF7E3',
  },
  favoriteButtonText: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  favoriteButtonTextActive: {
    color: ui.colors.primaryInk,
  },
  filterLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  list: {
    gap: 12,
  },
  storeCard: {
    paddingVertical: 14,
  },
  bestCard: {
    borderColor: ui.colors.primary,
  },
  storeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: {
    color: ui.colors.secondary,
    fontWeight: '900',
    fontSize: 18,
  },
  storeName: {
    color: ui.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  productName: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
  },
  distance: {
    color: '#98A2B3',
    fontWeight: '900',
  },
  storeBottom: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  price: {
    color: ui.colors.text,
    fontSize: 38,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  badgeBest: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBestText: {
    color: '#073D2C',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  savingsInline: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 12,
  },
  metaInline: {
    color: '#667085',
    fontWeight: '800',
    fontSize: 12,
  },
  detailBtn: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: ui.radius.lg,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnBest: {
    backgroundColor: ui.colors.primaryInk,
  },
  detailBtnText: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  detailBtnTextBest: {
    color: '#FFFFFF',
  },
  mapCard: {
    gap: 10,
  },
  mapPreview: {
    height: 170,
    borderRadius: ui.radius.md,
    backgroundColor: '#D0D5DD',
  },
  mapBtn: {
    alignSelf: 'flex-start',
    borderRadius: ui.radius.pill,
    backgroundColor: ui.colors.surface,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    paddingHorizontal: 14,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnText: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  mapHint: {
    color: ui.colors.muted,
    fontSize: 14,
  },
  emptyTitle: {
    color: ui.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailTitle: {
    color: ui.colors.text,
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ui.colors.surfaceLow,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: ui.colors.text,
    fontWeight: '900',
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailMetric: {
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
  shareRow: {
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
  reportBtn: {
    minHeight: 44,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBtnText: {
    color: '#C2410C',
    fontWeight: '900',
  },
});
