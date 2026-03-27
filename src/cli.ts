import 'dotenv/config';
import { applyInputDefaults } from './defaults.js';
import { estimatePropertyGrowth } from './service.js';
import { validateInput } from './validation.js';

async function main() {
  const rawArg = process.argv[2];
  if (!rawArg) {
    console.error('Usage: npm run cli -- "{...json input...}"');
    process.exit(1);
  }

  const input = applyInputDefaults(JSON.parse(rawArg));
  const validation = validateInput(input);
  if (!validation.valid) {
    console.error(JSON.stringify({ errors: validation.errors }, null, 2));
    process.exit(1);
  }

  const proxyUrl = process.env.APIFY_PROXY_URL;
  if (!proxyUrl) {
    console.error(JSON.stringify({ errors: ['APIFY_PROXY_URL is not set'] }, null, 2));
    process.exit(1);
  }

  const result = await estimatePropertyGrowth(input, proxyUrl);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ errors: [error instanceof Error ? error.message : 'Unknown error'] }, null, 2));
  process.exit(1);
});
