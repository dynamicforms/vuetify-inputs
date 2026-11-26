/**
 * Converts a pasted number to one with `decimalSeparator`. When `text` has more than one separator and all of them
 * are the same character (`'1.000.000'`, `'1,000,000'`), they are thousands separators and are dropped. Otherwise the
 * last `.` or `,` becomes the decimal separator and the earlier ones are dropped: `'1.234,56'` and `'1,234.56'` both
 * give `'1234<sep>56'`, `'1,5'` gives `'1<sep>5'`.
 */
export function normalizeDecimalSeparators(text: string, decimalSeparator: string): string {
  const separators = text.match(/[.,]/g) ?? [];
  if (separators.length === 0) return text;
  const strip = (part: string) => part.replace(/[.,]/g, '');
  if (separators.length > 1 && separators.every((sep) => sep === separators[0])) return strip(text);
  const last = Math.max(text.lastIndexOf('.'), text.lastIndexOf(','));
  return `${strip(text.slice(0, last))}${decimalSeparator}${text.slice(last + 1)}`;
}
