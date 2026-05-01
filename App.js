import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppShell from './components/layout/AppShell';
import { ui } from './lib/ui';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Analytics básico para web
      // Se implementará servicio completo en fase posterior
      console.log('Analytics enabled for web');
    }
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
