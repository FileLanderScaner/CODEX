import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

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

function requireStagingDbUrl() {
  if (process.env.ENVIRONMENT !== 'staging') {
    console.error('ENVIRONMENT=staging is required to run RLS tests.');
    process.exit(1);
  }

  if (!process.env.SUPABASE_STAGING_PROJECT_REF) {
    console.error('SUPABASE_STAGING_PROJECT_REF is required to run RLS tests.');
    process.exit(1);
  }

  if (!process.env.SUPABASE_DB_URL) {
    console.error('SUPABASE_DB_URL is required to run RLS tests.');
    process.exit(1);
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  const projectRef = process.env.SUPABASE_STAGING_PROJECT_REF;
  if (!dbUrl.includes(projectRef)) {
    console.error('SUPABASE_DB_URL must include SUPABASE_STAGING_PROJECT_REF.');
    process.exit(1);
  }

  if (/prod|production|live/i.test(process.env.ENVIRONMENT) || /prod|production|live/i.test(dbUrl)) {
    console.error('Production-like marker detected in RLS DB URL environment.');
    process.exit(1);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (process.env.RESET_SUPABASE_DB === 'true') {
  run('supabase', ['db', 'reset']);
}

requireStagingDbUrl();

run('psql', [process.env.SUPABASE_DB_URL, '-v', 'ON_ERROR_STOP=1', '-f', 'tests/rls/rls-policies.sql']);
