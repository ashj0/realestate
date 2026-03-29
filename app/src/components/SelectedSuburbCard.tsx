import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import { Chip, Paper, Stack, Typography } from '@mui/material';
import type { PropertyOption } from '../types';

interface SelectedSuburbCardProps {
  property: PropertyOption | null;
}

export function SelectedSuburbCard({ property }: SelectedSuburbCardProps) {
  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LocationOnRoundedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Selected property</Typography>
        </Stack>

        {property ? (
          <>
            <Typography variant="h5">{property.address}</Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Chip label={property.suburb} color="primary" />
              <Chip label={property.state} variant="outlined" />
              <Chip label={property.postcode} variant="outlined" />
              <Chip icon={<HomeWorkRoundedIcon />} label={property.propertyType} variant="outlined" />
            </Stack>
          </>
        ) : (
          <Typography color="text.secondary">
            No property selected yet. Choose one from the search box or map to continue.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
