-- Migración de Monetización v2
-- Fecha: 2026-04-27
-- Purpose: Trackear ahorros de usuario para validar disposición a pagar

-- 1. TABLA: Registrar ahorros de cada búsqueda
CREATE TABLE IF NOT EXISTS public.user_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  cheapest_store text NOT NULL,
  cheapest_price numeric(10, 2) NOT NULL,
  expensive_store text NOT NULL,
  expensive_price numeric(10, 2) NOT NULL,
  savings_amount numeric(10, 2) NOT NULL GENERATED ALWAYS AS (expensive_price - cheapest_price) STORED,
  currency text NOT NULL DEFAULT 'UYU',
  search_query text NOT NULL,
  searched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. TABLA: Suscripción Premium (referencia PayPal)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan text NOT NULL DEFAULT 'monthly', -- monthly | yearly
  paypal_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active', -- active | cancelled | expired
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  amount_paid numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  last_payment_at timestamptz,
  next_payment_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. TABLA: Eventos de monetización (analytics)
CREATE TABLE IF NOT EXISTS public.monetization_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL, -- paywall_shown | paywall_clicked | payment_started | payment_completed | payment_failed | subscription_created | subscription_cancelled
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS: user_savings (solo lectura del owner)
ALTER TABLE public.user_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_savings readable by owner"
  ON public.user_savings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_savings insertable by owner"
  ON public.user_savings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS: subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions readable by owner"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions updatable by owner"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS: monetization_events
ALTER TABLE public.monetization_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monetization_events insertable by any anon"
  ON public.monetization_events FOR INSERT
  WITH CHECK (true);

-- 7. ÍNDICES para queries rápidas
CREATE INDEX idx_user_savings_user_id_searched_at 
  ON public.user_savings(user_id, searched_at DESC);

CREATE INDEX idx_subscriptions_user_id 
  ON public.subscriptions(user_id);

CREATE INDEX idx_subscriptions_paypal_id 
  ON public.subscriptions(paypal_subscription_id);

CREATE INDEX idx_monetization_events_user_id_created_at 
  ON public.monetization_events(user_id, created_at DESC);

-- 8. FUNCIÓN SQL: Calcular ahorro mensual del usuario
CREATE OR REPLACE FUNCTION public.get_user_monthly_savings(p_user_id uuid, p_month_offset int DEFAULT 0)
RETURNS TABLE (
  total_savings numeric,
  count_searches int,
  avg_savings_per_search numeric,
  month_year text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(savings_amount), 0)::numeric as total_savings,
    COUNT(*)::int as count_searches,
    COALESCE(AVG(savings_amount), 0)::numeric as avg_savings_per_search,
    TO_CHAR(DATE_TRUNC('month', searched_at AT TIME ZONE 'UTC') - (p_month_offset || ' months')::interval, 'YYYY-MM') as month_year
  FROM public.user_savings
  WHERE user_id = p_user_id
    AND DATE_TRUNC('month', searched_at AT TIME ZONE 'UTC') = DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'UTC') - (p_month_offset || ' months')::interval
  GROUP BY DATE_TRUNC('month', searched_at AT TIME ZONE 'UTC');
END;
$$ LANGUAGE plpgsql;

-- 9. FUNCIÓN SQL: Validar si usuario es Premium
CREATE OR REPLACE FUNCTION public.is_user_premium(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 10. FUNCIÓN: Trigger para actualizar timestamp en subscriptions
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- 11. SEED DATA (optional para testing)
-- INSERT INTO public.user_savings (user_id, product_name, cheapest_store, cheapest_price, expensive_store, expensive_price, currency, search_query, searched_at)
-- VALUES (
--   '550e8400-e29b-41d4-a716-446655440000'::uuid,
--   'Leche Descremada 1L',
--   'Devoto',
--   40,
--   'Tienda Inglesa',
--   52,
--   'UYU',
--   'leche',
--   now() - interval '2 days'
-- );
