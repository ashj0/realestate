import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import { Chip, Paper, Stack, Typography } from '@mui/material';
import type { SuburbOption } from '../data/mockData';

interface SelectedSuburbCardProps {
  suburb: SuburbOption | null;
}

export function SelectedSuburbCard({ suburb }: SelectedSuburbCardProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LocationOnRoundedIcon color="primary" />
          <Typography variant="h6">Selected suburb</Typography>
        </Stack>

        {suburb ? (
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Chip label={suburb.suburb} color="primary" />
            <Chip label={suburb.state} variant="outlined" />
            <Chip label={suburb.postcode} variant="outlined" />
          </Stack>
        ) : (
          <Typography color="text.secondary">
            No suburb selected yet. Choose one from search to continue.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
