import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { formatNumberInput, parseNumberInput } from '../utils';

interface ValuationFormProps {
  valuation: string;
  loanBalance: string;
  sellingCostPercent: string;
  existingLoanInterestRate: string;
  retainedEquityPercent: string;
  onValuationChange: (value: string) => void;
  onLoanBalanceChange: (value: string) => void;
  onSellingCostPercentChange: (value: string) => void;
  onExistingLoanInterestRateChange: (value: string) => void;
  onRetainedEquityPercentChange: (value: string) => void;
  disabled?: boolean;
  onSubmit: () => void;
}

export function ValuationForm({
  valuation,
  loanBalance,
  sellingCostPercent,
  existingLoanInterestRate,
  retainedEquityPercent,
  onValuationChange,
  onLoanBalanceChange,
  onSellingCostPercentChange,
  onExistingLoanInterestRateChange,
  onRetainedEquityPercentChange,
  disabled,
  onSubmit,
}: ValuationFormProps) {
  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', width: '100%', minWidth: 0 }}>
      <Stack spacing={2.5} sx={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Enter last year&apos;s valuation</Typography>
        <TextField
          label="Last year's valuation"
          value={formatNumberInput(valuation)}
          onChange={(event) => onValuationChange(parseNumberInput(event.target.value))}
          placeholder="e.g. 1,850,000"
          inputMode="numeric"
          fullWidth
        />
        <TextField
          label="Current loan balance"
          value={formatNumberInput(loanBalance)}
          onChange={(event) => onLoanBalanceChange(parseNumberInput(event.target.value))}
          placeholder="e.g. 400,000"
          inputMode="numeric"
          fullWidth
        />
        <TextField
          label="Selling costs (%)"
          value={sellingCostPercent}
          onChange={(event) => onSellingCostPercentChange(event.target.value.replace(/[^\d.]/g, ''))}
          placeholder="e.g. 3"
          inputMode="decimal"
          fullWidth
        />
        <TextField
          label="Existing loan interest rate (%)"
          value={existingLoanInterestRate}
          onChange={(event) => onExistingLoanInterestRateChange(event.target.value.replace(/[^\d.]/g, ''))}
          placeholder="e.g. 6"
          inputMode="decimal"
          fullWidth
        />
        <TextField
          label="Retained equity requirement (%)"
          value={retainedEquityPercent}
          onChange={(event) => onRetainedEquityPercentChange(event.target.value.replace(/[^\d.]/g, ''))}
          placeholder="e.g. 20"
          inputMode="decimal"
          fullWidth
        />
        <Button
          variant="contained"
          size="large"
          startIcon={<AutoGraphRoundedIcon />}
          disabled={disabled}
          onClick={onSubmit}
        >
          Generate estimate
        </Button>
      </Stack>
    </Paper>
  );
}
