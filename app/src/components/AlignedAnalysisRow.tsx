import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface AlignedAnalysisRowProps {
  left: ReactNode;
  right: ReactNode;
}

export function AlignedAnalysisRow({ left, right }: AlignedAnalysisRowProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 7fr) minmax(320px, 3fr)' },
        alignItems: 'start',
      }}
    >
      <Box sx={{ minWidth: 0, display: 'flex' }}>{left}</Box>
      <Box sx={{ minWidth: 0, display: 'flex', alignSelf: 'start' }}>{right}</Box>
    </Box>
  );
}
