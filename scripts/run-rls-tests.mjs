import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RLS_SQL_FILE = 'tests/rls/rls-policies.sql';
const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const WINDOWS_PSQL_CANDIDATES = [
  'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
];
const SENSITIVE_OUTPUT_PATTERNS = [
  /postgres(?:ql)?:\/\/[^\s"'`]+/gi,
  /db\.[a-z0-9-]+\.supabase\.co/gi,
  /[a-z0-9-]+(?:-[a-z0-9]+)*\.pooler\.supabase\.com/gi,
  /\(([0-9a-f]{1,4}:){2,}[0-9a-f]{1,4}\)/gi,
  /password=[^\s]+/gi,
  /PGPASSWORD=[^\s]+/gi,
];

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

function isPresent(value) {
  return Boolean(String(value || '').trim());
}

function parseDatabaseUrl(dbUrl) {
  try {
    return new URL(dbUrl);
  } catch {
    return null;
  }
}

function classifyRlsEnvironment(env = process.env) {
  const missing = [];
  const environment = env.ENVIRONMENT;
  const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL || '';

  if (!isPresent(environment)) missing.push('ENVIRONMENT');
  if (!isPresent(dbUrl)) missing.push('SUPABASE_DB_URL or DATABASE_URL');

  if (missing.length) {
    return { ok: false, code: 'BLOCKED_MISSING_ENV', missing };
  }

  if (!['staging', 'local'].includes(environment)) {
    return { ok: false, code: 'BLOCKED_UNSAFE_ENVIRONMENT', message: 'ENVIRONMENT must be staging or local.' };
  }

  if (/prod|production|live/i.test(environment) || /prod|production|live/i.test(dbUrl)) {
    return { ok: false, code: 'BLOCKED_PRODUCTION_MARKER', message: 'Production-like marker detected.' };
  }

  const parsed = parseDatabaseUrl(dbUrl);
  if (!parsed || !['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    return { ok: false, code: 'BLOCKED_INVALID_DB_URL', message: 'Database URL must be a PostgreSQL connection URL.' };
  }

  if (environment === 'local') {
    if (!LOCAL_DB_HOSTS.has(parsed.hostname)) {
      return { ok: false, code: 'BLOCKED_LOCAL_DB_HOST', message: 'Local RLS tests require a localhost database host.' };
    }
    return { ok: true, dbUrl, parsed, environment, connectionMode: 'local' };
  }

  if (!isPresent(env.SUPABASE_STAGING_PROJECT_REF)) {
    return { ok: false, code: 'BLOCKED_MISSING_ENV', missing: ['SUPABASE_STAGING_PROJECT_REF'] };
  }

  const connectionMode = classifySupabaseConnection(parsed, env.SUPABASE_STAGING_PROJECT_REF);
  if (connectionMode === 'pooler_unverified_user') {
    return { ok: false, code: 'BLOCKED_POOLER_USER_FORMAT', message: 'Pooler URLs must use user postgres.<PROJECT_REF>.' };
  }

  if (!dbUrl.includes(env.SUPABASE_STAGING_PROJECT_REF)) {
    return { ok: false, code: 'BLOCKED_STAGING_REF_MISMATCH', message: 'Database URL must include SUPABASE_STAGING_PROJECT_REF.' };
  }

  return {
    ok: true,
    dbUrl,
    parsed,
    environment,
    connectionMode,
  };
}

function classifySupabaseConnection(parsedUrl, projectRef) {
  if (parsedUrl.hostname === `db.${projectRef}.supabase.co`) return 'direct';
  if (parsedUrl.hostname.endsWith('.pooler.supabase.com') && parsedUrl.username.endsWith(`.${projectRef}`)) return 'session_pooler';
  if (parsedUrl.hostname.endsWith('.pooler.supabase.com')) return 'pooler_unverified_user';
  return 'unknown';
}

function reportBlocked(result) {
  if (result.missing?.length) {
    console.error(`${result.code}: missing ${result.missing.join(', ')}`);
    return;
  }
  console.error(`${result.code}: ${result.message}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function sanitizeOutput(value) {
  return SENSITIVE_OUTPUT_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, '[REDACTED]'),
    String(value || ''),
  );
}

function printSanitized(value, stream = process.stdout) {
  const output = sanitizeOutput(value);
  if (output) stream.write(output);
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function findPsqlCommand(env = process.env) {
  if (env.PSQL_PATH && commandExists(env.PSQL_PATH)) return env.PSQL_PATH;
  if (commandExists('psql')) return 'psql';
  if (process.platform === 'win32') {
    const candidate = WINDOWS_PSQL_CANDIDATES.find((value) => fs.existsSync(value) && commandExists(value));
    if (candidate) return candidate;
  }
  return '';
}

function psqlEnvFromUrl(parsedUrl, baseEnv = process.env) {
  return {
    ...baseEnv,
    PGHOST: parsedUrl.hostname,
    PGPORT: parsedUrl.port || '5432',
    PGDATABASE: decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, '') || 'postgres'),
    PGUSER: decodeURIComponent(parsedUrl.username || 'postgres'),
    PGPASSWORD: decodeURIComponent(parsedUrl.password || ''),
    PGSSLMODE: parsedUrl.searchParams.get('sslmode') || baseEnv.PGSSLMODE || 'require',
    PGCONNECT_TIMEOUT: baseEnv.PGCONNECT_TIMEOUT || '10',
  };
}

export function validateRlsTestEnvironment(env = process.env) {
  return classifyRlsEnvironment(env);
}

export function buildPsqlInvocation(dbUrl, baseEnv = process.env) {
  const parsed = parseDatabaseUrl(dbUrl);
  if (!parsed) throw new Error('Invalid database URL');
  return {
    command: findPsqlCommand(baseEnv) || 'psql',
    args: ['-v', 'ON_ERROR_STOP=1', '-f', RLS_SQL_FILE],
    env: psqlEnvFromUrl(parsed, baseEnv),
  };
}

export function getRlsConnectionAdvisory(validation) {
  if (validation.connectionMode === 'direct') {
    return 'RLS_DIRECT_HOST_DETECTED: direct Supabase database hosts require IPv6 support. If connection times out, replace SUPABASE_DB_URL with the Supabase Session Pooler URL.';
  }
  if (validation.connectionMode === 'session_pooler') {
    return 'RLS_SESSION_POOLER_DETECTED';
  }
  if (validation.connectionMode === 'pooler_unverified_user') {
    return 'RLS_POOLER_USER_CHECK: pooler URLs should use user postgres.<PROJECT_REF>.';
  }
  return '';
}

export function getPsqlFailureDiagnostic(result, validation) {
  const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (/timed out|timeout|tiempo de espera agotado|could not connect|connection refused|fall[o�ó] la conexi[o�ó]n|could not translate host name/i.test(combined)) {
    if (validation.connectionMode === 'direct') {
      return 'BLOCKED_SUPABASE_DIRECT_CONNECTIVITY: psql is installed, but the direct Supabase host timed out. Use SUPABASE_DB_URL with the Session Pooler connection string from Supabase Dashboard > Connect > Session pooler.';
    }
    return 'BLOCKED_SUPABASE_CONNECTIVITY: psql is installed, but the database connection failed. Verify SUPABASE_DB_URL host, port, sslmode=require, network/firewall, and credentials.';
  }
  if (/password authentication failed|authentication failed|no password supplied/i.test(combined)) {
    return 'BLOCKED_SUPABASE_AUTH: psql reached the database endpoint but authentication failed. Verify SUPABASE_DB_URL username and password without printing them.';
  }
  if (/SSL connection is required|sslmode/i.test(combined)) {
    return 'BLOCKED_SUPABASE_SSL: add sslmode=require to SUPABASE_DB_URL.';
  }
  return 'BLOCKED_RLS_SQL: psql exited with an error. Review the sanitized output above.';
}

function runPsql(invocation, validation) {
  const result = spawnSync(invocation.command, invocation.args, {
    encoding: 'utf8',
    shell: false,
    env: invocation.env,
  });
  printSanitized(result.stdout, process.stdout);
  printSanitized(result.stderr, process.stderr);
  if (result.status !== 0) {
    console.error(getPsqlFailureDiagnostic(result, validation));
    process.exit(result.status || 1);
  }
}

export function main() {
  loadLocalEnvFile('.env.rls');

  const validation = validateRlsTestEnvironment();
  if (!validation.ok) {
    reportBlocked(validation);
    process.exit(1);
  }

  if (process.env.RESET_SUPABASE_DB === 'true') {
    if (validation.environment !== 'local') {
      console.error('BLOCKED_REMOTE_RESET: RESET_SUPABASE_DB=true is only allowed with ENVIRONMENT=local.');
      process.exit(1);
    }
    run('supabase', ['db', 'reset']);
  }

  const psqlCommand = findPsqlCommand();
  if (!psqlCommand) {
    console.error('BLOCKED_LOCAL_PSQL: psql not found. Install PostgreSQL client, add psql to PATH, or set PSQL_PATH to psql.exe.');
    process.exit(1);
  }

  const advisory = getRlsConnectionAdvisory(validation);
  if (advisory) console.error(advisory);

  const invocation = buildPsqlInvocation(validation.dbUrl);
  invocation.command = psqlCommand;
  runPsql(invocation, validation);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
