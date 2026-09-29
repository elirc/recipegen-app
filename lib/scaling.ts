const FRACTIONS: [number, string][] = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [0.333, "⅓"],
  [0.5, "½"],
  [0.667, "⅔"],
  [0.75, "¾"],
];

function toFraction(decimal: number): string | null {
  for (const [val, sym] of FRACTIONS) {
    if (Math.abs(decimal - val) < 0.04) return sym;
  }
  return null;
}

export function formatAmount(amount: number): string {
  if (amount < 0.1) amount = 0.1;

  const whole = Math.floor(amount);
  const decimal = amount - whole;

  if (decimal < 0.04) {
    return whole.toString();
  }

  const frac = toFraction(decimal);
  if (frac) {
    return whole > 0 ? `${whole}${frac}` : frac;
  }

  return amount < 10 ? amount.toFixed(1) : Math.round(amount).toString();
}

export function scaleAmount(
  baseAmount: number,
  baseServings: number,
  currentServings: number
): number {
  if (baseServings === 0) return baseAmount;
  return baseAmount * (currentServings / baseServings);
}
