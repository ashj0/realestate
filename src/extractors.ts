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

function extractComparableRecords(items: Array<Record<string, unknown>>, address: string, sourceUrl: string | null): ComparableRecord[] {
  return items
    .map((item) => {
      const path = firstString(item.pathV2);
      const soldDateRaw = firstString(item.soldDate);
      return {
        address: firstString(item.address) ?? address,
        saleDate: soldDateRaw ? soldDateRaw.slice(0, 10) : null,
        salePrice: parseNumber(firstString((item.priceV2 as Record<string, unknown> | undefined)?.display)),
        source: 'property.com.au' as SiteLabel,
        sourceUrl: path
          ? (path.startsWith('http') ? path : `https://www.property.com.au${path}`)
          : sourceUrl
      } satisfies ComparableRecord;
    })
    .filter((item) => item.address && !addressesMatch(item.address, address) && item.salePrice !== null)
    .slice(0, 6);
}

function extractNeighbouringPropertyRecords(items: Array<Record<string, unknown>>, address: string): ComparableRecord[] {
  return items
    .map((item) => ({
      address: firstString(item.fullAddress) ?? firstString(item.shortAddress) ?? address,
      saleDate: null,
      salePrice: null,
      source: 'property.com.au' as SiteLabel,
      sourceUrl: firstString(item.propertyPageLink)
    } satisfies ComparableRecord))
    .filter((item) => item.address && !addressesMatch(item.address, address))
    .slice(0, 6);
}

function rollingTwelveMonthPeriod(): string {
  return '12 months';
}

