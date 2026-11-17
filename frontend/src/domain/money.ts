const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 2422.5 → "$2,422.50" */
export function formatMoney(amount: number): string {
  return usd.format(amount);
}

/** 85 → "$85/h" */
export function formatRate(rate: number): string {
  return `$${Number.isInteger(rate) ? rate : rate.toFixed(2)}/h`;
}

/** Billable amount for a duration at an hourly rate, rounded to cents. */
export function amountFor(minutes: number, hourlyRate: number): number {
  return Math.round(((minutes / 60) * hourlyRate) * 100) / 100;
}
