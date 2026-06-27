import { getCurrencyInfo } from './currency';

export function formatCurrency(value: number, opts: { sign?: boolean; compact?: boolean } = {}): string {
  const info = getCurrencyInfo();
  const abs = Math.abs(value);
  let body: string;
  if (opts.compact && abs >= 1000) {
    body = new Intl.NumberFormat(info.locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(abs);
  } else {
    body = new Intl.NumberFormat(info.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(abs);
  }
  const sign = opts.sign ? (value >= 0 ? '+' : '−') : value < 0 ? '−' : '';
  return `${sign}${info.symbol}${body}`;
}

/** Returns just the currency symbol (e.g. ₹, $, €). */
export function currencySymbol(): string {
  return getCurrencyInfo().symbol;
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
