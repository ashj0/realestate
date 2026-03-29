import { Paper, Stack, Switch, FormControlLabel, TextField, Typography } from '@mui/material';
import { formatNumberInput, parseNumberInput } from '../utils';

interface OtpScenarioFormProps {
  purchasePrice: string;
  propertyCount: string;
  depositPercent: string;
  useDepositBond: boolean;
  actualUpfrontCash: string;
  principalInterestCost: string;
  annualGrowthPercent: string;
  yearsToCompletion: string;
  onPurchasePriceChange: (value: string) => void;
  onPropertyCountChange: (value: string) => void;
  onDepositPercentChange: (value: string) => void;
  onUseDepositBondChange: (value: boolean) => void;
  onActualUpfrontCashChange: (value: string) => void;
  onPrincipalInterestCostChange: (value: string) => void;
  onAnnualGrowthPercentChange: (value: string) => void;
  onYearsToCompletionChange: (value: string) => void;
}

export function OtpScenarioForm({
  purchasePrice,
  propertyCount,
  depositPercent,
  useDepositBond,
  actualUpfrontCash,
  principalInterestCost,
  annualGrowthPercent,
  yearsToCompletion,
  onPurchasePriceChange,
  onPropertyCountChange,
  onDepositPercentChange,
  onUseDepositBondChange,
  onActualUpfrontCashChange,
  onPrincipalInterestCostChange,
  onAnnualGrowthPercentChange,
  onYearsToCompletionChange,
}: OtpScenarioFormProps) {
  return (
    <Paper sx={{ p: 3.5, width: '100%' }}>
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Typography variant="h5">Off-the-plan strategy</Typography>
          <Typography color="text.secondary">
            Model the upfront cash required and forecast growth for multiple off-the-plan properties.
          </Typography>
        </Stack>

        <TextField
          label="Purchase price per property"
          value={formatNumberInput(purchasePrice)}
          onChange={(event) => onPurchasePriceChange(parseNumberInput(event.target.value))}
          placeholder="e.g. 750,000"
          inputMode="numeric"
          fullWidth
        />

        <TextField
          label="Number of properties"
          value={propertyCount}
          onChange={(event) => onPropertyCountChange(event.target.value.replace(/[^\d]/g, ''))}
          placeholder="e.g. 2"
          inputMode="numeric"
          fullWidth
        />

        <TextField
          label="Deposit (%)"
          value={depositPercent}
          onChange={(event) => onDepositPercentChange(event.target.value.replace(/[^\d.]/g, ''))}
          placeholder="e.g. 10"
          inputMode="decimal"
          fullWidth
        />

        <FormControlLabel
          control={<Switch checked={useDepositBond} onChange={(_, checked) => onUseDepositBondChange(checked)} />}
          label="Use deposit bond"
        />

        <TextField
          label="Actual upfront cash required per property"
          value={formatNumberInput(actualUpfrontCash)}
          onChange={(event) => onActualUpfrontCashChange(parseNumberInput(event.target.value))}
          placeholder="e.g. 20,000"
          inputMode="numeric"
          fullWidth
        />

        <TextField
          label="Principal & interest cost"
          value={formatNumberInput(principalInterestCost)}
          onChange={(event) => onPrincipalInterestCostChange(parseNumberInput(event.target.value))}
          placeholder="e.g. 60,000"
          inputMode="numeric"
          fullWidth
        />

        <TextField
          label="Forecast annual capital growth (%)"
          value={annualGrowthPercent}
          onChange={(event) => onAnnualGrowthPercentChange(event.target.value.replace(/[^\d.]/g, ''))}
          placeholder="e.g. 7"
          inputMode="decimal"
          fullWidth
        />

        <TextField
          label="Years to completion"
          value={yearsToCompletion}
          onChange={(event) => onYearsToCompletionChange(event.target.value.replace(/[^\d.]/g, ''))}
          placeholder="e.g. 2"
          inputMode="decimal"
          fullWidth
        />
      </Stack>
    </Paper>
  );
}
