export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const millionMatch = normalized.match(/([\d.]+)\s*m\b/);
  if (millionMatch) {
    const parsedMillion = Number(millionMatch[1]);
    return Number.isFinite(parsedMillion) ? Math.round(parsedMillion * 1_000_000) : null;
  }
  const thousandMatch = normalized.match(/([\d.]+)\s*k\b/);
  if (thousandMatch) {
    const parsedThousand = Number(thousandMatch[1]);
    return Number.isFinite(parsedThousand) ? Math.round(parsedThousand * 1_000) : null;
  }
  const cleaned = normalized.replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parsePercent(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

export function containsUnitContext(text: string): boolean {
  return /\b(unit|apartment)\b/i.test(text);
}

export function findFirstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }
  return null;
}

export function findAllMatches(text: string, pattern: RegExp): string[] {
  return Array.from(text.matchAll(pattern)).map((match) => normalizeWhitespace(match[1] ?? match[0] ?? '')).filter(Boolean);
}

export function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}
