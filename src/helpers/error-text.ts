import type { ErrorDescription } from '@dynamicforms/vue-forms';

import type { RenderContentNonCallable } from './render-content';
import type { VuetifyInputsSettings } from './settings';

/**
 * What a component renders for `error`: the `errorText` setting's answer, and `error.detail` where the setting is not
 * given or answers `undefined`.
 */
export function errorText(error: ErrorDescription, settings: VuetifyInputsSettings): RenderContentNonCallable {
  return settings.errorText?.(error) ?? error.detail;
}
