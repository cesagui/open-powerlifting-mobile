export function formatNumber(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}
