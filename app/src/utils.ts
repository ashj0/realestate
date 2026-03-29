export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const monthLookup: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

export function parseLooseDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const isoCandidate = new Date(value);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate;
  }

  const compact = value.trim().toUpperCase();
  const match = compact.match(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})$/);
  if (!match) return null;

  const [, month, year] = match;
  const monthIndex = monthLookup[month];
  if (monthIndex === undefined) return null;

  return new Date(Date.UTC(Number(year), monthIndex, 1));
}

export function formatDisplayDate(value: string | null | undefined): string {
  const parsed = parseLooseDate(value);
  if (!parsed) return value ?? '—';

  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}
