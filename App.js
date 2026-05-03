import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppShell from './components/layout/AppShell';
import { ui } from './lib/ui';
import { trackEvent } from './services/tracking-service';

export default function App() {
  useEffect(() => {
    trackEvent('app_loaded', {
      platform: Platform.OS,
      surface: 'root',
    }).catch(() => null);

    if (Platform.OS === 'web') {
      trackEvent('web_session_started', {
        path: typeof window !== 'undefined' ? window.location?.pathname || '/' : '/',
      }).catch(() => null);

      const onError = (event) => {
        trackEvent('client_error', {
          type: 'error',
          message: String(event?.message || 'client_error').slice(0, 180),
        }).catch(() => null);
      };
      const onUnhandledRejection = (event) => {
        trackEvent('client_error', {
          type: 'unhandledrejection',
          message: String(event?.reason?.message || event?.reason || 'unhandledrejection').slice(0, 180),
        }).catch(() => null);
      };
      window.addEventListener('error', onError);
      window.addEventListener('unhandledrejection', onUnhandledRejection);
      return () => {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onUnhandledRejection);
      };
    }
    return () => {};
  }, []);

  return (
    <View style={styles.safeArea}>
      <StatusBar style="dark" />
      <AppShell />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ui.colors.background,
  },
});
