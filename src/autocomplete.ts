import axios from 'axios';

const REALESTATE_PROPERTY_URL_PATTERN = /^https?:\/\/(?:www\.)?realestate\.com\.au\/property\/([^/?#]+)\/?(?:\?.*)?$/i;

function normalizeAutocompleteQuery(query: string): string[] {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);
  const slashMatch = trimmed.match(/^(\d+)\s*\/\s*(.+)$/);

  if (slashMatch) {
    const [, unitNumber, remainder] = slashMatch;
    variants.add(remainder.trim());
    variants.add(`Unit ${unitNumber} ${remainder.trim()}`);
    variants.add(`Apartment ${unitNumber} ${remainder.trim()}`);
  }

  return Array.from(variants);
}

export interface PropertyAutocompleteSuggestion {
  id: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType: 'house' | 'unit';
  lat: number;
  lng: number;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    town?: string;
    city_district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
    [key: string]: string | undefined;
  };
  class?: string;
  type?: string;
  addresstype?: string;
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  'new south wales': 'NSW',
  queensland: 'QLD',
  victoria: 'VIC',
  tasmania: 'TAS',
  'south australia': 'SA',
  'western australia': 'WA',
  'northern territory': 'NT',
  'australian capital territory': 'ACT',
};

function normalizeState(value?: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  const mapped = STATE_ABBREVIATIONS[trimmed.toLowerCase()];
  return mapped ?? trimmed.toUpperCase();
}

function inferPropertyType(result: NominatimResult): 'house' | 'unit' {
  const haystack = `${result.display_name} ${result.type ?? ''} ${result.addresstype ?? ''}`.toLowerCase();
  if (haystack.includes('unit') || haystack.includes('apartment') || haystack.includes('flat')) {
    return 'unit';
  }

  return 'house';
}

function buildAddress(result: NominatimResult): string {
  const houseNumber = result.address?.house_number?.trim();
  const road = result.address?.road?.trim();
  const suburb = (result.address?.suburb ?? result.address?.town ?? result.address?.city_district ?? result.address?.city ?? '').trim();
  const state = normalizeState(result.address?.state);
  const postcode = result.address?.postcode?.trim() ?? '';

  const street = [houseNumber, road].filter(Boolean).join(' ');
  const locality = [suburb, state, postcode].filter(Boolean).join(' ');

  return [street, locality].filter(Boolean).join(', ') || result.display_name;
}

function isAddressLikeResult(result: NominatimResult): boolean {
  const addressType = (result.addresstype ?? '').toLowerCase();
  const resultType = (result.type ?? '').toLowerCase();
  const resultClass = (result.class ?? '').toLowerCase();
  const hasHouseNumber = Boolean(result.address?.house_number?.trim());

  if (hasHouseNumber) return true;
  if (addressType === 'road' || resultType === 'road') return false;
  if (resultClass === 'highway') return false;

  return ['building', 'residential', 'house', 'apartments', 'apartment'].includes(addressType)
    || ['building', 'residential', 'house', 'apartments', 'apartment'].includes(resultType);
}

function toSuggestion(result: NominatimResult): PropertyAutocompleteSuggestion | null {
  const suburb = (result.address?.suburb ?? result.address?.town ?? result.address?.city_district ?? result.address?.city ?? '').trim();
  const state = normalizeState(result.address?.state);
  const postcode = result.address?.postcode?.trim() ?? '';

  if (!suburb || !state || !postcode || !isAddressLikeResult(result)) {
    return null;
  }

  return {
    id: String(result.place_id),
    address: buildAddress(result),
    suburb,
    state,
    postcode,
    propertyType: inferPropertyType(result),
    lat: Number(result.lat),
    lng: Number(result.lon),
  };
}

function parseRealestatePropertyUrl(query: string): PropertyAutocompleteSuggestion | null {
  const match = query.trim().match(REALESTATE_PROPERTY_URL_PATTERN);
  if (!match) return null;

  const slug = match[1]?.trim().toLowerCase();
  if (!slug) return null;

  const propertyType: 'house' | 'unit' = slug.startsWith('unit-') ? 'unit' : 'house';
  const parts = slug.split('-').filter(Boolean);
  const stateIndex = parts.findIndex((part) => /^[a-z]{2,3}$/.test(part) && part !== 'unit');
  const postcodeIndex = parts.findIndex((part, index) => index > stateIndex && /^\d{4}$/.test(part));

  if (stateIndex <= 0 || postcodeIndex <= stateIndex + 1) return null;

  const state = normalizeState(parts[stateIndex]);
  const postcode = parts[postcodeIndex] ?? '';
  const suburbWords = parts.slice(stateIndex + 1, postcodeIndex);
  const addressWords = parts.slice(propertyType === 'unit' ? 2 : 0, stateIndex);

  if (!addressWords.length || !suburbWords.length || !postcode) return null;

  const titleCase = (value: string) => value
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.length ? segment[0].toUpperCase() + segment.slice(1) : segment)
    .join(' ');

  const address = `${titleCase(addressWords.join('-'))}, ${titleCase(suburbWords.join('-'))} ${state} ${postcode}`;
  const suburb = titleCase(suburbWords.join('-'));

  return {
    id: `realestate-url:${slug}`,
    address,
    suburb,
    state,
    postcode,
    propertyType,
    lat: 0,
    lng: 0,
  };
}

export async function searchPropertyAutocomplete(query: string): Promise<PropertyAutocompleteSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const directRealestateMatch = parseRealestatePropertyUrl(trimmed);
  if (directRealestateMatch) return [directRealestateMatch];

  const queryVariants = normalizeAutocompleteQuery(trimmed);
  const deduped = new Map<string, PropertyAutocompleteSuggestion>();

  for (const variant of queryVariants) {
    const response = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
      params: {
        q: variant,
        format: 'jsonv2',
        addressdetails: 1,
        limit: 8,
        countrycodes: 'au',
      },
      headers: {
        'User-Agent': 'property-growth-estimator-app/0.1 (+local development)',
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    for (const item of response.data) {
      const suggestion = toSuggestion(item);
      if (!suggestion) continue;
      deduped.set(suggestion.address.toLowerCase(), suggestion);
    }

    if (deduped.size >= 6) break;
  }

  return Array.from(deduped.values()).slice(0, 6);
}
