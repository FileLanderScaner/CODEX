import path from 'node:path';
import fs from 'node:fs';
import { loadValidationEnv, printValidation, validateProductionEnv } from './validate-production-env.mjs';

const root = process.cwd();
const strict = process.argv.includes('--strict');

const checks = [
  ['dist exists', fs.existsSync(path.join(root, 'dist', 'index.html'))],
  ['vercel.json exists', fs.existsSync(path.join(root, 'vercel.json'))],
  ['production README exists', fs.existsSync(path.join(root, 'README_PRODUCTION.md'))],
  ['supabase production schema exists', fs.existsSync(path.join(root, 'supabase-production-schema.sql'))],
  ['public env has no private secret names', validateProductionEnv(loadValidationEnv(root)).exposed.length === 0],
  ['local fallback enabled', String(loadValidationEnv(root).ENABLE_LOCAL_FALLBACK ?? 'true').toLowerCase() !== 'false'],
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}`);
  if (!ok) failed = true;
}

const validation = validateProductionEnv(loadValidationEnv(root));
printValidation(validation);

if (strict && validation.mode !== 'production_ready') {
  console.log('FAIL strict production readiness requires production_ready mode');
  failed = true;
}

if (failed) {
  process.exitCode = 1;
}
