import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Stack,
} from '@mui/material';
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { SelectedSuburbCard } from './components/SelectedSuburbCard';
import { ValuationForm } from './components/ValuationForm';
import { EstimateSummaryCard } from './components/EstimateSummaryCard';
import { SourceBreakdown } from './components/SourceBreakdown';
import { SourceEstimateList } from './components/SourceEstimateList';
import { propertyOptions } from './data/mockData';
import type { EstimateApiResponse, PropertyOption } from './types';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export default function App() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(propertyOptions[0]);
  const [lastYearValuation, setLastYearValuation] = useState('1850000');
  const [showMap, setShowMap] = useState(false);
  const [result, setResult] = useState<EstimateApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    return Boolean(selectedProperty && Number(lastYearValuation) > 0);
  }, [selectedProperty, lastYearValuation]);

  async function handleGenerateEstimate() {
    if (!selectedProperty || Number(lastYearValuation) <= 0) {
      setError('Select a property and enter a valid valuation first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suburb: selectedProperty.suburb,
          address: selectedProperty.address,
          state: selectedProperty.state,
          postCode: selectedProperty.postcode,
          propertyType: selectedProperty.propertyType,
          lastYearValuation: Number(lastYearValuation),
          comparableType: 'sold',
          currency: 'AUD',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.join(' · ') ?? 'Failed to fetch estimate');
      }

      setResult(data as EstimateApiResponse);
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to fetch estimate');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, rgba(29,53,87,0.10) 0%, rgba(245,241,234,1) 22%, rgba(245,241,234,1) 100%)',
        py: 3,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={2.5}>
          <Header />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={2}>
                <SearchPanel
                  options={propertyOptions}
                  selected={selectedProperty}
                  onChange={setSelectedProperty}
                  mapOpen={showMap}
                  onMapOpen={() => setShowMap(true)}
                  onMapClose={() => setShowMap(false)}
                  apiBaseUrl={API_BASE_URL}
                />
                <SelectedSuburbCard property={selectedProperty} />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <ValuationForm
                valuation={lastYearValuation}
                onChange={setLastYearValuation}
                disabled={!canGenerate || loading}
                onSubmit={handleGenerateEstimate}
              />
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {result ? (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 4 }}>
                  <EstimateSummaryCard result={result} />
                </Grid>
                <Grid size={{ xs: 12, lg: 8 }}>
                  <SourceBreakdown siteEstimates={result.siteEstimates} />
                </Grid>
              </Grid>

              <SourceEstimateList
                siteEstimates={result.siteEstimates}
                selectedComparables={result.selectedComparables}
              />
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
