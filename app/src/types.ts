export interface PropertyOption {
  id: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType: 'house' | 'unit';
  lat: number;
  lng: number;
  isManual?: boolean;
}

export type PropertyAutocompleteOption = PropertyOption;

export interface EstimateApiResponse {
  input: {
    suburb: string;
    address: string;
    propertyType: 'house' | 'unit';
    lastYearValuation: number;
    principal?: number;
    comparableType: 'sold';
    currency: 'AUD';
  };
  result: {
    growthPercent: number | null;
    currentValuation: number | null;
    growthCalculationMethod: string;
    sitesUsed: string[];
  };
  siteEstimates: {
    realestate_com_au: SiteEstimate;
    domain_com_au: SiteEstimate;
    property_com_au: SiteEstimate;
  };
  selectedComparables: ComparableRecord[];
  confidence: 'low' | 'medium' | 'high';
  assumptions: string[];
  errors: string[];
}

export interface SiteEstimate {
  label: string;
  suburbGrowthPercent: number | null;
  medianPrice: number | null;
  medianPricePeriod: string | null;
  propertyEstimateRange: {
    low: number | null;
    mid: number | null;
    high: number | null;
  };
  estimateAccuracy: string | null;
  estimateUpdatedAt: string | null;
  propertyTypeMatched: boolean;
  comparables: ComparableRecord[];
  soldHistory: Array<{
    date: string | null;
    price: number | null;
    source?: string | null;
    sourceUrl?: string | null;
  }>;
  sourceUrl: string | null;
  notes: string[];
}

export interface ComparableRecord {
  address: string;
  salePrice?: number | null;
  saleDate?: string | null;
  distanceKm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  propertyType?: 'house' | 'unit' | null;
  source?: string | null;
  sourceUrl?: string | null;
}
