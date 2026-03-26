# Property Valuation App Spec

## 1. Overview

A desktop-first internal web app for a small team to generate one-off suburb-level property valuation estimates.

Users will:
- search for a suburb using public search
- optionally select a suburb from a map
- review suburb/state/postcode returned from search
- enter last year's valuation
- receive a single current valuation estimate plus supporting source estimates

The experience should feel premium, polished, and real-estate-inspired rather than like a rough internal tool.

---

## 2. Goals

### Primary goals
- Let a user quickly find a suburb
- Accept last year's valuation as the primary user input
- Produce a single current estimated valuation
- Show supporting evidence from multiple sites
- Present results clearly enough for internal team use

### Non-goals for v1
- No user accounts or authentication
- No SSO yet
- No persistent database storage
- No analytics/instrumentation
- No mobile optimization beyond basic responsiveness
- No property-level/street-address valuation yet

---

## 3. Target Users

- Small internal team
- Desktop/laptop users
- Likely repeat users who value speed, clarity, and trust signals

---

## 4. Core User Flow

1. User opens the app landing page
2. User searches for a suburb by typing into a public search box
3. User selects a suburb from search suggestions
   - or selects a suburb via a map interaction
4. App populates:
   - suburb
   - state
   - postcode
5. User enters last year's valuation
6. User submits for estimate
7. App fetches/aggregates source estimates
8. App calculates and displays:
   - single current estimated valuation
   - growth percentage
   - confidence score/label
   - source sites used
   - estimate from each source
   - clickable links to each source

---

## 5. Functional Requirements

### 5.1 Search and Location Selection
The app must allow suburb discovery in two ways:

#### A. Text search
- User can type a suburb name
- App shows public search suggestions
- User can select one result
- Result includes suburb, state, and postcode

#### B. Map selection
- User can select a location/suburb via map
- Map selection resolves to a suburb-level result
- Selected result should populate suburb, state, and postcode

#### Search requirements
- Search must use a public-facing search source/service
- Search should prevent ambiguous submission where possible by requiring a selected result rather than free text only
- Search results should prefer Australian suburb formatting if this is an Australian property workflow

### 5.2 Valuation Input
- User must be able to input last year's valuation
- Input should be numeric currency input
- Validation:
  - required
  - must be a positive number
  - sensible formatting with separators/currency display

### 5.3 Estimate Output
The app must display:
- **Current valuation**: one final single estimate
- **Growth %**: percentage change from last year's valuation to current estimate
- **Confidence**: confidence score or confidence band/label
- **Sites used**: list of source sites included in calculation
- **Per-site estimates**: estimate returned or inferred from each source
- **Source links**: clickable links for each source site

### 5.4 Calculation Logic
For v1, the system should:
- gather estimates/signals from configured source sites
- derive a single final estimate from those source estimates
- calculate growth percentage relative to last year's valuation
- derive a confidence value based on source coverage/consistency

The exact formula can be configurable or implemented with a simple documented heuristic first.

### 5.5 Result Persistence
- No database persistence required in v1
- Results can be ephemeral/in-memory per request
- Refreshing the page may clear current result state unless browser-local state is intentionally added

---

## 6. UX / UI Requirements

### Style direction
- Premium real-estate aesthetic
- Clean, spacious, modern layout
- High trust visual cues
- Friendlier tone in copy
- Should not feel overly technical or industrial

### UI characteristics
- Desktop-first layout
- Use React with Material UI (MUI)
- Emphasize legibility and polished presentation
- Avoid clutter

### Recommended page structure

#### Header
- App title / brand area
- Short subtitle or helper text

#### Search section
- Search box for suburb lookup
- Map panel or map modal for selecting suburb
- Read-only display of selected suburb/state/postcode

#### Input section
- Last year's valuation field
- Primary CTA: “Generate estimate” or similar

#### Results section
- Hero card for final valuation
- Secondary stats for growth % and confidence
- Source breakdown cards/table/list showing:
  - site name
  - estimate
  - link
- Optional note on how estimate was derived

### Copy tone
Use friendlier labels and helper text, for example:
- “Search for a suburb”
- “Enter last year's valuation”
- “Estimated current value”
- “Based on the sources below”

---

## 7. Suggested Screens

### Screen 1: Main valuation page
Sections:
- hero/header
- suburb search + map picker
- selected suburb details
- valuation input
- submit button
- results panel

### Optional states
- empty state before search
- search loading state
- valuation loading state
- no data / low confidence state
- validation error state

---

## 8. Suggested Component List

### Frontend components
- `AppShell`
- `Header`
- `SuburbSearchAutocomplete`
- `SuburbMapPicker`
- `SelectedSuburbCard`
- `ValuationInputForm`
- `EstimateSummaryCard`
- `ConfidenceBadge`
- `GrowthStat`
- `SourceEstimateList`
- `SourceEstimateCard`
- `EmptyState`
- `ErrorState`

### Utility modules
- currency formatting
- percentage formatting
- confidence labeling
- API client

---

## 9. Suggested Frontend Data Model

```ts
interface SuburbSelection {
  suburb: string;
  state: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  source?: string;
}

interface ValuationRequest {
  suburb: string;
  state: string;
  postcode: string;
  lastYearValuation: number;
}

interface SourceEstimate {
  siteKey: string;
  siteName: string;
  estimate: number | null;
  url: string;
  confidence?: number;
  note?: string;
}

interface ValuationResponse {
  finalEstimate: number;
  growthPercent: number;
  confidenceScore: number;
  confidenceLabel: 'Low' | 'Medium' | 'High';
  suburb: string;
  state: string;
  postcode: string;
  sources: SourceEstimate[];
  calculationNote?: string;
}
```

