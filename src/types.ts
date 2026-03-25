export type PropertyType = 'house' | 'unit';
export type ComparableType = 'sold';
export type Currency = 'AUD';
export type Confidence = 'low' | 'medium' | 'high';
export type SiteLabel = 'realestate.com.au' | 'domain.com.au' | 'property.com.au';

export interface PropertyGrowthInput {
  suburb: string;
  address: string;
  propertyType: PropertyType;
  lastYearValuation: number;
  comparableType: ComparableType;
  currency: Currency;
  knownUrls?: Partial<Record<'realestate' | 'domain' | 'property', string>>;
}

export interface PropertyEstimateRange {
  low: number | null;
  mid: number | null;
  high: number | null;
}

export interface SoldHistoryRecord {
  date: string | null;
  price: string | number | null;
  type?: string | null;
  source?: SiteLabel | null;
  sourceUrl?: string | null;
}

export interface ComparableRecord {
  date?: string | null;
  price?: number | null;
  address: string;
  source?: SiteLabel | null;
  sourceUrl?: string | null;
}

export interface SiteEstimate {
  label: SiteLabel;
  suburbGrowthPercent: number | null;
  medianPrice: number | null;
  medianPricePeriod: string | null;
  propertyEstimateRange: PropertyEstimateRange;
  estimateAccuracy: string | null;
  estimateUpdatedAt: string | null;
  propertyTypeMatched: boolean;
  comparables: ComparableRecord[];
  soldHistory: SoldHistoryRecord[];
  sourceUrl: string | null;
  notes: string[];
}

export interface PropertyGrowthResult {
  input: PropertyGrowthInput;
  result: {
    growthPercent: number | null;
    currentValuation: number | null;
    growthCalculationMethod: 'average_of_available_site_growths';
    sitesUsed: SiteLabel[];
  };
  siteEstimates: {
    realestate_com_au: SiteEstimate;
    domain_com_au: SiteEstimate;
    property_com_au: SiteEstimate;
  };
  selectedComparables: ComparableRecord[];
  confidence: Confidence;
  assumptions: string[];
  errors: string[];
}

export interface ScrapflyResponse {
  result?: {
    content?: string;
    final_url?: string;
    status_code?: number;
  };
}
