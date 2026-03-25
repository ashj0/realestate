import type { ComparableRecord, SiteEstimate, SiteLabel, SoldHistoryRecord } from './types.js';
import { containsUnitContext, findFirstMatch, normalizeWhitespace, parseNumber, parsePercent } from './utils.js';

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

function extractSoldHistory(text: string, source: SiteLabel, sourceUrl: string | null): SoldHistoryRecord[] {
  const records: SoldHistoryRecord[] = [];
  const pattern = /(\b(?:\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b)[^$]{0,80}(\$[\d,]+)/gi;
  for (const match of text.matchAll(pattern)) {
    records.push({
      date: normalizeWhitespace(match[1]),
      price: normalizeWhitespace(match[2]),
      type: 'Sold',
      source,
      sourceUrl
    });
    if (records.length >= 10) break;
  }
  return records;
}

function extractComparablesFromHistory(history: SoldHistoryRecord[], address: string, source: SiteLabel, sourceUrl: string | null): ComparableRecord[] {
  return history.slice(0, 3).map((record) => ({
    date: record.date ?? null,
    price: typeof record.price === 'number' ? record.price : parseNumber(String(record.price ?? '')),
    address,
    source,
    sourceUrl
  }));
}

export function extractRealestate(content: string, sourceUrl: string | null, address: string): SiteEstimate {
  const estimate = emptyEstimate('realestate.com.au', sourceUrl);
  const text = normalizeWhitespace(content);

  estimate.suburbGrowthPercent = parsePercent(findFirstMatch(text, [/(\d+(?:\.\d+)?)\s*%[^.]{0,40}(?:yearly change|YoY|annual)/i]));
  estimate.medianPrice = parseNumber(findFirstMatch(text, [/median[^$]{0,30}(\$[\d,]+)/i, /unit median[^$]{0,20}(\$[\d,]+)/i]));
  estimate.medianPricePeriod = findFirstMatch(text, [/(?:median display|median price period|updated)[:\s-]+([A-Z][a-z]{2,8}\s+\d{4})/i]);
  estimate.estimateUpdatedAt = findFirstMatch(text, [/(?:updated|last updated)[:\s-]+([A-Z][a-z]{2,8}\s+\d{4})/i]);
  estimate.propertyTypeMatched = containsUnitContext(text);
  estimate.soldHistory = extractSoldHistory(text, 'realestate.com.au', sourceUrl);
  estimate.comparables = extractComparablesFromHistory(estimate.soldHistory, address, 'realestate.com.au', sourceUrl);

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
  const text = normalizeWhitespace(content);
  const rangeMatch = text.match(/\$([\d,]+)\s*(?:-|to)\s*\$([\d,]+)[^.]{0,40}\$([\d,]+)/i);
  const estimateText = findFirstMatch(text, [/(Estimate[^.]{0,120})/i]);

  estimate.propertyEstimateRange.low = rangeMatch ? parseNumber(rangeMatch[1]) : null;
  estimate.propertyEstimateRange.mid = estimateText ? parseNumber(estimateText) : null;
  estimate.propertyEstimateRange.high = rangeMatch ? parseNumber(rangeMatch[3]) : null;
  estimate.estimateAccuracy = findFirstMatch(text, [/(High accuracy|Medium accuracy|Low accuracy)/i]);
  estimate.estimateUpdatedAt = findFirstMatch(text, [/(?:Updated|Last updated)[:\s-]+([A-Z][a-z]{2,8}\s+\d{4}|\d{4}-\d{2}-\d{2})/i]);
  estimate.propertyTypeMatched = containsUnitContext(text);
  estimate.soldHistory = extractSoldHistory(text, 'domain.com.au', sourceUrl);
  estimate.comparables = extractComparablesFromHistory(estimate.soldHistory, address, 'domain.com.au', sourceUrl);

  if (estimateText) {
    estimate.notes.push(normalizeWhitespace(estimateText));
  }

  return estimate;
}

export function extractProperty(content: string, sourceUrl: string | null, address: string): SiteEstimate {
  const estimate = emptyEstimate('property.com.au', sourceUrl);
  const text = normalizeWhitespace(content);

  estimate.suburbGrowthPercent = parsePercent(findFirstMatch(text, [/(\d+(?:\.\d+)?)\s*%[^.]{0,40}(?:growth|annual)/i]));
  estimate.medianPrice = parseNumber(findFirstMatch(text, [/(?:median|3 bed median)[^$]{0,20}(\$[\d,]+)/i]));
  estimate.medianPricePeriod = findFirstMatch(text, [/(?:median price period|updated)[:\s-]+([A-Z][a-z]{2,8}\s+\d{4})/i]);
  estimate.propertyTypeMatched = containsUnitContext(text);
  estimate.soldHistory = extractSoldHistory(text, 'property.com.au', sourceUrl);
  estimate.comparables = extractComparablesFromHistory(estimate.soldHistory, address, 'property.com.au', sourceUrl);

  if (estimate.medianPrice !== null) {
    estimate.notes.push(`Median: $${estimate.medianPrice.toLocaleString('en-AU')}`);
  }
  if (estimate.suburbGrowthPercent !== null) {
    estimate.notes.push(`Growth: ${estimate.suburbGrowthPercent}%`);
  }

  return estimate;
}