function decodeUnicodeEscapes(value: string): string {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

function parseEmbeddedPropertyJson(content: string): Record<string, unknown> | null {
  const marker = '\"marketTrends\":';
  const start = content.indexOf(marker);
  if (start === -1) return null;

  let i = start + marker.length;
  while (i < content.length && /\s/.test(content[i] ?? '')) i += 1;
  if (content[i] !== '{') return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let j = i; j < content.length; j += 1) {
    const ch = content[j] ?? '';
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = j + 1;
        break;
      }
    }
  }

  if (end === -1) return null;

  const rawObject = content.slice(i, end);
  try {
    return JSON.parse(decodeUnicodeEscapes(rawObject)) as Record<string, unknown>;
  } catch {
    return null;
  }
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
  suburbGrowthPercent: number | null;
  medianPrice: number | null;
  medianPricePeriod: string | null;
  estimateUpdatedAt: string | null;
  notes: string[];
} | null {
  const script = findArgonautScript(content);
  if (!script) return null;

  try {
    const exchange = JSON.parse(script) as Record<string, unknown>;
    const profileDataRaw = typeof exchange['resi-property_property-profile'] === 'object' && exchange['resi-property_property-profile']
      ? (exchange['resi-property_property-profile'] as Record<string, unknown>).property_detail_data
      : null;
    const profileData = typeof profileDataRaw === 'string' ? JSON.parse(profileDataRaw) as Record<string, unknown> : null;
    const propertyProfile = profileData?.propertyProfile as Record<string, unknown> | undefined;
    const property = propertyProfile?.property as Record<string, unknown> | undefined;
    const propertyAttributes = property?.attributes as Record<string, unknown> | undefined;
    const valuations = property?.valuations as Record<string, unknown> | undefined;
    const saleValuation = valuations?.sale as Record<string, unknown> | undefined;
    const medianValuation = saleValuation?.medianValuation as Record<string, unknown> | undefined;
    const pca = propertyProfile?.pca as Record<string, unknown> | undefined;
    const pcaPropertyLink = pca?.pcaPropertyLink as Record<string, unknown> | undefined;
    const marketMetrics = propertyProfile?.marketMetrics as Record<string, unknown> | undefined;
    const medianPriceRoot = marketMetrics?.medianPrice as Record<string, unknown> | undefined;
    const buyMetrics = medianPriceRoot?.buy as Record<string, unknown> | undefined;

    const notes: string[] = ['Parsed ArgonautExchange structured data'];
    const soldHistory: SoldHistoryRecord[] = [];
    const comparables: ComparableRecord[] = [];

    const propertyType = firstString(propertyAttributes?.propertyType) ?? null;
    const heroImageCandidate = firstString((property?.propertyMedia as Record<string, unknown> | undefined)?.mainImage)
      ?? firstString((property?.propertyMedia as Record<string, unknown> | undefined)?.images);
    const heroImageUrl = heroImageCandidate && /^https?:\/\//i.test(heroImageCandidate)
      ? heroImageCandidate.replace('{width}', '800').replace('{height}', '600')
      : null;
    const propertyComUrl = firstString(pcaPropertyLink?.href) ?? null;

    const timeline = Array.isArray(property?.propertyTimeline) ? property.propertyTimeline as Array<Record<string, unknown>> : [];
    for (const event of timeline) {
      const eventType = firstString(event.eventType)?.toLowerCase() ?? null;
      if (eventType !== 'sold') continue;
      soldHistory.push({
        date: firstString(event.date),
        price: parseNumber(firstString(event.price)),
        source: 'realestate.com.au',
        sourceUrl: null
      });
    }

    const neighbouringProperties = Array.isArray((propertyProfile?.streetDetails as Record<string, unknown> | undefined)?.neighbouringProperties)
      ? ((propertyProfile?.streetDetails as Record<string, unknown> | undefined)?.neighbouringProperties as Array<Record<string, unknown>>)
      : [];
    for (const neighbour of neighbouringProperties) {
      const address = firstString(neighbour.fullAddress) ?? firstString(neighbour.shortAddress);
      if (!address || addressesMatch(address, targetAddress)) continue;
      comparables.push({
        address,
        saleDate: null,
        salePrice: null,
        source: 'realestate.com.au',
        sourceUrl: firstString(neighbour.propertyPageLink)
      });
      if (comparables.length >= 3) break;
    }

    const propertyTypeKey = propertyType?.toLowerCase() === 'unit' || propertyType?.toLowerCase() === 'apartment' ? 'unit' : 'house';
    const bedroomsValue = Number((propertyAttributes?.bedrooms as Record<string, unknown> | undefined)?.value);
    const bedroomBucket = Number.isFinite(bedroomsValue)
      ? propertyTypeKey === 'unit'
        ? (bedroomsValue >= 4 ? 'fourPlusBed' : bedroomsValue === 3 ? 'threeBed' : bedroomsValue === 2 ? 'twoBed' : bedroomsValue === 1 ? 'oneBed' : 'allBed')
        : (bedroomsValue >= 5 ? 'fivePlusBed' : bedroomsValue === 4 ? 'fourBed' : bedroomsValue === 3 ? 'threeBed' : bedroomsValue === 2 ? 'twoBed' : bedroomsValue === 1 ? 'oneBed' : 'allBed')
      : 'allBed';

    const typedMetrics = (buyMetrics?.[propertyTypeKey] as Record<string, unknown> | undefined);
    const bedroomMetrics = (typedMetrics?.[bedroomBucket] as Record<string, unknown> | undefined) ?? (typedMetrics?.allBed as Record<string, unknown> | undefined);
    const yearlyMetrics = (bedroomMetrics?.yearly as Record<string, unknown> | undefined) ?? (typedMetrics?.allBed as Record<string, unknown> | undefined)?.yearly as Record<string, unknown> | undefined;

    const suburbGrowthPercent = typeof (yearlyMetrics?.changePercentage as Record<string, unknown> | undefined)?.value === 'number'
      ? ((yearlyMetrics?.changePercentage as Record<string, unknown>).value as number)
      : parsePercent(firstString((yearlyMetrics?.changePercentage as Record<string, unknown> | undefined)?.display));
    const medianPrice = parseNumber(firstString(yearlyMetrics?.display));
    const estimateUpdatedAt = firstString(medianValuation?.lastUpdated) ?? null;

    if (!soldHistory.length) {
      notes.push('No sold history found in property timeline');
    }
    if (!comparables.length) {
      notes.push('No neighbouring property comparables found in Argonaut data');
    }
    if (!heroImageUrl) {
      notes.push('No hero image found in property media');
    }

    return {
      propertyType,
      heroImageUrl,
      propertyComUrl,
      soldHistory,
      comparables,
      suburbGrowthPercent,
      medianPrice,
      medianPricePeriod: yearlyMetrics ? rollingTwelveMonthPeriod() : null,
      estimateUpdatedAt,
      notes
    };
  } catch {
    return null;
  }
}

