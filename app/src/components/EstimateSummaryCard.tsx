import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { Alert, Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import type { EstimateApiResponse } from '../types';
import { formatCurrency, formatPercent } from '../utils';

interface EstimateSummaryCardProps {
  result: EstimateApiResponse;
  loanBalance: number;
  sellingCostPercent: number;
  existingLoanInterestRate: number;
  retainedEquityPercent: number;
}

function toConfidenceLabel(value: EstimateApiResponse['confidence']) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toConfidenceScore(value: EstimateApiResponse['confidence']) {
  if (value === 'high') return 85;
  if (value === 'medium') return 65;
  return 40;
}

export function EstimateSummaryCard({ result, loanBalance, sellingCostPercent, existingLoanInterestRate, retainedEquityPercent }: EstimateSummaryCardProps) {
  const lastYearValuation = result.input.lastYearValuation;
  const currentValuation = result.result.currentValuation;
  const increaseAmount = currentValuation === null ? null : currentValuation - lastYearValuation;
  const totalEquity = currentValuation === null ? null : currentValuation - loanBalance;
  const estimatedSellingCosts = currentValuation === null ? null : currentValuation * (sellingCostPercent / 100);
  const annualInterestOnlyCost = loanBalance * (existingLoanInterestRate / 100);
  const retainedEquityAmount = currentValuation === null ? null : currentValuation * (retainedEquityPercent / 100);
  const usableEquityIfHeld =
    totalEquity === null || retainedEquityAmount === null ? null : totalEquity - retainedEquityAmount;
  const netDeployableEquity =
    currentValuation === null || estimatedSellingCosts === null ? null : currentValuation - loanBalance - estimatedSellingCosts;
  const isUp = increaseAmount !== null && increaseAmount > 0;
  const isEquityUp = totalEquity !== null && totalEquity > 0;
  const isDeployableUp = netDeployableEquity !== null && netDeployableEquity > 0;

  return (
    <Paper sx={{ p: 3.5, height: '100%', width: '100%' }}>
      <Stack spacing={3} sx={{ height: '100%' }}>
        <Stack direction={{ xs: 'column', xl: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', xl: 'center' }} gap={2}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="overline" color="text.secondary">
              Estimated current value
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color: isUp ? 'success.main' : 'text.primary',
                wordBreak: 'break-word',
                lineHeight: 1.05,
              }}
            >
              {currentValuation === null ? 'Unavailable' : formatCurrency(currentValuation)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Based on last year&apos;s valuation of {formatCurrency(lastYearValuation)}
            </Typography>
          </Box>
          <Chip
            icon={<VerifiedRoundedIcon />}
            label={`${toConfidenceLabel(result.confidence)} confidence · ${toConfidenceScore(result.confidence)}/100`}
            color={result.confidence === 'high' ? 'success' : result.confidence === 'medium' ? 'primary' : 'default'}
            sx={{ maxWidth: '100%' }}
          />
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Last year&apos;s valuation</Typography>
                <Typography variant="h5">{formatCurrency(lastYearValuation)}</Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
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
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Current loan balance</Typography>
                <Typography variant="h5">{formatCurrency(loanBalance)}</Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Total equity</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpRoundedIcon color={isEquityUp ? 'success' : 'disabled'} />
                  <Typography variant="h5" sx={{ color: isEquityUp ? 'success.main' : 'text.primary' }}>
                    {totalEquity === null ? 'Unavailable' : formatCurrency(totalEquity)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Estimated current value - current loan balance
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Usable equity if held</Typography>
                <Typography variant="h5">{usableEquityIfHeld === null ? 'Unavailable' : formatCurrency(usableEquityIfHeld)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total equity - retained equity requirement ({retainedEquityPercent.toFixed(1)}%)
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Net deployable equity</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpRoundedIcon color={isDeployableUp ? 'success' : 'disabled'} />
                  <Typography variant="h5" sx={{ color: isDeployableUp ? 'success.main' : 'text.primary' }}>
                    {netDeployableEquity === null ? 'Unavailable' : formatCurrency(netDeployableEquity)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Current value - loan balance - selling costs
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Estimated selling costs</Typography>
                <Typography variant="h5">
                  {estimatedSellingCosts === null ? 'Unavailable' : formatCurrency(estimatedSellingCosts)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sellingCostPercent.toFixed(1)}% of estimated current value
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Annual interest-only cost</Typography>
                <Typography variant="h5">{formatCurrency(annualInterestOnlyCost)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {existingLoanInterestRate.toFixed(1)}% of current loan balance
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
            <Stack spacing={0.5}>
              {result.assumptions.slice(0, 2).map((assumption) => (
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
