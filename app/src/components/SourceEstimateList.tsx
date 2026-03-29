import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import {
  Button,
  Grid,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ComparableRecord, EstimateApiResponse } from '../types';
import { formatCurrency, formatDisplayDate, parseLooseDate } from '../utils';

interface SourceEstimateListProps {
  siteEstimates: EstimateApiResponse['siteEstimates'];
  selectedComparables: EstimateApiResponse['selectedComparables'];
}

function estimateRows(siteEstimates: EstimateApiResponse['siteEstimates']) {
  return [
    siteEstimates.realestate_com_au,
    siteEstimates.domain_com_au,
    siteEstimates.property_com_au,
  ];
}

function allSoldHistory(siteEstimates: EstimateApiResponse['siteEstimates']) {
  const deduped = new Map<string, { date: string | null; price: number | null; source: string | null; sourceUrl: string | null }>();

  for (const site of estimateRows(siteEstimates)) {
    for (const item of site.soldHistory) {
      const record = {
        date: item.date,
        price: item.price,
        source: item.source ?? site.label,
        sourceUrl: item.sourceUrl ?? site.sourceUrl,
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

function renderComparableRows(rows: ComparableRecord[]) {
  if (!rows.length) {
    return (
      <TableRow>
        <TableCell align="center" colSpan={6} sx={{ color: 'text.secondary' }}>
          No comparable properties returned.
        </TableCell>
      </TableRow>
    );
  }

  return rows.map((row, index) => (
    <TableRow key={`${row.address}-${row.saleDate ?? index}`} hover>
      <TableCell align="center">{row.address}</TableCell>
      <TableCell align="center">{row.source ?? 'Unknown'}</TableCell>
      <TableCell align="center">{row.saleDate ? formatDisplayDate(row.saleDate) : '—'}</TableCell>
      <TableCell align="center">{row.salePrice != null ? formatCurrency(row.salePrice) : '—'}</TableCell>
      <TableCell align="center">
        {row.sourceUrl ? (
          <Link href={row.sourceUrl} target="_blank" rel="noreferrer" underline="hover">
            Property link
          </Link>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell align="center">
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

export function SourceEstimateList({ siteEstimates, selectedComparables }: SourceEstimateListProps) {
  const soldHistoryRows = allSoldHistory(siteEstimates);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Paper sx={{ p: 3.5, height: '100%' }}>
          <Typography variant="h5" gutterBottom>
            Comparables
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Comparable properties selected from the source results.
          </Typography>

          <TableContainer sx={{ maxHeight: 360, border: '1px solid rgba(29,53,87,0.08)', borderRadius: 3 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Name</TableCell>
                  <TableCell align="center">Site</TableCell>
                  <TableCell align="center">Sale date</TableCell>
                  <TableCell align="center">Sale price</TableCell>
                  <TableCell align="center">Link</TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{renderComparableRows(selectedComparables)}</TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <Paper sx={{ p: 3.5, height: '100%' }}>
          <Typography variant="h5" gutterBottom>
            Property Sales History
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Historical sale points returned by the provider responses.
          </Typography>

          <TableContainer sx={{ maxHeight: 360, border: '1px solid rgba(29,53,87,0.08)', borderRadius: 3 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Date</TableCell>
                  <TableCell align="center">Price</TableCell>
                  <TableCell align="center">Source</TableCell>
                  <TableCell align="center">Property</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {soldHistoryRows.length ? (
                  soldHistoryRows.map((row, index) => (
                    <TableRow key={`${row.source}-${row.date ?? index}`} hover>
                      <TableCell align="center">{row.date ? formatDisplayDate(row.date) : '—'}</TableCell>
                      <TableCell align="center">{row.price === null ? '—' : formatCurrency(row.price)}</TableCell>
                      <TableCell align="center">{row.source ?? 'Unknown'}</TableCell>
                      <TableCell align="center">
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
                    <TableCell align="center" colSpan={4} sx={{ color: 'text.secondary' }}>
                      No sold history returned.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
}
