export function isPositiveInteger(value: string|null): boolean {
    if (value === null) {
      return false
    }
    if (!value || typeof value !== 'string') {
      return false;
    }
    const isNumeric = /^\d+$/.test(value);
    const isNonNegative = Number(value) >= 0;
    return isNumeric && isNonNegative;
  }