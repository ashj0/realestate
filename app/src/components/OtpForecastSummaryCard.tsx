import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import { formatCurrency, formatPercent } from '../utils';

interface OtpForecastSummaryCardProps {
  purchasePrice: number;
  propertyCount: number;
  depositPercent: number;
  useDepositBond: boolean;
  actualUpfrontCashPerProperty: number;
  annualGrowthPercent: number;
  yearsToCompletion: number;
  retainedEquityPercent: number;
  netDeployableEquity: number | null;
  principalInterestCost: number;
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
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 4,
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
        bgcolor: highlight ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
      }}
    >
      <Stack spacing={1} sx={{ minWidth: 0 }}>
        <Typography color="text.secondary">{label}</Typography>
        <Typography
          variant="h5"
          sx={{
            color: positive ? 'success.main' : highlight ? 'primary.main' : 'text.primary',
            overflowWrap: 'anywhere',
            lineHeight: 1.15,
          }}
        >
          {value}
        </Typography>
        {helper ? (
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {helper}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

function DetailRow({ label, value, helper, strong = false }: { label: string; value: string; helper?: string; strong?: boolean }) {
  return (
    <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none', pb: 0 }, minWidth: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: strong ? 700 : 500, color: strong ? 'text.primary' : 'text.secondary', overflowWrap: 'anywhere' }}
        >
          {value}
        </Typography>
      </Stack>
      {helper ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}>
          {helper}
        </Typography>
      ) : null}
    </Box>
  );
}

export function OtpForecastSummaryCard({
  purchasePrice,
  propertyCount,
  depositPercent,
  useDepositBond,
  actualUpfrontCashPerProperty,
  annualGrowthPercent,
  yearsToCompletion,
  retainedEquityPercent,
  netDeployableEquity,
  principalInterestCost,
}: OtpForecastSummaryCardProps) {
  const depositAmount = purchasePrice * (depositPercent / 100);
  const actualUpfrontCash = useDepositBond ? actualUpfrontCashPerProperty : depositAmount;
  const forecastCompletionValue = purchasePrice * Math.pow(1 + annualGrowthPercent / 100, yearsToCompletion);
  const forecastEquityGainPerProperty = forecastCompletionValue - purchasePrice;
  const retainedEquityPerProperty = forecastCompletionValue * (retainedEquityPercent / 100);
  const usableOtpEquityPerProperty = forecastCompletionValue - retainedEquityPerProperty;
  const totalUpfrontCashNeeded = actualUpfrontCash * propertyCount;
  const totalProjectedGain = forecastEquityGainPerProperty * propertyCount;
  const totalUsableOtpEquity = usableOtpEquityPerProperty * propertyCount;
  const fundingSurplusShortfall = netDeployableEquity === null ? null : netDeployableEquity - totalUpfrontCashNeeded;
  const hasPositiveGain = totalProjectedGain > 0;
  const hasFundingCover = fundingSurplusShortfall !== null && fundingSurplusShortfall >= 0;

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3.5 }, width: '100%', overflow: 'hidden' }}>
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Projected OTP Outcome</Typography>
              <Chip label="At completion" size="small" variant="outlined" />
            </Stack>
            <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              Focuses on the likely future outcome first, with the funding and assumption detail grouped underneath.
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <HeroMetric label="Purchase price" value={formatCurrency(purchasePrice)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <HeroMetric
              label="Projected completion value"
              value={formatCurrency(forecastCompletionValue)}
              helper={`${formatPercent(annualGrowthPercent)} over ${yearsToCompletion} years`}
              highlight
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <HeroMetric
              label="Projected equity created"
              value={formatCurrency(forecastEquityGainPerProperty)}
              helper="Completion value minus purchase price"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <HeroMetric
              label="Usable equity at completion"
              value={formatCurrency(usableOtpEquityPerProperty)}
              helper={`After retaining ${retainedEquityPercent.toFixed(1)}% equity`}
              positive
            />
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, overflow: 'hidden' }}>
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Forecast assumptions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
                These settings explain how the completion outcome and funding position have been modeled.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: '100%', overflow: 'hidden' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Project setup
                  </Typography>
                  <Box>
                    <DetailRow label="Number of OTP properties" value={String(propertyCount)} />
                    <DetailRow
                      label="Deposit structure"
                      value={formatPercent(depositPercent)}
                      helper={useDepositBond ? 'Using deposit bond structure' : 'Using full cash deposit structure'}
                    />
                    <DetailRow label="Deposit amount per property" value={formatCurrency(depositAmount)} />
                    <DetailRow
                      label="Actual upfront cash per property"
                      value={formatCurrency(actualUpfrontCash)}
                      helper={useDepositBond ? 'Deposit bond cash assumption applied' : 'Matches full deposit amount'}
                    />
                    <DetailRow label="Total upfront cash needed" value={formatCurrency(totalUpfrontCashNeeded)} strong />
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3, height: '100%', overflow: 'hidden' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Growth and outcome
                  </Typography>
                  <Box>
                    <DetailRow label="Forecast annual growth" value={formatPercent(annualGrowthPercent)} />
                    <DetailRow label="Years to completion" value={String(yearsToCompletion)} />
                    <DetailRow
                      label="Total projected gain"
                      value={formatCurrency(totalProjectedGain)}
                      helper={`Across ${propertyCount} ${propertyCount === 1 ? 'property' : 'properties'}`}
                      strong={hasPositiveGain}
                    />
                    <DetailRow label="Total usable OTP equity" value={formatCurrency(totalUsableOtpEquity)} strong />
                    <DetailRow label="Principal & interest cost" value={formatCurrency(principalInterestCost)} />
                    <DetailRow
                      label="Funding surplus / shortfall"
                      value={fundingSurplusShortfall === null ? 'Unavailable' : formatCurrency(fundingSurplusShortfall)}
                      helper="Net deployable equity minus total upfront cash needed"
                      strong={hasFundingCover}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, overflow: 'hidden' }}>
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <TrendingUpRoundedIcon color={hasPositiveGain ? 'success' : 'disabled'} sx={{ mt: 0.25 }} />
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              {hasFundingCover
                ? 'Current modeled deployable equity appears sufficient to fund the upfront OTP structure.'
                : 'Review the funding gap if the modeled deployable equity does not fully cover the upfront OTP structure.'}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
