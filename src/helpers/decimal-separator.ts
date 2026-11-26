/**
 * Converts a pasted number to one with `decimalSeparator`: the last `.` or `,` in `text` becomes the decimal
 * separator and the earlier ones, taken for thousands separators, are dropped. `'1.234,56'` and `'1,234.56'` both
 * give `'1234<sep>56'`; `'1.234.567'` gives `'1234<sep>567'`.
 */
export function normalizeDecimalSeparators(text: string, decimalSeparator: string): string {
  const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf(','));
  if (last < 0) return text;
  const strip = (part: string) => part.replace(/[.,]/g, '');
  return `${strip(text.slice(0, last))}${decimalSeparator}${text.slice(last + 1)}`;
}
