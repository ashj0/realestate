import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

function validateProxyUrl(proxyUrl: string): string {
  const parsed = new URL(proxyUrl);

  if (!parsed.hostname || !parsed.port) {
    throw new Error('APIFY_PROXY_URL must include hostname and port');
  }

  return parsed.toString();
}

export async function fetchViaApifyProxy(url: string, proxyUrl: string): Promise<string> {
  const agent = new HttpsProxyAgent(validateProxyUrl(proxyUrl));

  const response = await axios.get<string>(url, {
    responseType: 'text',
    timeout: 60000,
    httpAgent: agent,
    httpsAgent: agent,
    proxy: false,
    headers: {
      'user-agent': process.env.FETCH_USER_AGENT ?? DEFAULT_USER_AGENT,
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'en-AU,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Apify proxy request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = String(response.headers['content-type'] ?? '');
  if (!contentType.includes('text/html')) {
    const bodySnippet = String(response.data).slice(0, 500);
    throw new Error(`Unexpected content-type for ${url}: ${contentType || 'unknown'} :: ${bodySnippet}`);
  }

  return String(response.data);
}
