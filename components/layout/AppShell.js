import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import BottomNav from './BottomNav';
import { ui } from '../../lib/ui';
import LandingScreen from '../../screens/LandingScreen';
import PriceSearchScreen from '../../screens/PriceSearchScreen';
import { useWebLocation } from '../../lib/navigation';

const TABS = [
  { key: 'home', label: 'Inicio', icon: 'home' },
  { key: 'search', label: 'Buscar', icon: 'search' },
  { key: 'alerts', label: 'Alertas', icon: 'bell' },
  { key: 'favorites', label: 'Favoritos', icon: 'heart' },
  { key: 'profile', label: 'Perfil', icon: 'user' },
];

export default function AppShell() {
  const webLocation = useWebLocation();
  const [tab, setTab] = useState('home');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const path = webLocation.path || '/app';
    if (path.startsWith('/app/alertas')) setTab('alerts');
    else if (path.startsWith('/app/favoritos')) setTab('favorites');
    else if (path.startsWith('/app/perfil')) setTab('profile');
    else if (path.startsWith('/app/buscar')) setTab('search');
    else setTab('home');
  }, [webLocation.path]);

  const nav = useMemo(
    () => ({
      tab,
      setTab: (next) => {
        setTab(next);
        if (Platform.OS === 'web') {
          if (next === 'home') webLocation.navigate('/app');
          if (next === 'search') webLocation.navigate('/app/buscar');
          if (next === 'alerts') webLocation.navigate('/app/alertas');
          if (next === 'favorites') webLocation.navigate('/app/favoritos');
          if (next === 'profile') webLocation.navigate('/app/perfil');
        }
      },
      path: webLocation.path,
      query: webLocation.query,
      navigate: (path) => {
        if (Platform.OS === 'web') {
          webLocation.navigate(path);
        }
      },
      goHome: () => {
        setTab('home');
        if (Platform.OS === 'web') webLocation.navigate('/app');
      },
      goSearch: () => {
        setTab('search');
        if (Platform.OS === 'web') webLocation.navigate('/app/buscar');
      },
    }),
    [tab, webLocation],
  );

  if (Platform.OS === 'web' && (webLocation.path === '/' || webLocation.path === '')) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <LandingScreen onOpenApp={() => webLocation.navigate('/app')} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <PriceSearchScreen nav={nav} activeTab={tab} />
      </ScrollView>

      <View style={styles.navWrap}>
        <BottomNav tabs={TABS} activeKey={tab} onChange={nav.setTab} />
      </View>
    </View>
  );
}

const NAV_HEIGHT = 74;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ui.colors.background,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: ui.spacing.page,
    paddingTop: 14,
    paddingBottom: NAV_HEIGHT + 18,
    gap: 16,
  },
  navWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: ui.spacing.page,
  },
});
