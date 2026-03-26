import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import type { ValuationResult } from '../data/mockData';
import { formatCurrency, formatPercent } from '../utils';

interface EstimateSummaryCardProps {
  result: ValuationResult;
}

export function EstimateSummaryCard({ result }: EstimateSummaryCardProps) {
  return (
    <Paper sx={{ p: 3.5 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="overline" color="text.secondary">
              Estimated current value
            </Typography>
            <Typography variant="h3">{formatCurrency(result.finalEstimate)}</Typography>
          </div>
          <Chip
            icon={<VerifiedRoundedIcon />}
            label={`${result.confidenceLabel} confidence · ${result.confidenceScore}/100`}
            color="success"
          />
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Growth</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpRoundedIcon color="success" />
                  <Typography variant="h5">{formatPercent(result.growthPercent)}</Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4 }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Sources used</Typography>
                <Typography variant="h5">{result.sources.length}</Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}
