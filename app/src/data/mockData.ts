export interface SuburbOption {
  suburb: string;
  state: string;
  postcode: string;
}

export interface SourceEstimate {
  siteName: string;
  estimate: number;
  url: string;
}

export interface ValuationResult {
  finalEstimate: number;
  growthPercent: number;
  confidenceLabel: 'Low' | 'Medium' | 'High';
  confidenceScore: number;
  sources: SourceEstimate[];
}

export const suburbOptions: SuburbOption[] = [
  { suburb: 'Bondi', state: 'NSW', postcode: '2026' },
  { suburb: 'New Farm', state: 'QLD', postcode: '4005' },
  { suburb: 'Richmond', state: 'VIC', postcode: '3121' },
  { suburb: 'Subiaco', state: 'WA', postcode: '6008' },
  { suburb: 'Unley', state: 'SA', postcode: '5061' },
];

export const mockValuationResult: ValuationResult = {
  finalEstimate: 1942500,
  growthPercent: 5,
  confidenceLabel: 'High',
  confidenceScore: 78,
  sources: [
    {
      siteName: 'Realestate.com.au',
      estimate: 1930000,
      url: 'https://www.realestate.com.au/',
    },
    {
      siteName: 'Domain',
      estimate: 1955000,
      url: 'https://www.domain.com.au/',
    },
    {
      siteName: 'Property.com.au',
      estimate: 1940000,
      url: 'https://www.property.com.au/',
    },
  ],
};
