import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { config, hasPayPalConfig } from '../lib/config';

export default function PayPalButtons({ accessToken, onStatus }) {
  const containerRef = useRef(null);
  const [loadingScript, setLoadingScript] = useState(false);

  useEffect(() => {
    if (!hasPayPalConfig || !containerRef.current || window.paypal) {
      return;
    }

    setLoadingScript(true);
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.paypalClientId)}&currency=${encodeURIComponent(config.premiumCurrency)}&components=buttons`;
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
      createOrder: async () => {
        onStatus('Creando orden...');
        const response = await fetch(`${config.apiBaseUrl}/api/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: accessToken ? `Bearer ${accessToken}` : '' },
          body: JSON.stringify({
            amount: config.premiumPrice,
            currency: config.premiumCurrency,
            plan: 'premium_monthly',
          }),
        });
        const order = await response.json();
        if (!response.ok) {
          throw new Error(order.error || 'No pudimos crear la orden.');
        }
        return order.id;
      },
      onApprove: async (data) => {
        onStatus('Confirmando pago...');
        const response = await fetch(`${config.apiBaseUrl}/api/paypal/capture-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: accessToken ? `Bearer ${accessToken}` : '' },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        const capture = await response.json();
        if (!response.ok) {
          throw new Error(capture.error || 'No pudimos confirmar el pago.');
        }
        onStatus('Pago confirmado. Tu plan premium quedo registrado.');
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
