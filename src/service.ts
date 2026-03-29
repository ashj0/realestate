import type { ComparableRecord, PropertyGrowthInput, PropertyGrowthResult, SiteEstimate, SiteLabel } from './types.js';
import { saveDebugHtml } from './debug.js';
import { extractDomain, extractProperty, extractRealestate } from './extractors.js';
import { buildSuburbUrls } from './location.js';
import { fetchScrapflyContent } from './scrapfly.js';
import { resolveKnownUrls } from './url-resolver.js';
import { average, uniqueBy } from './utils.js';
import { validateOutput } from './validation.js';

function emptySiteEstimates(input: PropertyGrowthInput, urls: { realestate: string; domain: string; property: string }) {
  return {
    realestate_com_au: extractRealestate('', urls.realestate, input.address),
    domain_com_au: extractDomain('', urls.domain, input.address),
    property_com_au: extractProperty('', urls.property, input.address)
  };
}

function collectGrowths(siteEstimates: PropertyGrowthResult['siteEstimates']): { values: number[]; sitesUsed: SiteLabel[] } {
  const entries: Array<[SiteLabel, SiteEstimate]> = [
    ['realestate.com.au', siteEstimates.realestate_com_au],
    ['domain.com.au', siteEstimates.domain_com_au],
    ['property.com.au', siteEstimates.property_com_au]
  ];

  const values: number[] = [];
  const sitesUsed: SiteLabel[] = [];

  for (const [label, estimate] of entries) {
    if (estimate.propertyTypeMatched && typeof estimate.suburbGrowthPercent === 'number') {
      values.push(estimate.suburbGrowthPercent);
      sitesUsed.push(label);
    }
  }

  return { values, sitesUsed };
}

function selectComparables(siteEstimates: PropertyGrowthResult['siteEstimates']): ComparableRecord[] {
  const combined = [
    ...siteEstimates.realestate_com_au.comparables,
    ...siteEstimates.domain_com_au.comparables,
    ...siteEstimates.property_com_au.comparables
  ];

  return uniqueBy(
    combined.filter((item) => item.address && item.salePrice !== null && item.salePrice !== undefined),
    (item) => `${item.source ?? 'unknown'}|${item.address}|${item.saleDate ?? ''}|${item.salePrice ?? ''}`
  ).slice(0, 3);
}

function determineConfidence(siteEstimates: PropertyGrowthResult['siteEstimates'], selectedComparables: ComparableRecord[]): PropertyGrowthResult['confidence'] {
  const usefulSources = [siteEstimates.realestate_com_au, siteEstimates.domain_com_au, siteEstimates.property_com_au].filter(
    (estimate) => estimate.propertyTypeMatched && (estimate.suburbGrowthPercent !== null || estimate.propertyEstimateRange.mid !== null || estimate.soldHistory.length > 0)
  ).length;

  if (usefulSources >= 3 && selectedComparables.length >= 2) return 'high';
  if (usefulSources >= 2) return 'medium';
  return 'low';
}

function appendResolutionNotes(
  siteEstimates: PropertyGrowthResult['siteEstimates'],
  resolvedKnownUrls: Awaited<ReturnType<typeof resolveKnownUrls>>,
  suburbUrls: { realestate: string; domain: string; property: string }
) {
  const mappings = [
    {
      estimate: siteEstimates.realestate_com_au,
      resolved: resolvedKnownUrls.realestate,
      fallbackUrl: suburbUrls.realestate,
      label: 'realestate.com.au'
    },
    {
      estimate: siteEstimates.domain_com_au,
      resolved: resolvedKnownUrls.domain,
      fallbackUrl: suburbUrls.domain,
      label: 'domain.com.au'
    },
    {
      estimate: siteEstimates.property_com_au,
      resolved: resolvedKnownUrls.property,
      fallbackUrl: suburbUrls.property,
      label: 'property.com.au'
    }
  ] as const;

  for (const mapping of mappings) {
    if (mapping.resolved.resolution === 'provided') {
      mapping.estimate.notes.unshift(`URL resolution: using caller-provided property URL`);
    } else if (mapping.resolved.resolution === 'resolved-property') {
      mapping.estimate.notes.unshift(`URL resolution: matched property URL`);
      if (mapping.resolved.matchedCandidate) {
        mapping.estimate.notes.push(`Matched candidate: ${mapping.resolved.matchedCandidate}`);
      }
      if (mapping.resolved.searchUrl) {
        mapping.estimate.notes.push(`Search page: ${mapping.resolved.searchUrl}`);
      }
    } else {
      mapping.estimate.notes.unshift(`URL resolution: fallback to suburb/site page`);
      mapping.estimate.notes.push(`Fallback URL: ${mapping.fallbackUrl}`);
      if (mapping.resolved.reason) {
        mapping.estimate.notes.push(mapping.resolved.reason);
      }
      if (mapping.resolved.searchUrl) {
        mapping.estimate.notes.push(`Search page: ${mapping.resolved.searchUrl}`);
      }
    }
  }
}

