import type { ErrorDescription } from '@dynamicforms/vue-forms';

import { isRenderContent, type RenderContentNonCallable, renderContentText } from './render-content';
import type { VuetifyInputsSettings } from './settings';

/**
 * An error as a component accepts it for rendering: content in one of the four forms (a string, an `MdString`, an
 * `HtmlString` or a `SimpleComponentDef`), which renders as it is, or an error description of which any member may
 * be missing.
 */
export type ErrorInput = RenderContentNonCallable | Partial<ErrorDescription>;

/**
 * `error` with every missing member set: `code` to `''`, `params` to `{}`, `detail` to `''` and `origin` to
 * `'application'`. Content becomes an error without a code, its text (`renderContentText`) as the `detail`.
 */
export function toErrorDescription(error: ErrorInput): ErrorDescription {
  if (isRenderContent(error)) return { code: '', params: {}, detail: renderContentText(error), origin: 'application' };
  return {
    code: typeof error.code === 'string' ? error.code : '',
    params: error.params ?? {},
    detail: typeof error.detail === 'string' ? error.detail : '',
    origin: typeof error.origin === 'string' && error.origin ? error.origin : 'application',
  };
}

/**
 * What a component renders for `error`. Content renders as it is. An error without a code renders as its
 * `detail`: it is text in the user's language. An error with a code renders as the `errorText` setting's answer, and
 * as its `detail` where the setting is not given or answers `undefined`.
 */
export function errorText(error: ErrorInput, settings: VuetifyInputsSettings): RenderContentNonCallable {
  if (isRenderContent(error)) return error;
  const description = toErrorDescription(error);
  if (!description.code) return description.detail;
  return settings.errorText?.(description) ?? description.detail;
}
