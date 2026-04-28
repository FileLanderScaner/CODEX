import { spawnSync } from 'node:child_process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (process.env.RESET_SUPABASE_DB === 'true') {
  run('supabase', ['db', 'reset']);
}

if (!process.env.SUPABASE_DB_URL) {
  console.error('SUPABASE_DB_URL is required to run RLS tests.');
  process.exit(1);
}

run('psql', [process.env.SUPABASE_DB_URL, '-v', 'ON_ERROR_STOP=1', '-f', 'tests/rls/rls-policies.sql']);
