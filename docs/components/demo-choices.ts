import type { FieldDensity, FieldVariant } from '../../src';

/** every FieldVariant; the type check fails when the list misses one */
export const fieldVariants = [
  'outlined',
  'filled',
  'underlined',
  'plain',
  'solo',
  'solo-inverted',
  'solo-filled',
  'inverted',
] as const satisfies readonly FieldVariant[];

/** every FieldDensity; the type check fails when the list misses one */
export const fieldDensities = [
  'default',
  'comfortable',
  'compact',
  'inline',
] as const satisfies readonly FieldDensity[];

type Exhaustive<Listed extends string, All extends string> = [Exclude<All, Listed>] extends [never] ? true : never;
const variantsComplete: Exhaustive<(typeof fieldVariants)[number], FieldVariant> = true;
const densitiesComplete: Exhaustive<(typeof fieldDensities)[number], FieldDensity> = true;
void variantsComplete;
void densitiesComplete;

/** df-select choices whose text is the id */
export function choicesOf<T extends string>(ids: readonly T[]): { id: T; text: T }[] {
  return ids.map((id) => ({ id, text: id }));
}
