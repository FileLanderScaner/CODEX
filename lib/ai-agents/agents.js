import { BaseAgent } from './BaseAgent.js';
import { AgentPermissionLevel, AgentRiskLevel } from './contracts.js';

function suggestion(title, impact = 'medium', effort = 'medium', risk = 'low', action = 'human_review') {
  return { title, impact, effort, risk, action, createdAt: new Date().toISOString() };
}

export class ProductAuditAgent extends BaseAgent {
  constructor() {
    super({ name: 'ProductAuditAgent', description: 'Audita rutas, UX, fricciones y oportunidades de producto.', risk: AgentRiskLevel.LOW });
  }

  async analyze(input, context) {
    const routes = input.routes || context.routes || [];
    const requiredRoutes = ['/app', '/app/buscar', '/app/favoritos', '/app/alertas', '/app/perfil', '/app/premium'];
    const missingRoutes = requiredRoutes.filter((route) => !routes.includes(route));
    return {
      report: { type: 'ProductAuditReport', routesChecked: routes.length, missingRoutes, mobileRisk: 'medium', monetizationCtas: ['Premium', 'WhatsApp share'] },
      suggestions: [
        ...(missingRoutes.length ? [suggestion(`Verificar rutas faltantes: ${missingRoutes.join(', ')}`, 'high', 'medium')] : []),
        suggestion('Agregar metricas de conversion por busqueda, favorito, alerta y premium', 'high', 'low'),
      ],
    };
  }
}

export class PriceIntelligenceAgent extends BaseAgent {
  constructor() {
    super({ name: 'PriceIntelligenceAgent', description: 'Analiza calidad, outliers y confianza de precios.', permissionLevel: AgentPermissionLevel.LEVEL_2_SAFE_AUTOMATION });
  }

