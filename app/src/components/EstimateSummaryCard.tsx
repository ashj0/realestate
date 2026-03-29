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

function HeroMetric({
  label,
  value,
  helper,
  highlight = false,
  positive = false,
}: {
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%', bgcolor: highlight ? 'rgba(25, 118, 210, 0.04)' : 'background.paper' }}>
      <Stack spacing={1}>
        <Typography color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ color: positive ? 'success.main' : highlight ? 'primary.main' : 'text.primary' }}>
          {value}
        </Typography>
        {helper ? (
          <Typography variant="body2" color="text.secondary">
            {helper}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

function DetailRow({ label, value, helper, strong = false }: { label: string; value: string; helper?: string; strong?: boolean }) {
  return (
    <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none', pb: 0 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 500, color: strong ? 'text.primary' : 'text.secondary' }}>
          {value}
        </Typography>
      </Stack>
      {helper ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {helper}
        </Typography>
      ) : null}
    </Box>
  );
}

export function EstimateSummaryCard({ result, loanBalance, sellingCostPercent, existingLoanInterestRate, retainedEquityPercent }: EstimateSummaryCardProps) {
  const lastYearValuation = result.input.lastYearValuation;
  const currentValuation = result.result.currentValuation;
  const increaseAmount = currentValuation === null ? null : currentValuation - lastYearValuation;
  const totalEquity = currentValuation === null ? null : currentValuation - loanBalance;
  const estimatedSellingCosts = currentValuation === null ? null : currentValuation * (sellingCostPercent / 100);
  const annualInterestOnlyCost = loanBalance * (existingLoanInterestRate / 100);
  const retainedEquityAmount = currentValuation === null ? null : currentValuation * (retainedEquityPercent / 100);
  const usableEquityIfHeld = totalEquity === null || retainedEquityAmount === null ? null : totalEquity - retainedEquityAmount;
  const netDeployableEquity =
    currentValuation === null || estimatedSellingCosts === null ? null : currentValuation - loanBalance - estimatedSellingCosts;
  const isUp = increaseAmount !== null && increaseAmount > 0;

  return (
    <Paper sx={{ p: 3.5, height: '100%', width: '100%' }}>
      <Stack spacing={3} sx={{ height: '100%' }}>
        <Stack direction={{ xs: 'column', xl: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', xl: 'center' }} gap={2}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap' }}>
              <Typography variant="h5">Current Property Position</Typography>
              <Chip label="Now" size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Shows what the property is worth today, how much equity sits in it, and how much may actually be usable.
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
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <HeroMetric
              label="Estimated current value"
              value={currentValuation === null ? 'Unavailable' : formatCurrency(currentValuation)}
              helper={`Based on last year's valuation of ${formatCurrency(lastYearValuation)}`}
              highlight
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <HeroMetric label="Loan balance" value={formatCurrency(loanBalance)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <HeroMetric
              label="Net equity"
              value={totalEquity === null ? 'Unavailable' : formatCurrency(totalEquity)}
              helper="Estimated current value minus current loan balance"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <HeroMetric
              label="Usable equity if held"
              value={usableEquityIfHeld === null ? 'Unavailable' : formatCurrency(usableEquityIfHeld)}
              helper={`After retaining ${retainedEquityPercent.toFixed(1)}% equity in the property`}
              positive
            />
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                How usable equity is calculated
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                The detail below separates the hold scenario from the sell-and-redeploy scenario.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Hold position
                </Typography>
                <Box>
                  <DetailRow
                    label="Property increase"
                    value={increaseAmount === null ? 'Unavailable' : formatCurrency(increaseAmount)}
                    helper={
                      result.result.growthPercent === null
                        ? 'Growth estimate unavailable'
                        : `${formatPercent(result.result.growthPercent)} year-on-year`
                    }
                    strong={isUp}
                  />
                  <DetailRow
                    label="Retained equity buffer %"
                    value={formatPercent(retainedEquityPercent)}
                  />
                  <DetailRow
                    label="Retained equity amount"
                    value={retainedEquityAmount === null ? 'Unavailable' : formatCurrency(retainedEquityAmount)}
                  />
                  <DetailRow
                    label="Annual interest-only cost"
                    value={formatCurrency(annualInterestOnlyCost)}
                    helper={`${existingLoanInterestRate.toFixed(1)}% of current loan balance`}
                  />
                  <DetailRow
                    label="Usable equity if held"
                    value={usableEquityIfHeld === null ? 'Unavailable' : formatCurrency(usableEquityIfHeld)}
                    strong
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Sell and redeploy position
                </Typography>
                <Box>
                  <DetailRow
                    label="Estimated selling costs"
                    value={estimatedSellingCosts === null ? 'Unavailable' : formatCurrency(estimatedSellingCosts)}
                    helper={`${sellingCostPercent.toFixed(1)}% of estimated current value`}
                  />
                  <DetailRow
                    label="Net deployable equity"
                    value={netDeployableEquity === null ? 'Unavailable' : formatCurrency(netDeployableEquity)}
                    helper="Estimated current value minus loan balance and selling costs"
                    strong
                  />
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

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
