import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { applyInputDefaults } from './defaults.js';
import { estimatePropertyGrowth } from './service.js';
import { validateInput } from './validation.js';

async function main() {
  const filePath = process.argv[2] ?? path.resolve('src/sample-input.json');
  const raw = await fs.readFile(filePath, 'utf8');
  const input = applyInputDefaults(JSON.parse(raw));
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
