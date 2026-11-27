import type { ComputedRef, InjectionKey } from 'vue';

import type { ErrorInput } from './error-text';
import type { Label } from './input-base';

/** The state of the input a `DfInputHint` or `DfLabel` renders in, which they take where their props omit it. */
export interface InputContext {
  shownErrors: ComputedRef<ErrorInput[]>;
  hint: ComputedRef<string>;
  label: ComputedRef<Label>;
}

export const inputContextKey: InjectionKey<InputContext> = Symbol('df-input-context');
