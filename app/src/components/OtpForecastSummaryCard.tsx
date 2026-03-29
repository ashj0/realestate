import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { Grid, Paper, Stack, Typography } from '@mui/material';
import { formatCurrency, formatPercent } from '../utils';

interface OtpForecastSummaryCardProps {
  purchasePrice: number;
  propertyCount: number;
  depositPercent: number;
  useDepositBond: boolean;
  actualUpfrontCashPerProperty: number;
  annualGrowthPercent: number;
  yearsToCompletion: number;
  netDeployableEquity: number | null;
}

export function OtpForecastSummaryCard({
  purchasePrice,
  propertyCount,
  depositPercent,
  useDepositBond,
  actualUpfrontCashPerProperty,
  annualGrowthPercent,
  yearsToCompletion,
  netDeployableEquity,
}: OtpForecastSummaryCardProps) {
  const depositAmount = purchasePrice * (depositPercent / 100);
  const actualUpfrontCash = useDepositBond ? actualUpfrontCashPerProperty : depositAmount;
  const forecastCompletionValue = purchasePrice * Math.pow(1 + annualGrowthPercent / 100, yearsToCompletion);
  const forecastEquityGainPerProperty = forecastCompletionValue - purchasePrice;
  const projectedEquityPerProperty = actualUpfrontCash + forecastEquityGainPerProperty;
  const totalUpfrontCashNeeded = actualUpfrontCash * propertyCount;
  const totalProjectedGain = forecastEquityGainPerProperty * propertyCount;
  const totalProjectedOtpEquity = projectedEquityPerProperty * propertyCount;
  const fundingSurplusShortfall = netDeployableEquity === null ? null : netDeployableEquity - totalUpfrontCashNeeded;
  const hasPositiveGain = totalProjectedGain > 0;
  const hasFundingCover = fundingSurplusShortfall !== null && fundingSurplusShortfall >= 0;

  return (
    <Paper sx={{ p: 3.5, width: '100%' }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h5">OTP forecast summary</Typography>
          <Typography color="text.secondary">
            Estimate the completion value, expected gain, projected OTP equity position, and whether current deployable equity can fund the upfront structure.
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Forecast completion value</Typography>
                <Typography variant="h5">{formatCurrency(forecastCompletionValue)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPercent(annualGrowthPercent)} over {yearsToCompletion} years
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Forecast gain per property</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpRoundedIcon color={hasPositiveGain ? 'success' : 'disabled'} />
                  <Typography variant="h5" sx={{ color: hasPositiveGain ? 'success.main' : 'text.primary' }}>
                    {formatCurrency(forecastEquityGainPerProperty)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Completion value - purchase price
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Projected equity per property</Typography>
                <Typography variant="h5">{formatCurrency(projectedEquityPerProperty)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Upfront cash committed + forecast gain
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Total projected OTP equity</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpRoundedIcon color={hasPositiveGain ? 'success' : 'disabled'} />
                  <Typography variant="h5" sx={{ color: hasPositiveGain ? 'success.main' : 'text.primary' }}>
                    {formatCurrency(totalProjectedOtpEquity)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Across {propertyCount} properties
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Deposit amount per property</Typography>
                <Typography variant="h5">{formatCurrency(depositAmount)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {depositPercent.toFixed(1)}% deposit structure
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Total upfront cash needed</Typography>
                <Typography variant="h5">{formatCurrency(totalUpfrontCashNeeded)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {useDepositBond ? 'Using deposit bond cash assumption' : 'Using full deposit amount'}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Funding surplus / shortfall</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpRoundedIcon color={hasFundingCover ? 'success' : 'disabled'} />
                  <Typography variant="h5" sx={{ color: hasFundingCover ? 'success.main' : 'text.primary' }}>
                    {fundingSurplusShortfall === null ? 'Unavailable' : formatCurrency(fundingSurplusShortfall)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Net deployable equity - total upfront cash
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}
