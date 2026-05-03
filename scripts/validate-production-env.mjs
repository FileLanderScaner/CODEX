import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PUBLIC_REQUIRED = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_APP_URL',
  'EXPO_PUBLIC_PAYPAL_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_CLIENT_ID',
];

const SERVER_REQUIRED_STAGING = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ALLOWED_ORIGINS',
  'PAYPAL_ENV',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'PAYPAL_MONTHLY_PLAN_ID',
  'PAYPAL_YEARLY_PLAN_ID',
];

const SERVER_REQUIRED_PRODUCTION = [
  ...SERVER_REQUIRED_STAGING,
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
];

const SECRET_PUBLIC_PATTERNS = [
  /SERVICE_ROLE/i,
  /CLIENT_SECRET/i,
  /SECRET/i,
  /PASSWORD/i,
  /PRIVATE/i,
  /POSTGRES/i,
  /DATABASE_URL/i,
  /TOKEN/i,
];

const PLACEHOLDER_PATTERNS = [
  /^$/,
  /your-/i,
  /replace-/i,
  /<.+>/,
  /xxxxxxxx/i,
  /yyyyyyyy/i,
];

export function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function hasValue(env, key) {
  const value = String(env[key] || '').trim();
  return Boolean(value) && !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function missing(env, keys) {
  return keys.filter((key) => !hasValue(env, key));
}

function publicSecretLeaks(env) {
  return Object.keys(env)
    .filter((key) => key.startsWith('EXPO_PUBLIC_') || key.startsWith('NEXT_PUBLIC_'))
    .filter((key) => SECRET_PUBLIC_PATTERNS.some((pattern) => pattern.test(key)));
}

function riskyValues(env) {
  const risks = [];
  if (env.AI_AUTONOMY_LEVEL === 'LEVEL_4_CONTROLLED_EXECUTION') risks.push('AI_AUTONOMY_LEVEL=LEVEL_4_CONTROLLED_EXECUTION is blocked for initial production.');
  if (String(env.ENABLE_AI_LEVEL4_OVERRIDE).toLowerCase() === 'true') risks.push('ENABLE_AI_LEVEL4_OVERRIDE=true is not allowed for staging/initial production.');
  if (String(env.ENABLE_ADMIN_AI_PANEL).toLowerCase() === 'true' && !hasValue(env, 'SUPABASE_SERVICE_ROLE_KEY')) risks.push('Admin AI panel enabled without Supabase server memory.');
  if (!String(env.ALLOWED_ORIGINS || '').includes('https://')) risks.push('ALLOWED_ORIGINS should include explicit HTTPS staging/production origins.');
  return risks;
}

export function validateProductionEnv(source = process.env) {
  const env = { ...source };
  const publicMissing = missing(env, PUBLIC_REQUIRED);
  const stagingMissing = missing(env, SERVER_REQUIRED_STAGING);
  const productionMissing = missing(env, SERVER_REQUIRED_PRODUCTION);
  const exposed = publicSecretLeaks(env);
  const risks = riskyValues(env);
  const aiSafe = env.AI_PROVIDER === 'mock'
    && env.AI_AUTONOMY_LEVEL === 'LEVEL_0_READ_ONLY'
    && String(env.ENABLE_AI_LEVEL4_OVERRIDE).toLowerCase() !== 'true';
  const hasSafeOrigins = hasValue(env, 'ALLOWED_ORIGINS');
  const stagingReady = publicMissing.length === 0
    && stagingMissing.length === 0
    && exposed.length === 0
    && aiSafe
    && hasSafeOrigins;
  const productionReady = stagingReady
    && productionMissing.length === 0
    && env.PAYPAL_ENV === 'live'
    && risks.length === 0;

  return {
    mode: productionReady ? 'production_ready' : stagingReady ? 'staging_ready' : 'demo_or_partial',
    missing: {
      public: publicMissing,
      staging: stagingMissing,
      production: productionMissing,
    },
    risks,
    exposed,
    checks: {
      supabase_public: publicMissing.filter((key) => key.includes('SUPABASE')).length === 0,
      supabase_server: stagingMissing.filter((key) => key.includes('SUPABASE')).length === 0,
      paypal: stagingMissing.filter((key) => key.includes('PAYPAL')).length === 0 && hasValue(env, 'EXPO_PUBLIC_PAYPAL_CLIENT_ID'),
      google_auth: hasValue(env, 'EXPO_PUBLIC_GOOGLE_CLIENT_ID') && hasValue(env, 'GOOGLE_OAUTH_CLIENT_ID') && hasValue(env, 'GOOGLE_OAUTH_CLIENT_SECRET'),
      allowed_origins: hasSafeOrigins,
      ai_safe_defaults: aiSafe,
    },
  };
}

export function loadValidationEnv(root = process.cwd()) {
  const publicEnv = parseEnvFile(path.join(root, '.env.local'));
  const serverEnv = parseEnvFile(path.join(root, '.env.server.local'));
  return { ...process.env, ...publicEnv, ...serverEnv };
}

export function printValidation(result) {
  console.log(`mode=${result.mode}`);
  Object.entries(result.checks).forEach(([key, ok]) => {
    console.log(`${key}=${ok ? 'ready' : 'missing'}`);
  });
  console.log(`missing_public=${result.missing.public.join(',') || 'none'}`);
  console.log(`missing_staging=${result.missing.staging.join(',') || 'none'}`);
  console.log(`missing_production=${result.missing.production.join(',') || 'none'}`);
  console.log(`dangerously_exposed=${result.exposed.join(',') || 'none'}`);
  console.log(`risks=${result.risks.join(' | ') || 'none'}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const strict = process.argv.includes('--strict');
  const result = validateProductionEnv(loadValidationEnv());
  printValidation(result);
  if (strict && result.mode !== 'production_ready') {
    process.exitCode = 1;
  }
}
