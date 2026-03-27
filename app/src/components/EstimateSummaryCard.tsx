import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { Alert, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import type { EstimateApiResponse } from '../types';
import { formatCurrency, formatPercent } from '../utils';

interface EstimateSummaryCardProps {
  result: EstimateApiResponse;
}

function toConfidenceLabel(value: EstimateApiResponse['confidence']) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toConfidenceScore(value: EstimateApiResponse['confidence']) {
  if (value === 'high') return 85;
  if (value === 'medium') return 65;
  return 40;
}

export function EstimateSummaryCard({ result }: EstimateSummaryCardProps) {
  return (
    <Paper sx={{ p: 3.5 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <div>
            <Typography variant="overline" color="text.secondary">
              Estimated current value
            </Typography>
            <Typography variant="h3">
              {result.result.currentValuation === null ? 'Unavailable' : formatCurrency(result.result.currentValuation)}
            </Typography>
          </div>
          <Chip
            icon={<VerifiedRoundedIcon />}
            label={`${toConfidenceLabel(result.confidence)} confidence · ${toConfidenceScore(result.confidence)}/100`}
            color={result.confidence === 'high' ? 'success' : result.confidence === 'medium' ? 'primary' : 'default'}
          />
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Average suburb growth</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpRoundedIcon color={result.result.growthPercent !== null ? 'success' : 'disabled'} />
                  <Typography variant="h5">
                    {result.result.growthPercent === null ? 'Unavailable' : formatPercent(result.result.growthPercent)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Sources used</Typography>
                <Typography variant="h5">{result.result.sitesUsed.length}</Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {result.errors.length ? <Alert severity="warning">{result.errors.join(' · ')}</Alert> : null}
      </Stack>
    </Paper>
  );
}
