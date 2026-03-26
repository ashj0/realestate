import { useMemo, useState } from 'react';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import {
  Box,
  Button,
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
import { mockValuationResult, suburbOptions, type SuburbOption } from './data/mockData';

export default function App() {
  const [selectedSuburb, setSelectedSuburb] = useState<SuburbOption | null>(suburbOptions[0]);
  const [lastYearValuation, setLastYearValuation] = useState('1850000');
  const [showResults, setShowResults] = useState(true);

  const canGenerate = useMemo(() => {
    return Boolean(selectedSuburb && Number(lastYearValuation) > 0);
  }, [selectedSuburb, lastYearValuation]);

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
                  options={suburbOptions}
                  selected={selectedSuburb}
                  onChange={setSelectedSuburb}
                />
                <SelectedSuburbCard suburb={selectedSuburb} />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={3}>
                <ValuationForm
                  valuation={lastYearValuation}
                  onChange={setLastYearValuation}
                  disabled={!canGenerate}
                  onSubmit={() => setShowResults(true)}
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
                      Ready for the next step
                    </Typography>
                    <Typography variant="h6">
                      This scaffold is set up for a real search API, map picker, and backend estimate
                      endpoint.
                    </Typography>
                    <Button startIcon={<ApartmentRoundedIcon />} variant="text" sx={{ px: 0, alignSelf: 'flex-start' }}>
                      Replace mock data next
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          {showResults ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 5 }}>
                <EstimateSummaryCard result={mockValuationResult} />
              </Grid>
              <Grid size={{ xs: 12, lg: 7 }}>
                <SourceEstimateList sources={mockValuationResult.sources} />
              </Grid>
            </Grid>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
