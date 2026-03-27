import { chromium } from 'playwright';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

function parseProxyUrl(proxyUrl: string) {
  const parsed = new URL(proxyUrl);
  const server = `${parsed.protocol}//${parsed.hostname}:${parsed.port}`;
  const username = decodeURIComponent(parsed.username || '');
  const password = decodeURIComponent(parsed.password || '');

  return { server, username, password };
}

export async function fetchWithPlaywright(url: string, proxyUrl: string): Promise<string> {
  const browser = await chromium.launch({
    headless: true,
    proxy: parseProxyUrl(proxyUrl),
  });

  try {
    const context = await browser.newContext({
      userAgent: process.env.FETCH_USER_AGENT ?? DEFAULT_USER_AGENT,
      locale: 'en-AU',
      extraHTTPHeaders: {
        'accept-language': 'en-AU,en;q=0.9',
      },
      viewport: { width: 1440, height: 1100 },
    });

    const page = await context.newPage();
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    const status = response?.status() ?? null;
    if (status !== null && status >= 400) {
      throw new Error(`Playwright fetch failed for ${url}: ${status}`);
    }

    const content = await page.content();
    if (!content || content.length < 100) {
      throw new Error(`Playwright returned insufficient content for ${url}`);
    }

    await context.close();
    return content;
  } finally {
    await browser.close();
  }
}
