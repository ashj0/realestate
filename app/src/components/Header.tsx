import { Box, Chip, Stack, Typography } from '@mui/material';
import insynergyLogo from '../assets/insynergy-logo.png';

export function Header() {
  return (
    <Stack spacing={2}>
      <Box
        component="img"
        src={insynergyLogo}
        alt="inSynergy logo"
        sx={{ height: { xs: 48, md: 60 }, width: 'auto', alignSelf: 'flex-start' }}
      />
      <Chip
        label="inSynergy property strategy workspace"
        color="secondary"
        sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
      />
      <Box>
        <Typography variant="h1" gutterBottom>
          inSynergy Hold v&apos;s Sell Property Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 860, lineHeight: 1.5 }}>
          Compare hold-versus-sell scenarios, review current property position, and assess OTP strategy outcomes
          in a clearer client-facing inSynergy workflow.
        </Typography>
      </Box>
    </Stack>
  );
}
