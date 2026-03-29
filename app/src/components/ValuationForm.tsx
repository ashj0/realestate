import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { formatNumberInput, parseNumberInput } from '../utils';

interface ValuationFormProps {
  valuation: string;
  principal: string;
  onValuationChange: (value: string) => void;
  onPrincipalChange: (value: string) => void;
  disabled?: boolean;
  onSubmit: () => void;
}

export function ValuationForm({
  valuation,
  principal,
  onValuationChange,
  onPrincipalChange,
  disabled,
  onSubmit,
}: ValuationFormProps) {
  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', width: '100%', minWidth: 0 }}>
      <Stack spacing={2.5} sx={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography variant="h6">Enter last year&apos;s valuation</Typography>
        <TextField
          label="Last year's valuation"
          value={formatNumberInput(valuation)}
          onChange={(event) => onValuationChange(parseNumberInput(event.target.value))}
          placeholder="e.g. 1,850,000"
          inputMode="numeric"
          fullWidth
        />
        <TextField
          label="Loan principal"
          value={formatNumberInput(principal)}
          onChange={(event) => onPrincipalChange(parseNumberInput(event.target.value))}
          placeholder="e.g. 400,000"
          inputMode="numeric"
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
