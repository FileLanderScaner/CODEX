import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import ActivityFeed from '../components/ActivityFeed';
import AdBanner from '../components/AdBanner';
import AuthPanel from '../components/AuthPanel';
import PremiumCard from '../components/PremiumCard';
import OfferOfDayCard from '../components/home/OfferOfDayCard';
import SupermarketMiniCard from '../components/home/SupermarketMiniCard';
import TrendDealCard from '../components/home/TrendDealCard';
import TopBar from '../components/ui/TopBar';
import SearchBar from '../components/ui/SearchBar';
import Chip from '../components/ui/Chip';
import SurfaceCard from '../components/ui/SurfaceCard';
import { MONTEVIDEO_SEED_PRICES } from '../data/seed-prices';
import { ui } from '../lib/ui';
import PaywallScreen from './PaywallScreen';
import ResultsScreen from './ResultsScreen';
import ProductDetailScreen from './ProductDetailScreen';
import QrScreen from './QrScreen';
import { loadFavorites, toggleFavorite } from '../services/favorites-service';
import {
  checkPremiumStatus,
  createCloudAlert,
  getSessionUser,
  loadCloudFavorites,
  migrateLocalStateToCloud,
  saveCloudFavorite,
  subscribeToAuth,
  upsertProfile,
} from '../services/account-service';
import { loadProductLinks } from '../services/commerce-service';
import { loadUnifiedCatalogPrices, mergeCatalogPrices } from '../services/catalog-service';
import { loadGrowthMetrics } from '../services/growth-service';
import { getPremiumLocalSuggestions } from '../services/local-commerce-service';
import { buildPriceComparison } from '../services/price-engine';
import {
  buildShareText,
  filterMontevideoLaunchPrices,
  getPopularDeals,
  normalizeProduct,
  searchPrices,
} from '../services/price-service';
import { addCloudPrice, addCloudReport, addCloudShare, loadCloudPrices } from '../services/supabase-price-service';
import { trackEvent } from '../services/tracking-service';
import { getIntentLabel, resolveSearchIntent } from '../services/search-intent-service';
import {
  addPoints,
  addSearchHistory,
  deleteLocalAlert,
  loadLocalAlerts,
  loadPoints,
  loadSearchHistory,
  reportPrice,
  setLocalAlertActive,
  upsertLocalAlert,
} from '../services/user-price-service';
import { deleteCloudAlert, loadCloudAlerts, setCloudAlertActive } from '../services/account-service';
// keep signOut in the same module (explicit import kept separate to avoid big diffs)
import { signOutAccount } from '../services/account-service';

const LAUNCH_PRODUCT_ORDER = ['yerba', 'leche', 'arroz', 'panales', 'carne', 'higiene'];

function shareAttributionFromQuery(query = {}) {
  const source = String(query.utm_source || query.source || '').trim().toLowerCase();
  if (source !== 'whatsapp') {
    return null;
  }

  const savings = Number(query.savings || query.saving || 0);
  return {
    source: 'whatsapp',
    medium: String(query.utm_medium || 'share'),
    campaign: String(query.utm_campaign || 'montevideo_launch'),
    product: normalizeProduct(query.q || query.product || ''),
    store: String(query.store || ''),
    savings: Number.isFinite(savings) && savings > 0 ? Math.round(savings) : null,
  };
}

