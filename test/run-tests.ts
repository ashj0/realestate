import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { applyInputDefaults } from '../src/defaults.js';
import { buildSuburbUrls } from '../src/location.js';
import { estimatePropertyGrowth } from '../src/service.js';
import { validateInput } from '../src/validation.js';

interface Fixture {
  name: string;
  input: Record<string, unknown>;
  assertions?: {
    expectSites?: string[];
    expectConfidence?: string[];
    requireComparables?: boolean;
    requireDomainEstimateRange?: boolean;
    expectGeneratedUrls?: {
      realestate: string;
      domain: string;
      property: string;
    };
    note?: string;
  };
}

async function loadFixtures(): Promise<Fixture[]> {
  const fixturesDir = path.resolve('test/fixtures');
  const files = (await fs.readdir(fixturesDir)).filter((file) => file.endsWith('.json')).sort();
  return Promise.all(files.map(async (file) => JSON.parse(await fs.readFile(path.join(fixturesDir, file), 'utf8')) as Fixture));
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  const fixtures = await loadFixtures();
  const apiKey = process.env.SCRAPFLY_API_KEY;

  for (const fixture of fixtures) {
    const input = applyInputDefaults(fixture.input);
    const validation = validateInput(input);
    assert(validation.valid, `[${fixture.name}] input validation failed: ${(validation as { errors?: string[] }).errors?.join('; ') ?? 'unknown error'}`);

    if (fixture.assertions?.expectGeneratedUrls) {
      const urls = buildSuburbUrls(input);
      assert(urls.realestate === fixture.assertions.expectGeneratedUrls.realestate, `[${fixture.name}] realestate fallback URL mismatch`);
      assert(urls.domain === fixture.assertions.expectGeneratedUrls.domain, `[${fixture.name}] domain fallback URL mismatch`);
      assert(urls.property === fixture.assertions.expectGeneratedUrls.property, `[${fixture.name}] property fallback URL mismatch`);
      console.log(`✓ ${fixture.name} generated suburb URLs`);
      continue;
    }

    if (fixture.assertions?.note) {
      console.log(`- ${fixture.name}: ${fixture.assertions.note}`);
      continue;
    }

    assert(apiKey, `[${fixture.name}] SCRAPFLY_API_KEY is required for live tests`);
    const result = await estimatePropertyGrowth(input, apiKey!);

    if (fixture.assertions?.expectSites) {
      for (const site of fixture.assertions.expectSites) {
        assert(result.result.sitesUsed.includes(site as any), `[${fixture.name}] expected site ${site} in sitesUsed`);
      }
    }

    if (fixture.assertions?.expectConfidence) {
      assert(fixture.assertions.expectConfidence.includes(result.confidence), `[${fixture.name}] unexpected confidence ${result.confidence}`);
    }

    if (fixture.assertions?.requireComparables) {
      assert(result.selectedComparables.length > 0, `[${fixture.name}] expected selected comparables`);
    }

    if (fixture.assertions?.requireDomainEstimateRange) {
      const domain = result.siteEstimates.domain_com_au.propertyEstimateRange;
      assert(domain.low !== null && domain.mid !== null && domain.high !== null, `[${fixture.name}] expected complete domain estimate range`);
    }

    console.log(`✓ ${fixture.name} live assertions passed`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
