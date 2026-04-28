# 📋 GUÍA DE INTEGRACIÓN - MONETIZACIÓN EN RESULTADOS

**Objetivo:** Integrar contador de ahorros + paywall contextual en ResultsScreen

---

## 1️⃣ MODIFICAR ResultsScreen.js

### A. Imports Necesarios
```javascript
// Agregar al inicio de ResultsScreen.js
import SavingsCounter from '../components/SavingsCounter';
import PaywallContextual from '../components/PaywallContextual';
import { recordSaving, getPremiumStatus, getSavingsSummary, shouldShowPaywall, getMotivationalMessage } from '../services/premium-service';
import { getSavingsOpportunity } from '../services/price-service';
```

### B. Estado Nuevo
```javascript
// Dentro del componente ResultsScreen, agregar al useState:

const [savings, setSavings] = useState({
  monthlyTotal: 0,
  thisSearchSavings: 0,
  trend: null,
});

const [paywallVisible, setPaywallVisible] = useState(false);
const [lastPaywallShownAt, setLastPaywallShownAt] = useState(null);

const [premiumStatus, setPremiumStatus] = useState(null);
const [loading, setLoading] = useState({
  savings: false,
  premium: false,
});
```

### C. Effect para Cargar Estado Premium
```javascript
// Después de useEffect que obtiene precios, agregar:

useEffect(() => {
  if (!user?.email) {
    setPremiumStatus({ is_premium: false });
    return;
  }

  setLoading(prev => ({ ...prev, premium: true }));

  getAccessToken()
    .then(async token => {
      if (token) {
        const status = await getPremiumStatus(token);
        setPremiumStatus(status || { is_premium: false });
      }
    })
    .catch(() => setPremiumStatus({ is_premium: false }))
    .finally(() => setLoading(prev => ({ ...prev, premium: false })));
}, [user?.email]);
```

### D. Effect para Registrar Ahorros y Mostrar Paywall
```javascript
// Cuando hay resultados de precios, registrar ahorros:

useEffect(() => {
  if (!results.length || !user?.email) return;

  const recordAndShowPaywall = async () => {
    setLoading(prev => ({ ...prev, savings: true }));

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setLoading(prev => ({ ...prev, savings: false }));
        return;
      }

      // 1. Calcular ahorro de esta búsqueda
      const savingAmount = getSavingsOpportunity(results);
      if (savingAmount === 0) {
        setLoading(prev => ({ ...prev, savings: false }));
        return;
      }

      // 2. Registrar el ahorro
      const saving = await recordSaving(accessToken, {
        product_name: results[0]?.displayName || 'Producto',
        search_query: query,
        cheapest_store: results[0]?.store || '',
        cheapest_price: results[0]?.price || 0,
        expensive_store: results[results.length - 1]?.store || '',
        expensive_price: results[results.length - 1]?.price || 0,
        currency: results[0]?.currency || 'UYU',
      });

      if (!saving) {
        setLoading(prev => ({ ...prev, savings: false }));
        return;
      }

      // 3. Actualizar estado local
      setSavings({
        monthlyTotal: saving.user_monthly_total,
        thisSearchSavings: saving.savings_amount,
        trend: 'up',
      });

      // 4. Decidir si mostrar paywall
      const summaryData = await getSavingsSummary(accessToken);
      if (shouldShowPaywall(premiumStatus, summaryData, lastPaywallShownAt)) {
        setPaywallVisible(true);
        setLastPaywallShownAt(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error recording savings:', error);
    } finally {
      setLoading(prev => ({ ...prev, savings: false }));
    }
  };

  recordAndShowPaywall();
}, [results, query, user?.email]);
```

### E. Renderizado del Contador y Paywall
```javascript
// En el JSX del componente, agregar ANTES de la lista de resultados:

{savings.monthlyTotal > 0 && (
  <SavingsCounter
    monthlyTotal={savings.monthlyTotal}
    thisSearchSavings={savings.thisSearchSavings}
    trend={savings.trend}
    currency={results[0]?.currency || 'UYU'}
  />
)}

{/* Paywall Contextual */}
<PaywallContextual
  visible={paywallVisible}
  monthlyTotal={savings.monthlyTotal}
  onDismiss={() => setPaywallVisible(false)}
  onOpenCheckout={() => {
    // Navegar a PaywallScreen si es necesario
    navigation.navigate('Paywall');
  }}
  accessToken={accessToken}
  currency={results[0]?.currency || 'UYU'}
/>
```

