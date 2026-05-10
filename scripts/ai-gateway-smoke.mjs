import { generateText } from 'ai';

function hasGatewayAuth() {
  return Boolean(process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY);
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
    .replace(/vck_[A-Za-z0-9._-]+/g, '[REDACTED_VERCEL_TOKEN]')
    .replace(/vercel_[A-Za-z0-9._-]+/g, '[REDACTED_VERCEL_TOKEN]')
    .replace(/sk-[A-Za-z0-9._-]+/g, '[REDACTED_API_KEY]');
}

if (!hasGatewayAuth()) {
  console.error('BLOCKED_MISSING_GATEWAY_AUTH: VERCEL_OIDC_TOKEN or AI_GATEWAY_API_KEY is required.');
  process.exit(1);
}

if (String(process.env.AI_GATEWAY_SMOKE_PROMPT_ENABLED || '').toLowerCase() !== 'true') {
  console.error('BLOCKED_SMOKE_PROMPT_DISABLED: set AI_GATEWAY_SMOKE_PROMPT_ENABLED=true for an explicit paid Gateway smoke.');
  process.exit(1);
}

try {
  const result = await generateText({
    model: process.env.AI_GATEWAY_MODEL || 'openai/gpt-5.5',
    prompt: 'Explain quantum computing in two simple sentences.',
    maxOutputTokens: Number(process.env.AI_GATEWAY_MAX_OUTPUT_TOKENS || 600),
  });

  process.stdout.write(`${result.text}\nAI_GATEWAY_SMOKE_PASS\n`);
} catch (error) {
  console.error('AI_GATEWAY_SMOKE_FAIL:', safeErrorMessage(error));
  process.exit(1);
}
