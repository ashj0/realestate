import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { Button, Divider, Paper, Stack, Typography } from '@mui/material';
import type { SourceEstimate } from '../data/mockData';
import { formatCurrency } from '../utils';

interface SourceEstimateListProps {
  sources: SourceEstimate[];
}

export function SourceEstimateList({ sources }: SourceEstimateListProps) {
  return (
    <Paper sx={{ p: 3.5 }}>
      <Stack spacing={2.5}>
        <div>
          <Typography variant="h5" gutterBottom>
            Source breakdown
          </Typography>
          <Typography color="text.secondary">
            Each source estimate stays visible so the team can judge the final number in context.
          </Typography>
        </div>

        <Stack divider={<Divider flexItem />}>
          {sources.map((source) => (
            <Stack
              key={source.siteName}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
              sx={{ py: 1.5 }}
            >
              <div>
                <Typography fontWeight={700}>{source.siteName}</Typography>
                <Typography color="text.secondary">{formatCurrency(source.estimate)}</Typography>
              </div>
              <Button
                variant="text"
                endIcon={<LaunchRoundedIcon />}
                component="a"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                Open source
              </Button>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