---

## 2️⃣ ESTRUCTURA DE CARPETAS ACTUALIZADA

```
api/v1/
├── savings.js                    ✅ NUEVO
├── premium/
│   ├── status.js                 ✅ NUEVO
│   └── webhook-paypal.js         ✅ NUEVO

components/
├── SavingsCounter.js             ✅ NUEVO
├── PaywallContextual.js          ✅ NUEVO

services/
├── premium-service.js            ✅ NUEVO

screens/
├── ResultsScreen.js              ⚠️ MODIFICAR (integración)

supabase/migrations/
└── 202604271200_monetization_v2_premium_system.sql ✅ NUEVO

docs/monetization/
└── STRATEGY_2026-04-27.md       ✅ NUEVO
```

---

## 3️⃣ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Backend (3h)
- [ ] Ejecutar migración SQL en Supabase
- [ ] Validar tablas creadas:
  - [ ] `user_savings`
  - [ ] `subscriptions`
  - [ ] `monetization_events`
- [ ] Validar funciones SQL:
  - [ ] `get_user_monthly_savings()`
  - [ ] `is_user_premium()`
  - [ ] Triggers de actualización

### Fase 2: API (2h)
- [ ] Implementar `/api/v1/savings.js`
  - [ ] POST /api/v1/savings
  - [ ] GET /api/v1/savings/summary
- [ ] Implementar `/api/v1/premium/status.js`
  - [ ] GET /api/v1/premium/status
- [ ] Implementar `/api/v1/premium/webhook-paypal.js`
  - [ ] Parseo de webhooks PayPal
  - [ ] Actualización de suscripciones
  - [ ] Manejo de eventos

### Fase 3: Frontend (3h)
- [ ] Crear `services/premium-service.js`
- [ ] Crear `components/SavingsCounter.js`
- [ ] Crear `components/PaywallContextual.js`
- [ ] Integrar en `screens/ResultsScreen.js`

### Fase 4: Testing (2h)
- [ ] Test E2E: Buscar → Registrar ahorro → Ver contador
- [ ] Test E2E: Alcanzar $50 ahorro → Mostrar paywall
- [ ] Test E2E: Click en Premium → Abrir PayPal
- [ ] Test webhook: Simular pago completo → Actualizar profiles

### Fase 5: DevOps (1h)
- [ ] Configurar webhook en PayPal (URL: `https://api.domain.com/api/v1/premium/webhook-paypal`)
- [ ] Agregar secrets de PayPal en variables de entorno
- [ ] Habilitar logging de monetización_events en Supabase
- [ ] Crear dashboard de métricas

---

## 4️⃣ FLUJO END-TO-END

```
┌─────────────────────────────────────────────────────────────┐
│ Usuario abre app → PriceSearchScreen                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Usuario busca "leche"                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ API devuelve precios:                                       │
│ - Devoto: $40 (min)                                          │
│ - Tienda Inglesa: $52 (max)                                  │
│ - Ahorro: $12                                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend llama POST /api/v1/savings                          │
│ Body:                                                       │
│ {                                                           │
│   product_name: "Leche",                                    │
│   cheapest_price: 40,                                       │
│   expensive_price: 52,                                      │
│   ...                                                       │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend:                                                    │
│ 1. Inserta en user_savings                                  │
│ 2. Calcula total mensual: $12                               │
│ 3. Registra evento analytics                                │
│ 4. Devuelve:                                                │
│    {                                                        │
│      savings_amount: 12,                                    │
│      user_monthly_total: 12,                                │
│      should_show_paywall: false (total < $50)               │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend:                                                   │
│ 1. Muestra SavingsCounter: "Ahorro: $12"                    │
│ 2. No muestra paywall (trigger no met)                      │
│ 3. Muestra resultados                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ↓                       ↓
    [Segunda búsqueda]      [Tercera búsqueda]
    "Carne" → +$45              "Arroz" → +$8
    Total: $65                  Total: $65
                                │
                                ↓
            ┌─────────────────────────────────────────────────┐
            │ Total mensual: $65 > $50 ✅                      │
            │ Días desde último paywall: > 7 ✅                │
            │ Usuario no premium: true ✅                      │
            │                                                 │
            │ MOSTRAR PAYWALL CONTEXTUAL                       │
            └─────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ↓                       ↓
            [Activar Premium]      [Seguir buscando]
                    │
                    ↓
        ┌─────────────────────────────┐
        │ Abrir PayPal Checkout       │
        │ Plan: Monthly ($3.99)       │
        │ user_id en custom_id        │
        └─────────────────────────────┘
                    │
                    ↓
        ┌─────────────────────────────┐
        │ Usuario completa pago       │
        │ PayPal webhook:             │
        │ BILLING.SUBSCRIPTION.CREATED│
        └─────────────────────────────┘
                    │
                    ↓
        ┌─────────────────────────────┐
        │ Backend webhook recibe:     │
        │ - subscription_id           │
        │ - user_id (custom_id)       │
        │ - status: ACTIVE            │
        │ - expires_at: +30 días      │
        └─────────────────────────────┘
                    │
                    ↓
        ┌─────────────────────────────────────┐
        │ Actualizar Supabase:                │
        │ - INSERT subscriptions              │
        │ - UPDATE profiles.plan = 'premium'  │
        │ - UPDATE profiles.premium_until     │
        │ - INSERT monetization_event         │
        └─────────────────────────────────────┘
                    │
                    ↓
        ┌─────────────────────────────────────┐
        │ Frontend detecta cambio:            │
        │ - getPremiumStatus() = premium      │
        │ - Desbloquea features               │
        │ - Muestra "Premium hasta 27/5"      │
        │ - Esconde paywall                   │
        └─────────────────────────────────────┘
```

