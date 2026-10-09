import type { ErrorDescription, FieldBase, ValidationError } from '@dynamicforms/vue-forms';

import { FieldDensity, type FieldVariant } from '@/helpers/input-base';
import type { RenderContentNonCallable } from '@/helpers/render-content';

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
  /**
   * The content an error renders as: plain text, an `MdString` or a `SimpleComponentDef`. `undefined` renders
   * the text `defaultErrorText` gives, which is the `translatableStrings` entry named by the error's `code`, or
   * its `detail`. It runs while the errors are rendered and its reactive reads, such as the locale, are tracked.
   */
  errorText?: (error: ErrorDescription) => RenderContentNonCallable | undefined;
}

export const vuetifyInputsSettingsKey = Symbol('vuetifyInputsSettingsKey');
