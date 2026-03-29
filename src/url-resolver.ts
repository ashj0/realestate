import { load } from 'cheerio';
import { fetchScrapflyContent } from './scrapfly.js';
import { slugifySegment } from './location.js';
import { normalizeWhitespace } from './utils.js';
import type { PropertyGrowthInput } from './types.js';

export interface ResolvedSiteUrl {
  url?: string;
  resolution: 'provided' | 'resolved-property' | 'fallback-suburb';
  searchUrl?: string;
  matchedCandidate?: string;
  reason?: string;
}

export interface ResolvedKnownUrls {
  realestate: ResolvedSiteUrl;
  domain: ResolvedSiteUrl;
  property: ResolvedSiteUrl;
}

interface CandidateLink {
  url: string;
  text: string;
}

function normalizeAddress(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildAddressSignals(input: PropertyGrowthInput) {
  const normalized = normalizeAddress(input.address);
  const parts = normalized.split(' ').filter(Boolean);
  const houseNumber = parts.find((part) => /^\d+[a-z]?$/.test(part)) ?? '';
  const streetParts = parts.filter((part) => part !== houseNumber);
  const suburb = normalizeAddress(input.suburb);

  return {
    normalized,
    houseNumber,
    streetParts,
    suburb,
  };
}

function scoreCandidate(candidate: CandidateLink, input: PropertyGrowthInput): number {
  const candidateText = normalizeAddress(`${candidate.url} ${candidate.text}`);
  const signals = buildAddressSignals(input);

  if (!candidateText) return -1;

  let score = 0;

  if (signals.normalized && candidateText.includes(signals.normalized)) score += 20;
  if (signals.houseNumber && candidateText.includes(signals.houseNumber)) score += 5;

  const matchedStreetParts = signals.streetParts.filter((part) => part.length >= 3 && candidateText.includes(part));
  score += matchedStreetParts.length * 2;

  if (signals.suburb && candidateText.includes(signals.suburb)) score += 3;

  if (candidate.url.endsWith('/property/') || /\/property\/?$/i.test(candidate.url)) score -= 20;

  const strongAddressMatch = Boolean(
    signals.houseNumber && matchedStreetParts.length >= 1 && candidateText.includes(signals.houseNumber)
  );

  return strongAddressMatch || candidateText.includes(signals.normalized) ? score : -1;
}

function uniqueCandidates(candidates: CandidateLink[]): CandidateLink[] {
  const seen = new Set<string>();
  const output: CandidateLink[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    output.push(candidate);
  }

  return output;
}

function extractMatchingUrl(content: string, baseUrl: string, input: PropertyGrowthInput, site: 'realestate' | 'domain' | 'property'): { url?: string; matchedCandidate?: string; reason: string } {
  const $ = load(content);
  const selectors = [
    'a[href*="realestate.com.au"]',
    'a[href*="domain.com.au"]',
    'a[href*="property.com.au"]',
    'a[href^="/"]',
    'a[href^="http"]'
  ];

  const rawCandidates: CandidateLink[] = [];
  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      try {
        const url = new URL(href, baseUrl).toString();
        const text = normalizeWhitespace($(element).text());
        rawCandidates.push({ url, text });
      } catch {
        // ignore invalid hrefs
      }
    });
  }

  const filtered = uniqueCandidates(rawCandidates).filter((candidate) => {
    if (site === 'realestate') return /realestate\.com\.au\/property\//i.test(candidate.url) && !/\/property\/?$/i.test(candidate.url);
    if (site === 'domain') return /domain\.com\.au\/property-profile\//i.test(candidate.url);
    return /property\.com\.au\//i.test(candidate.url) && /pid-|\/unit-|\/house-|\/apartment-/i.test(candidate.url);
  });

  const ranked = filtered
    .map((candidate) => ({ ...candidate, score: scoreCandidate(candidate, input) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return { reason: 'No confident property URL match found from provider search results' };
  }

  return {
    url: ranked[0].url,
    matchedCandidate: ranked[0].text || ranked[0].url,
    reason: `Resolved property URL from provider search (score ${ranked[0].score})`
  };
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
  const resolved: ResolvedKnownUrls = {
    realestate: input.knownUrls?.realestate
      ? { url: input.knownUrls.realestate, resolution: 'provided', reason: 'Using caller-provided property URL' }
      : { resolution: 'fallback-suburb' },
    domain: input.knownUrls?.domain
      ? { url: input.knownUrls.domain, resolution: 'provided', reason: 'Using caller-provided property URL' }
      : { resolution: 'fallback-suburb' },
    property: input.knownUrls?.property
      ? { url: input.knownUrls.property, resolution: 'provided', reason: 'Using caller-provided property URL' }
      : { resolution: 'fallback-suburb' },
  };

  await Promise.all([
    (async () => {
      if (resolved.realestate.url) return;
      const searchUrl = buildSearchUrl(input, 'realestate');
      const match = extractMatchingUrl(await fetchScrapflyContent(searchUrl, apiKey), searchUrl, input, 'realestate');
      resolved.realestate = match.url
        ? { url: match.url, resolution: 'resolved-property', searchUrl, matchedCandidate: match.matchedCandidate, reason: match.reason }
        : { resolution: 'fallback-suburb', searchUrl, reason: match.reason };
    })(),
    (async () => {
      if (resolved.domain.url) return;
      const searchUrl = buildSearchUrl(input, 'domain');
      const match = extractMatchingUrl(await fetchScrapflyContent(searchUrl, apiKey), searchUrl, input, 'domain');
      resolved.domain = match.url
        ? { url: match.url, resolution: 'resolved-property', searchUrl, matchedCandidate: match.matchedCandidate, reason: match.reason }
        : { resolution: 'fallback-suburb', searchUrl, reason: match.reason };
    })(),
    (async () => {
      if (resolved.property.url) return;
      const searchUrl = buildSearchUrl(input, 'property');
      const match = extractMatchingUrl(await fetchScrapflyContent(searchUrl, apiKey), searchUrl, input, 'property');
      resolved.property = match.url
        ? { url: match.url, resolution: 'resolved-property', searchUrl, matchedCandidate: match.matchedCandidate, reason: match.reason }
        : { resolution: 'fallback-suburb', searchUrl, reason: match.reason };
    })()
  ]);

  return resolved;
}