---

## 5️⃣ VARIABLES DE ENTORNO NECESARIAS

### En Vercel (producción)
```
# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<client_id_live>
PAYPAL_SECRET=<secret_live>
PAYPAL_WEBHOOK_ID=<webhook_id_live>

# Supabase (ya existente)
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```

### En .env.example (local)
```
# Agregar:
NEXT_PUBLIC_PAYPAL_CLIENT_ID=ARD...
PAYPAL_SECRET=EHkNMxRc...
PAYPAL_WEBHOOK_ID=WH-123...
```

---

## 6️⃣ TESTING MANUAL

### Test 1: Contador de Ahorros
```
1. Abrir app
2. Iniciar sesión
3. Buscar "leche"
4. ✅ Debe aparecer SavingsCounter con "$X ahorro"
5. Buscar otro producto
6. ✅ Contador debe sumar
```

### Test 2: Paywall Contextual
```
1. Hacer 3 búsquedas (total > $50)
2. ✅ Paywall debe aparecer automáticamente
3. Cerrar paywall
4. ✅ No debe aparecer en 7 días
5. Pasados 8 días, hacer búsqueda
6. ✅ Paywall reaparece
```

### Test 3: Pago PayPal
```
1. Desde paywall, click "Activar Premium"
2. ✅ Abre PayPal
3. Completa pago test
4. ✅ Backend recibe webhook
5. ✅ Supabase actualiza subscriptions + profiles
6. ✅ Vuelve a app mostrado "Premium hasta..."
```

---

## 7️⃣ MÉTRICAS A TRACKEAR

```javascript
// Eventos a registrar en monetization_events:

// Cuando se busca y hay ahorro
{
  event_type: 'search_with_savings',
  metadata: {
    savings_amount: 12,
    product: 'Leche',
    user_monthly_total: 12
  }
}

// Cuando paywall aparece
{
  event_type: 'paywall_shown',
  metadata: {
    reason: 'savings_threshold',
    trigger_value: 65,
    user_monthly_total: 65
  }
}

// Cuando usuario interactúa con paywall
{
  event_type: 'paywall_clicked',
  metadata: {
    action: 'activated' | 'dismissed',
    shown_at: '2026-04-27T...',
    dismissed_at: '2026-04-27T...',
    time_to_decision: 30 // segundos
  }
}
```

---

## 8️⃣ PRÓXIMOS PASOS (POST-MVP)

1. **A/B Testing de Pricing**
   - Variante A: USD $1.99
   - Variante B: USD $3.99
   - Medir: conversion_rate, churn

2. **Referral Program**
   - "Invita amigos, ambos ganan $1 descuento"

3. **Upgrade/Downgrade**
   - Monthly → Yearly (upgrade)
   - Yearly → Monthly (downgrade)

4. **Affiliate System**
   - Links con comisión para usuarios
   - Premium early access a mejores oportunidades

5. **Dashboard Admin**
   - Visualizar conversiones en tiempo real
   - Churn rate por cohorte
   - Revenue tracking

---

**Documento creado:** 27 de abril de 2026  
**Status:** Lista para implementación  
**Esfuerzo estimado:** 10 horas (2 days sprint)
