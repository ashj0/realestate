import { useMemo, useState } from 'react';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { SelectedSuburbCard } from './components/SelectedSuburbCard';
import { ValuationForm } from './components/ValuationForm';
import { EstimateSummaryCard } from './components/EstimateSummaryCard';
import { SourceEstimateList } from './components/SourceEstimateList';
import { propertyOptions } from './data/mockData';
import type { EstimateApiResponse, PropertyOption } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

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
        py: 6,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Header />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={3}>
                <SearchPanel
                  options={propertyOptions}
                  selected={selectedProperty}
                  onChange={setSelectedProperty}
                  mapOpen={showMap}
                  onMapOpen={() => setShowMap(true)}
                  onMapClose={() => setShowMap(false)}
                />
                <SelectedSuburbCard property={selectedProperty} />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3}>
                <ValuationForm
                  valuation={lastYearValuation}
                  onChange={setLastYearValuation}
                  disabled={!canGenerate || loading}
                  onSubmit={handleGenerateEstimate}
                />
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 5,
                    bgcolor: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(29,53,87,0.08)',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" color="text.secondary">
                      What happens next
                    </Typography>
                    <Typography variant="h6">
                      Once a property is selected, the app sends the suburb and property type to the API
                      and returns growth data from realestate.com.au, Domain, and property.com.au.
                    </Typography>
                    <Button startIcon={<ApartmentRoundedIcon />} variant="text" sx={{ px: 0, alignSelf: 'flex-start' }}>
                      Backend wired to /estimate
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {result ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 5 }}>
                <EstimateSummaryCard result={result} />
              </Grid>
              <Grid size={{ xs: 12, lg: 7 }}>
                <SourceEstimateList siteEstimates={result.siteEstimates} />
              </Grid>
            </Grid>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
