import type { PropertyGrowthInput } from './types.js';

export interface ParsedLocation {
  suburb: string;
  state: string;
  postCode: string;
}

export function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseLocationParts(input: Pick<PropertyGrowthInput, 'suburb' | 'state' | 'postCode'>): ParsedLocation {
  if (input.state && input.postCode) {
    return {
      suburb: input.suburb.trim(),
      state: input.state.trim().toLowerCase(),
      postCode: input.postCode.trim()
    };
  }

  const match = input.suburb.trim().match(/^(.*)\s+([A-Za-z]{2,3})\s+(\d{4})$/);
  if (!match) {
    throw new Error('Could not parse suburb/state/postCode. Provide suburb in the form "Suburb ST 1234" or pass separate state and postCode fields.');
  }

  return {
    suburb: match[1].trim(),
    state: match[2].trim().toLowerCase(),
    postCode: match[3].trim()
  };
}

function normalizeStreetAddress(address: string): { unit: string | null; street: string } {
  const trimmed = address.trim().split(',')[0]?.trim() ?? address.trim();
  const slashMatch = trimmed.match(/^(\d+[A-Za-z]?)\s*\/\s*(.+)$/);
  if (slashMatch) {
    return {
      unit: slashMatch[1],
      street: slashMatch[2].trim()
    };
  }

  return {
    unit: null,
    street: trimmed
  };
}

export function buildPropertyUrls(input: Pick<PropertyGrowthInput, 'address' | 'suburb' | 'state' | 'postCode'>): {
  realestate: string;
  domain: string;
  property: string;
} {
  const location = parseLocationParts(input);
  const { unit, street } = normalizeStreetAddress(input.address);
  const streetSlug = slugifySegment(street);
  const suburbSlug = slugifySegment(location.suburb);
  const unitPrefix = unit ? `${slugifySegment(unit)}-` : '';

  return {
    realestate: `https://www.realestate.com.au/property/${unitPrefix}${streetSlug}-${suburbSlug}-${location.state}-${location.postCode}/`,
    domain: `https://www.domain.com.au/property-profile/${unitPrefix}${streetSlug}-${suburbSlug}-${location.state}-${location.postCode}`,
    property: `https://www.property.com.au/${location.state}/${suburbSlug}-${location.postCode}/${streetSlug}/${unit ? `${slugifySegment(unit)}-` : ''}`
  };
}

export function buildSuburbUrls(input: Pick<PropertyGrowthInput, 'suburb' | 'state' | 'postCode'>): { realestate: string; domain: string; property: string } {
  const location = parseLocationParts(input);
  const suburbSlug = slugifySegment(location.suburb);

  return {
    realestate: `https://www.realestate.com.au/${location.state}/${suburbSlug}-${location.postCode}/`,
    property: `https://www.property.com.au/${location.state}/${suburbSlug}-${location.postCode}/`,
    domain: `https://www.domain.com.au/suburb-profile/${suburbSlug}-${location.state}-${location.postCode}`
  };
}
