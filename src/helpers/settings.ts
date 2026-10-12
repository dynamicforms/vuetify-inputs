import type { TranslateFunction } from '@dynamicforms/translatable';
import type { ErrorDescription, FieldBase, ValidationError } from '@dynamicforms/vue-forms';
import type { Locale } from 'date-fns';
import type { MaybeRef } from 'vue';

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
  /**
   * The translation function of the library's strings, shaped like vue-i18n's `t`. Where it is given, `translate()`
   * called while a component that reads these settings sets up or renders uses it in place of the one
   * `translateStrings` set for the process. Under server-side rendering, an app per request gives each request its
   * own.
   */
  translate?: TranslateFunction;
  /** The namespace `translate` looks the library's keys up under: `${translateNamespace}.${key}`. */
  translateNamespace?: string;
  /**
   * The date-fns locale `<df-date-time>` formats and parses with in this app, in place of
   * `DateTimeLocaleConfig.dateTimeLocale`. A component's `locale` prop takes precedence.
   */
  dateTimeLocale?: MaybeRef<Locale>;
}

export const vuetifyInputsSettingsKey = Symbol('vuetifyInputsSettingsKey');
