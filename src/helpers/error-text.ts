import { interpolate } from '@dynamicforms/translatable';
import type { ErrorDescription } from '@dynamicforms/vue-forms';

import type { RenderContentNonCallable } from './render-content';
import type { VuetifyInputsSettings } from './settings';
import { translatableStrings } from './translations';

/**
 * The text of `error` by its code: the entry of `translatableStrings` named by `error.code`, with `error.params`
 * substituted, and `error.detail` where no entry has that name. An array param is substituted as its items joined
 * with `, `.
 */
export function defaultErrorText(error: ErrorDescription): string {
  const template = (translatableStrings as Record<string, string>)[error.code];
  if (template == null) return error.detail;
  const params: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(error.params))
    params[name] = Array.isArray(value) ? value.join(', ') : value;
  return interpolate(template, params);
}

/**
 * What a component renders for `error`: the `errorText` setting's answer, and `defaultErrorText` where the setting
 * is not given or answers `undefined`.
 */
export function errorText(error: ErrorDescription, settings: VuetifyInputsSettings): RenderContentNonCallable {
  return settings.errorText?.(error) ?? defaultErrorText(error);
}
