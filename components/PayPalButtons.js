import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, StyleSheet, View } from 'react-native';
import { config } from '../lib/config';
import { getApiUrl } from '../lib/config';
import { trackEvent } from '../services/tracking-service';

function loadPayPalSdk(clientId, currency) {
  if (typeof window === 'undefined') return Promise.reject(new Error('PayPal web SDK requires a browser'));
  if (window.paypal?.Buttons) return Promise.resolve(window.paypal);
  const existing = document.querySelector('script[data-ahorroya-paypal="true"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(window.paypal));
      existing.addEventListener('error', () => reject(new Error('No pudimos cargar PayPal')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`;
    script.async = true;
    script.dataset.ahorroyaPaypal = 'true';
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error('No pudimos cargar PayPal'));
    document.body.appendChild(script);
  });
}

export default function PayPalButtons({ user, accessToken, onStatus, onOpenWebCheckout }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const canRenderWebButtons = Platform.OS === 'web' && config.paypalClientId && accessToken;
  const amount = useMemo(() => Number(config.premiumPrice || 4.99).toFixed(2), []);

  useEffect(() => {
    let cancelled = false;
    if (!canRenderWebButtons || !containerRef.current) return undefined;
    containerRef.current.innerHTML = '';
    loadPayPalSdk(config.paypalClientId, config.premiumCurrency)
      .then((paypal) => {
        if (cancelled || !paypal?.Buttons || !containerRef.current) return;
        setReady(true);
        paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'pay' },
          createOrder: async () => {
            onStatus?.('Creando orden segura en PayPal...');
            await trackEvent('premium_started', { provider: 'paypal', user_id: user?.id || null }).catch(() => null);
            const response = await fetch(getApiUrl('/api/paypal/create-order'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                amount,
                currency: config.premiumCurrency,
                plan: 'premium_monthly',
              }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.id) {
              throw new Error(data.error || 'No pudimos crear la orden');
            }
            return data.id;
          },
          onApprove: async (data) => {
            onStatus?.('Confirmando pago...');
            const response = await fetch(getApiUrl('/api/paypal/capture-order'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(payload.error || 'PayPal no confirmo el pago');
            }
            await trackEvent('premium_completed', { provider: 'paypal', order_id: data.orderID }, Number(amount), config.premiumCurrency).catch(() => null);
            onStatus?.('Premium activo. Gracias por apoyar AhorroYA.');
          },
          onError: (error) => {
            onStatus?.(error?.message || 'No pudimos completar PayPal.');
          },
        }).render(containerRef.current);
      })
      .catch((error) => onStatus?.(error.message || 'PayPal no esta disponible.'));
    return () => {
      cancelled = true;
    };
  }, [accessToken, amount, canRenderWebButtons, onStatus, user?.id]);

  if (canRenderWebButtons) {
    return (
      <View style={styles.wrapper}>
        {!ready ? <Text selectable style={styles.status}>Cargando PayPal...</Text> : null}
        <div ref={containerRef} />
      </View>
    );
  }

  return (
    <Pressable accessibilityRole="button" onPress={onOpenWebCheckout} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{config.paypalClientId ? 'Abrir checkout web' : 'Pagar en la web'}</Text>
    </Pressable>
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
