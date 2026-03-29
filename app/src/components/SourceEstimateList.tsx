import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import {
  Box,
  Button,
  Chip,
  Grid,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ComparableRecord, EstimateApiResponse, SiteEstimate } from '../types';
import { formatCurrency, formatDisplayDate, formatPercent, parseLooseDate } from '../utils';

interface SourceEstimateListProps {
  siteEstimates: EstimateApiResponse['siteEstimates'];
  selectedComparables: EstimateApiResponse['selectedComparables'];
  subjectAddress: string;
}

function estimateRows(siteEstimates: EstimateApiResponse['siteEstimates']) {
  return [
    siteEstimates.realestate_com_au,
    siteEstimates.domain_com_au,
    siteEstimates.property_com_au,
  ];
}

function allSoldHistory(siteEstimates: EstimateApiResponse['siteEstimates']) {
  const deduped = new Map<string, { date: string | null; price: number | null; source: string | null; sourceUrl: string | null; address: string | null }>();

  for (const site of estimateRows(siteEstimates)) {
    for (const item of site.soldHistory) {
      const record = {
        date: item.date,
        price: item.price,
        source: item.source ?? site.label,
        sourceUrl: item.sourceUrl ?? site.sourceUrl,
        address: null,
      };

      if (!(record.date || record.price || record.source)) continue;

      const key = `${record.source ?? 'unknown'}|${record.date ?? ''}|${record.price ?? ''}|${record.sourceUrl ?? ''}`;
      if (!deduped.has(key)) {
        deduped.set(key, record);
      }
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const left = parseLooseDate(a.date)?.getTime() ?? 0;
    const right = parseLooseDate(b.date)?.getTime() ?? 0;
    return right - left;
  });
}

function growthLabel(site: SiteEstimate) {
  return site.suburbGrowthPercent === null ? 'Unavailable' : formatPercent(site.suburbGrowthPercent);
}

function renderComparableRows(rows: ComparableRecord[]) {
  if (!rows.length) {
    return (
      <TableRow>
        <TableCell colSpan={6} sx={{ color: 'text.secondary' }}>
          No comparable properties returned.
        </TableCell>
      </TableRow>
    );
  }

  return rows.map((row, index) => (
    <TableRow key={`${row.address}-${row.saleDate ?? index}`} hover>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {row.address}
        </Typography>
      </TableCell>
      <TableCell>{row.source ?? 'Unknown'}</TableCell>
      <TableCell>{row.saleDate ? formatDisplayDate(row.saleDate) : '—'}</TableCell>
      <TableCell>{row.salePrice != null ? formatCurrency(row.salePrice) : '—'}</TableCell>
      <TableCell>
        {row.sourceUrl ? (
          <Link href={row.sourceUrl} target="_blank" rel="noreferrer" underline="hover">
            Property link
          </Link>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        {row.sourceUrl ? (
          <Button
            size="small"
            variant="text"
            endIcon={<LaunchRoundedIcon />}
            component="a"
            href={row.sourceUrl}
            target="_blank"
            rel="noreferrer"
            sx={{ minWidth: 0, p: 0 }}
          >
            Open
          </Button>
        ) : (
          '—'
        )}
      </TableCell>
    </TableRow>
  ));
}

export function SourceEstimateList({ siteEstimates, selectedComparables, subjectAddress }: SourceEstimateListProps) {
  const rows = estimateRows(siteEstimates);
  const soldHistoryRows = allSoldHistory(siteEstimates);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3.5 }}>
        <Stack spacing={2.5}>
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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3.5, height: '100%' }}>
            <Stack spacing={2}>
              <div>
                <Typography variant="h5" gutterBottom>
                  Comparables
                </Typography>
                <Typography color="text.secondary">
                  Comparable properties selected from the source results.
                </Typography>
              </div>

              <TableContainer sx={{ maxHeight: 360, border: '1px solid rgba(29,53,87,0.08)', borderRadius: 3 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Site</TableCell>
                      <TableCell>Sale date</TableCell>
                      <TableCell>Sale price</TableCell>
                      <TableCell>Link</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{renderComparableRows(selectedComparables)}</TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3.5, height: '100%' }}>
            <Stack spacing={2}>
              <div>
                <Typography variant="h5" gutterBottom>
                  Sold history
                </Typography>
                <Typography color="text.secondary">
                  Historical sale points returned by the provider responses.
                </Typography>
              </div>

              <TableContainer sx={{ maxHeight: 360, border: '1px solid rgba(29,53,87,0.08)', borderRadius: 3 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Property</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {soldHistoryRows.length ? (
                      soldHistoryRows.map((row, index) => (
                        <TableRow key={`${row.source}-${row.date ?? index}`} hover>
                          <TableCell>{row.date ? formatDisplayDate(row.date) : '—'}</TableCell>
                          <TableCell>{row.address ?? subjectAddress}</TableCell>
                          <TableCell>{row.price === null ? '—' : formatCurrency(row.price)}</TableCell>
                          <TableCell>{row.source ?? 'Unknown'}</TableCell>
                          <TableCell>
                            {row.sourceUrl ? (
                              <Link href={row.sourceUrl} target="_blank" rel="noreferrer" underline="hover">
                                View property
                              </Link>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                          No sold history returned.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
