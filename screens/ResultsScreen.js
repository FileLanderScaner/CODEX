import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import ProductLinks from '../components/ProductLinks';
import Chip from '../components/ui/Chip';
import SurfaceCard from '../components/ui/SurfaceCard';
import { ui } from '../lib/ui';
import { trackProductClick } from '../services/commerce-service';
import { buildShareText, getCheapest, getPriceStats, getSavingsOpportunity, getSavingsText } from '../services/price-service';

function stableDistanceKm(seed) {
  return null;
}

function hasValidPrice(item) {
  return Number.isFinite(Number(item?.price)) && Number(item?.price) > 0;
}

function sortResults(results, sortKey) {
  const list = [...(results || [])];
  if (sortKey === 'price') {
    return list.sort((a, b) => Number(hasValidPrice(a) ? a.price : Number.MAX_SAFE_INTEGER) - Number(hasValidPrice(b) ? b.price : Number.MAX_SAFE_INTEGER));
  }
  if (sortKey === 'distance') {
    return list.sort((a, b) => String(a.neighborhood || '').localeCompare(String(b.neighborhood || '')));
  }
  return list;
}

export default function ResultsScreen({
  searchedQuery,
  results,
  loadingCatalogs = false,
  partialResults = [],
  finalResults = [],
  premiumLocalSuggestions = null,
  isPremium = false,
  onOpenPremium,
  favorites,
  onFavorite,
  onSharePoints,
  onReportPrice,
  onCreateAlert,
  productLinks,
  catalogStatus,
  catalogSources = [],
  sortKey = 'relevance',
  selectedNeighborhood,
  onNeighborhood,
  onOpenMap,
  onOpenDetail,
}) {
  const [selected, setSelected] = useState(null);
  const sorted = useMemo(() => sortResults(results, sortKey), [results, sortKey]);
  const pricedOffers = useMemo(() => sorted.flatMap((item) => item.offers || [item]).filter(hasValidPrice), [sorted]);
  const cheapest = useMemo(() => getCheapest(pricedOffers), [pricedOffers]);
  const stats = useMemo(() => getPriceStats(pricedOffers), [pricedOffers]);
  const savingsOpportunity = useMemo(() => getSavingsOpportunity(pricedOffers), [pricedOffers]);
  const isFavorite = Boolean(searchedQuery && favorites.includes(String(searchedQuery).toLowerCase()));

  const handleShare = async () => {
    const message = buildShareText(pricedOffers);
    try {
      await Share.share({ message });
    } catch (_error) {
      Alert.alert('Compartir', message);
    } finally {
      onSharePoints(cheapest, 'native', { savings: getSavingsOpportunity(pricedOffers), url: message.match(/https?:\/\/\S+/)?.[0] || '' });
    }
  };

  const handleWhatsApp = async () => {
    const message = buildShareText(pricedOffers);
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    onSharePoints(cheapest, 'whatsapp', { savings: getSavingsOpportunity(pricedOffers), url: message.match(/https?:\/\/\S+/)?.[0] || '' });
  };

  const handleCopy = async () => {
    const message = buildShareText(pricedOffers);
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
            {pricedOffers.length ? getSavingsText(pricedOffers) : 'Mostrando links oficiales para comparar'}
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
            {['Todos', 'Centro', 'Cordon', 'Pocitos', 'Carrasco'].map((name) => (
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

      {cheapest && savingsOpportunity > 0 ? (
        <SurfaceCard style={styles.wowCard}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text selectable style={styles.wowTitle}>Encontraste ${savingsOpportunity} de diferencia</Text>
            <Text selectable style={styles.wowText}>
              Mejor precio en {cheapest.store}. Si te sirve, compartilo o deja una alerta para la proxima compra.
            </Text>
          </View>
          <View style={styles.wowActions}>
            <Pressable accessibilityRole="button" onPress={handleWhatsApp} style={styles.whatsBtn}>
              <Text style={styles.whatsBtnText}>Compartir</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onCreateAlert(String(searchedQuery))} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Avisarme</Text>
            </Pressable>
          </View>
        </SurfaceCard>
      ) : null}

      {sorted.length ? (
        <View style={styles.list}>
          {sorted.map((item, index) => {
            const isComparison = item.type === 'comparison';
            const bestOffer = item.bestOffer || item;
            const offers = item.offers || [item];
            const diff = Number(bestOffer?.price) - Number(cheapest?.price || bestOffer?.price || 0);
            const best = index === 0;
            const regionLabel = bestOffer?.neighborhood || bestOffer?.region || 'Catalogo online';
            const hasPrice = hasValidPrice(bestOffer);

            return (
              <SurfaceCard key={item.id} style={[styles.storeCard, best && styles.bestCard]}>
                <View style={styles.storeTop}>
                  <View style={styles.storeLogo}>
                    <Text style={styles.storeLogoText}>{String(bestOffer?.store || item.store || 'S').slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text selectable style={styles.storeName} numberOfLines={1}>{item.displayName}</Text>
                    <Text selectable style={styles.productName} numberOfLines={1}>{item.displayName}</Text>
                  </View>
                  <Text selectable style={styles.distance}>{regionLabel}</Text>
                </View>

                <View style={styles.storeBottom}>
                  <View style={{ gap: 8 }}>
                    <Text selectable style={styles.bestLabel}>{best && hasPrice ? 'MEJOR PRECIO PARA COMPRAR' : 'PRECIO'}</Text>
                    <Text selectable style={styles.price}>{hasPrice ? `$${Number(bestOffer.price)}` : 'Ver catalogo'}</Text>
                    <View style={styles.badgeRow}>
                      {best && hasPrice ? (
                        <>
                          <View style={styles.badgeBest}><Text style={styles.badgeBestText}>MAS BARATO</Text></View>
                          <Text selectable style={styles.savingsInline}>{savingsOpportunity > 0 ? `AHORRAS $${savingsOpportunity}` : 'MEJOR OFERTA'}</Text>
                        </>
                      ) : (
                        <Text selectable style={styles.metaInline}>
                          {hasPrice && diff > 0 ? `+$${Math.round(diff)}` : `${item.commerceCount || offers.length} comercios consultados`}
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

                {isComparison ? (
                  <View style={styles.comparisonBox}>
                    <Text selectable style={styles.comparisonTitle}>Comparacion por comercio</Text>
                    {offers.map((offer) => {
                      const offerHasPrice = hasValidPrice(offer);
                      const link = offer.catalogUrl || offer.fallbackUrl;
                      return (
                        <View key={offer.id} style={styles.commerceRow}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text selectable style={styles.commerceStore}>{offer.store}</Text>
                            <Text selectable style={styles.commerceMeta}>
                              {offerHasPrice ? `$${Number(offer.price)}${offer.priceDifference ? ` (+$${offer.priceDifference})` : ''}` : 'Sin precio legible'}
                              {' · '}
                              {String(offer.source || '').startsWith('catalog:') ? 'catalogo online' : String(offer.source || '').includes('fallback') ? 'link oficial' : 'seed local'}
                            </Text>
                          </View>
                          {link ? (
                            <Pressable
                              accessibilityRole="link"
                              onPress={async () => {
                                await trackProductClick({
                                  id: offer.id,
                                  product: offer.product || searchedQuery,
                                  store: offer.store,
                                  url: link,
                                }, offerHasPrice ? 'comparison_product' : 'comparison_fallback');
                                Linking.openURL(link);
                              }}
                              style={styles.catalogBtn}
                            >
                              <Text style={styles.catalogBtnText}>{offerHasPrice ? 'Ver producto' : 'Ver catalogo'}</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      );
                    })}
                    <Text selectable style={styles.catalogTime}>
                      Fuente: {offers.map((offer) => offer.store).filter(Boolean).join(', ')}. Confianza {item.confidence || item.trustScore || 0}%.
                    </Text>
                  </View>
                ) : null}
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

      {catalogStatus ? (
        <SurfaceCard style={styles.catalogCard} elevated={false}>
          <View style={styles.catalogStatusTop}>
            <Text selectable style={styles.catalogTitle}>Catalogos online</Text>
            {loadingCatalogs ? <ActivityIndicator size="small" color={ui.colors.primaryInk} /> : null}
          </View>
          <Text selectable style={styles.catalogText}>
            {catalogStatus} {partialResults.length && finalResults.length ? `Resultados locales: ${partialResults.length}. Comparaciones finales: ${finalResults.length}.` : ''}
          </Text>
          {catalogSources.length ? (
            <View style={styles.sourceGrid}>
              {catalogSources.map((source) => {
                const label = source.store || source.commerce || 'Comercio';
                const status = source.status === 'ok' ? 'precio online' : source.status === 'timeout' ? 'sin respuesta' : source.status === 'error' ? 'fallo, link oficial' : 'link oficial';
                return (
                  <View key={`${label}-${status}`} style={styles.sourcePill}>
                    <Text selectable style={styles.sourceStore}>{label}</Text>
                    <Text selectable style={styles.sourceStatus}>{status}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </SurfaceCard>
      ) : null}

      {premiumLocalSuggestions?.suggestions?.length ? (
        <SurfaceCard style={styles.premiumLocalCard}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text selectable style={styles.premiumLocalTitle}>
                {isPremium ? 'Premium: resolver ahora' : 'Premium: locales abiertos'}
              </Text>
              <Text selectable style={styles.premiumLocalText}>
                {premiumLocalSuggestions.lateNight
                  ? 'Para compras tarde, priorizamos delivery y comercios con horarios extendidos.'
                  : 'Compara precio y decide donde comprar, retirar o pedir envio.'}
              </Text>
            </View>
            {!isPremium ? (
              <Pressable accessibilityRole="button" onPress={onOpenPremium} style={styles.unlockBtn}>
                <Text style={styles.unlockBtnText}>Activar</Text>
              </Pressable>
            ) : null}
          </View>

          {premiumLocalSuggestions.restricted === 'alcohol' ? (
            <Text selectable style={styles.restrictedText}>Venta sujeta a mayoria de edad y reglas del comercio.</Text>
          ) : null}

          {(isPremium ? premiumLocalSuggestions.suggestions : premiumLocalSuggestions.suggestions.slice(0, 2)).map((commerce) => (
            <View key={commerce.id} style={styles.localRow}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={styles.localName}>{commerce.name}</Text>
                <Text selectable style={styles.localMeta}>{commerce.openSignal} · {commerce.deliveryLabel}</Text>
                <Text selectable style={styles.localMeta}>{commerce.contactLabel}</Text>
              </View>
              <View style={styles.localActions}>
                <Pressable
                  accessibilityRole="link"
                  onPress={async () => {
                    await trackProductClick({
                      id: `premium-local-${commerce.id}-${premiumLocalSuggestions.query}`,
                      product: premiumLocalSuggestions.query,
                      store: commerce.name,
                      url: commerce.url,
                    }, 'premium_local_catalog');
                    Linking.openURL(commerce.url);
                  }}
                  style={styles.catalogBtn}
                >
                  <Text style={styles.catalogBtnText}>Ver</Text>
                </Pressable>
                {isPremium ? (
                  <Pressable
                    accessibilityRole="link"
                    onPress={async () => {
                      await trackProductClick({
                        id: `premium-local-map-${commerce.id}-${premiumLocalSuggestions.query}`,
                        product: premiumLocalSuggestions.query,
                        store: commerce.name,
                        url: commerce.mapUrl,
                      }, 'premium_local_map');
                      Linking.openURL(commerce.mapUrl);
                    }}
                    style={styles.mapSmallBtn}
                  >
                    <Text style={styles.mapSmallBtnText}>Mapa</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}

          {!isPremium ? (
            <Text selectable style={styles.premiumLocalHint}>Premium desbloquea mas opciones, mapa, contacto oficial y priorizacion por hora.</Text>
          ) : null}
        </SurfaceCard>
      ) : null}

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
              <Text selectable style={styles.metricValue}>{cheapest ? `$${Number(cheapest.price || 0)}` : 'Catalogo'}</Text>
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
            <Text style={styles.primaryBtnText}>Avisarme si baja</Text>
          </Pressable>

          <View style={styles.shareRow}>
            <Pressable accessibilityRole="button" onPress={handleShare} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Compartir este ahorro</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleWhatsApp} style={styles.whatsBtn}>
              <Text style={styles.whatsBtnText}>WhatsApp</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Copiar</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" onPress={() => onReportPrice(selected.bestOffer || selected)} style={styles.reportBtn}>
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
  wowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
  },
  wowTitle: {
    color: '#05603A',
    fontSize: 17,
    fontWeight: '900',
  },
  wowText: {
    color: '#067647',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  wowActions: {
    gap: 8,
    alignItems: 'stretch',
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
  bestLabel: {
    color: ui.colors.primaryInk,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
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
  catalogCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    gap: 6,
  },
  catalogStatusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  catalogTitle: {
    color: '#075985',
    fontWeight: '900',
    fontSize: 15,
  },
  catalogText: {
    color: '#0C4A6E',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourcePill: {
    borderRadius: ui.radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  sourceStore: {
    color: '#075985',
    fontSize: 12,
    fontWeight: '900',
  },
  sourceStatus: {
    color: '#0C4A6E',
    fontSize: 11,
    fontWeight: '700',
  },
  comparisonBox: {
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.colors.outline,
    paddingTop: 12,
    gap: 10,
  },
  comparisonTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 14,
  },
  commerceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commerceStore: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 14,
  },
  commerceMeta: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  catalogBtn: {
    minHeight: 38,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    backgroundColor: ui.colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogBtnText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 12,
  },
  catalogTime: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  premiumLocalCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    gap: 12,
  },
  premiumLocalTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  premiumLocalText: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  unlockBtn: {
    minHeight: 40,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  restrictedText: {
    color: '#854D0E',
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    borderWidth: 1,
    borderRadius: ui.radius.sm,
    padding: 10,
    fontSize: 12,
    fontWeight: '800',
  },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.colors.outline,
    paddingTop: 10,
  },
  localName: {
    color: ui.colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  localMeta: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  localActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapSmallBtn: {
    minHeight: 38,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapSmallBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  premiumLocalHint: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
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
