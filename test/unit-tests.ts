import { parseLocationParts, buildSuburbUrls, slugifySegment } from '../src/location.js';
import { parseNumber, parsePercent } from '../src/utils.js';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  const parsed = parseLocationParts({ suburb: 'Rivervale WA 6103', state: '', postCode: '' });
  assert(parsed.suburb === 'Rivervale', 'parseLocationParts should extract suburb');
  assert(parsed.state === 'wa', 'parseLocationParts should extract lowercase state');
  assert(parsed.postCode === '6103', 'parseLocationParts should extract postcode');

  const direct = parseLocationParts({ suburb: 'Bondi', state: 'NSW', postCode: '2026' });
  assert(direct.suburb === 'Bondi', 'parseLocationParts should preserve split suburb');
  assert(direct.state === 'nsw', 'parseLocationParts should normalize split state');
  assert(direct.postCode === '2026', 'parseLocationParts should preserve split postcode');

  assert(slugifySegment('Port Macquarie') === 'port-macquarie', 'slugifySegment should hyphenate spaces');
  assert(slugifySegment('Surfers Paradise!') === 'surfers-paradise', 'slugifySegment should strip punctuation');

  const urls = buildSuburbUrls({ suburb: 'Port Macquarie', state: 'NSW', postCode: '2444' });
  assert(urls.realestate === 'https://www.realestate.com.au/nsw/port-macquarie-2444/', 'realestate suburb URL mismatch');
  assert(urls.property === 'https://www.property.com.au/nsw/port-macquarie-2444/', 'property suburb URL mismatch');
  assert(urls.domain === 'https://www.domain.com.au/suburb-profile/port-macquarie-nsw-2444', 'domain suburb URL mismatch');

  assert(parseNumber('$1.21m') === 1210000, 'parseNumber should parse million shorthand');
  assert(parseNumber('$1.4m') === 1400000, 'parseNumber should parse decimal million shorthand');
  assert(parseNumber('$950k') === 950000, 'parseNumber should parse thousand shorthand');
  assert(parseNumber('$915,000') === 915000, 'parseNumber should parse comma-separated integers');

  assert(parsePercent('15.78% YoY') === 15.78, 'parsePercent should parse decimal percentages');
  assert(parsePercent('Growth: -2.4%') === -2.4, 'parsePercent should parse negative percentages');

  console.log('✓ local unit tests passed');
}

run();
