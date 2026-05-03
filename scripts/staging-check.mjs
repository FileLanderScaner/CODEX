import { loadValidationEnv, printValidation, validateProductionEnv } from './validate-production-env.mjs';

const env = loadValidationEnv();
const result = validateProductionEnv(env);
const failures = [];

printValidation(result);

if (result.mode !== 'staging_ready') {
  failures.push(`Expected mode=staging_ready, got mode=${result.mode}.`);
}

if (result.exposed.length > 0) {
  failures.push(`Dangerously exposed public secrets: ${result.exposed.join(', ')}.`);
}

if (String(env.ENABLE_AI_LEVEL4_OVERRIDE).toLowerCase() === 'true') {
  failures.push('ENABLE_AI_LEVEL4_OVERRIDE=true is blocked for staging.');
}

if (env.AI_AUTONOMY_LEVEL === 'LEVEL_4_CONTROLLED_EXECUTION') {
  failures.push('AI_AUTONOMY_LEVEL=LEVEL_4_CONTROLLED_EXECUTION is blocked for staging.');
}

if (String(env.PAYPAL_ENV).toLowerCase() === 'live') {
  failures.push('PAYPAL_ENV=live is blocked for staging; use PAYPAL_ENV=sandbox.');
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exitCode = 1;
}
