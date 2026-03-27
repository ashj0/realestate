import { chromium } from 'playwright';

async function main() {
  const proxyUrl = process.env.APIFY_PROXY_URL;
  if (!proxyUrl) throw new Error('APIFY_PROXY_URL is not set');

  const parsed = new URL(proxyUrl);
  const browser = await chromium.launch({
    headless: true,
    proxy: {
      server: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
      username: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
    },
  });

  try {
    const page = await browser.newPage();
    const response = await page.goto('http://httpbin.org/ip', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    console.log(JSON.stringify({ status: response?.status() ?? null, body: await page.textContent('body') }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
