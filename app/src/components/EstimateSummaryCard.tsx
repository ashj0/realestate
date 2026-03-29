import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { Alert, Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
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
  const lastYearValuation = result.input.lastYearValuation;
  const currentValuation = result.result.currentValuation;
  const increaseAmount = currentValuation === null ? null : currentValuation - lastYearValuation;
  const isUp = increaseAmount !== null && increaseAmount > 0;

  return (
    <Paper sx={{ p: 3.5, height: '100%' }}>
      <Stack spacing={3} sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <div>
            <Typography variant="overline" color="text.secondary">
              Estimated current value
            </Typography>
            <Typography variant="h3" sx={{ color: isUp ? 'success.main' : 'text.primary' }}>
              {currentValuation === null ? 'Unavailable' : formatCurrency(currentValuation)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Based on last year&apos;s valuation of {formatCurrency(lastYearValuation)}
            </Typography>
          </div>
          <Chip
            icon={<VerifiedRoundedIcon />}
            label={`${toConfidenceLabel(result.confidence)} confidence · ${toConfidenceScore(result.confidence)}/100`}
            color={result.confidence === 'high' ? 'success' : result.confidence === 'medium' ? 'primary' : 'default'}
          />
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Last year&apos;s valuation</Typography>
                <Typography variant="h5">{formatCurrency(lastYearValuation)}</Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Property increase</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpRoundedIcon color={isUp ? 'success' : 'disabled'} />
                  <Typography variant="h5" sx={{ color: isUp ? 'success.main' : 'text.primary' }}>
                    {increaseAmount === null ? 'Unavailable' : formatCurrency(increaseAmount)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {result.result.growthPercent === null ? 'Growth unavailable' : `${formatPercent(result.result.growthPercent)} year-on-year`}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Sources used</Typography>
                <Typography variant="h5">{result.result.sitesUsed.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.result.sitesUsed.length ? result.result.sitesUsed.join(' · ') : 'No sources available'}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {result.assumptions.length ? (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Methodology notes
            </Typography>
            <Stack spacing={0.75}>
              {result.assumptions.slice(0, 3).map((assumption) => (
                <Typography key={assumption} variant="body2" color="text.secondary">
                  • {assumption}
                </Typography>
              ))}
            </Stack>
          </Box>
        ) : null}

        {result.errors.length ? <Alert severity="warning">{result.errors.join(' · ')}</Alert> : null}
      </Stack>
    </Paper>
  );
}
