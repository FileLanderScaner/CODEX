import fs from 'node:fs';
import process from 'node:process';

function loadLocalEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnvFile('.env.rls');

const requiredEnv = [
  'ENVIRONMENT',
  'SUPABASE_STAGING_PROJECT_REF',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'RLS_NORMAL_EMAIL',
  'RLS_NORMAL_PASSWORD',
  'RLS_ADMIN_EMAIL',
  'RLS_ADMIN_PASSWORD',
  'RLS_INTERNAL_EMAIL',
  'RLS_INTERNAL_PASSWORD',
];

function getEnv(key) {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

const env = Object.fromEntries(requiredEnv.map((key) => [key, getEnv(key)]));

function getSupabaseProjectRef(url) {
  try {
    const host = new URL(url).host;
    const match = /^([a-z0-9-]+)\.supabase\.co$/i.exec(host);
    return match?.[1] || '';
  } catch {
    return '';
  }
}

function assertStagingOnly() {
  if (env.ENVIRONMENT !== 'staging') {
    console.error('Blocked: ENVIRONMENT must be exactly "staging" in .env.rls.');
    process.exit(1);
  }

  const projectRef = getSupabaseProjectRef(env.SUPABASE_URL);
  if (!projectRef) {
    console.error('Blocked: SUPABASE_URL must be a valid https://<project-ref>.supabase.co URL.');
    process.exit(1);
  }

  if (projectRef !== env.SUPABASE_STAGING_PROJECT_REF) {
    console.error('Blocked: SUPABASE_URL project ref does not match SUPABASE_STAGING_PROJECT_REF.');
    process.exit(1);
  }

  if (/prod|production|live/i.test(env.ENVIRONMENT) || /prod|production|live/i.test(env.SUPABASE_URL)) {
    console.error('Blocked: production-like marker detected in RLS smoke environment.');
    process.exit(1);
  }
}

if (/service_role/i.test(env.SUPABASE_ANON_KEY)) {
  console.error('The provided SUPABASE_ANON_KEY appears to be a service role key. Use the anon key only.');
  process.exit(1);
}

assertStagingOnly();

const defaultHeaders = {
  'Content-Type': 'application/json',
  apikey: env.SUPABASE_ANON_KEY,
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { response, body };
}

function summarizeError(response, body) {
  if (!response) return 'unknown error';
  const code = response.status;
  if (!body) return `status ${code}`;
  const message = body.msg || body.error || body.message || JSON.stringify(body);
  return `status ${code} - ${message}`;
}

async function signIn(email, password) {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`;
  const { response, body } = await fetchJson(url, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok || !body || !body.access_token) {
    throw new Error(summarizeError(response, body));
  }

  return body.access_token;
}

function decodeJwtPayload(accessToken) {
  const [, payload] = accessToken.split('.');
  if (!payload) return {};

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function getRoleClaim(accessToken) {
  try {
    const payload = decodeJwtPayload(accessToken);
    return payload.app_metadata?.role || 'missing';
  } catch {
    return 'unreadable';
  }
}

async function runSelect(accessToken) {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/agent_executions?select=id&limit=1`;
  const { response, body } = await fetchJson(url, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  return { response, body };
}

async function runInsert(accessToken, eventName) {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/agent_logs`;
  const payload = {
    agent_name: 'rls-agent-smoke',
    level: 'info',
    event: eventName,
    metadata: { verified: true },
    environment: 'staging',
  };

  const { response, body } = await fetchJson(url, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  return { response, body };
}

function formatResult(userType, operation, allowed, reason = '') {
  console.log(`${userType} | ${operation} | ${allowed ? 'allowed' : 'blocked'}${reason ? ` | ${reason}` : ''}`);
}

function booleanResult(allowed) {
  return allowed ? 'true' : 'false';
}

async function run() {
  const summary = {
    normalBlocked: false,
    adminAllowed: false,
    internalJobAllowed: false,
    roles: {
      normal: 'missing',
      admin: 'missing',
      internalJob: 'missing',
    },
  };

  try {
    const normalToken = await signIn(env.RLS_NORMAL_EMAIL, env.RLS_NORMAL_PASSWORD);
    summary.roles.normal = getRoleClaim(normalToken);
    const normalSelect = await runSelect(normalToken);

    if (!normalSelect.response.ok) {
      formatResult('normal', 'select agent_executions', false, summarizeError(normalSelect.response, normalSelect.body));
    } else {
      formatResult('normal', 'select agent_executions', true, `visible rows: ${normalSelect.body.length}`);
    }

    const normalInsert = await runInsert(normalToken, 'normal_user_should_fail');
    const normalInsertBlocked = !normalInsert.response.ok;
    if (normalInsertBlocked) {
      formatResult('normal', 'insert agent_logs', false, summarizeError(normalInsert.response, normalInsert.body));
    } else {
      formatResult('normal', 'insert agent_logs', true, 'unexpectedly succeeded');
    }

    summary.normalBlocked = normalInsertBlocked;
  } catch (error) {
    formatResult('normal', 'validation', false, error.message);
    summary.normalBlocked = true;
  }

  try {
    const adminToken = await signIn(env.RLS_ADMIN_EMAIL, env.RLS_ADMIN_PASSWORD);
    summary.roles.admin = getRoleClaim(adminToken);
    const adminInsert = await runInsert(adminToken, 'admin_rls_smoke_test');
    summary.adminAllowed = adminInsert.response.ok;
    formatResult('admin', 'insert agent_logs', summary.adminAllowed, summary.adminAllowed ? '' : summarizeError(adminInsert.response, adminInsert.body));
  } catch (error) {
    formatResult('admin', 'insert agent_logs', false, error.message);
    summary.adminAllowed = false;
  }

  try {
    const internalToken = await signIn(env.RLS_INTERNAL_EMAIL, env.RLS_INTERNAL_PASSWORD);
    summary.roles.internalJob = getRoleClaim(internalToken);
    const internalInsert = await runInsert(internalToken, 'internal_job_rls_smoke_test');
    summary.internalJobAllowed = internalInsert.response.ok;
    formatResult('internal_job', 'insert agent_logs', summary.internalJobAllowed, summary.internalJobAllowed ? '' : summarizeError(internalInsert.response, internalInsert.body));
  } catch (error) {
    formatResult('internal_job', 'insert agent_logs', false, error.message);
    summary.internalJobAllowed = false;
  }

  const rlsValidation = summary.normalBlocked && summary.adminAllowed && summary.internalJobAllowed;

  console.log('\nSUMMARY');
  console.log(`normal_blocked: ${booleanResult(summary.normalBlocked)}`);
  console.log(`admin_allowed: ${booleanResult(summary.adminAllowed)}`);
  console.log(`internal_job_allowed: ${booleanResult(summary.internalJobAllowed)}`);
  console.log(`normal_jwt_role: ${summary.roles.normal}`);
  console.log(`admin_jwt_role: ${summary.roles.admin}`);
  console.log(`internal_job_jwt_role: ${summary.roles.internalJob}`);
  console.log(`rls_validation: ${rlsValidation ? 'PASS' : 'FAIL'}`);

  process.exit(rlsValidation ? 0 : 1);
}

run().catch((error) => {
  console.error('Unexpected error:', error.message || error);
  process.exit(1);
});
