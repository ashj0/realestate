import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import type { EstimateApiResponse, SiteEstimate } from '../types';
import { formatCurrency, formatPercent } from '../utils';

interface SourceEstimateListProps {
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

function medianLabel(site: SiteEstimate) {
  return site.medianPrice === null ? 'Unavailable' : formatCurrency(site.medianPrice);
}

export function SourceEstimateList({ siteEstimates }: SourceEstimateListProps) {
  const rows = estimateRows(siteEstimates);

  return (
    <Paper sx={{ p: 3.5 }}>
      <Stack spacing={2.5}>
        <div>
          <Typography variant="h5" gutterBottom>
            Source breakdown
          </Typography>
          <Typography color="text.secondary">
            Suburb growth and median values fetched from the three configured property sites.
          </Typography>
        </div>

        <Stack divider={<Divider flexItem />}>
          {rows.map((site) => (
            <Stack key={site.label} spacing={1.5} sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <div>
                  <Typography fontWeight={700}>{site.label}</Typography>
                  <Typography color="text.secondary">
                    Growth: {growthLabel(site)} · Median: {medianLabel(site)}
                  </Typography>
                </div>
                {site.sourceUrl ? (
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
                ) : null}
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={site.propertyTypeMatched ? 'Property type matched' : 'Property type mismatch'} size="small" />
                {site.medianPricePeriod ? <Chip label={site.medianPricePeriod} size="small" variant="outlined" /> : null}
                {site.estimateUpdatedAt ? <Chip label={`Updated ${site.estimateUpdatedAt}`} size="small" variant="outlined" /> : null}
              </Stack>

              {site.notes.length ? (
                <Typography variant="body2" color="text.secondary">
                  {site.notes.join(' · ')}
                </Typography>
              ) : null}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
