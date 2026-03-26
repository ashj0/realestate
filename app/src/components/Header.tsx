import { Box, Chip, Stack, Typography } from '@mui/material';

export function Header() {
  return (
    <Stack spacing={2}>
      <Chip
        label="Internal valuation workspace"
        color="secondary"
        sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
      />
      <Box>
        <Typography variant="h1" gutterBottom>
          Premium suburb valuation, without the spreadsheet feel.
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.5 }}>
          Search a suburb, add last year&apos;s valuation, and get a polished current estimate
          backed by source-by-source evidence.
        </Typography>
      </Box>
    </Stack>
  );
}
