import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { hasSupabaseConfig } from '../lib/config';
import { signInWithFallback, signInWithProvider, signOutAccount } from '../services/account-service';

export default function AuthPanel({ user, isPremium }) {
  if (user) {
    return (
      <View style={styles.card}>
        <View style={styles.copy}>
          <Text selectable style={styles.title}>{user.email || 'Cuenta conectada'}</Text>
          <Text selectable style={styles.text}>
            {isPremium ? 'Premium activo' : hasSupabaseConfig ? 'Favoritos y alertas guardados en la nube' : 'Sesion local activa con persistencia en este dispositivo'}
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={signOutAccount} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Salir</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>Guarda tus alertas</Text>
        <Text selectable style={styles.text}>
          {hasSupabaseConfig ? 'Entra con Google o Facebook para sincronizar favoritos, ranking y Premium.' : 'Modo fallback activo: entra con una cuenta demo para guardar favoritos, alertas y Premium local.'}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => hasSupabaseConfig ? signInWithProvider('google') : signInWithFallback()} style={styles.button}>
          <Text style={styles.buttonText}>Google</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => hasSupabaseConfig ? signInWithProvider('facebook') : signInWithFallback('facebook@ahorroya.local')} style={styles.button}>
          <Text style={styles.buttonText}>Facebook</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: '#101828',
    fontSize: 16,
    fontWeight: '900',
  },
  text: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#101828',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 8,
    borderColor: '#D0D5DD',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#344054',
    fontWeight: '800',
  },
});
