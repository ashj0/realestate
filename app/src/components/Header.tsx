import { Box, Chip, Stack, Typography } from '@mui/material';

export function Header() {
  return (
    <Stack spacing={2}>
      <Chip
        label="Property valuation workspace"
        color="secondary"
        sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
      />
      <Box>
        <Typography variant="h1" gutterBottom>
          Insynergy Property Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.5 }}>
          Search a property, enter last year&apos;s valuation, and review the estimated current value,
          growth, sold history, and supporting comparables in one place.
        </Typography>
      </Box>
    </Stack>
  );
}