export function extractRealestatePropertyComUrl(content: string, address: string): string | null {
  const argonautUrl = parseRealestateArgonaut(content, address)?.propertyComUrl ?? null;
  if (argonautUrl) return argonautUrl;

  const $ = load(content);
  return attrFromSelector($, ['a[href*="property.com.au"]'], 'href');
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

  estimate.suburbGrowthPercent = argonaut?.suburbGrowthPercent ?? parsePercent(growthAttr ?? growthText);
  estimate.medianPrice = argonaut?.medianPrice ?? parseNumber(medianText);
  estimate.medianPricePeriod = argonaut?.medianPricePeriod ?? rollingTwelveMonthPeriod();
  estimate.estimateUpdatedAt = argonaut?.estimateUpdatedAt ?? (updatedText ? normalizeWhitespace(updatedText) : null);

  estimate.heroImageUrl = argonaut?.heroImageUrl ?? attrFromSelector($, ['meta[property="og:image"]', 'meta[name="thumbnail"]'], 'content') ?? null;
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
  const embedded = parseEmbeddedPropertyJson(content);
  const marketInsights = embedded?.marketInsightsV3 as Record<string, unknown> | undefined;
  const medianPrice = marketInsights?.medianPrice as Record<string, unknown> | undefined;
  const medianPriceCost = medianPrice?.cost as Record<string, unknown> | undefined;
  const medianPriceChange = medianPrice?.costChange as Record<string, unknown> | undefined;
  const marketTrends = embedded?.marketTrends as Record<string, unknown> | undefined;
  const otherSimilarSoldProperties = marketTrends?.otherSimilarSoldProperties as Record<string, unknown> | undefined;
  const comparableSoldProperties = marketTrends?.comparableSoldProperties as Record<string, unknown> | undefined;
  const comparableSoldList = Array.isArray(comparableSoldProperties?.properties)
    ? comparableSoldProperties.properties as Array<Record<string, unknown>>
    : [];
  const otherSimilarSoldList = Array.isArray(otherSimilarSoldProperties?.properties)
    ? otherSimilarSoldProperties.properties as Array<Record<string, unknown>>
    : [];
  const argonautData = parseRealestateArgonaut(content, address);

  const growthTexts = textsFromSelector($, ['[class*="CostChange__TrendIndicator"]', '[class^="MedianCostBrick__TrendIndicator"]']);
  const medianText = textFromSelector($, ['[class^="MedianCostBrick__CostValue"]']);
  estimate.suburbGrowthPercent = parsePercent(firstString(medianPriceChange?.value))
    ?? firstParsedPercent(growthTexts)
    ?? parsePercent(textFromSelector($, ['[class^="MedianCostBrick__TrendIndicator"]']));
  estimate.medianPrice = parseNumber(firstString(medianPriceCost?.title)) ?? parseNumber(medianText);
  estimate.medianPricePeriod = rollingTwelveMonthPeriod();
  estimate.propertyTypeMatched = containsUnitContext(bodyText) || /\/unit-/i.test(bodyText);
  estimate.soldHistory = extractSoldHistoryFromText(bodyText, 'property.com.au', sourceUrl);

  const directComparables = extractComparableRecords(comparableSoldList, address, sourceUrl);
  const fallbackComparables = extractComparableRecords(otherSimilarSoldList, address, sourceUrl);
  const neighbouringComparables = extractNeighbouringPropertyRecords((argonautData?.comparables ?? []).map((item) => ({
    fullAddress: item.address,
    propertyPageLink: item.sourceUrl
  })), address);
  estimate.comparables = directComparables.length
    ? directComparables
    : fallbackComparables.length
      ? fallbackComparables
      : neighbouringComparables;

  if (directComparables.length) {
    estimate.notes.push(`Parsed ${directComparables.length} comparables from property.com.au comparableSoldProperties`);
  } else if (fallbackComparables.length) {
    estimate.notes.push(`Parsed ${fallbackComparables.length} comparables from property.com.au otherSimilarSoldProperties`);
  } else if (neighbouringComparables.length) {
    estimate.notes.push(`Fell back to ${neighbouringComparables.length} neighbouring properties from property.com.au page context (no sold prices available)`);
  } else if (comparableSoldList.length || otherSimilarSoldList.length) {
    estimate.notes.push('Structured property.com.au market-trends entries were present but matched the subject property or lacked sale prices');
  } else {
    estimate.notes.push('No structured property.com.au market-trends comparables found');
  }

  if (estimate.medianPrice !== null) {
    estimate.notes.push(`Median: $${estimate.medianPrice.toLocaleString('en-AU')}`);
  }
  if (estimate.suburbGrowthPercent !== null) {
    estimate.notes.push(`Growth: ${estimate.suburbGrowthPercent}%`);
  }

  return estimate;
}
