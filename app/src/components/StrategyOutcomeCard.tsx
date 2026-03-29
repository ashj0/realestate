import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import PauseCircleRoundedIcon from '@mui/icons-material/PauseCircleRounded';
import { Alert, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import { formatCurrency, formatPercent } from '../utils';

interface StrategyOutcomeCardProps {
  valuationConfidence: 'low' | 'medium' | 'high';
  growthPercent: number | null;
  currentValuation: number | null;
  netDeployableEquity: number | null;
  totalProjectedGain: number;
  totalUpfrontCashNeeded: number;
  fundingSurplusShortfall: number | null;
  useDepositBond: boolean;
  propertyCount: number;
  annualGrowthPercent: number;
}

function buildRecommendation(props: StrategyOutcomeCardProps) {
  const {
    netDeployableEquity,
    totalProjectedGain,
    totalUpfrontCashNeeded,
    fundingSurplusShortfall,
    propertyCount,
    annualGrowthPercent,
  } = props;

  if (netDeployableEquity === null || netDeployableEquity <= 0) {
    return {
      label: 'Insufficient Equity',
      color: 'default' as const,
      icon: <ErrorOutlineRoundedIcon />,
      summary: 'Estimated deployable equity is not yet strong enough to support the modeled redeployment strategy.',
    };
  }

  if (fundingSurplusShortfall !== null && fundingSurplusShortfall >= 0 && totalProjectedGain > 0) {
    return {
      label: 'Sell and Redeploy Candidate',
      color: 'success' as const,
      icon: <CheckCircleRoundedIcon />,
      summary: `Estimated deployable equity appears sufficient to fund ${propertyCount} off-the-plan properties with projected growth of ${formatPercent(annualGrowthPercent)} per year.`,
    };
  }

  if (totalProjectedGain > 0 && totalUpfrontCashNeeded > netDeployableEquity) {
    return {
      label: 'Potential Sell Candidate',
      color: 'primary' as const,
      icon: <InsightsRoundedIcon />,
      summary: 'The strategy may work, but the current property does not appear to release enough deployable equity to fully fund the modeled upfront cash requirement.',
    };
  }

  return {
    label: 'Hold / Monitor',
    color: 'default' as const,
    icon: <PauseCircleRoundedIcon />,
    summary: 'The current assumptions do not yet show a clear advantage in rotating this equity into the modeled off-the-plan scenario.',
  };
}

export function StrategyOutcomeCard(props: StrategyOutcomeCardProps) {
  const recommendation = buildRecommendation(props);
  const warnings: string[] = [];

  const keepPropertyValueIn3Years =
    props.currentValuation === null || props.growthPercent === null
      ? null
      : props.currentValuation * Math.pow(1 + props.growthPercent / 100, 3);

  const keepPropertyGainIn3Years =
    keepPropertyValueIn3Years === null || props.currentValuation === null
      ? null
      : keepPropertyValueIn3Years - props.currentValuation;

  const sellAndBuyOutcomeIn3Years = props.totalProjectedGain;
  const strategyDifference =
    keepPropertyGainIn3Years === null ? null : sellAndBuyOutcomeIn3Years - keepPropertyGainIn3Years;

  if (props.valuationConfidence === 'low') {
    warnings.push('Valuation confidence is low, so current value and deployable equity may move materially.');
  }

  if (props.growthPercent === null) {
    warnings.push('Current property growth estimate is unavailable, so the keep-vs-sell comparison is less reliable.');
  }

  if (props.useDepositBond) {
    warnings.push('Deposit bond assumptions should be validated against the actual project and lender structure.');
  }

  if (props.fundingSurplusShortfall !== null && props.fundingSurplusShortfall < 0) {
    warnings.push(`Modeled strategy is short by ${formatCurrency(Math.abs(props.fundingSurplusShortfall))} on upfront cash requirements.`);
  }

  if (props.annualGrowthPercent >= 10) {
    warnings.push('Forecast annual growth assumption is relatively aggressive and should be stress-tested.');
  }

  return (
    <Paper sx={{ p: 3.5, width: '100%' }}>
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Typography variant="h5">Strategy outcome</Typography>
          <Typography color="text.secondary">
            Compare the 3-year outcome of keeping the current property versus selling and redeploying into {props.propertyCount} off-the-plan properties.
          </Typography>
        </Stack>

        <Chip icon={recommendation.icon} label={recommendation.label} color={recommendation.color} sx={{ width: 'fit-content' }} />

        <Typography>{recommendation.summary}</Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Keep current property for 3 years</Typography>
                <Typography variant="h5">
                  {keepPropertyGainIn3Years === null ? 'Unavailable' : formatCurrency(keepPropertyGainIn3Years)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {props.growthPercent === null ? 'Current property growth unavailable' : `${formatPercent(props.growthPercent)} annual growth assumption`}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Sell and buy {props.propertyCount} OTP properties</Typography>
                <Typography variant="h5" sx={{ color: props.totalProjectedGain > 0 ? 'success.main' : 'text.primary' }}>
                  {formatCurrency(props.totalProjectedGain)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Projected 3-year modeled gain across new properties
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 4, height: '100%' }}>
              <Stack spacing={1}>
                <Typography color="text.secondary">Difference</Typography>
                <Typography variant="h5" sx={{ color: strategyDifference !== null && strategyDifference > 0 ? 'success.main' : 'text.primary' }}>
                  {strategyDifference === null ? 'Unavailable' : formatCurrency(strategyDifference)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  OTP strategy minus keeping current property
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Stack spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Key strategy metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Net deployable equity: {props.netDeployableEquity === null ? 'Unavailable' : formatCurrency(props.netDeployableEquity)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total upfront cash needed: {formatCurrency(props.totalUpfrontCashNeeded)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total projected gain: {formatCurrency(props.totalProjectedGain)}
          </Typography>
        </Stack>

        {warnings.length ? (
          <Stack spacing={1}>
            {warnings.map((warning) => (
              <Alert key={warning} severity="warning">
                {warning}
              </Alert>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
