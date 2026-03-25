import type { ScrapflyResponse } from './types.js';

const SCRAPFLY_ENDPOINT = 'https://api.scrapfly.io/scrape';

export async function fetchScrapflyContent(url: string, apiKey: string): Promise<string> {
  const endpoint = new URL(SCRAPFLY_ENDPOINT);
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('asp', 'true');
  endpoint.searchParams.set('render_js', 'true');
  endpoint.searchParams.set('auto_scroll', 'true');
  endpoint.searchParams.set('rendering_wait', '5000');

  const response = await fetch(endpoint, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Scrapfly request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ScrapflyResponse;
  const content = payload.result?.content;

  if (!content) {
    throw new Error(`Scrapfly returned no rendered content for ${url}`);
  }

  return content;
}
