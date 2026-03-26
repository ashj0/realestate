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

export function extractRealestate(content: string, sourceUrl: string | null, address: string): SiteEstimate {
  const estimate = emptyEstimate('realestate.com.au', sourceUrl);
  if (!content) return estimate;

  const $ = load(content);
  const bodyText = normalizeWhitespace($.root().text());

  const growthAttr = attrFromSelector($, ['[data-testid="growth-percentage"]'], 'growth');
  const growthText = textFromSelector($, ['[data-testid="growth-percentage"]', '[class^="MedianPriceGrowth__GrowthValue"]']);
  const medianText = textFromSelector($, ['[data-testid="median-price-display"]']);
  const updatedText = bodyText.match(/(?:Updated|Last updated)[:\s-]+([A-Z][a-z]{2,8}\s+\d{4})/i)?.[1] ?? null;

  estimate.suburbGrowthPercent = parsePercent(growthAttr ?? growthText);
  estimate.medianPrice = parseNumber(medianText);
  estimate.medianPricePeriod = rollingTwelveMonthPeriod();
  estimate.estimateUpdatedAt = updatedText ? normalizeWhitespace(updatedText) : null;
  estimate.propertyTypeMatched = containsUnitContext(bodyText) || /\/property\/unit-/i.test(sourceUrl ?? '');
  estimate.soldHistory = extractSoldHistoryFromText(bodyText, 'realestate.com.au', sourceUrl);
  estimate.comparables = soldHistoryToComparables(estimate.soldHistory, address, 'realestate.com.au', sourceUrl);

  if (estimate.medianPrice !== null) {
    estimate.notes.push(`Unit median: $${estimate.medianPrice.toLocaleString('en-AU')}`);
  }
  if (estimate.suburbGrowthPercent !== null) {
    estimate.notes.push(`Growth: ${estimate.suburbGrowthPercent}% YoY`);
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

  const growthText = textFromSelector($, ['[class^="MedianCostBrick__TrendIndicator"]']);
  const medianText = textFromSelector($, ['[class^="MedianCostBrick__CostValue"]']);
  estimate.suburbGrowthPercent = parsePercent(growthText);
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
