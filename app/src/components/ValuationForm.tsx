import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';

interface ValuationFormProps {
  valuation: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onSubmit: () => void;
}

export function ValuationForm({ valuation, onChange, disabled, onSubmit }: ValuationFormProps) {
  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex' }}>
      <Stack spacing={2.5} sx={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography variant="h6">Enter last year&apos;s valuation</Typography>
        <TextField
          label="Last year's valuation"
          value={valuation}
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. 1850000"
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
