import type Form from '@dynamicforms/vue-forms';

/** The classes that hide an element or an action of the given visibility: `d-none` for hidden, `invisible` for
 *  invisible. */
export function visibilityClasses(visibility: Form.Visibility) {
  return { 'd-none': visibility === 'hidden', invisible: visibility === 'invisible' };
}
