import React, { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, Text, StyleSheet, View } from 'react-native';
import { config } from '../lib/config';
import { getApiUrl } from '../lib/config';
import { trackEvent } from '../services/tracking-service';

export default function PayPalButtons({ user, accessToken, onStatus, onOpenWebCheckout }) {
  const [pending, setPending] = useState(false);
  const canStartSubscription = Boolean(config.paypalClientId && accessToken);
  const amount = useMemo(() => Number(config.premiumPrice || 4.99).toFixed(2), []);

  const startSubscriptionCheckout = useCallback(async () => {
    if (!canStartSubscription) {
      onOpenWebCheckout?.();
      return;
    }

    setPending(true);
    try {
      onStatus?.('Creando suscripcion segura en PayPal...');
      await trackEvent('checkout_started', {
        provider: 'paypal',
        checkout_type: 'subscription',
        plan: 'premium_monthly',
        user_id: user?.id || null,
      }, Number(amount), config.premiumCurrency).catch(() => null);
      await trackEvent('premium_started', {
        provider: 'paypal',
        checkout_type: 'subscription',
        user_id: user?.id || null,
      }).catch(() => null);

      const response = await fetch(getApiUrl('/api/v1/billing/subscriptions/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan: 'premium_monthly' }),
      });
      const payload = await response.json().catch(() => ({}));
      const approvalUrl = payload?.data?.approval_url;

      if (!response.ok || !approvalUrl) {
        throw new Error(payload.error || 'No pudimos crear la suscripcion');
      }

      await trackEvent('premium_checkout_redirected', {
        provider: 'paypal',
        checkout_type: 'subscription',
        subscription_id: payload?.data?.provider_subscription_id || null,
      }, Number(amount), config.premiumCurrency).catch(() => null);
      onStatus?.('Redirigiendo a PayPal sandbox...');
      await Linking.openURL(approvalUrl);
    } catch (error) {
      await trackEvent('subscription_failed', {
        provider: 'paypal',
        checkout_type: 'subscription',
        plan: 'premium_monthly',
        error: String(error?.message || 'paypal_checkout_failed').slice(0, 180),
      }, Number(amount), config.premiumCurrency).catch(() => null);
      onStatus?.(error?.message || 'No pudimos iniciar PayPal.');
    } finally {
      setPending(false);
    }
  }, [accessToken, amount, canStartSubscription, onOpenWebCheckout, onStatus, user?.id]);

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        disabled={pending}
        onPress={startSubscriptionCheckout}
        style={[styles.primaryButton, pending ? styles.primaryButtonDisabled : null]}
      >
        <Text style={styles.primaryButtonText}>
          {pending ? 'Creando suscripcion...' : config.paypalClientId ? 'Continuar con PayPal' : 'Pagar en la web'}
        </Text>
      </Pressable>
      {canStartSubscription ? (
        <Text selectable style={styles.status}>Checkout de suscripcion sandbox protegido por webhook verificado.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  status: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#101828',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
