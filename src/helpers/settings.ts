import type { ErrorDescription, FieldBase, ValidationError } from '@dynamicforms/vue-forms';

import { FieldDensity, type FieldVariant } from '@/helpers/input-base';
import type { RenderContentNonCallable } from '@/helpers/render-content';

/**
 * Converts an error to the content it renders as: plain text, an `MdString` for markdown, an `HtmlString` for HTML
 * or a `SimpleComponentDef` for a component. `undefined` renders the error's `detail`. It is called for an error with
 * a code. It runs while the errors are rendered, so the reactive state it reads, such as the locale, is tracked.
 */
export type ErrorText = (error: ErrorDescription) => RenderContentNonCallable | undefined;

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
   * The content an error renders as; see `ErrorText`. Without it, an error renders as its `detail`.
   */
  errorText?: ErrorText;
}

export const vuetifyInputsSettingsKey = Symbol('vuetifyInputsSettingsKey');
