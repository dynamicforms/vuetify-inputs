import type { FieldBase, ValidationError } from '@dynamicforms/vue-forms';

import { FieldDensity, type FieldVariant } from '@/helpers/input-base';

export interface VuetifyInputsSettings {
  defaultVariant?: FieldVariant;
  defaultDensity?: FieldDensity;
  /** Milliseconds between `<df-file>`/`<df-image>` keep-alive touches; overridable per field by their
   *  `touchInterval` prop. Defaults to 60000 when neither is set. */
  defaultTouchInterval?: number;
  /**
   * The condition that decides whether an error is shown, asked for each error a component would show, with the
   * answer the default rule gives (see `useShownErrors`); its answer stands. `control` is the element the component
   * is bound to, absent where the errors come from the `errors` prop. It runs while the errors are rendered, so it
   * is synchronous and changes nothing.
   */
  shownErrors?: (error: ValidationError, control: FieldBase | undefined, shownByDefault: boolean) => boolean;
}

export const vuetifyInputsSettingsKey = Symbol('vuetifyInputsSettingsKey');
