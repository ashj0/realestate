import 'dotenv/config';
import express from 'express';
import { applyInputDefaults } from './defaults.js';
import { estimatePropertyGrowth } from './service.js';
import { validateInput } from './validation.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/estimate', async (req, res) => {
  const input = applyInputDefaults(req.body ?? {});
  const validation = validateInput(input);

  if (!validation.valid) {
    res.status(400).json({ errors: validation.errors });
    return;
  }

  const proxyUrl = process.env.APIFY_PROXY_URL;
  if (!proxyUrl) {
    res.status(500).json({ errors: ['APIFY_PROXY_URL is not set'] });
    return;
  }

  try {
    const result = await estimatePropertyGrowth(input, proxyUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ errors: [error instanceof Error ? error.message : 'Unknown error'] });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`property-growth-estimator listening on http://localhost:${port}`);
});
