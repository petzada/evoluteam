const PT_BR_LOCALE = 'pt-BR';

export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat(PT_BR_LOCALE, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat(PT_BR_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
