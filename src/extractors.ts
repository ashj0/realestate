import { load } from 'cheerio';
import type { ComparableRecord, SiteEstimate, SiteLabel, SoldHistoryRecord } from './types.js';
import { containsUnitContext, normalizeWhitespace, parseNumber, parsePercent } from './utils.js';

function emptyEstimate(label: SiteLabel, sourceUrl: string | null): SiteEstimate {
  return {
    label,
    suburbGrowthPercent: null,
    medianPrice: null,
    medianPricePeriod: null,
    propertyEstimateRange: { low: null, mid: null, high: null },
    estimateAccuracy: null,
    estimateUpdatedAt: null,
    propertyTypeMatched: false,
    heroImageUrl: null,
    comparables: [],
    soldHistory: [],
    sourceUrl,
    notes: []
  };
}

function textFromSelector($: ReturnType<typeof load>, selectors: string[]): string | null {
  for (const selector of selectors) {
    const value = normalizeWhitespace($(selector).first().text());
    if (value) return value;
  }
  return null;
}

function attrFromSelector($: ReturnType<typeof load>, selectors: string[], attr: string): string | null {
  for (const selector of selectors) {
    const value = $(selector).first().attr(attr);
    if (value && normalizeWhitespace(value)) return normalizeWhitespace(value);
  }
  return null;
}

function textsFromSelector($: ReturnType<typeof load>, selectors: string[]): string[] {
  const values: string[] = [];

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const value = normalizeWhitespace($(element).text());
      if (value) values.push(value);
    });
  }

  return values;
}

function firstParsedPercent(values: Array<string | null | undefined>): number | null {
  for (const value of values) {
    const parsed = parsePercent(value);
    if (typeof parsed === 'number' && Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function extractSoldHistoryFromText(text: string, source: SiteLabel, sourceUrl: string | null): SoldHistoryRecord[] {
  const records: SoldHistoryRecord[] = [];
  const pattern = /(\b(?:\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[a-zA-Z]*\s+\d{4})\b)[^$]{0,80}(\$[\d,]+)/g;
  for (const match of text.matchAll(pattern)) {
    records.push({
      date: normalizeWhitespace(match[1]),
      price: parseNumber(match[2]),
      source,
      sourceUrl
    });
    if (records.length >= 10) break;
  }
  return records;
}

function soldHistoryToComparables(history: SoldHistoryRecord[], address: string, source: SiteLabel, sourceUrl: string | null): ComparableRecord[] {
  return history.slice(0, 3).map((record) => ({
    address,
    saleDate: record.date ?? null,
    salePrice: typeof record.price === 'number' ? record.price : null,
    source,
    sourceUrl
  } as unknown as ComparableRecord));
}

function rollingTwelveMonthPeriod(): string {
  return '12 months';
}

function findArgonautScript(content: string): string | null {
  const match = content.match(/window\.ArgonautExchange\s*=\s*(\{[\s\S]*?\});/);
  return match?.[1] ?? null;
}

function collectNestedObjects(value: unknown, output: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!value) return output;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        collectNestedObjects(JSON.parse(trimmed), output);
      } catch {
        // ignore non-JSON strings
      }
    }
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectNestedObjects(item, output);
    return output;
  }

  if (typeof value === 'object') {
    output.push(value as Record<string, unknown>);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectNestedObjects(nested, output);
    }
  }

  return output;
}

function firstString(value: unknown, seen = new Set<unknown>()): string | null {
  if (value == null || seen.has(value)) return null;
  if (typeof value === 'string') {
    const normalized = normalizeWhitespace(value);
    return normalized || null;
  }

  if (typeof value !== 'object') return null;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item, seen);
      if (found) return found;
    }
    return null;
  }

  for (const nested of Object.values(value as Record<string, unknown>)) {
    const found = firstString(nested, seen);
    if (found) return found;
  }

  return null;
}

function collectAddressLikeStrings(value: unknown, output = new Set<string>()): Set<string> {
  if (value == null) return output;

  if (typeof value === 'string') {
    const normalized = normalizeWhitespace(value);
    if (/\b(?:street|st|road|rd|avenue|ave|drive|dr|parade|pde|place|pl|court|ct|crescent|cres|lane|ln|terrace|tce|way|close|cct|boulevard|blvd)\b/i.test(normalized)) {
      output.add(normalized);
    }
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectAddressLikeStrings(item, output);
    return output;
  }

  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectAddressLikeStrings(nested, output);
    }
  }

  return output;
}

function normalizeAddressForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(street)\b/g, 'st')
    .replace(/\b(road)\b/g, 'rd')
    .replace(/\b(parade)\b/g, 'pde')
    .replace(/\b(avenue)\b/g, 'ave')
    .replace(/\b(drive)\b/g, 'dr')
    .replace(/\b(place)\b/g, 'pl')
    .replace(/\b(court)\b/g, 'ct')
    .replace(/\b(terrace)\b/g, 'tce')
    .replace(/\s+/g, ' ')
    .trim();
}

