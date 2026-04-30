import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import PayPalButtons from '../components/PayPalButtons';
import SurfaceCard from '../components/ui/SurfaceCard';
import { config, getAppUrl, hasPayPalConfig, hasSupabaseConfig } from '../lib/config';
import { ui } from '../lib/ui';
import { activateMockPremium, getAccessToken, signInWithFallback, signInWithProvider } from '../services/account-service';

function FeatureRow({ title, subtitle }) {
  return (
    <SurfaceCard style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>+</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text selectable style={styles.featureTitle}>{title}</Text>
        <Text selectable style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </SurfaceCard>
  );
}

export default function PaywallScreen({ user, onBack }) {
  const [status, setStatus] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const openWebCheckout = useCallback(() => {
    const appUrl = getAppUrl();
    if (appUrl) {
      Linking.openURL(appUrl);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAccessToken()
      .then((token) => {
        if (active) {
          setAccessToken(token || '');
        }
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const priceLabel = useMemo(
    () => `${config.premiumCurrency} ${config.premiumPrice} / mes`,
    [],
  );

  return (
    <View style={styles.wrapper}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>{"<"} Volver</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text selectable style={styles.heroKicker}>PREMIUM ACCESS</Text>
        <Text selectable style={styles.heroTitle}>Ahorra mas cada semana</Text>
        <Text selectable style={styles.heroSub}>Desbloquea herramientas para optimizar tus compras.</Text>
      </View>

      <FeatureRow title="Busquedas ilimitadas" subtitle="Sin restricciones diarias." />
      <FeatureRow title="Alertas de precio ilimitadas" subtitle="Enterate al instante." />
      <FeatureRow title="Sin anuncios" subtitle="Navegacion limpia y rapida." />
      <FeatureRow title="Historial completo" subtitle="Ve tendencias y mejores compras." />
      <FeatureRow title="Favoritos ilimitados" subtitle="Guarda todo lo que te interesa." />

      <SurfaceCard style={styles.planCard}>
        <View style={styles.planRow}>
          <View style={{ gap: 2 }}>
            <Text selectable style={styles.planTitle}>Mensual</Text>
            <Text selectable style={styles.planSub}>Flexibilidad total</Text>
          </View>
          <Text selectable style={styles.planPrice}>{priceLabel}</Text>
        </View>
        <View style={styles.planTrack}>
          <View style={styles.planFill} />
          <View style={styles.planRest} />
        </View>
      </SurfaceCard>

      {!hasPayPalConfig ? (
        <SurfaceCard style={styles.noticeCard} elevated={false}>
          <Text selectable style={styles.noticeText}>
            Falta EXPO_PUBLIC_PAYPAL_CLIENT_ID. Modo demo activo: podes simular checkout y activar Premium local.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const result = await activateMockPremium(user);
              setStatus(`Premium demo activo para ${result.user.email}.`);
            }}
            style={styles.mockPayButton}
          >
            <Text style={styles.mockPayButtonText}>Simular pago exitoso</Text>
          </Pressable>
        </SurfaceCard>
      ) : null}

      {!user?.email ? (
        <SurfaceCard style={styles.noticeCard} elevated={false}>
          <Text selectable style={styles.noticeTitle}>Necesitas iniciar sesion</Text>
          <Text selectable style={styles.noticeText}>
            Para que Premium quede asociado a tu cuenta, entra antes de pagar. Sin Supabase se crea una sesion demo local.
          </Text>
          <View style={styles.noticeActions}>
            <Pressable accessibilityRole="button" onPress={() => hasSupabaseConfig ? signInWithProvider('google') : signInWithFallback()} style={styles.providerBtn}>
              <Text style={styles.providerBtnText}>Google</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => hasSupabaseConfig ? signInWithProvider('facebook') : signInWithFallback('facebook@ahorroya.local')} style={styles.providerBtn}>
              <Text style={styles.providerBtnText}>Facebook</Text>
            </Pressable>
          </View>
          {status ? <Text selectable style={styles.status}>{status}</Text> : null}
        </SurfaceCard>
      ) : (
        <SurfaceCard style={{ gap: 12 }}>
          <Text selectable style={styles.payTitle}>Activar Premium</Text>
          <PayPalButtons
            user={user}
            accessToken={accessToken}
            onStatus={setStatus}
            onOpenWebCheckout={openWebCheckout}
          />
          {status ? <Text selectable style={styles.status}>{status}</Text> : null}
          <Text selectable style={styles.cancelNote}>Podes cancelar cuando quieras desde configuracion.</Text>
        </SurfaceCard>
      )}
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
  hero: {
    borderRadius: ui.radius.xl,
    backgroundColor: ui.colors.primaryInk,
    padding: 18,
    gap: 10,
  },
  heroKicker: {
    color: '#D1FAE5',
    fontWeight: '900',
    letterSpacing: 1.0,
    fontSize: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  heroSub: {
    color: '#D1FAE5',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E9FBF2',
    borderWidth: 1,
    borderColor: '#CFF7E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 18,
  },
  featureTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  featureSubtitle: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },
  planCard: {
    gap: 12,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  planTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  planSub: {
    color: '#667085',
    fontWeight: '600',
  },
  planPrice: {
    color: ui.colors.primaryInk,
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'right',
  },
  planTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: ui.colors.outline,
  },
  planFill: {
    width: '32%',
    backgroundColor: ui.colors.primary,
  },
  planRest: {
    flex: 1,
  },
  payTitle: {
    color: ui.colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  noticeCard: {
    backgroundColor: '#FFFAEB',
    borderColor: '#FEC84B',
    gap: 10,
  },
  noticeTitle: {
    color: '#7A2E0E',
    fontWeight: '900',
  },
  noticeText: {
    color: '#B54708',
    fontWeight: '700',
    lineHeight: 20,
  },
  noticeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  providerBtn: {
    flex: 1,
    height: 44,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  mockPayButton: {
    minHeight: 46,
    borderRadius: ui.radius.md,
    backgroundColor: ui.colors.primaryInk,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  mockPayButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  status: {
    color: '#344054',
    fontSize: 14,
  },
  cancelNote: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
});
