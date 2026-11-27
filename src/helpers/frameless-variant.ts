import type { FieldVariant } from './input-base';

/** Whether a field of the variant draws no frame around its text: `plain` and `underlined`. */
export function isFramelessVariant(variant: FieldVariant | undefined): boolean {
  return variant === 'plain' || variant === 'underlined';
}
