---
name: property-growth-estimator
description: Scrapfly-rendered extraction and normalization of Australian residential property market data from realestate.com.au, domain.com.au, and property.com.au. Use when estimating suburb annual growth, current valuation from last year's valuation, property estimate ranges, sold history, or 3 sold comparable properties for a specific address/suburb. Best for workflows involving suburb + address + property type + lastYearValuation and strict JSON output.
---

# property-growth-estimator

Use Scrapfly-rendered pages and DOM/text extraction to gather property market signals for a target property.

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

1. Prefer known direct property/profile URLs over search.
2. Fetch each property URL through Scrapfly instead of navigating directly in a browser.
3. Use the Scrapfly scrape endpoint:
   - `https://api.scrapfly.io/scrape`
4. Required request parameters for each property page:
   - `url`: target property URL
   - `key`: Scrapfly API key
   - `asp=true` to enable anti-scraping protection bypass
   - `render_js=true`
   - `auto_scroll=true`
   - `rendering_wait=5000`
5. Extract all relevant visible fields from `result.content` in the Scrapfly response.
6. Use DOM selectors first where possible; use text parsing only as fallback.
7. Normalize site data into the output schema.
8. Compute:
   - `growthPercent = average(valid suburbGrowthPercent values where propertyTypeMatched=true)`
   - `currentValuation = lastYearValuation * (1 + growthPercent / 100)`
9. Select up to 3 sold comparables across all visible sources, preferring same suburb and same property type.
10. Return strict JSON only.

## Scrapfly configuration

Use Scrapfly because direct navigation may be blocked, especially by realestate.com.au.

Required parameters:
- `asp: true`
- `render_js: true`
- `auto_scroll: true`
- `rendering_wait: 5000`

If a page still fails, return partial results and record the failure in `errors`.

## Portal rules

### realestate.com.au
Primary source for:
- suburb growth %
- median price
- median price period
- property.com.au backlink if visible

Extract:
- `suburbGrowthPercent` from unit median yearly change percentage
- `medianPrice` from unit median value
- `medianPricePeriod` from unit median display
- `propertyTypeMatched = true` only if the page confirms `unit` or `apartment` context

### domain.com.au
Primary source for:
- address-level estimate range
- estimate accuracy
- update date
- similar properties if visible

Extract:
- `propertyEstimateRange.low`
- `propertyEstimateRange.mid`
- `propertyEstimateRange.high`
- `estimateAccuracy`
- `estimateUpdatedAt`

### property.com.au
Primary source for:
- sold history
- sold comparables
- property profile
- market data if visible
- median prices if visible

Extract only explicit visible values from the rendered response.

## Property type matching

Set `propertyTypeMatched` to true only when the source page explicitly confirms the target property type context.

For `unit`, accept explicit page evidence such as:
- `unit`
- `apartment`

Do not infer match status from suburb-level data alone.

## Confidence

- `high`: multiple valid growth/estimate sources and strong comparables
- `medium`: two useful sources, or one strong source with good comparables
- `low`: one useful source or partial extraction only

## Failure handling

- Never invent values.
- Only use explicit visible values from Scrapfly-rendered content.
- If a portal is blocked, incomplete, or rate-limited, return partial results and explain in `errors`.
- If no valid suburb growth values exist, set `growthPercent` and `currentValuation` to `null`.

## Output

Return exactly:

```json
{
  "input": {"suburb": "...", "address": "...", "propertyType": "unit", "lastYearValuation": 1000000, "comparableType": "sold", "currency": "AUD"},
  "result": {},
  "siteEstimates": {},
  "selectedComparables": [],
  "confidence": "low",
  "assumptions": [],
  "errors": []
}
```

Return strict JSON only.

## References

Read these as needed:
- `references/input-schema.json`
- `references/output-schema-v2.json`
- `references/dom-selector-spec.json`
- `references/example-output.json`
