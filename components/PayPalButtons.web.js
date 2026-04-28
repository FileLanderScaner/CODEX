import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { config, getApiUrl, hasPayPalConfig } from '../lib/config';

export default function PayPalButtons({ accessToken, onStatus }) {
  const containerRef = useRef(null);
  const [loadingScript, setLoadingScript] = useState(false);

  useEffect(() => {
    if (!hasPayPalConfig || !containerRef.current || window.paypal) {
      return;
    }

    setLoadingScript(true);
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.paypalClientId)}&currency=${encodeURIComponent(config.premiumCurrency)}&components=buttons&vault=true&intent=subscription`;
    script.async = true;
    script.onload = () => setLoadingScript(false);
    script.onerror = () => {
      setLoadingScript(false);
      onStatus('No pudimos cargar PayPal.');
    };
    document.body.appendChild(script);
  }, [onStatus]);

  useEffect(() => {
    if (!hasPayPalConfig || !window.paypal || !containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = '';
    window.paypal.Buttons({
      createSubscription: async () => {
        onStatus('Creando suscripcion...');
        const response = await fetch(getApiUrl('/api/v1/billing/subscriptions/create'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: accessToken ? `Bearer ${accessToken}` : '' },
          body: JSON.stringify({
            plan: 'premium_monthly',
          }),
        });
        const subscription = await response.json();
        if (!response.ok) {
          throw new Error(subscription.error || 'No pudimos crear la suscripcion.');
        }
        return subscription.data?.provider_subscription_id;
      },
      onApprove: async () => {
        onStatus('Suscripcion aprobada. PayPal notificara el alta premium en unos segundos.');
      },
      onError: (error) => {
        onStatus(error.message || 'PayPal rechazo la operacion.');
      },
    }).render(containerRef.current);
  }, [accessToken, loadingScript, onStatus]);

  if (!hasPayPalConfig) {
    return null;
  }

  return (
    <View style={{ minHeight: 52 }}>
      {loadingScript ? <ActivityIndicator /> : null}
      <div ref={containerRef} />
      <Text selectable style={{ color: '#667085', fontSize: 12 }}>
        Los pagos se procesan desde PayPal y se registran en el backend.
      </Text>
    </View>
  );
}
