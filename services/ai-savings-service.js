import { optimizeCart, rankOffers } from './savings-intelligence-service.js';

const RECIPE_PRESETS = [
  { test: /asado|parrilla|carne/i, items: ['tira de asado', 'chorizo', 'pan', 'refresco', 'ensalada'] },
  { test: /canasta|semana|basica|básica/i, items: ['arroz', 'fideos', 'leche', 'pan', 'huevos', 'yerba', 'aceite'] },
  { test: /1500|presupuesto|barato|economico|económico/i, items: ['arroz', 'fideos', 'atun', 'leche', 'verduras'] },
];

function fallbackPlan(prompt, offers, options) {
  const preset = RECIPE_PRESETS.find((entry) => entry.test.test(prompt)) || RECIPE_PRESETS[1];
  const cart = optimizeCart(preset.items.map((product) => ({ product, quantity: 1 })), offers, options);
  return {
    provider: 'fallback_rules',
    answer: `Arme una recomendacion con reglas locales para: ${prompt}`,
    cart,
    recommendations: cart.recommendation.lines || cart.splitStores.lines || [],
    explainability: {
      savings: cart.recommendation.estimatedSavings,
      stores_considered: [...new Set((cart.recommendation.lines || cart.splitStores.lines || []).map((line) => line.offer?.store).filter(Boolean))],
      discarded_alternative: cart.singleStore && cart.recommendation.strategy !== 'single_store'
        ? `${cart.singleStore.store} quedo descartada por total estimado $${cart.singleStore.total}`
        : 'No hubo alternativa completa mejor que la recomendacion actual',
      data_confidence: cart.recommendation.confidence,
    },
  };
}

async function callOpenAI(prompt, context, env) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'Sos el asistente de ahorro de AhorroYA. Responde en JSON compacto con items, rationale y warnings. No inventes precios: usa solo contexto.' },
        { role: 'user', content: JSON.stringify({ prompt, context }) },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) throw new Error(`openai_failed_${response.status}`);
  const payload = await response.json();
  return JSON.parse(payload.choices?.[0]?.message?.content || '{}');
}

async function callGemini(prompt, context, env) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Responde en JSON compacto para AhorroYA, sin inventar precios. Prompt: ${prompt}\nContexto: ${JSON.stringify(context)}` }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  });
  if (!response.ok) throw new Error(`gemini_failed_${response.status}`);
  const payload = await response.json();
  return JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
}

export async function answerSavingsAssistant({ prompt, offers = [], preferences = {}, env = process.env }) {
  const context = {
    preferences,
    top_matches: rankOffers(prompt, offers, { minScore: 20 }).slice(0, 20).map((offer) => ({
      product: offer.displayName,
      store: offer.store,
      price: offer.price,
      unit: offer.unit,
      confidence_score: offer.confidence_score,
    })),
  };

  let ai = null;
  let provider = 'fallback_rules';
  try {
    if (env.OPENAI_API_KEY) {
      ai = await callOpenAI(prompt, context, env);
      provider = 'openai';
    } else if (env.GEMINI_API_KEY) {
      ai = await callGemini(prompt, context, env);
      provider = 'gemini';
    }
  } catch (error) {
    ai = { warning: error.message };
  }

  const fallback = fallbackPlan(prompt, offers, preferences);
  return {
    ...fallback,
    provider,
    ai,
    answer: ai?.answer || ai?.rationale || fallback.answer,
    explainability: {
      ...fallback.explainability,
      model_used: provider,
      fallback_used: provider === 'fallback_rules' || Boolean(ai?.warning),
    },
  };
}
