import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const publicEnvPath = path.join(root, '.env.local');
const serverEnvPath = path.join(root, '.env.server.local');

function parseEnvFile(filePath) {
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

const publicEnv = parseEnvFile(publicEnvPath);
const serverEnv = parseEnvFile(serverEnvPath);
const mergedEnv = { ...process.env, ...publicEnv, ...serverEnv };
const env = {
  SUPABASE_URL: mergedEnv.SUPABASE_URL || mergedEnv.EXPO_PUBLIC_SUPABASE_URL || mergedEnv.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: mergedEnv.SUPABASE_ANON_KEY || mergedEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY || mergedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || mergedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: mergedEnv.SUPABASE_SERVICE_ROLE_KEY || '',
  PAYPAL_CLIENT_ID: mergedEnv.PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_SECRET: mergedEnv.PAYPAL_CLIENT_SECRET || '',
  ENABLE_LOCAL_FALLBACK: String(mergedEnv.ENABLE_LOCAL_FALLBACK ?? 'true').toLowerCase() !== 'false',
  allowedOrigins: String(mergedEnv.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean),
};

const publicSecretPatterns = [/SECRET/i, /SERVICE_ROLE/i, /PASSWORD/i, /POSTGRES/i, /JWT/i, /PRISMA/i];
const publicLeaks = Object.keys(publicEnv).filter((key) => publicSecretPatterns.some((pattern) => pattern.test(key)));

const checks = [
  ['dist exists', fs.existsSync(path.join(root, 'dist', 'index.html'))],
  ['vercel.json exists', fs.existsSync(path.join(root, 'vercel.json'))],
  ['production README exists', fs.existsSync(path.join(root, 'README_PRODUCTION.md'))],
  ['supabase production schema exists', fs.existsSync(path.join(root, 'supabase-production-schema.sql'))],
  ['public env has no private secret names', publicLeaks.length === 0],
  ['local fallback enabled', env.ENABLE_LOCAL_FALLBACK === true],
];

const capabilities = {
  supabase_public: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
  supabase_server: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  paypal: Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET),
  google_auth: Boolean(mergedEnv.GOOGLE_OAUTH_CLIENT_ID || mergedEnv.EXPO_PUBLIC_GOOGLE_CLIENT_ID || mergedEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
  allowed_origins: env.allowedOrigins.length > 0,
};

const productionReady = capabilities.supabase_public
  && capabilities.supabase_server
  && capabilities.paypal
  && capabilities.allowed_origins;

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}`);
  if (!ok) failed = true;
}

console.log(`mode=${productionReady ? 'production' : 'demo_or_partial'}`);
Object.entries(capabilities).forEach(([key, value]) => {
  console.log(`${key}=${value ? 'ready' : 'missing'}`);
});

if (publicLeaks.length) {
  console.log(`public_env_secret_like_keys=${publicLeaks.join(',')}`);
}

if (strict && !productionReady) {
  console.log('FAIL strict production readiness requires Supabase public/server, PayPal server credentials, and ALLOWED_ORIGINS');
  failed = true;
}

if (failed) {
  process.exitCode = 1;
}
