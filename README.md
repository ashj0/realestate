# Property Growth Estimator App

Node.js/TypeScript API and CLI for the `property-growth-estimator` workflow.

## Setup

```bash
npm install
cp .env.example .env
# set SCRAPFLY_API_KEY in .env
npm run build
npm start
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
  "suburb": "Rivervale WA 6103",
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
    "suburb": "SUBURB STATE POSTCODE",
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
SUBURB="Bondi NSW 2026"
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

## Notes

- Uses Scrapfly rendered responses instead of direct browser navigation.
- Output is validated against the existing JSON schemas in `property-growth-estimator/references/`.
- Parsing is heuristic and should be tightened against real Scrapfly payloads during testing.
