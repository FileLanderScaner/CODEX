import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppShell from './components/layout/AppShell';
import { ui } from './lib/ui';

export default function App() {
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
