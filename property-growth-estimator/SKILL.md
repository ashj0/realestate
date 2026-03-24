---
name: property-growth-estimator
description: Browser-rendered extraction and normalization of Australian residential property market data from realestate.com.au, domain.com.au, and property.com.au. Use when estimating suburb annual growth, current valuation from last year's valuation, property estimate ranges, sold history, or 3 sold comparable properties for a specific address/suburb. Best for workflows involving suburb + address + property type + lastYearValuation and strict JSON output.
---

# property-growth-estimator

Use browser-rendered pages and DOM selectors to extract property market signals for a target property.

## Inputs

Expect an object with:

```json
{
  "suburb": "Rivervale WA 6103",
  "address": "705/60 Riversdale Road, Rivervale WA 6103",
  "propertyType": "unit",
  "lastYearValuation": 1000000,
  "comparableType": "sold",
  "currency": "AUD"
}
```

Required:
- `suburb`
- `address`
- `propertyType` (`house` or `unit`)
- `lastYearValuation`

Defaults:
- `comparableType = sold`
- `currency = AUD`

## Workflow

1. Prefer direct property/profile URLs over search.
2. Open each portal page once in a rendered browser context.
3. Extract all visible fields from the current DOM before navigating away.
4. Use DOM selectors first; use text parsing only as fallback.
5. Normalize site data into the output schema.
6. Compute:
   - `growthPercent = average(valid suburbGrowthPercent values where propertyTypeMatched=true)`
   - `currentValuation = lastYearValuation * (1 + growthPercent / 100)`
7. Select up to 3 sold comparables, preferring same suburb and same property type.
8. Return strict JSON only.

## Portal rules

### realestate.com.au
Primary source for:
- suburb growth %
- median price
- median price period
- property.com.au backlink

Preferred selectors:
- `[data-testid='growth-percentage']` → attribute `growth`
- `[data-testid='median-price-display']`
- `[data-testid='median-price-date']`
- anchor where `href` contains `property.com.au`

### domain.com.au
Primary source for:
- address-level estimate range
- estimate accuracy
- update date
- similar properties if visible

Preferred selector:
- `[data-testid='estimate-card']`

### property.com.au
Primary source for:
- sold history
- property profile
- sold comparables
- market data if visible

## Confidence

- `high`: 3 valid growth sources and strong comparables
- `medium`: 2 valid growth sources, or 1 strong growth source with good support
- `low`: 1 valid growth source or partial extraction only

## Failure handling

- Never invent values.
- If a portal is blocked or rate-limited, return partial results and explain in `notes` or `errors`.
- If no valid suburb growth values exist, set `growthPercent` and `currentValuation` to `null`.

## References

Read these as needed:
- `references/input-schema.json`
- `references/output-schema-v2.json`
- `references/dom-selector-spec.json`
- `references/example-output.json`