  async analyze(input, context) {
    const prices = context.toolbox.getPrices(input.prices);
    const grouped = prices.reduce((acc, item) => {
      const key = context.toolbox.normalizeProduct(item.product || item.displayName);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
    const products = Object.entries(grouped).map(([product, rows]) => {
      const values = rows.map((row) => Number(row.price)).filter(Number.isFinite);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
      const outliers = rows.filter((row) => Number(row.price) > avg * 3 || Number(row.price) < avg * 0.25);
      return { product, observations: rows.length, min, avg, max, outliers: outliers.length, confidence: Math.max(40, Math.min(95, 60 + rows.length * 8 - outliers.length * 15)) };
    });
    return {
      report: { type: 'PriceQualityReport', products, anomalies: products.filter((item) => item.outliers > 0).length },
      suggestions: products.some((item) => item.outliers)
        ? [suggestion('Revisar precios outlier antes de usarlos en recomendaciones premium', 'high', 'low')]
        : [suggestion('Versionar precios con metadata de fuente y fecha de actualizacion', 'medium', 'medium')],
    };
  }
}

export class SavingsOptimizerAgent extends BaseAgent {
  constructor() {
    super({ name: 'SavingsOptimizerAgent', description: 'Optimiza carritos por precio, traslado y cantidad de tiendas.', permissionLevel: AgentPermissionLevel.LEVEL_2_SAFE_AUTOMATION });
  }

  async analyze(input, context) {
    const items = input.items?.length ? input.items : [{ product: 'yerba', quantity: 1 }, { product: 'leche', quantity: 1 }, { product: 'arroz', quantity: 1 }];
    const cart = context.toolbox.optimizeCart(items, input.prices, {
      transportCost: input.transportCost,
      extraStoreTransportCost: input.extraStoreTransportCost,
    });
    return {
      report: { type: 'SavingsOptimizerReport', cart, recommendation: cart.recommendation.explanation },
      suggestions: [suggestion('Mostrar explicacion simple de ahorro neto en resultados de carrito', 'high', 'medium')],
    };
  }
}

export class PersonalizationAgent extends BaseAgent {
  constructor() {
    super({ name: 'PersonalizationAgent', description: 'Segmenta usuarios y recomienda alertas o upgrades.', permissionLevel: AgentPermissionLevel.LEVEL_1_SUGGEST });
  }

  async analyze(input) {
    const searches = input.searches || [];
    const favorites = input.favorites || [];
    const segment = favorites.length >= 3 ? 'High Intent Buyer' : searches.length >= 5 ? 'Deal Hunter' : searches.length ? 'Explorer' : 'Dormant User';
    return {
      report: { type: 'PersonalizationReport', segment, signals: { searches: searches.length, favorites: favorites.length } },
      suggestions: [suggestion(`Activar recomendacion para segmento ${segment}`, 'medium', 'low')],
    };
  }
}

export class GrowthAgent extends BaseAgent {
  constructor() {
    super({ name: 'GrowthAgent', description: 'Genera backlog de crecimiento, referidos, WhatsApp y SEO.', permissionLevel: AgentPermissionLevel.LEVEL_1_SUGGEST });
  }

  async analyze(input, context) {
    const deals = context.toolbox.getPopularDeals(input.prices).slice(0, 5);
    return {
      report: { type: 'GrowthReport', dealsUsed: deals.length, channels: ['whatsapp', 'seo', 'referrals'] },
      suggestions: [
        suggestion('Crear paginas SEO programaticas por producto y barrio', 'high', 'medium'),
        suggestion('Lanzar referido: 7 dias Premium por amigo activado', 'high', 'medium'),
        ...deals.map((deal) => suggestion(`WhatsApp hook: ${deal.product} con ahorro $${deal.savings}`, 'medium', 'low')),
      ],
    };
  }
}

export class MonetizationAgent extends BaseAgent {
  constructor() {
    super({ name: 'MonetizationAgent', description: 'Analiza Premium, afiliados, ads, B2B y paywalls.', permissionLevel: AgentPermissionLevel.LEVEL_1_SUGGEST, risk: AgentRiskLevel.MEDIUM });
  }

  async analyze() {
    return {
      report: { type: 'MonetizationReport', activeModels: ['Premium', 'affiliate_ready', 'B2B_leads'], blockedActions: ['touch_real_payments'] },
      suggestions: [
        suggestion('Limitar alertas avanzadas y carrito multi-tienda al plan Premium', 'high', 'medium', 'medium'),
        suggestion('Ofrecer reporte B2B mensual de precios por categoria a supermercados', 'high', 'medium', 'medium'),
      ],
    };
  }
}

export class SupportWhatsAppAgent extends BaseAgent {
  constructor() {
    super({ name: 'SupportWhatsAppAgent', description: 'Prepara soporte y compartir por WhatsApp.', permissionLevel: AgentPermissionLevel.LEVEL_1_SUGGEST });
  }

  async analyze(_input, context) {
    const hasTwilio = Boolean(context.env.TWILIO_ACCOUNT_SID && context.env.TWILIO_AUTH_TOKEN && context.env.TWILIO_WHATSAPP_NUMBER);
    return {
      report: { type: 'WhatsAppSupportReport', mode: hasTwilio ? 'business_api_ready' : 'deep_links_only', missingEnv: hasTwilio ? [] : ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'] },
      suggestions: [suggestion('Mantener deep links para compartir ahorros y preparar webhook Business API con opt-in', 'medium', 'medium')],
    };
  }
}

export class DataIngestionAgent extends BaseAgent {
  constructor() {
    super({ name: 'DataIngestionAgent', description: 'Audita fuentes de precios, imports y scraping responsable.', permissionLevel: AgentPermissionLevel.LEVEL_1_SUGGEST });
  }

  async analyze() {
    return {
      report: { type: 'DataIngestionReport', supported: ['CSV fixtures', 'official adapters', 'catalog fallback links'], guardrails: ['robots.txt', 'rate limits', 'metadata de fuente'] },
      suggestions: [suggestion('Guardar source_url, observed_at, importer_version y checksum por precio', 'high', 'medium')],
    };
  }
}

export class QARegressionAgent extends BaseAgent {
  constructor() {
    super({ name: 'QARegressionAgent', description: 'Define y evalua salud de lint, tests, build y rutas.', permissionLevel: AgentPermissionLevel.LEVEL_1_SUGGEST });
  }

  async analyze(input) {
    const checks = input.checks || {};
    const failed = Object.entries(checks).filter(([, value]) => value === false).map(([key]) => key);
    return {
      report: { type: 'QARegressionReport', checks, failed, shouldBlock: failed.length > 0 },
      suggestions: failed.length ? [suggestion(`Bloquear deploy hasta corregir: ${failed.join(', ')}`, 'high', 'medium', 'medium')] : [suggestion('Mantener smoke tests de rutas principales en CI', 'medium', 'low')],
    };
  }
}

export class DevAutonomyAgent extends BaseAgent {
  constructor() {
    super({ name: 'DevAutonomyAgent', description: 'Convierte hallazgos en tareas y parches propuestos.', permissionLevel: AgentPermissionLevel.LEVEL_3_CODE_PROPOSAL, risk: AgentRiskLevel.MEDIUM });
  }

  async analyze(input) {
    const findings = input.findings || [];
    return {
      report: { type: 'DevAutonomyReport', tasksCreated: findings.length, policy: 'small_patches_only_after_qa_security' },
      suggestions: findings.map((finding) => suggestion(`Crear tarea: ${finding}`, 'medium', 'medium', 'medium')).concat(
        suggestion('Generar changelog automatico por release', 'medium', 'low'),
      ),
    };
  }
}

export class SecurityComplianceAgent extends BaseAgent {
  constructor() {
    super({ name: 'SecurityComplianceAgent', description: 'Revisa secretos, RLS, endpoints, CORS, XSS y abuso.', permissionLevel: AgentPermissionLevel.LEVEL_1_SUGGEST, risk: AgentRiskLevel.MEDIUM });
  }

  async analyze(_input, context) {
    const env = context.env || {};
    const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SHARED_SECRET', 'ALLOWED_ORIGINS'].filter((key) => !env[key]);
    return {
      report: { type: 'SecurityAuditReport', missingEnv: missing, protectedByDefault: true, blockedActions: ['credentials', 'payments', 'production_data'] },
      suggestions: [
        ...(missing.length ? [suggestion(`Completar variables servidor: ${missing.join(', ')}`, 'high', 'low', 'medium')] : []),
        suggestion('Agregar rate limiting persistente con Upstash en produccion', 'high', 'medium', 'medium'),
      ],
    };
  }
}

export class ObservabilityAgent extends BaseAgent {
  constructor() {
    super({ name: 'ObservabilityAgent', description: 'Define eventos, performance, funnels y errores.', permissionLevel: AgentPermissionLevel.LEVEL_1_SUGGEST });
  }

  async analyze() {
    return {
      report: { type: 'ObservabilityReport', events: ['search_product', 'view_best_price', 'click_whatsapp', 'premium_started', 'add_favorite', 'create_alert'], funnels: ['search_to_share', 'search_to_premium', 'favorite_to_alert'] },
      suggestions: [suggestion('Crear dashboard diario de conversion y productos mas buscados', 'high', 'medium')],
    };
  }
}