export async function estimatePropertyGrowth(input: PropertyGrowthInput, _proxyUrl: string): Promise<PropertyGrowthResult> {
  const errors: string[] = [];
  const assumptions: string[] = [];
  const suburbUrls = buildSuburbUrls(input);

  const apiKey = process.env.SCRAPFLY_API_KEY;

  if (!apiKey) {
    throw new Error('SCRAPFLY_API_KEY environment variable is required');
  }

  const resolvedKnownUrls = await resolveKnownUrls(input, apiKey);
  const urls = {
    realestate: resolvedKnownUrls.realestate.url ?? suburbUrls.realestate,
    domain: resolvedKnownUrls.domain.url ?? suburbUrls.domain,
    property: resolvedKnownUrls.property.url ?? suburbUrls.property
  };

  const siteEstimates = emptySiteEstimates(input, urls);

  await Promise.all([
    fetchScrapflyContent(urls.realestate, apiKey)
      .then(async (content) => {
        await saveDebugHtml('realestate', content);
        siteEstimates.realestate_com_au = extractRealestate(content, urls.realestate, input.address);
      })
      .catch((error: Error) => errors.push(`realestate.com.au: ${error.message}`)),
    fetchScrapflyContent(urls.domain, apiKey)
      .then(async (content) => {
        await saveDebugHtml('domain', content);
        siteEstimates.domain_com_au = extractDomain(content, urls.domain, input.address);
      })
      .catch((error: Error) => errors.push(`domain.com.au: ${error.message}`)),
    fetchScrapflyContent(urls.property, apiKey)
      .then(async (content) => {
        await saveDebugHtml('property', content);
        siteEstimates.property_com_au = extractProperty(content, urls.property, input.address);
      })
      .catch((error: Error) => errors.push(`property.com.au: ${error.message}`))
  ]);

  appendResolutionNotes(siteEstimates, resolvedKnownUrls, suburbUrls);

  const { values, sitesUsed } = collectGrowths(siteEstimates);
  const growthPercent = average(values);
  const currentValuation = growthPercent === null ? null : Math.round(input.lastYearValuation * (1 + growthPercent / 100));
  const selectedComparables = selectComparables(siteEstimates);
  const confidence = determineConfidence(siteEstimates, selectedComparables);

  if (growthPercent !== null) {
    assumptions.push(`Current valuation calculated as $${input.lastYearValuation.toLocaleString('en-AU')} * (1 + ${growthPercent}%) = $${currentValuation?.toLocaleString('en-AU')}`);
  } else {
    assumptions.push('No valid suburb growth values were available, so growthPercent and currentValuation are null');
  }

  if (siteEstimates.realestate_com_au.suburbGrowthPercent !== null && siteEstimates.realestate_com_au.propertyTypeMatched) {
    assumptions.push(`Using unit median growth (${siteEstimates.realestate_com_au.suburbGrowthPercent}%) from realestate.com.au`);
  }

  if (siteEstimates.property_com_au.suburbGrowthPercent !== null && siteEstimates.property_com_au.propertyTypeMatched) {
    assumptions.push(`Using unit median growth (${siteEstimates.property_com_au.suburbGrowthPercent}%) from property.com.au`);
  }

  const { knownUrls: _knownUrls, state: _state, postCode: _postCode, ...publicInput } = input;

  const output: PropertyGrowthResult = {
    input: publicInput,
    result: {
      growthPercent,
      currentValuation,
      growthCalculationMethod: 'average_of_available_site_growths',
      sitesUsed
    },
    siteEstimates,
    selectedComparables,
    confidence,
    assumptions,
    errors
  };

  const validation = validateOutput(output);
  if (!validation.valid) {
    output.errors.push(...validation.errors.map((error) => `output validation: ${error}`));
  }

  return output;
}