export default function PriceSearchScreen({ nav, activeTab }) {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Todos');
  const [results, setResults] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [partialResults, setPartialResults] = useState([]);
  const [finalResults, setFinalResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [cloudPrices, setCloudPrices] = useState([]);
  const [catalogPrices, setCatalogPrices] = useState([]);
  const [cloudStatus, setCloudStatus] = useState('Cargando precios reales');
  const [catalogStatus, setCatalogStatus] = useState('Catalogos online listos');
  const [catalogSources, setCatalogSources] = useState([]);
  const [growthMetrics, setGrowthMetrics] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [accountUser, setAccountUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [productLinks, setProductLinks] = useState([]);
  const [premiumLocalSuggestions, setPremiumLocalSuggestions] = useState(null);
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showPremium, setShowPremium] = useState(false);
  const [sortKey, setSortKey] = useState('relevance');
  const [showDeveloperFeed, setShowDeveloperFeed] = useState(false);
  const [valueSearches, setValueSearches] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [qrText, setQrText] = useState('');
  const [newPrice, setNewPrice] = useState({
    product: '',
    price: '',
    store: '',
    neighborhood: '',
  });

  const locationLabel = useMemo(() => 'Montevideo, UY', []);
  const currentPath = Platform.OS === 'web' ? (nav?.path || '/app') : '/app';
  const currentQuery = Platform.OS === 'web' ? (nav?.query || {}) : {};
  const trackedInboundShareRef = useRef(new Set());
  const searchSeqRef = useRef(0);

  useEffect(() => {
    Promise.all([
      loadFavorites(),
      loadSearchHistory(),
      loadPoints(),
      loadLocalAlerts().catch(() => []),
      loadCloudPrices().catch(() => []),
      loadGrowthMetrics().catch(() => null),
    ]).then(([storedFavorites, storedHistory, storedPoints, storedAlerts, storedCloudPrices, storedGrowthMetrics]) => {
      setFavorites(storedFavorites);
      setHistory(storedHistory);
      const launchPrices = filterMontevideoLaunchPrices(storedCloudPrices);
      setCloudPrices(launchPrices);
      setGrowthMetrics(storedGrowthMetrics);
      setPoints(storedPoints);
      setAlerts(storedAlerts);
      setCloudStatus(`Supabase activo: ${launchPrices.length} precios reales en Disco, Tienda Inglesa, Devoto y Ta-Ta`);
      setPricesLoading(false);
    }).catch((error) => {
      setCloudStatus(error.message || 'No pudimos cargar precios reales');
      setPricesLoading(false);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const path = nav?.path || '/app';
    if (path.startsWith('/app/premium')) {
      setShowPremium(true);
    }
    if (path.startsWith('/app/qr')) {
      const text = String(currentQuery.text || '').trim();
      if (text) setQrText(text);
    }
  }, [nav?.path]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const attribution = shareAttributionFromQuery(currentQuery);
    if (!attribution) {
      return;
    }
    const key = [currentPath, attribution.product, attribution.campaign, attribution.store, attribution.savings].join('|');
    if (trackedInboundShareRef.current.has(key)) {
      return;
    }
    trackedInboundShareRef.current.add(key);
    trackEvent('share_click', {
      ...attribution,
      city: 'Montevideo',
      path: currentPath,
    }, attribution.savings).catch(() => null);
  }, [currentPath, currentQuery.q, currentQuery.utm_source, currentQuery.utm_medium, currentQuery.utm_campaign, currentQuery.store, currentQuery.savings, currentQuery.saving]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const path = nav?.path || '/app';
    if (path.startsWith('/app/buscar')) {
      const q = String(currentQuery.q || '').trim();
      if (q && !pricesLoading && normalizeProduct(q) !== normalizeProduct(searchedQuery)) {
        runSearch(q);
      }
    }
  }, [nav?.path, currentQuery.q, pricesLoading]);

  useEffect(() => {
    getSessionUser().then(async (user) => {
      setAccountUser(user);
      if (user) {
        await upsertProfile(user).catch(() => null);
        await migrateLocalStateToCloud(user).catch(() => null);
        const [cloudFavorites, premium] = await Promise.all([
          loadCloudFavorites(user),
          checkPremiumStatus(user),
        ]);
        const cloudAlerts = await loadCloudAlerts(user).catch(() => []);
        if (cloudFavorites.length) {
          setFavorites(cloudFavorites);
        }
        if (cloudAlerts?.length) {
          setAlerts(cloudAlerts);
        }
        setIsPremium(premium);
      }
    });

    return subscribeToAuth(async (user) => {
      setAccountUser(user);
      if (user) {
        await upsertProfile(user).catch(() => null);
        await migrateLocalStateToCloud(user).catch(() => null);
        const [cloudFavorites, premium] = await Promise.all([
          loadCloudFavorites(user),
          checkPremiumStatus(user),
        ]);
        const cloudAlerts = await loadCloudAlerts(user).catch(() => []);
        if (cloudFavorites.length) {
          setFavorites(cloudFavorites);
        }
        if (cloudAlerts?.length) {
          setAlerts(cloudAlerts);
        }
        setIsPremium(premium);
      } else {
        setIsPremium(false);
        // Keep local alerts only for anonymous sessions; authenticated alerts persist in Supabase.
        setAlerts(await loadLocalAlerts().catch(() => []));
      }
    });
  }, []);

  const allCommunityPrices = useMemo(() => mergeCatalogPrices(cloudPrices, catalogPrices), [cloudPrices, catalogPrices]);
  const localSearchPrices = useMemo(() => mergeCatalogPrices(MONTEVIDEO_SEED_PRICES, cloudPrices), [cloudPrices]);
  const deals = useMemo(() => getPopularDeals(allCommunityPrices), [allCommunityPrices]);
  const socialProof = useMemo(() => ({
    comparisons: growthMetrics?.funnel?.searches ?? 0,
    savings: growthMetrics?.activation?.savings_detected ?? deals.length,
    shares: growthMetrics?.funnel?.shares ?? 0,
  }), [deals, growthMetrics]);
  const popularProducts = useMemo(() => {
    const liveProducts = deals.map((deal) => deal.product).concat(allCommunityPrices.map((price) => price.product));
    return LAUNCH_PRODUCT_ORDER
      .concat(liveProducts)
      .map(normalizeProduct)
      .filter(Boolean)
      .filter((product, index, list) => list.indexOf(product) === index)
      .slice(0, 8);
  }, [allCommunityPrices, deals]);
  const hasPremiumTrigger = valueSearches >= 2 || favorites.length > 0 || alerts.length > 0;

  useEffect(() => {
    if (!searchedQuery || !allCommunityPrices.length) return;
    const comparison = buildPriceComparison({
      query: searchedQuery,
      seedPrices: localSearchPrices,
      catalogPrices,
      neighborhood: selectedNeighborhood,
    });
    setPartialResults(comparison.partialResults);
    setFinalResults(comparison.finalResults);
    setResults(comparison.finalResults);
  }, [allCommunityPrices, catalogPrices, localSearchPrices, searchedQuery, selectedNeighborhood]);

  const runSearch = async (value = query, neighborhood = selectedNeighborhood) => {
    const intent = resolveSearchIntent(value);
    const nextQuery = intent.query;
    if (!nextQuery) {
      return;
    }

    const searchSeq = searchSeqRef.current + 1;
    searchSeqRef.current = searchSeq;
    setQuery(nextQuery);
    setSearchedQuery(nextQuery);
    setPremiumLocalSuggestions(getPremiumLocalSuggestions(nextQuery));
    const startedAt = Date.now();
    const attribution = shareAttributionFromQuery(currentQuery);
    const localFound = searchPrices(nextQuery, localSearchPrices, { neighborhood });
    const initialComparison = buildPriceComparison({
      query: nextQuery,
      seedPrices: localFound,
      catalogPrices: [],
      neighborhood,
    });
    const firstResultMs = Date.now() - startedAt;
    setPartialResults(initialComparison.partialResults);
    setFinalResults(initialComparison.finalResults);
    setResults(initialComparison.finalResults);
    setLoadingCatalogs(true);
    setCatalogSources([]);
    setCatalogStatus(`${getIntentLabel(intent)} Consultando supermercados, farmacias, marketplace y delivery...`.trim());
    await trackEvent('search_submitted', {
      product: nextQuery,
      neighborhood,
      city: 'Montevideo',
      attribution,
    }).catch(() => null);

    const [catalogPayload, nextProductLinks] = await Promise.all([
      loadUnifiedCatalogPrices(nextQuery).catch(() => ({ data: [], sources: [], commerceResults: [], links: [] })),
      loadProductLinks(nextQuery).catch(() => []),
    ]);

    if (searchSeqRef.current !== searchSeq) {
      return;
    }

    const catalogData = catalogPayload.data || [];
    const comparison = buildPriceComparison({
      query: nextQuery,
      seedPrices: localFound,
      catalogPrices: catalogData,
      commerceResults: catalogPayload.commerceResults || catalogPayload.sources || [],
      neighborhood,
    });
    setCatalogPrices((current) => mergeCatalogPrices(current, catalogData).slice(0, 120));
    setPartialResults(initialComparison.finalResults);
    setFinalResults(comparison.finalResults);
    setResults(comparison.finalResults);
    const dedupedLinks = [...(catalogPayload.links || []), ...nextProductLinks].filter((link, index, list) => (
      list.findIndex((item) => item.url === link.url) === index
    ));
    setProductLinks(dedupedLinks);
    const liveSources = (catalogPayload.sources || []).filter((source) => source.status === 'ok').map((source) => source.store || source.commerce);
    const fallbackSources = (catalogPayload.sources || []).filter((source) => source.status !== 'ok');
    const linkedSources = Math.max(
      (catalogPayload.sources || []).filter((source) => source.searchUrl || source.fallbackUrl).length,
      dedupedLinks.length,
    );
    setCatalogStatus(liveSources.length
      ? `Catalogos online actualizados: ${liveSources.join(', ')}. Consulta: ${new Date(catalogPayload.generatedAt || Date.now()).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}`
      : `Catalogos vinculados: ${linkedSources || 4} comercios. Si no hay precio legible, abrimos la busqueda oficial.`);
    setCatalogSources(catalogPayload.sources || []);
    if (fallbackSources.length) {
      await trackEvent('fallback_used', {
        product: nextQuery,
        stores: fallbackSources.map((source) => source.store || source.commerce),
        cacheStatus: catalogPayload.cacheStatus || null,
      }).catch(() => null);
    }
    setHistory(await addSearchHistory(nextQuery));
    await trackEvent('search_product', {
      product: nextQuery,
      results: comparison.finalResults.length,
      neighborhood,
      city: 'Montevideo',
      time_to_first_result_ms: firstResultMs,
      attribution,
    }).catch(() => null);
    const bestShown = comparison.finalResults.find((item) => item.bestOffer)?.bestOffer || null;
    if (bestShown) {
      const bestGroup = comparison.finalResults.find((item) => item.bestOffer?.id === bestShown.id) || comparison.finalResults[0];
      if (Number(bestGroup?.priceDifference || 0) > 0) {
        setValueSearches((current) => current + 1);
        setFeedback(`Encontraste $${Math.round(Number(bestGroup.priceDifference))} de diferencia. Comparti el ahorro o crea una alerta.`);
      }
      await trackEvent('view_best_price', {
        product: bestShown.product,
        price_id: bestShown.id,
        price: bestShown.price,
        store: bestShown.store,
        city: 'Montevideo',
        time_to_first_result_ms: firstResultMs,
        attribution,
      }, bestShown.price, bestShown.currency).catch(() => null);
      await trackEvent('cheapest_price_shown', {
        product: bestShown.product,
        price_id: bestShown.id,
        price: bestShown.price,
        store: bestShown.store,
        compared_commerces: comparison.finalResults[0]?.commerceCount || 0,
      }, bestShown.price, bestShown.currency).catch(() => null);
    }
    setLoadingCatalogs(false);

    if (nav?.goSearch) {
      nav.goSearch();
    }

  };

  const handleNeighborhood = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    if (searchedQuery) {
      const comparison = buildPriceComparison({
        query: searchedQuery,
        seedPrices: localSearchPrices,
        catalogPrices,
        neighborhood,
      });
      setPartialResults(comparison.partialResults);
      setFinalResults(comparison.finalResults);
      setResults(comparison.finalResults);
    }
  };

  const handleFavorite = async (product) => {
    const normalized = normalizeProduct(product);
    const nextFavorites = await toggleFavorite(favorites, normalized);
    await saveCloudFavorite(accountUser, normalized, nextFavorites.includes(normalized)).catch(() => null);
    setFavorites(nextFavorites);
    if (nextFavorites.includes(normalized)) {
      await trackEvent('add_favorite', { product: normalized, authenticated: Boolean(accountUser) }).catch(() => null);
    }
    setFeedback(nextFavorites.includes(normalized) ? 'Favorito guardado.' : 'Favorito eliminado.');
    if (nextFavorites.includes(normalized)) {
      setValueSearches((current) => Math.max(current, 1));
    }
  };

  const handleSharePoints = async (price, channel, context = {}) => {
    const nextPoints = await addPoints(1);
    await addCloudShare({ ...price, savings: context.savings, shareUrl: context.url }, channel).catch(() => null);
    await trackEvent(channel === 'whatsapp' ? 'click_whatsapp' : 'share', {
      product: price?.product || searchedQuery,
      price_id: price?.id || null,
      store: price?.store || null,
      channel,
      url: context.url || null,
    }, context.savings || null).catch(() => null);
    setPoints(nextPoints);
    setFeedback('+1 punto por compartir. Gracias por sumar a la comunidad.');
  };

  const shareDealOnWhatsApp = async (deal) => {
    if (!deal?.cheapest) return;
    const comparison = [deal.cheapest, deal.expensive].filter(Boolean);
    const message = buildShareText(comparison);
    const url = message.match(/https?:\/\/\S+/)?.[0] || '';
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    await handleSharePoints(deal.cheapest, 'whatsapp', { savings: deal.savings, url });
  };

  const handleReportPrice = async (price) => {
    await reportPrice(price);
    await addCloudReport(price).catch(() => null);
    setFeedback('Reporte guardado. Gracias por ayudar a limpiar la base de precios.');
  };

  const handleCreateAlert = async (product) => {
    const normalized = normalizeProduct(product);
    const nextFavorites = favorites.includes(normalized) ? favorites : await toggleFavorite(favorites, normalized);
    await saveCloudFavorite(accountUser, normalized, true).catch(() => null);
    const neighborhood = selectedNeighborhood === 'Todos' ? null : selectedNeighborhood;
    if (!accountUser) {
      const nextAlerts = await upsertLocalAlert({ normalized_product: normalized, neighborhood: neighborhood || 'Montevideo' });
      setAlerts(nextAlerts);
      setFavorites(nextFavorites);
      setValueSearches((current) => Math.max(current, 2));
      setFeedback(`Alerta local creada para ${normalized}. Inicia sesion para sincronizarla.`);
      return;
    }
    const created = await createCloudAlert(accountUser, normalized, neighborhood).catch(() => null);
    if (created) {
      setAlerts((current) => [created, ...current.filter((a) => a.id !== created.id)]);
    }
    setFavorites(nextFavorites);
    setValueSearches((current) => Math.max(current, 2));
    await trackEvent('create_alert', { product: normalized, neighborhood, authenticated: Boolean(accountUser) }).catch(() => null);
    setFeedback(`Alerta creada para ${normalized}.`);
  };

  const toggleAlert = async (alert, nextActive) => {
    if (!alert) {
      return;
    }
    if (accountUser && alert.id && !String(alert.id).startsWith('local-alert-')) {
      await setCloudAlertActive(accountUser, alert.id, nextActive).catch(() => null);
      setAlerts((current) => current.map((a) => (a.id === alert.id ? { ...a, active: Boolean(nextActive) } : a)));
      return;
    }
    const key = alert.key || `${alert.normalized_product}::${alert.neighborhood || ''}`;
    const next = await setLocalAlertActive(key, nextActive).catch(() => []);
    setAlerts(next);
  };

  const removeAlert = async (alert) => {
    if (!alert) {
      return;
    }
    if (accountUser && alert.id && !String(alert.id).startsWith('local-alert-')) {
      const ok = await deleteCloudAlert(accountUser, alert.id).catch(() => false);
      if (ok) {
        setAlerts((current) => current.filter((a) => a.id !== alert.id));
      }
      return;
    }
    const key = alert.key || `${alert.normalized_product}::${alert.neighborhood || ''}`;
    const next = await deleteLocalAlert(key).catch(() => []);
    setAlerts(next);
  };

  const openPremium = async () => {
    await trackEvent('premium_click', { source: 'home_cta' }, deals.reduce((s, d) => s + d.savings, 0)).catch(() => null);
    setShowPremium(true);
    if (Platform.OS === 'web') {
      nav?.navigate?.('/app/premium');
    }
  };

  const openProductDetail = (item) => {
    const normalized = normalizeProduct(item?.product || item?.normalizedProduct || searchedQuery);
    if (!normalized) return;
    if (Platform.OS === 'web') {
      nav?.navigate?.(`/app/productos/${encodeURIComponent(normalized)}`);
    }
  };

  const openQr = (text) => {
    const payload = String(text || '').trim();
    if (!payload) return;
    setQrText(payload);
    if (Platform.OS === 'web') {
      nav?.navigate?.(`/app/qr?text=${encodeURIComponent(payload)}`);
    }
  };

  const handleAddPrice = async () => {
    const product = normalizeProduct(newPrice.product);
    const price = Number(String(newPrice.price || '').replace(',', '.'));
    const store = String(newPrice.store || '').trim();
    const neighborhood = String(newPrice.neighborhood || '').trim();

    if (!product || !price || !store) {
      setFeedback('Completa producto, precio y tienda.');
      return;
    }

    if (price <= 0 || price > 99999) {
      setFeedback('Revisa el precio. Tiene que ser un monto valido.');
      return;
    }

    setSavingPrice(true);
    setFeedback('');
    try {
      const savedCloud = await addCloudPrice({
        product,
        price,
        store,
        neighborhood: neighborhood || 'Cerca tuyo',
      }).catch(() => null);
      if (!savedCloud) {
        setFeedback('No pudimos guardar el precio en Supabase. Revisa sesion o conexion.');
        return;
      }
      setCloudPrices((current) => [savedCloud, ...current].slice(0, 250));

      const nextPoints = await addPoints(1);
      setPoints(nextPoints);
      setNewPrice({ product: '', price: '', store: '', neighborhood: '' });
      setFeedback('Gracias, estas ayudando a otros a ahorrar.');
    } finally {
      setSavingPrice(false);
    }
  };

  if (showPremium) {
    return (
      <PaywallScreen
        user={accountUser ? { id: accountUser.id, email: accountUser.email } : null}
        onBack={() => {
          setShowPremium(false);
          if (Platform.OS === 'web') {
            nav?.navigate?.('/app/perfil');
          }
        }}
      />
    );
  }

  const renderHome = () => {
    const topDeal = deals[0] || null;
    const stores = Array.from(new Set(allCommunityPrices.map((item) => item.store))).slice(0, 4);
    const featured = deals.slice(0, 3);

    return (
      <View style={{ gap: 18 }}>
        <TopBar
          locationLabel={locationLabel}
          onPressLocation={() => Platform.OS === 'web' ? nav?.navigate?.('/app/configuracion') : Alert.alert('Ubicacion', 'Proximo paso: elegir ciudad y barrio.')}
          onPressQr={() => Platform.OS === 'web' ? nav?.navigate?.('/app/escanear') : Alert.alert('Escanear', 'Proximo paso: escaneo por codigo de barras.')}
        />

        <View style={styles.hero}>
          <Text selectable style={styles.brand}>AhorroYA</Text>
          <Text selectable style={styles.heroSubtitle}>Busca yerba, leche o arroz y ve en segundos donde esta mas barato hoy.</Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => runSearch()}
          onPressBarcode={() => Platform.OS === 'web' ? nav?.navigate?.('/app/escanear') : Alert.alert('Escanear', 'Proximo paso: escaneo por codigo de barras.')}
        />

        <SurfaceCard style={styles.localProofCard}>
          <View style={styles.proofMetric}>
            <Text selectable style={styles.proofValue}>{socialProof.comparisons}</Text>
            <Text selectable style={styles.proofLabel}>compararon hoy</Text>
          </View>
          <View style={styles.proofMetric}>
            <Text selectable style={styles.proofValue}>{socialProof.savings}</Text>
            <Text selectable style={styles.proofLabel}>ahorros detectados</Text>
          </View>
          <View style={styles.proofMetric}>
            <Text selectable style={styles.proofValue}>{socialProof.shares}</Text>
            <Text selectable style={styles.proofLabel}>shares hoy</Text>
          </View>
        </SurfaceCard>

        <View style={{ gap: 10 }}>
          <Text selectable style={styles.sectionTitle}>Prueba con productos reales</Text>
          {popularProducts.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {popularProducts.map((product) => (
                <Chip key={product} label={`Buscar ${product}`} active={false} onPress={() => runSearch(product)} />
              ))}
            </ScrollView>
          ) : (
            <SurfaceCard>
              {pricesLoading ? <ActivityIndicator /> : null}
              <Text selectable style={styles.emptyTitle}>Conectando precios reales</Text>
              <Text selectable style={styles.emptyText}>{cloudStatus}</Text>
            </SurfaceCard>
          )}
        </View>

        <View style={{ gap: 10 }}>
          <Text selectable style={styles.sectionTitle}>Ahorro del dia</Text>
          {topDeal ? (
            <View style={{ gap: 10 }}>
              <OfferOfDayCard
                title={String(topDeal.product).replace(/\b\w/g, (c) => c.toUpperCase())}
                price={`$${Number(topDeal.cheapest?.price || 0)}`}
                oldPrice={`$${Number(topDeal.expensive?.price || 0)}`}
                subtitle={`Encontraste $${topDeal.savings} de diferencia en ${topDeal.cheapest?.store}`}
                onPress={() => runSearch(topDeal.product)}
              />
              <Pressable accessibilityRole="button" onPress={() => shareDealOnWhatsApp(topDeal)} style={styles.whatsHomeBtn}>
                <Text style={styles.whatsHomeBtnText}>Compartir este ahorro</Text>
              </Pressable>
            </View>
          ) : (
            <SurfaceCard>
              <Text selectable style={styles.emptyTitle}>Todavia no hay ahorro comparable.</Text>
              <Text selectable style={styles.emptyText}>Necesitamos al menos dos tiendas reales para el mismo producto. Estado: {cloudStatus}</Text>
            </SurfaceCard>
          )}
        </View>

        <View style={{ gap: 10 }}>
          <View style={styles.rowBetween}>
            <Text selectable style={styles.sectionTitle}>Supermercados foco</Text>
            <Pressable accessibilityRole="button" onPress={() => Platform.OS === 'web' ? nav?.navigate?.('/app/supermercados') : Alert.alert('Mapa', 'Proximo paso: mapa de sucursales.')}>
              <Text style={styles.link}>Ver mapa</Text>
            </Pressable>
          </View>
          <View style={styles.storeGrid}>
            {stores.length ? stores.map((store) => (
              <SupermarketMiniCard key={store} name={store} distanceLabel="Montevideo" onPress={() => runSearch(query || popularProducts[0] || '')} />
            )) : (
              <SurfaceCard style={{ flex: 1 }}>
                <Text selectable style={styles.emptyText}>Sin tiendas reales cargadas todavia.</Text>
              </SurfaceCard>
            )}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text selectable style={styles.sectionTitle}>Ofertas destacadas</Text>
          <View style={{ gap: 12 }}>
            {featured.length ? featured.map((deal, idx) => (
              <TrendDealCard
                key={`${deal.product}-${idx}`}
                category={String(deal.cheapest?.category || 'Supermercado').toUpperCase()}
                title={String(deal.cheapest?.displayName || deal.product)}
                priceLabel={`$${Number(deal.cheapest?.price || 0) || 0}`}
                badgeLabel={deal.savings > 0 ? `-${Math.min(99, Math.round((deal.savings / Math.max(deal.expensive?.price || 1, 1)) * 100))}%` : 'ESTABLE'}
                badgeTone={deal.savings > 0 ? 'down' : 'stable'}
                onPress={() => runSearch(deal.product)}
              />
            )) : (
              <SurfaceCard>
                <Text selectable style={styles.emptyTitle}>Todavia no hay suficientes precios.</Text>
                <Text selectable style={styles.emptyText}>Ejecuta una ingesta oficial o conecta Supabase para mostrar oportunidades reales.</Text>
              </SurfaceCard>
            )}
          </View>
        </View>

      </View>
    );
  };

  const renderSearch = () => (
    <View style={{ gap: 14 }}>
      <TopBar
        locationLabel={locationLabel}
        onPressLocation={() => Platform.OS === 'web' ? nav?.navigate?.('/app/configuracion') : Alert.alert('Ubicacion', 'Proximo paso: elegir ciudad y barrio.')}
        onPressQr={() => Platform.OS === 'web' ? nav?.navigate?.('/app/escanear') : Alert.alert('Escanear', 'Proximo paso: escaneo por codigo de barras.')}
      />

      <View style={styles.searchHeader}>
        <Pressable accessibilityRole="button" onPress={() => nav?.goHome?.()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{"<"}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={() => runSearch()}
            onPressBarcode={() => Platform.OS === 'web' ? nav?.navigate?.('/app/escanear') : Alert.alert('Escanear', 'Proximo paso: escaneo por codigo de barras.')}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        <Chip label="Relevancia" active={sortKey === 'relevance'} onPress={() => setSortKey('relevance')} leading="≡" />
        <Chip label="Precio" active={sortKey === 'price'} onPress={() => setSortKey('price')} />
        <Chip label="Distancia" active={sortKey === 'distance'} onPress={() => setSortKey('distance')} />
        <Chip label="Filtros" active={sortKey === 'filters'} onPress={() => setSortKey('filters')} leading="⎚" />
      </ScrollView>

      <ResultsScreen
        searchedQuery={searchedQuery}
        results={results}
        loadingCatalogs={loadingCatalogs}
        partialResults={partialResults}
        finalResults={finalResults}
        premiumLocalSuggestions={premiumLocalSuggestions}
        isPremium={isPremium}
        onOpenPremium={openPremium}
        favorites={favorites}
        onFavorite={handleFavorite}
        onSharePoints={handleSharePoints}
        onReportPrice={handleReportPrice}
        onCreateAlert={handleCreateAlert}
        productLinks={productLinks}
        catalogStatus={catalogStatus}
        catalogSources={catalogSources}
        sortKey={sortKey}
        selectedNeighborhood={selectedNeighborhood}
        onNeighborhood={handleNeighborhood}
        onOpenMap={() => Platform.OS === 'web' ? nav?.navigate?.('/app/supermercados') : Alert.alert('Mapa', 'Proximo paso: mapa de sucursales.')}
        onOpenDetail={(item) => openProductDetail(item)}
      />

      <SurfaceCard style={{ gap: 10 }}>
        <Text selectable style={styles.sectionTitle}>Sumar un precio</Text>
        <Text selectable style={styles.emptyText}>Gracias, estas ayudando a otros a ahorrar.</Text>
        <View style={styles.formRow}>
          <TextInput
            autoCapitalize="none"
            placeholder="Producto (ej: leche entera 1L)"
            value={newPrice.product}
            onChangeText={(value) => setNewPrice((current) => ({ ...current, product: value }))}
            style={[styles.inputBox, styles.flexInput]}
          />
          <TextInput
            keyboardType="decimal-pad"
            placeholder="Precio"
            value={newPrice.price}
            onChangeText={(value) => setNewPrice((current) => ({ ...current, price: value }))}
            style={[styles.inputBox, styles.smallInput]}
          />
        </View>
        <View style={styles.formRow}>
          <TextInput
            placeholder="Tienda"
            value={newPrice.store}
            onChangeText={(value) => setNewPrice((current) => ({ ...current, store: value }))}
            style={[styles.inputBox, styles.flexInput]}
          />
          <TextInput
            placeholder="Barrio"
            value={newPrice.neighborhood}
            onChangeText={(value) => setNewPrice((current) => ({ ...current, neighborhood: value }))}
            style={[styles.inputBox, styles.flexInput]}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={handleAddPrice} disabled={savingPrice} style={[styles.addButton, savingPrice && { opacity: 0.65 }]}>
          <Text style={styles.addButtonText}>{savingPrice ? 'Guardando...' : 'Guardar precio'}</Text>
        </Pressable>
      </SurfaceCard>

      {!isPremium && hasPremiumTrigger ? <PremiumCard onPress={openPremium} /> : null}
      {!isPremium ? <AdBanner /> : null}
    </View>
  );

  const renderAlerts = () => (
    <View style={{ gap: 14 }}>
      <TopBar
        locationLabel={locationLabel}
        onPressLocation={() => Platform.OS === 'web' ? nav?.navigate?.('/app/configuracion') : null}
        onPressQr={() => Platform.OS === 'web' ? nav?.navigate?.('/app/escanear') : setShowDeveloperFeed((v) => !v)}
      />
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={styles.pageTitle}>Mis Alertas</Text>
          <Text selectable style={styles.pageSubtitle}>Gestiona tus avisos de precios bajos.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => Platform.OS === 'web' ? nav?.navigate?.('/app/buscar') : Alert.alert('Crear alerta', 'Desde resultados toca “Avisarme si baja”.')}
          style={styles.primaryCta}
        >
          <Text style={styles.primaryCtaText}>Avisarme si baja</Text>
        </Pressable>
      </View>

      {alerts.length ? (
        <View style={{ gap: 12 }}>
          {alerts.map((alert) => {
            const name = alert.normalized_product || alert.normalizedProduct || 'producto';
            const neighborhood = alert.neighborhood ? `En ${alert.neighborhood}` : 'Cerca tuyo';
            const target = alert.target_price ? `Aviso cuando baje de $${Number(alert.target_price)}` : 'Aviso cuando baje de precio';
            const active = alert.active !== false;
            return (
              <SurfaceCard key={alert.id || alert.key} style={styles.alertRow}>
                <View style={styles.alertIcon}>
                  <Text style={styles.alertIconText}>{active ? 'A' : '-'}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={styles.alertTitle}>{name}</Text>
                  <Text selectable style={styles.alertMeta}>{target}</Text>
                  <Text selectable style={styles.alertMetaLink}>{neighborhood}</Text>
                </View>
                <View style={styles.alertActions}>
                  <Pressable accessibilityRole="button" onPress={() => toggleAlert(alert, !active)} style={[styles.toggle, active && styles.toggleOn]}>
                    <View style={[styles.toggleKnob, active && styles.toggleKnobOn]} />
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => removeAlert(alert)} style={styles.trashBtn}>
                    <Text style={styles.trashText}>X</Text>
                  </Pressable>
                </View>
              </SurfaceCard>
            );
          })}
          <SurfaceCard style={styles.infoCard}>
            <Text selectable style={styles.infoTitle}>Como funcionan?</Text>
            <Text selectable style={styles.infoText}>
              Cuando detectemos un precio mas bajo para un producto que seguis, te lo vamos a avisar. Proximo paso: notificaciones push reales.
            </Text>
          </SurfaceCard>
        </View>
      ) : (
        <SurfaceCard>
          <Text selectable style={styles.emptyTitle}>Todavia no tenes alertas.</Text>
          <Text selectable style={styles.emptyText}>Abri un producto en Buscar y toca “Avisarme si baja”.</Text>
        </SurfaceCard>
      )}
    </View>
  );

  const renderFavorites = () => (
    <View style={{ gap: 14 }}>
      <TopBar
        locationLabel={locationLabel}
        onPressLocation={() => Platform.OS === 'web' ? nav?.navigate?.('/app/configuracion') : null}
        onPressQr={() => Platform.OS === 'web' ? nav?.navigate?.('/app/escanear') : setShowDeveloperFeed((v) => !v)}
      />
      <View style={{ gap: 6 }}>
        <Text selectable style={styles.pageTitle}>Favoritos</Text>
        <Text selectable style={styles.pageSubtitle}>Tus productos con seguimiento activo.</Text>
      </View>

      {favorites.length ? (
        <View style={{ gap: 12 }}>
          {favorites.map((fav) => (
            <SurfaceCard key={fav} style={{ gap: 10 }}>
              <View style={styles.rowBetween}>
                <Text selectable style={styles.favTitle}>{fav}</Text>
                <Pressable accessibilityRole="button" onPress={() => handleFavorite(fav)} style={styles.heartBtn}>
                  <Text style={styles.heartBtnText}>F</Text>
                </Pressable>
              </View>
              <Text selectable style={styles.emptyText}>Toca para ver comparacion y crear alerta.</Text>
              <Pressable accessibilityRole="button" onPress={() => runSearch(fav)} style={styles.secondaryCta}>
                <Text style={styles.secondaryCtaText}>Ver comparacion</Text>
              </Pressable>
            </SurfaceCard>
          ))}
        </View>
      ) : (
        <SurfaceCard>
          <Text selectable style={styles.emptyTitle}>Todavia no guardaste favoritos.</Text>
          <Text selectable style={styles.emptyText}>Busca un producto y toca “Favorito” para seguir su precio.</Text>
        </SurfaceCard>
      )}

      <SurfaceCard style={styles.tipCard}>
        <Text selectable style={styles.tipTitle}>Queres ahorrar mas?</Text>
        <Text selectable style={styles.tipText}>Activa alertas para tus favoritos y te avisamos cuando bajen de precio.</Text>
      </SurfaceCard>
    </View>
  );

  const renderProfile = () => (
    <View style={{ gap: 14 }}>
      <TopBar
        locationLabel={locationLabel}
        onPressLocation={() => Platform.OS === 'web' ? nav?.navigate?.('/app/configuracion') : null}
        onPressQr={() => Platform.OS === 'web' ? nav?.navigate?.('/app/escanear') : setShowDeveloperFeed((v) => !v)}
      />
      <SurfaceCard style={{ gap: 10 }}>
        <Text selectable style={styles.pageTitle}>{accountUser?.email || 'Usuario Ahorrador'}</Text>
        <Text selectable style={styles.pageSubtitle}>{isPremium ? 'Plan Premium' : 'Plan gratis'}</Text>
        <View style={styles.rowBetween}>
          <View style={styles.statMini}>
            <Text selectable style={styles.statLabel}>Favoritos</Text>
            <Text selectable style={styles.statValue}>{favorites.length}</Text>
          </View>
          <View style={styles.statMini}>
            <Text selectable style={styles.statLabel}>Puntos</Text>
            <Text selectable style={styles.statValue}>{points}</Text>
          </View>
        </View>
        {!isPremium ? (
          <Pressable accessibilityRole="button" onPress={openPremium} style={styles.primaryCta}>
            <Text style={styles.primaryCtaText}>Ver Premium</Text>
          </Pressable>
        ) : null}
      </SurfaceCard>

      <AuthPanel user={accountUser} isPremium={isPremium} />

      <SurfaceCard style={{ gap: 10 }}>
        <Pressable accessibilityRole="button" onPress={() => Platform.OS === 'web' ? nav?.navigate?.('/app/favoritos') : null} style={styles.menuRow}>
          <Text selectable style={styles.menuText}>Mis Favoritos</Text>
          <Text style={styles.menuArrow}>{'>'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => Platform.OS === 'web' ? nav?.navigate?.('/app/historial') : null} style={styles.menuRow}>
          <Text selectable style={styles.menuText}>Historial de Busquedas</Text>
          <Text style={styles.menuArrow}>{'>'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            const deal = deals[0];
            const message = deal?.cheapest
              ? buildShareText([deal.cheapest, deal.expensive].filter(Boolean))
              : 'Estoy buscando ahorros reales con AhorroYA 👉 https://codex-kohl-mu.vercel.app/app';
            try {
              await Share.share({ message });
            } catch (_e) {
              Alert.alert('Invitar amigos', message);
            }
          }}
          style={styles.menuRow}
        >
          <Text selectable style={styles.menuText}>Invitar Amigos</Text>
          <Text style={styles.menuArrow}>{'>'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => Platform.OS === 'web' ? nav?.navigate?.('/app/configuracion') : null} style={styles.menuRow}>
          <Text selectable style={styles.menuText}>Configuracion</Text>
          <Text style={styles.menuArrow}>{'>'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={openPremium} style={styles.menuRow}>
          <Text selectable style={[styles.menuText, { color: ui.colors.primaryInk }]}>Plan Premium</Text>
          <Text style={styles.menuArrow}>{'>'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await signOutAccount().catch(() => null);
            setAccountUser(null);
            setIsPremium(false);
            setFeedback('Sesion cerrada.');
          }}
          style={[styles.menuRow, { borderTopWidth: 1, borderTopColor: ui.colors.outline, paddingTop: 12 }]}
        >
          <Text selectable style={[styles.menuText, { color: ui.colors.danger }]}>Cerrar Sesion</Text>
          <Text style={[styles.menuArrow, { color: ui.colors.danger }]}>{'>'}</Text>
        </Pressable>
      </SurfaceCard>

      {history.length ? (
        <View style={{ gap: 10 }}>
          <Text selectable style={styles.sectionTitle}>Historial</Text>
          <View style={{ gap: 10 }}>
            {history.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => runSearch(item)}>
                <SurfaceCard style={styles.historyRow}>
                  <Text selectable style={styles.favTitle}>{item}</Text>
                  <Text style={styles.link}>Buscar</Text>
                </SurfaceCard>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {showDeveloperFeed ? (
        <View style={{ gap: 12 }}>
          <Text selectable style={styles.sectionTitle}>Actividad (dev)</Text>
          <ActivityFeed activities={allCommunityPrices} />
          <SurfaceCard>
            <Text selectable style={styles.emptyTitle}>Supabase</Text>
            <Text selectable style={styles.emptyText}>{cloudStatus}</Text>
          </SurfaceCard>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {feedback ? (
        <SurfaceCard style={styles.feedbackCard} elevated={false}>
          <Text selectable style={styles.feedbackText}>{feedback}</Text>
        </SurfaceCard>
      ) : null}

      {Platform.OS === 'web' && currentPath.startsWith('/app/qr') ? (
        <QrScreen
          text={qrText || String(currentQuery.text || '')}
          onBack={() => nav?.navigate?.('/app/perfil')}
        />
      ) : null}

      {Platform.OS === 'web' && currentPath.startsWith('/app/productos/') ? (
        <ProductDetailScreen
          product={decodeURIComponent(currentPath.replace('/app/productos/', ''))}
          allPrices={allCommunityPrices}
          onBack={() => nav?.navigate?.('/app/buscar')}
          onCreateAlert={handleCreateAlert}
          onSharePoints={handleSharePoints}
          onOpenQr={(text) => openQr(text)}
          locationLabel={locationLabel}
        />
      ) : null}

      {Platform.OS === 'web' && currentPath.startsWith('/app/escanear') ? (
        <View style={{ gap: 14 }}>
          <TopBar locationLabel={locationLabel} onPressLocation={() => nav?.navigate?.('/app/configuracion')} />
          <SurfaceCard style={{ gap: 10 }}>
            <Text selectable style={styles.pageTitle}>Escanear</Text>
            <Text selectable style={styles.pageSubtitle}>Ingresa el codigo de barras para buscar (MVP).</Text>
            <TextInput
              placeholder="Codigo de barras"
              keyboardType="number-pad"
              value={query}
              onChangeText={setQuery}
              style={styles.inputBox}
            />
            <Pressable accessibilityRole="button" onPress={() => runSearch(query)} style={styles.primaryCta}>
              <Text style={styles.primaryCtaText}>Buscar producto</Text>
            </Pressable>
          </SurfaceCard>
        </View>
      ) : null}

      {Platform.OS === 'web' && currentPath.startsWith('/app/supermercados') ? (
        <View style={{ gap: 14 }}>
          <TopBar locationLabel={locationLabel} onPressLocation={() => nav?.navigate?.('/app/configuracion')} onPressQr={() => nav?.navigate?.('/app/escanear')} />
          <View style={{ gap: 6 }}>
            <Text selectable style={styles.pageTitle}>Supermercados</Text>
            <Text selectable style={styles.pageSubtitle}>Listado rapido (hasta tener mapa real).</Text>
          </View>
          <View style={{ gap: 12 }}>
            {Array.from(new Set(allCommunityPrices.map((p) => p.store))).slice(0, 12).map((store) => (
              <Pressable
                key={store}
                accessibilityRole="button"
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store} ${locationLabel}`)}`)}
              >
                <SurfaceCard style={styles.historyRow}>
                  <Text selectable style={styles.favTitle}>{store}</Text>
                  <Text style={styles.link}>Abrir</Text>
                </SurfaceCard>
              </Pressable>
            ))}
            <SurfaceCard>
              <Text selectable style={styles.emptyTitle}>Mapa</Text>
              <Text selectable style={styles.emptyText}>Proximo paso: mapa real con sucursales y distancia usando ubicacion del telefono.</Text>
            </SurfaceCard>
          </View>
        </View>
      ) : null}

      {Platform.OS === 'web' && currentPath.startsWith('/app/configuracion') ? (
        <View style={{ gap: 14 }}>
          <TopBar locationLabel={locationLabel} onPressQr={() => nav?.navigate?.('/app/escanear')} />
          <SurfaceCard style={{ gap: 10 }}>
            <Text selectable style={styles.pageTitle}>Configuracion</Text>
            <Text selectable style={styles.pageSubtitle}>Elegimos barrio para ordenar resultados.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {['Todos', 'Centro', 'Cordon', 'Pocitos', 'Carrasco'].map((name) => (
                <Chip key={name} label={name} active={selectedNeighborhood === name} onPress={() => handleNeighborhood(name)} />
              ))}
            </View>
            <Pressable accessibilityRole="button" onPress={() => nav?.navigate?.('/app')} style={styles.primaryCta}>
              <Text style={styles.primaryCtaText}>Guardar</Text>
            </Pressable>
          </SurfaceCard>
        </View>
      ) : null}

      {Platform.OS === 'web' && currentPath.startsWith('/app/historial') ? (
        <View style={{ gap: 14 }}>
          <TopBar locationLabel={locationLabel} onPressLocation={() => nav?.navigate?.('/app/configuracion')} />
          <View style={{ gap: 6 }}>
            <Text selectable style={styles.pageTitle}>Historial</Text>
            <Text selectable style={styles.pageSubtitle}>Tus ultimas busquedas.</Text>
          </View>
          {history.length ? (
            <View style={{ gap: 10 }}>
              {history.map((item) => (
                <Pressable key={item} accessibilityRole="button" onPress={() => runSearch(item)}>
                  <SurfaceCard style={styles.historyRow}>
                    <Text selectable style={styles.favTitle}>{item}</Text>
                    <Text style={styles.link}>Buscar</Text>
                  </SurfaceCard>
                </Pressable>
              ))}
            </View>
          ) : (
            <SurfaceCard>
              <Text selectable style={styles.emptyTitle}>Todavia no hay historial.</Text>
              <Text selectable style={styles.emptyText}>Busca un producto y quedara guardado aca.</Text>
            </SurfaceCard>
          )}
        </View>
      ) : null}

      {!(Platform.OS === 'web' && (
        currentPath.startsWith('/app/qr') ||
        currentPath.startsWith('/app/productos/') ||
        currentPath.startsWith('/app/escanear') ||
        currentPath.startsWith('/app/supermercados') ||
        currentPath.startsWith('/app/configuracion') ||
        currentPath.startsWith('/app/historial')
      )) ? (
        <>
          {activeTab === 'home' ? renderHome() : null}
          {activeTab === 'search' ? renderSearch() : null}
          {activeTab === 'alerts' ? renderAlerts() : null}
          {activeTab === 'favorites' ? renderFavorites() : null}
          {activeTab === 'profile' ? renderProfile() : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  hero: {
    gap: 8,
  },
  brand: {
    ...ui.type.display,
    color: ui.colors.primaryInk,
  },
  heroSubtitle: {
    ...ui.type.body,
    color: ui.colors.muted,
  },
  sectionTitle: {
    color: ui.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  localProofCard: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  proofMetric: {
    flex: 1,
    gap: 4,
  },
  proofValue: {
    color: ui.colors.text,
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  proofLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  whatsHomeBtn: {
    minHeight: 48,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  whatsHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  storeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  link: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ui.colors.surface,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  pageTitle: {
    ...ui.type.headline,
    color: ui.colors.text,
  },
  pageSubtitle: {
    ...ui.type.bodySm,
    color: '#667085',
  },
  primaryCta: {
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryCta: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.surfaceLow,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 14,
  },
  emptyTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  emptyText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackCard: {
    backgroundColor: '#FFFAEB',
    borderColor: '#FEC84B',
  },
  feedbackText: {
    color: '#B54708',
    fontWeight: '800',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputBox: {
    minHeight: 48,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    paddingHorizontal: 12,
    backgroundColor: ui.colors.surface,
    color: ui.colors.text,
    fontWeight: '700',
  },
  flexInput: {
    flex: 1,
  },
  smallInput: {
    width: 110,
  },
  addButton: {
    minHeight: 52,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  favTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9FBF2',
    borderWidth: 1,
    borderColor: '#CFF7E3',
  },
  heartBtnText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
  },
  tipCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  tipTitle: {
    color: '#7C2D12',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 4,
  },
  tipText: {
    color: '#7C2D12',
    fontSize: 14,
    lineHeight: 20,
  },
  statMini: {
    flex: 1,
    backgroundColor: ui.colors.surfaceLow,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.colors.outline,
    padding: 12,
    gap: 6,
  },
  statLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  statValue: {
    color: ui.colors.text,
    fontSize: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  menuText: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 15,
  },
  menuArrow: {
    color: '#98A2B3',
    fontWeight: '900',
    fontSize: 16,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E9FBF2',
    borderWidth: 1,
    borderColor: '#CFF7E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
  },
  alertTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  alertMeta: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },
  alertMetaLink: {
    color: ui.colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  alertActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#E4E7EC',
    borderWidth: 1,
    borderColor: ui.colors.outline,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: ui.colors.primary,
    borderColor: '#7AE7BE',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: ui.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashText: {
    color: '#667085',
    fontWeight: '900',
  },
  infoCard: {
    backgroundColor: '#EEF4FF',
    borderColor: '#C7D7FE',
    gap: 8,
  },
  infoTitle: {
    color: '#1E40AF',
    fontWeight: '900',
    fontSize: 16,
  },
  infoText: {
    color: '#1F2A37',
    fontSize: 14,
    lineHeight: 20,
  },
});
