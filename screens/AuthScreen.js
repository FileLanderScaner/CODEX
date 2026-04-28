import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { hasSupabaseConfig } from '../lib/config';
import { signInWithEmail, signUpWithEmail } from '../services/auth-service';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase() || 'demo@ahorroya.app';
      const normalizedPassword = password || 'demo1234';
      const user = mode === 'signup'
        ? await signUpWithEmail(normalizedEmail, normalizedPassword)
        : await signInWithEmail(normalizedEmail, normalizedPassword);

      onAuthenticated(user);
    } catch (authError) {
      setError(authError.message || 'No pudimos iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text selectable style={styles.eyebrow}>AhorroYA</Text>
      <Text selectable style={styles.title}>Control real de tus gastos, metas y ahorro.</Text>
      <Text selectable style={styles.body}>
        {hasSupabaseConfig
          ? 'Entra con tu cuenta o crea una nueva para guardar datos en la nube.'
          : 'Modo local activo. Cuando conectes Supabase, este mismo flujo guardara usuarios reales.'}
      </Text>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode('signin')}
          style={[styles.tab, mode === 'signin' && styles.tabActive]}
        >
          <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Entrar</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode('signup')}
          style={[styles.tab, mode === 'signup' && styles.tabActive]}
        >
          <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Crear cuenta</Text>
        </Pressable>
      </View>

      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="email@dominio.com"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Contrasena"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {error ? <Text selectable style={styles.error}>{error}</Text> : null}

      <Pressable accessibilityRole="button" onPress={submit} disabled={loading} style={styles.primaryButton}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{mode === 'signup' ? 'Crear cuenta' : 'Entrar'}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    gap: 12,
  },
  eyebrow: {
    color: '#027A48',
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    color: '#101828',
    fontSize: 28,
    fontWeight: '800',
  },
  body: {
    color: '#475467',
    fontSize: 15,
    lineHeight: 21,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#667085',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#101828',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#101828',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#101828',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  error: {
    color: '#B42318',
    fontSize: 13,
  },
});
