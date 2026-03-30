import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { EstimateApiResponse, PropertyOption } from '../types';

interface SelectedSuburbCardProps {
  property: PropertyOption | null;
  estimate?: EstimateApiResponse | null;
}

export function SelectedSuburbCard({ property, estimate }: SelectedSuburbCardProps) {
  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LocationOnRoundedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Selected property</Typography>
        </Stack>

        {property ? (
          <>
            {estimate?.siteEstimates?.realestate_com_au?.heroImageUrl ? (
              <Box
                component="img"
                src={estimate.siteEstimates.realestate_com_au.heroImageUrl}
                alt={property.address}
                sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
              />
            ) : null}
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
