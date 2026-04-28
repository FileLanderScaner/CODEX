// components/PaywallContextual.js
// Paywall inteligente que aparece contextualment cuando usuario vio valor

import React, { useCallback } from 'react';
import { Pressable, Text, View, StyleSheet, Modal, Linking } from 'react-native';
import SurfaceCard from './ui/SurfaceCard';
import { ui } from '../lib/ui';
import { getAppUrl, hasPayPalConfig } from '../lib/config';

/**
 * PaywallContextual
 * Props:
 * - visible: boolean
 * - monthlyTotal: número de ahorro
 * - onDismiss: callback cuando usuario cierra
 * - onOpenCheckout: callback para abrir PayPal
 * - accessToken: token de autenticación
 * - currency: string (default 'UYU')
 */
export default function PaywallContextual({
  visible = false,
  monthlyTotal = 0,
  onDismiss = () => {},
  onOpenCheckout = () => {},
  accessToken = '',
  currency = 'UYU',
}) {
  const openWebCheckout = useCallback(() => {
    const appUrl = getAppUrl();
    if (appUrl) {
      Linking.openURL(appUrl);
    } else {
      onOpenCheckout();
    }
  }, [onOpenCheckout]);

  if (!visible) return null;

  const monthlyPrice = '$3.99';
  const annualPrice = '$39.90';
  const annualSavingPerMonth = (39.9 / 12).toFixed(2);
  const annualDiscount = '17%';

  const projectedAnnual = (monthlyTotal * 12).toFixed(0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.centered}>
          <SurfaceCard style={styles.container} elevated>
            {/* Header */}
            <View style={styles.header}>
              <Text selectable style={styles.emoji}>💰</Text>
              <Text selectable style={styles.title}>Activa Premium</Text>
              <Text selectable style={styles.subtitle}>
                Ya ahorraste {currency} {monthlyTotal.toFixed(0)} este mes
              </Text>
            </View>

            {/* Value Proposition */}
            <View style={styles.valueSection}>
              <View style={styles.valueRow}>
                <Text selectable style={styles.checkmark}>✅</Text>
                <Text selectable style={styles.valueText}>Alertas automáticas de precios</Text>
              </View>
              <View style={styles.valueRow}>
                <Text selectable style={styles.checkmark}>✅</Text>
                <Text selectable style={styles.valueText}>Historial de tendencias</Text>
              </View>
              <View style={styles.valueRow}>
                <Text selectable style={styles.checkmark}>✅</Text>
                <Text selectable style={styles.valueText}>Sin publicidad</Text>
              </View>
              <View style={styles.valueRow}>
                <Text selectable style={styles.checkmark}>✅</Text>
                <Text selectable style={styles.valueText}>Favoritos ilimitados</Text>
              </View>
            </View>

            {/* Pricing Cards */}
            <View style={styles.pricingContainer}>
              {/* Monthly */}
              <Pressable
                onPress={openWebCheckout}
                style={({ pressed }) => [
                  styles.priceCard,
                  styles.priceCardMonthly,
                  pressed && styles.priceCardPressed,
                ]}
              >
                <Text selectable style={styles.planLabel}>Mensual</Text>
                <View style={styles.priceRow}>
                  <Text selectable style={styles.price}>{monthlyPrice}</Text>
                  <Text selectable style={styles.period}>/mes</Text>
                </View>
                <Text selectable style={styles.priceNote}>Cancelá cuando quieras</Text>
              </Pressable>

              {/* Annual */}
              <Pressable
                onPress={openWebCheckout}
                style={({ pressed }) => [
                  styles.priceCard,
                  styles.priceCardAnnual,
                  pressed && styles.priceCardPressed,
                ]}
              >
                <View style={styles.badgeContainer}>
                  <Text selectable style={styles.badge}>AHORRA {annualDiscount}</Text>
                </View>
                <Text selectable style={styles.planLabel}>Anual</Text>
                <View style={styles.priceRow}>
                  <Text selectable style={styles.price}>{annualPrice}</Text>
                  <Text selectable style={styles.period}>/año</Text>
                </View>
                <Text selectable style={styles.priceNote}>
                  {annualSavingPerMonth}/mes
                </Text>
              </Pressable>
            </View>

            {/* ROI Message */}
            <View style={styles.roiSection}>
              <Text selectable style={styles.roiTitle}>Retorno esperado</Text>
              <Text selectable style={styles.roiValue}>
                {currency} {projectedAnnual} de ahorro potencial/año
              </Text>
              <Text selectable style={styles.roiNote}>
                Basado en tu uso actual
              </Text>
            </View>

            {!hasPayPalConfig && (
              <SurfaceCard style={styles.noticeCard} elevated={false}>
                <Text selectable style={styles.noticeText}>
                  PayPal no está configurado. Falta completar integración.
                </Text>
              </SurfaceCard>
            )}

            {!accessToken && (
              <SurfaceCard style={styles.noticeCard} elevated={false}>
                <Text selectable style={styles.noticeTitle}>Necesitas iniciar sesión</Text>
                <Text selectable style={styles.noticeText}>
                  Para activar Premium, entra con tu cuenta Google o Facebook
                </Text>
              </SurfaceCard>
            )}

            {/* Dismiss Button */}
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.dismissBtn,
                pressed && styles.dismissBtnPressed,
              ]}
            >
              <Text selectable style={styles.dismissBtnText}>Seguir buscando</Text>
            </Pressable>

            {/* Legal Note */}
            <Text selectable style={styles.legalNote}>
              Cancelación flexible. Sin compromiso. Política de privacidad
            </Text>
          </SurfaceCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  centered: {
    maxWidth: 500,
    width: '100%',
  },
  container: {
    gap: 16,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: ui.colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ui.colors.textSecondary,
    textAlign: 'center',
  },
  valueSection: {
    gap: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: ui.colors.outline,
    paddingVertical: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkmark: {
    fontSize: 16,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    color: ui.colors.text,
    flex: 1,
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    padding: 14,
    borderRadius: ui.radius.lg,
    borderWidth: 2,
    gap: 6,
  },
  priceCardMonthly: {
    backgroundColor: ui.colors.surfaceVariant,
    borderColor: ui.colors.outline,
  },
  priceCardAnnual: {
    backgroundColor: ui.colors.primaryInk,
    borderColor: ui.colors.primaryInk,
  },
  priceCardPressed: {
    opacity: 0.8,
  },
  badgeContainer: {
    marginBottom: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  planLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ui.colors.textSecondary,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: ui.colors.primaryInk,
  },
  priceCardAnnual: {
    color: '#fff',
  },
  period: {
    fontSize: 12,
    fontWeight: '600',
    color: ui.colors.textSecondary,
  },
  priceNote: {
    fontSize: 11,
    fontWeight: '500',
    color: ui.colors.textSecondary,
  },
  roiSection: {
    backgroundColor: ui.colors.surfaceVariant,
    padding: 12,
    borderRadius: ui.radius.lg,
    gap: 4,
    alignItems: 'center',
  },
  roiTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: ui.colors.textSecondary,
    textTransform: 'uppercase',
  },
  roiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10b981',
  },
  roiNote: {
    fontSize: 11,
    fontWeight: '500',
    color: ui.colors.textSecondary,
  },
  noticeCard: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#b45309',
  },
  dismissBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: ui.radius.lg,
    borderWidth: 2,
    borderColor: ui.colors.outline,
    backgroundColor: ui.colors.surface,
    alignItems: 'center',
  },
  dismissBtnPressed: {
    opacity: 0.7,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ui.colors.text,
  },
  legalNote: {
    fontSize: 10,
    fontWeight: '500',
    color: ui.colors.textSecondary,
    textAlign: 'center',
  },
});