---

## 10. Suggested API Shape

### `GET /api/suburbs/search?q=<query>`
Returns suburb suggestions.

Example response:
```json
[
  {
    "suburb": "Bondi",
    "state": "NSW",
    "postcode": "2026",
    "latitude": -33.8915,
    "longitude": 151.2767
  }
]
```

### `POST /api/valuation/estimate`
Generates estimate for a selected suburb.

Request:
```json
{
  "suburb": "Bondi",
  "state": "NSW",
  "postcode": "2026",
  "lastYearValuation": 1850000
}
```

Response:
```json
{
  "finalEstimate": 1942500,
  "growthPercent": 5,
  "confidenceScore": 78,
  "confidenceLabel": "High",
  "suburb": "Bondi",
  "state": "NSW",
  "postcode": "2026",
  "sources": [
    {
      "siteKey": "site-a",
      "siteName": "Example Site A",
      "estimate": 1930000,
      "url": "https://example.com/a"
    },
    {
      "siteKey": "site-b",
      "siteName": "Example Site B",
      "estimate": 1955000,
      "url": "https://example.com/b"
    }
  ],
  "calculationNote": "Estimate derived from available suburb-level source data."
}
```

---

## 11. Backend / Service Requirements

### Runtime
- Frontend and backend can run on the same machine for now
- Environment-specific config should live in `.env`

### Suggested environment variables
```env
PORT=3000
VITE_API_BASE_URL=http://localhost:3000/api
SEARCH_PROVIDER=<provider>
MAP_PROVIDER=<provider>
SOURCE_SITE_1=<name>
SOURCE_SITE_2=<name>
```

### Backend responsibilities
- proxy suburb search requests
- normalize suburb search results
- aggregate source-site estimates
- compute final estimate
- compute growth percentage
- compute confidence
- return frontend-safe response payload

---

## 12. Calculation Recommendations for v1

A pragmatic first-pass heuristic:

### Final estimate
- collect all valid source estimates
- discard null/invalid values
- if multiple estimates exist, use median or weighted average
- if only one estimate exists, use it directly

### Growth %
```ts
growthPercent = ((finalEstimate - lastYearValuation) / lastYearValuation) * 100
```

### Confidence
Can be derived from:
- number of available sources
- agreement between sources
- freshness/completeness of source data

Example heuristic:
- High: 3+ sources with close agreement
- Medium: 2 sources or moderate spread
- Low: 1 source or large disagreement

---

## 13. Validation & Error Handling

### Validation
- suburb selection required
- last year's valuation required
- valuation must be positive numeric

### Error states
- search provider unavailable
- no suburb match found
- source estimate fetch failed
- partial source results available
- no estimate available

### UX handling
- show friendly inline validation messages
- allow partial results where possible
- indicate if confidence is lower due to limited sources

---

## 14. Accessibility & Usability

- Keyboard accessible autocomplete
- Sufficient color contrast
- Clear labels for inputs and actions
- Loading states that communicate progress
- Desktop-first, but avoid completely breaking on narrower screens

---

## 15. Security / Auth

### v1
- No authentication
- Intended for internal use only

### Future
- SSO integration later
- Access control when app moves beyond initial internal use

---

## 16. Future Enhancements

- Property/street-address level valuation
- Save estimate history to database
- User accounts and SSO
- Compare suburbs
- Export to PDF
- Trend charts/history
- Admin configuration for source weighting
- Audit trail for estimate generation

---

## 17. Open Questions / Decisions Still Needed

1. Which suburb search provider will be used?
2. Which map provider will be used?
3. Which source sites are approved for valuation estimates?
4. Are source links deep links to suburb pages, search result pages, or generic site URLs?
5. Should the app show exact confidence score only, or both score + label?
6. Should source estimate breakdown be shown as cards or table?
7. Should estimates be rounded to nearest dollar, nearest hundred, or nearest thousand?
8. Should results include a disclaimer for internal-use estimates?
9. How should missing source estimates be displayed?
10. Do source sites provide APIs, or will this require scraping/manual integration paths?

---

## 18. Recommended v1 Implementation Plan

### Phase 1
- Set up React + MUI app shell
- Implement suburb text search
- Implement selected suburb state
- Add last year's valuation form
- Build mock results UI

### Phase 2
- Add backend API endpoints
- Integrate real suburb search provider
- Integrate source estimate providers
- Implement estimate aggregation logic

### Phase 3
- Add map-based suburb selection
- Refine premium UI styling
- Improve confidence logic and error handling

### Phase 4
- Prepare for deployment/config hardening
- Add placeholders for future SSO and persistence

---

## 19. Recommended Tech Stack

### Frontend
- React
- MUI
- React Router (optional, likely minimal for v1)
- React Query or SWR for async request handling
- Zod or Yup for validation

### Backend
- Node.js
- Express / Fastify
- Axios/fetch for provider calls
- dotenv for config

---

## 20. Summary

This v1 should be a polished internal desktop web app that lets a small team search for a suburb, enter last year's valuation, and receive a single current valuation estimate backed by per-site source estimates and clickable links.

The design priority is trust, speed, and a premium real-estate presentation.
