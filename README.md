# Property Growth Estimator App

Node.js/TypeScript API and CLI for the `property-growth-estimator` workflow, plus a starter React + MUI frontend scaffold for the suburb valuation UI.

## Setup

### Backend

```bash
npm install
cp .env.example .env
# set APIFY_PROXY_URL in .env
# optional: set FETCH_MODE=playwright for browser-backed fetches
npm run build
npm start
```

### Frontend scaffold

```bash
cd app
npm install
cp .env.example .env
npm run dev
```

## API

Start server:

```bash
npm run dev
```

Health check:

```bash
GET /health
```

Estimate:

```bash
POST /estimate
Content-Type: application/json
```

Example request body:

```json
{
  "suburb": "Rivervale",
  "state": "WA",
  "postCode": "6103",
  "address": "705/60 Riversdale Road, Rivervale WA 6103",
  "propertyType": "unit",
  "lastYearValuation": 1000000,
  "comparableType": "sold",
  "currency": "AUD",
  "knownUrls": {
    "realestate": "https://www.realestate.com.au/property/unit-705-60-riversdale-rd-rivervale-wa-6103/",
    "domain": "https://www.domain.com.au/property-profile/705-60-riversdale-road-rivervale-wa-6103",
    "property": "https://www.property.com.au/wa/rivervale-6103/riversdale-rd/705-60-pid-20009700/"
  }
}
```

If you omit `knownUrls`, the app can build suburb-level fallback URLs from:
- `suburb`
- `state`
- `postCode`

Fallback URL formats:
- `https://www.realestate.com.au/{state}/{suburb}-{postCode}/`
- `https://www.property.com.au/{state}/{suburb}-{postCode}/`
- `https://www.domain.com.au/suburb-profile/{suburb}-{state}-{postCode}`

## CLI

```bash
npm run cli -- '{"suburb":"Rivervale WA 6103","address":"705/60 Riversdale Road, Rivervale WA 6103","propertyType":"unit","lastYearValuation":1000000,"comparableType":"sold","currency":"AUD"}'
```

## curl examples

Arbitrary address template:

```bash
curl -s -X POST http://localhost:3000/estimate \
  -H 'Content-Type: application/json' \
  -d '{
    "suburb": "SUBURB",
    "state": "STATE",
    "postCode": "POSTCODE",
    "address": "FULL STREET ADDRESS, SUBURB STATE POSTCODE",
    "propertyType": "unit",
    "lastYearValuation": 1000000,
    "comparableType": "sold",
    "currency": "AUD",
    "knownUrls": {
      "realestate": "https://www.realestate.com.au/...",
      "domain": "https://www.domain.com.au/...",
      "property": "https://www.property.com.au/..."
    }
  }' | jq
```

Example with shell variables:

```bash
SUBURB="Bondi"
STATE="NSW"
POSTCODE="2026"
ADDRESS="1 Example Street, Bondi NSW 2026"
PROPERTY_TYPE="house"
LAST_YEAR_VALUATION="2500000"
REA_URL="https://www.realestate.com.au/property-house-nsw-bondi-123456789"
DOMAIN_URL="https://www.domain.com.au/property-profile/1-example-street-bondi-nsw-2026"
PROPERTY_URL="https://www.property.com.au/nsw/bondi-2026/example-st/1-pid-1234567/"

curl -s -X POST http://localhost:3000/estimate \
  -H 'Content-Type: application/json' \
  -d "{
    \"suburb\": \"$SUBURB\",
    \"state\": \"$STATE\",
    \"postCode\": \"$POSTCODE\",
    \"address\": \"$ADDRESS\",
    \"propertyType\": \"$PROPERTY_TYPE\",
    \"lastYearValuation\": $LAST_YEAR_VALUATION,
    \"comparableType\": \"sold\",
    \"currency\": \"AUD\",
    \"knownUrls\": {
      \"realestate\": \"$REA_URL\",
      \"domain\": \"$DOMAIN_URL\",
      \"property\": \"$PROPERTY_URL\"
    }
  }" | jq
```

Example using suburb/state/postCode only (no `knownUrls`):

```bash
curl -s -X POST http://localhost:3000/estimate \
  -H 'Content-Type: application/json' \
  -d '{
    "suburb": "Rivervale",
    "state": "WA",
    "postCode": "6103",
    "address": "705/60 Riversdale Road, Rivervale WA 6103",
    "propertyType": "unit",
    "lastYearValuation": 1000000,
    "comparableType": "sold",
    "currency": "AUD"
  }' | jq
```

This will generate fallback suburb URLs automatically:
- `https://www.realestate.com.au/wa/rivervale-6103/`
- `https://www.property.com.au/wa/rivervale-6103/`
- `https://www.domain.com.au/suburb-profile/rivervale-wa-6103`

## Usage modes

### Address-level mode

Use this when you know the exact property/profile URLs and want the most precise extraction.

Inputs typically include:
- `suburb`
- `state`
- `postCode`
- `address`
- `knownUrls`

Best for:
- address-specific estimates
- sold history for a property
- tighter comparable selection

### Suburb-only mode

Use this when you only know suburb-level location details and want the app to generate fallback URLs.

Inputs typically include:
- `suburb`
- `state`
- `postCode`
- optional `address`
- no `knownUrls`

Best for:
- suburb-level growth lookup
- median price lookup
- early-stage testing before exact property URLs are known

Tradeoff:
- suburb-only mode is more convenient
- address-level mode is usually more accurate

## Frontend scaffold

The React app lives in `app/` and currently includes:
- premium desktop-first MUI layout
- suburb autocomplete with mock data
- selected suburb summary card
- last year valuation form
- estimate summary card
- source breakdown with clickable links
- placeholder map-selection entry point

Next step is wiring this scaffold to real search, map, and estimate APIs.

## Notes

- Supports direct HTML fetches through an Apify proxy, with optional Playwright browser fetch mode behind the same proxy.
- Output is validated against the existing JSON schemas in `property-growth-estimator/references/`.
- Parsing is heuristic and should be tightened against real Scrapfly payloads during testing.
