import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import type { EstimateApiResponse, SiteEstimate } from '../types';
import { formatPercent } from '../utils';

interface SourceBreakdownProps {
  siteEstimates: EstimateApiResponse['siteEstimates'];
}

function estimateRows(siteEstimates: EstimateApiResponse['siteEstimates']) {
  return [
    siteEstimates.realestate_com_au,
    siteEstimates.domain_com_au,
    siteEstimates.property_com_au,
  ];
}

function growthLabel(site: SiteEstimate) {
  return site.suburbGrowthPercent === null ? 'Unavailable' : formatPercent(site.suburbGrowthPercent);
}

export function SourceBreakdown({ siteEstimates }: SourceBreakdownProps) {
  const rows = estimateRows(siteEstimates);

  return (
    <Paper sx={{ p: 3.5, height: '100%' }}>
      <Stack spacing={2.5} sx={{ height: '100%' }}>
        <div>
          <Typography variant="h5" gutterBottom>
            Source breakdown
          </Typography>
          <Typography color="text.secondary">
            Growth signals and source links across the configured property sites.
          </Typography>
        </div>

        <Stack spacing={1.5}>
          {rows.map((site) => (
            <Paper key={site.label} variant="outlined" sx={{ p: 2.25, borderRadius: 4 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1}>
                  <Typography fontWeight={700}>{site.label}</Typography>
                  <Typography color="text.secondary">Growth: {growthLabel(site)}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={site.propertyTypeMatched ? 'Property type matched' : 'Property type mismatch'} size="small" />
                    {site.medianPricePeriod ? <Chip label={site.medianPricePeriod} size="small" variant="outlined" /> : null}
                  </Stack>
                  {site.notes.length ? (
                    <Typography variant="body2" color="text.secondary">
                      {site.notes.join(' · ')}
                    </Typography>
                  ) : null}
                </Stack>

                {site.sourceUrl ? (
                  <Box>
                    <Button
                      variant="text"
                      endIcon={<LaunchRoundedIcon />}
                      component="a"
                      href={site.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open source
                    </Button>
                  </Box>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
