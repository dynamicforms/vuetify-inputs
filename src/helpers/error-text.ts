import type { ErrorDescription } from '@dynamicforms/vue-forms';

import { MdString, type RenderContentNonCallable } from './render-content';
import type { VuetifyInputsSettings } from './settings';

/**
 * An error as a component accepts it for rendering: a string or an `MdString`, which is text in the user's language,
 * or an error description of which any member may be missing.
 */
export type ErrorInput = string | MdString | Partial<ErrorDescription>;

/**
 * `error` with every missing member set: `code` to `''`, `params` to `{}`, `detail` to `''` and `origin` to
 * `'application'`. A string or an `MdString` becomes the `detail` of an error without a code.
 */
export function toErrorDescription(error: ErrorInput): ErrorDescription {
  if (typeof error === 'string' || error instanceof MdString) {
    return { code: '', params: {}, detail: error.toString(), origin: 'application' };
  }
  return {
    code: typeof error.code === 'string' ? error.code : '',
    params: error.params ?? {},
    detail: typeof error.detail === 'string' ? error.detail : '',
    origin: typeof error.origin === 'string' && error.origin ? error.origin : 'application',
  };
}

/**
 * What a component renders for `error`. An `MdString` renders as markdown. An error without a code renders as its
 * `detail`: it is text in the user's language. An error with a code renders as the `errorText` setting's answer, and
 * as its `detail` where the setting is not given or answers `undefined`.
 */
export function errorText(error: ErrorInput, settings: VuetifyInputsSettings): RenderContentNonCallable {
  if (error instanceof MdString) return error;
  const description = toErrorDescription(error);
  if (!description.code) return description.detail;
  return settings.errorText?.(description) ?? description.detail;
}