function addressesMatch(candidate: string, target: string): boolean {
  const candidateNorm = normalizeAddressForComparison(candidate);
  const targetNorm = normalizeAddressForComparison(target);

  if (!candidateNorm || !targetNorm) return false;
  return candidateNorm.includes(targetNorm) || targetNorm.includes(candidateNorm);
}

function parseRealestateArgonaut(content: string, targetAddress: string): {
  propertyType: string | null;
  heroImageUrl: string | null;
  propertyComUrl: string | null;
  soldHistory: SoldHistoryRecord[];
  comparables: ComparableRecord[];
  notes: string[];
} | null {
  const script = findArgonautScript(content);
  if (!script) return null;

  try {
    const exchange = JSON.parse(script) as Record<string, unknown>;
    const nestedObjects = collectNestedObjects(exchange);
    const notes: string[] = ['Parsed ArgonautExchange structured data'];

    let propertyType: string | null = null;
    let heroImageUrl: string | null = null;
    let propertyComUrl: string | null = null;
    const soldHistory: SoldHistoryRecord[] = [];
    const comparables: ComparableRecord[] = [];
    const seenHistory = new Set<string>();
    const seenComparables = new Set<string>();

    for (const node of nestedObjects) {
      if (!propertyType && 'propertyType' in node) {
        const candidate = firstString((node as Record<string, unknown>).propertyType);
        if (candidate) propertyType = candidate;
      }
      if (!heroImageUrl) {
        const imageCandidate = firstString((node as Record<string, unknown>).heroImageUrl)
          ?? firstString((node as Record<string, unknown>).mainImage)
          ?? firstString((node as Record<string, unknown>).image)
          ?? firstString((node as Record<string, unknown>).images);
        if (imageCandidate && /^https?:\/\//i.test(imageCandidate) && /\.(jpg|jpeg|png|webp)/i.test(imageCandidate)) {
          heroImageUrl = imageCandidate.replace('{width}', '800').replace('{height}', '600');
        }
      }
      if (!propertyComUrl) {
        const hrefCandidate = firstString((node as Record<string, unknown>).href)
          ?? firstString((node as Record<string, unknown>).url)
          ?? firstString((node as Record<string, unknown>).link);
        if (hrefCandidate && /property\.com\.au/i.test(hrefCandidate)) {
          propertyComUrl = hrefCandidate.replace(/\\u002F/g, '/');
        }
      }

      const addressCandidates = Array.from(collectAddressLikeStrings(node));
      const matchingAddress = addressCandidates.find((candidate) => addressesMatch(candidate, targetAddress)) ?? null;
      const nonTargetAddress = addressCandidates.find((candidate) => !addressesMatch(candidate, targetAddress)) ?? null;

      const keys = Object.keys(node);
      const dateKey = keys.find((key) => /date/i.test(key));
      const priceKey = keys.find((key) => /price/i.test(key));

      if (dateKey && priceKey) {
        const date = firstString(node[dateKey]);
        const price = parseNumber(firstString(node[priceKey]));

        if (matchingAddress && (date || price !== null)) {
          const key = `${matchingAddress}|${date ?? ''}|${price ?? ''}`;
          if (!seenHistory.has(key)) {
            seenHistory.add(key);
            soldHistory.push({
              date,
              price,
              source: 'realestate.com.au',
              sourceUrl: null
            });
          }
        }

        if (nonTargetAddress && price !== null) {
          const key = `${nonTargetAddress}|${date ?? ''}|${price}`;
          if (!seenComparables.has(key)) {
            seenComparables.add(key);
            comparables.push({
              address: nonTargetAddress,
              saleDate: date,
              salePrice: price,
              source: 'realestate.com.au',
              sourceUrl: null
            });
          }
        }
      }
    }

    if (!soldHistory.length) {
      notes.push('No address-linked sold history found in Argonaut data');
    }
    if (!comparables.length) {
      notes.push('No address-linked comparables found in Argonaut data');
    }

    return {
      propertyType,
      heroImageUrl,
      propertyComUrl,
      soldHistory,
      comparables,
      notes
    };
  } catch {
    return null;
  }
}

export function extractRealestatePropertyComUrl(content: string, address: string): string | null {
  return parseRealestateArgonaut(content, address)?.propertyComUrl ?? null;
}

