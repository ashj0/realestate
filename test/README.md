Automated test fixtures live here.

- `address-level.json`: live address-level test using known property URLs
- `suburb-only-rivervale.json`: verifies fallback suburb URL generation without knownUrls
- `address-level-bondi-house.json`: placeholder fixture for a second address-level scenario; replace with live URLs before enabling live assertions

Run tests with:

```bash
SCRAPFLY_API_KEY=your_key_here npm run test
```
