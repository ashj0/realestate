import 'dotenv/config';
import { estimatePropertyGrowth } from './service.js';
import { validateInput, withInputDefaults } from './validation.js';

async function main() {
  const rawArg = process.argv[2];
  if (!rawArg) {
    console.error('Usage: npm run cli -- "{...json input...}"');
    process.exit(1);
  }

  const input = withInputDefaults(JSON.parse(rawArg));
  const validation = validateInput(input);
  if (!validation.valid) {
    console.error(JSON.stringify({ errors: validation.errors }, null, 2));
    process.exit(1);
  }

  const apiKey = process.env.SCRAPFLY_API_KEY;
  if (!apiKey) {
    console.error(JSON.stringify({ errors: ['SCRAPFLY_API_KEY is not set'] }, null, 2));
    process.exit(1);
  }

  const result = await estimatePropertyGrowth(input, apiKey);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ errors: [error instanceof Error ? error.message : 'Unknown error'] }, null, 2));
  process.exit(1);
});