export function extractRealestate(content: string, sourceUrl: string | null, address: string): SiteEstimate {
  const estimate = emptyEstimate('realestate.com.au', sourceUrl);
  if (!content) return estimate;

  const $ = load(content);
  const bodyText = normalizeWhitespace($.root().text());
  const argonaut = parseRealestateArgonaut(content, address);

  const growthAttr = attrFromSelector($, ['[data-testid="growth-percentage"]'], 'growth');
  const growthText = textFromSelector($, ['[data-testid="growth-percentage"]', '[class*="MedianPriceGrowth__GrowthValue"]']);
  const medianText = textFromSelector($, ['[data-testid="median-price-display"]']);
  const updatedText = bodyText.match(/(?:Updated|Last updated)[:\s-]+([A-Z][a-z]{2,8}\s+\d{4})/i)?.[1] ?? null;

  estimate.suburbGrowthPercent = parsePercent(growthAttr ?? growthText);
  estimate.medianPrice = parseNumber(medianText);
  estimate.medianPricePeriod = rollingTwelveMonthPeriod();
  estimate.estimateUpdatedAt = updatedText ? normalizeWhitespace(updatedText) : null;

  estimate.heroImageUrl = argonaut?.heroImageUrl ?? null;
  const argonautPropertyType = argonaut?.propertyType?.toLowerCase() ?? null;
  estimate.propertyTypeMatched =
    argonautPropertyType === 'unit' ||
    argonautPropertyType === 'apartment' ||
    containsUnitContext(bodyText) ||
    /\/property\/unit-/i.test(sourceUrl ?? '');

  estimate.soldHistory = argonaut?.soldHistory?.length
    ? argonaut.soldHistory.slice(0, 10).map((item) => ({ ...item, sourceUrl }))
    : [];
  estimate.comparables = argonaut?.comparables?.length
    ? argonaut.comparables.slice(0, 3).map((item) => ({ ...item, sourceUrl }))
    : [];

  if (estimate.medianPrice !== null) {
    estimate.notes.push(`Unit median: $${estimate.medianPrice.toLocaleString('en-AU')}`);
  }
  if (estimate.suburbGrowthPercent !== null) {
    estimate.notes.push(`Growth: ${estimate.suburbGrowthPercent}% YoY`);
  }
  if (argonaut?.notes?.length) {
    estimate.notes.push(...argonaut.notes);
  }

  return estimate;
}

export function extractDomain(content: string, sourceUrl: string | null, address: string): SiteEstimate {
  const estimate = emptyEstimate('domain.com.au', sourceUrl);
  if (!content) return estimate;

  const $ = load(content);
  const bodyText = normalizeWhitespace($.root().text());
  const estimateRangeText = textFromSelector($, ['div[aria-label="Estimate Range"]']);
  const estimateTitle = textFromSelector($, ['[aria-label="Estimate Range"]']);
  const combinedEstimate = normalizeWhitespace([estimateRangeText, estimateTitle].filter(Boolean).join(' '));
  const lowText = combinedEstimate.match(/Low\s*\$?([\d.,]+\s*[mk]?)/i)?.[1] ?? null;
  const midText = combinedEstimate.match(/Mid\s*\$?([\d.,]+\s*[mk]?)/i)?.[1] ?? null;
  const highText = combinedEstimate.match(/High\s*\$?([\d.,]+\s*[mk]?)/i)?.[1] ?? null;

  estimate.propertyEstimateRange.low = parseNumber(lowText);
  estimate.propertyEstimateRange.mid = parseNumber(midText);
  estimate.propertyEstimateRange.high = parseNumber(highText);
  estimate.estimateAccuracy = textFromSelector($, ['[aria-label="Estimate Range"] + *', 'body'])?.match(/(High accuracy|Medium accuracy|Low accuracy)/i)?.[1] ?? null;
  estimate.estimateUpdatedAt = bodyText.match(/(?:Updated|Last updated)[:\s-]+([A-Z][a-z]{2,8}\s+\d{4}|\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
  estimate.propertyTypeMatched = containsUnitContext(bodyText) || /property-profile/i.test(sourceUrl ?? '');
  estimate.soldHistory = extractSoldHistoryFromText(bodyText, 'domain.com.au', sourceUrl);
  estimate.comparables = soldHistoryToComparables(estimate.soldHistory, address, 'domain.com.au', sourceUrl);

  if (combinedEstimate) {
    estimate.notes.push(combinedEstimate);
  }

  return estimate;
}

export function extractProperty(content: string, sourceUrl: string | null, address: string): SiteEstimate {
  const estimate = emptyEstimate('property.com.au', sourceUrl);
  if (!content) return estimate;

  const $ = load(content);
  const bodyText = normalizeWhitespace($.root().text());

  const growthTexts = textsFromSelector($, ['[class*="CostChange__TrendIndicator"]', '[class^="MedianCostBrick__TrendIndicator"]']);
  const medianText = textFromSelector($, ['[class^="MedianCostBrick__CostValue"]']);
  estimate.suburbGrowthPercent = firstParsedPercent(growthTexts) ?? parsePercent(textFromSelector($, ['[class^="MedianCostBrick__TrendIndicator"]']));
  estimate.medianPrice = parseNumber(medianText);
  estimate.medianPricePeriod = rollingTwelveMonthPeriod();
  estimate.propertyTypeMatched = containsUnitContext(bodyText) || /\/unit-/i.test(bodyText);
  estimate.soldHistory = extractSoldHistoryFromText(bodyText, 'property.com.au', sourceUrl);
  estimate.comparables = soldHistoryToComparables(estimate.soldHistory, address, 'property.com.au', sourceUrl);

  if (estimate.medianPrice !== null) {
    estimate.notes.push(`Median: $${estimate.medianPrice.toLocaleString('en-AU')}`);
  }
  if (estimate.suburbGrowthPercent !== null) {
    estimate.notes.push(`Growth: ${estimate.suburbGrowthPercent}%`);
  }

  return estimate;
}
