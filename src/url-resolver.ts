import { load } from 'cheerio';
import { fetchScrapflyContent } from './scrapfly.js';
import { slugifySegment } from './location.js';
import { normalizeWhitespace } from './utils.js';
import type { PropertyGrowthInput } from './types.js';

interface ResolvedKnownUrls {
  realestate?: string;
  domain?: string;
  property?: string;
}

function normalizeAddress(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreCandidate(candidateUrl: string, address: string, suburb: string): number {
  const haystack = normalizeAddress(`${candidateUrl} ${address} ${suburb}`);
  const target = normalizeAddress(address);
  const suburbTarget = normalizeAddress(suburb);

  let score = 0;
  if (haystack.includes(target)) score += 10;

  const targetParts = target.split(' ').filter(Boolean);
  for (const part of targetParts) {
    if (part.length >= 2 && haystack.includes(part)) score += 1;
  }

  if (suburbTarget && haystack.includes(suburbTarget)) score += 2;
  return score;
}

function uniqueHttpUrls(urls: Array<string | undefined | null>): string[] {
  return Array.from(new Set(urls.filter((value): value is string => Boolean(value && /^https?:\/\//i.test(value)))));
}

function extractMatchingUrl(content: string, baseUrl: string, input: PropertyGrowthInput, site: 'realestate' | 'domain' | 'property'): string | undefined {
  const $ = load(content);
  const address = input.address;
  const suburb = input.suburb;
  const selectors = [
    'a[href*="realestate.com.au"]',
    'a[href*="domain.com.au"]',
    'a[href*="property.com.au"]',
    'a[href^="/"]',
    'a[href^="http"]'
  ];

  const rawUrls: string[] = [];
  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      try {
        rawUrls.push(new URL(href, baseUrl).toString());
      } catch {
        // ignore invalid hrefs
      }
    });
  }

  const filtered = uniqueHttpUrls(rawUrls).filter((url) => {
    if (site === 'realestate') return /realestate\.com\.au\/property\//i.test(url);
    if (site === 'domain') return /domain\.com\.au\/property-profile\//i.test(url);
    return /property\.com\.au\//i.test(url) && /pid-|\/unit-|\/house-/i.test(url);
  });

  const ranked = filtered
    .map((url) => ({ url, score: scoreCandidate(url, address, suburb) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].url : undefined;
}

function buildSearchUrl(input: PropertyGrowthInput, site: 'realestate' | 'domain' | 'property'): string {
  const query = encodeURIComponent(`${input.address} ${input.suburb} ${input.state ?? ''} ${input.postCode ?? ''}`.trim());

  if (site === 'realestate') {
    return `https://www.realestate.com.au/buy/in-${slugifySegment(input.suburb)}%2c+${String(input.state ?? '').toLowerCase()}+${input.postCode}/list-1?keywords=${query}`;
  }

  if (site === 'domain') {
    return `https://www.domain.com.au/sale/${String(input.state ?? '').toLowerCase()}/${slugifySegment(input.suburb)}-${input.postCode}/?q=${query}`;
  }

  return `https://www.property.com.au/search/?q=${query}`;
}

export async function resolveKnownUrls(input: PropertyGrowthInput, apiKey: string): Promise<ResolvedKnownUrls> {
  const resolved: ResolvedKnownUrls = { ...input.knownUrls };

  await Promise.all([
    (async () => {
      if (resolved.realestate) return;
      const searchUrl = buildSearchUrl(input, 'realestate');
      const content = await fetchScrapflyContent(searchUrl, apiKey);
      resolved.realestate = extractMatchingUrl(content, searchUrl, input, 'realestate');
    })(),
    (async () => {
      if (resolved.domain) return;
      const searchUrl = buildSearchUrl(input, 'domain');
      const content = await fetchScrapflyContent(searchUrl, apiKey);
      resolved.domain = extractMatchingUrl(content, searchUrl, input, 'domain');
    })(),
    (async () => {
      if (resolved.property) return;
      const searchUrl = buildSearchUrl(input, 'property');
      const content = await fetchScrapflyContent(searchUrl, apiKey);
      resolved.property = extractMatchingUrl(content, searchUrl, input, 'property');
    })()
  ]);

  return resolved;
}
