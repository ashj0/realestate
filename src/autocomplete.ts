import axios from 'axios';

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

function toSuggestion(result: NominatimResult): PropertyAutocompleteSuggestion | null {
  const suburb = (result.address?.suburb ?? result.address?.town ?? result.address?.city_district ?? result.address?.city ?? '').trim();
  const state = normalizeState(result.address?.state);
  const postcode = result.address?.postcode?.trim() ?? '';

  if (!suburb || !state || !postcode) {
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

export async function searchPropertyAutocomplete(query: string): Promise<PropertyAutocompleteSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const response = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
    params: {
      q: trimmed,
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

  const deduped = new Map<string, PropertyAutocompleteSuggestion>();

  for (const item of response.data) {
    const suggestion = toSuggestion(item);
    if (!suggestion) continue;
    deduped.set(suggestion.address.toLowerCase(), suggestion);
  }

  return Array.from(deduped.values()).slice(0, 6);
}
