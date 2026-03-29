import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
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
  const [principal, setPrincipal] = useState('400000');
  const [showMap, setShowMap] = useState(false);
  const [result, setResult] = useState<EstimateApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    return Boolean(selectedProperty && Number(lastYearValuation) > 0 && Number(principal) >= 0);
  }, [selectedProperty, lastYearValuation, principal]);

  async function handleGenerateEstimate() {
    if (!selectedProperty || Number(lastYearValuation) <= 0 || Number(principal) < 0) {
      setError('Select a property and enter a valid valuation and principal first.');
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
          principal: Number(principal),
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

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(320px, 3fr)' },
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <SearchPanel
                options={propertyOptions}
                selected={selectedProperty}
                onChange={setSelectedProperty}
                mapOpen={showMap}
                onMapOpen={() => setShowMap(true)}
                onMapClose={() => setShowMap(false)}
                apiBaseUrl={API_BASE_URL}
              />
            </Box>
            <Box sx={{ minWidth: 0, gridRow: { xs: 'auto', lg: 'span 2' } }}>
              <ValuationForm
                valuation={lastYearValuation}
                principal={principal}
                onValuationChange={setLastYearValuation}
                onPrincipalChange={setPrincipal}
                disabled={!canGenerate || loading}
                onSubmit={handleGenerateEstimate}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <SelectedSuburbCard property={selectedProperty} />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {result ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(320px, 3fr)' },
                  alignItems: { xs: 'start', lg: 'stretch' },
                }}
              >
                <Box sx={{ minWidth: 0, display: 'flex' }}>
                  <EstimateSummaryCard result={result} principal={Number(principal) || 0} />
                </Box>
                <Box sx={{ minWidth: 0, display: 'flex' }}>
                  <SourceBreakdown siteEstimates={result.siteEstimates} />
                </Box>
              </Box>

              <Box sx={{ width: '100%' }}>
                <SourceEstimateList
                  siteEstimates={result.siteEstimates}
                  selectedComparables={result.selectedComparables}
                />
              </Box>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
