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

async function handlePropertyAutocomplete(req: express.Request, res: express.Response) {
  const query = typeof req.query.q === 'string' ? req.query.q : '';

  if (query.trim().length < 3) {
    res.json([]);
    return;
  }

  try {
    const { searchPropertyAutocomplete } = await import('./autocomplete.js');
    const results = await searchPropertyAutocomplete(query);
    res.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('429')) {
      res.json([]);
      return;
    }
    res.status(500).json({ errors: [message] });
  }
}

async function handleEstimate(req: express.Request, res: express.Response) {
  const input = applyInputDefaults(req.body ?? {});
  const validation = validateInput(input);

  if (!validation.valid) {
    res.status(400).json({ errors: validation.errors });
    return;
  }

  const apiKey = process.env.SCRAPFLY_API_KEY;
  if (!apiKey) {
    res.status(500).json({ errors: ['SCRAPFLY_API_KEY is not set'] });
    return;
  }

  try {
    const result = await estimatePropertyGrowth(input, '');
    res.json(result);
  } catch (error) {
    res.status(500).json({ errors: [error instanceof Error ? error.message : 'Unknown error'] });
  }
}

app.get('/property-autocomplete', handlePropertyAutocomplete);
app.get('/api/property-autocomplete', handlePropertyAutocomplete);

app.post('/estimate', handleEstimate);
app.post('/api/estimate', handleEstimate);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`property-growth-estimator listening on http://localhost:${port}`);
});
