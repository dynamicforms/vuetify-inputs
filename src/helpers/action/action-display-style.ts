/**
 * How an action is rendered: `'button'` as a tonal `<v-btn>`, `'text'` as a text-variant `<v-btn>`.
 */
export type ActionDisplayStyle = 'button' | 'text';

/** every display style */
export const actionDisplayStyles: readonly ActionDisplayStyle[] = Object.freeze(['button', 'text']);

/** What an action renders as where nothing states otherwise. */
export const defaultDisplayStyle: ActionDisplayStyle = 'button';

/** Answers whether `value` is one of the display styles. */
export function isActionDisplayStyle(value: unknown): value is ActionDisplayStyle {
  return (actionDisplayStyles as readonly unknown[]).includes(value);
}
