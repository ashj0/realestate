import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';

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
          value={valuation}
          onChange={(event) => onValuationChange(event.target.value)}
          placeholder="e.g. 1850000"
          type="number"
          fullWidth
        />
        <TextField
          label="Principal"
          value={principal}
          onChange={(event) => onPrincipalChange(event.target.value)}
          placeholder="e.g. 400000"
          type="number"
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
