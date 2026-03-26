import type { PropertyGrowthInput } from './types.js';

export function applyInputDefaults(input: Partial<PropertyGrowthInput>): PropertyGrowthInput {
  return {
    suburb: input.suburb ?? '',
    address: input.address ?? '',
    state: input.state ?? '',
    postCode: input.postCode ?? '',
    propertyType: input.propertyType ?? 'unit',
    lastYearValuation: input.lastYearValuation ?? 0,
    comparableType: input.comparableType ?? 'sold',
    currency: input.currency ?? 'AUD',
    knownUrls: input.knownUrls
  };
}
