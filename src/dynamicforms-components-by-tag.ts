import * as components from './dynamicforms-components';

type KebabCase<S extends string, Acc extends string = ''> = S extends `${infer C}${infer Rest}`
  ? C extends Lowercase<C>
    ? KebabCase<Rest, `${Acc}${C}`>
    : KebabCase<Rest, `${Acc}${Acc extends '' ? '' : '-'}${Lowercase<C>}`>
  : Acc;

type ComponentsByTag = { readonly [K in keyof typeof components as KebabCase<K>]: (typeof components)[K] };

// same rule as KebabCase: a dash before every capital but the first, then lower case
const kebabCase = (name: string) => name.replace(/\B([A-Z])/g, '-$1').toLowerCase();

/**
 * Every component this library draws with, keyed by the tag a layout names it by.
 *
 * The keys are the kebab-case of the export names, so a tag names the same component whether it is looked up
 * here or left to Vue's own resolver after `DynamicFormsInputs` has registered the components globally.
 */
export const dfInputComponentsByTag = Object.fromEntries(
  Object.entries(components).map(([name, component]) => [kebabCase(name), component]),
) as ComponentsByTag;

/** The tags {@link dfInputComponentsByTag} answers for. */
export type DfInputComponentTag = keyof typeof dfInputComponentsByTag;
