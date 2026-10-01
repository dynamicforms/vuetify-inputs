import type { FieldBase, ValidationError } from '@dynamicforms/vue-forms';
import { computed, type ComputedRef, inject, type MaybeRefOrGetter, toValue } from 'vue';

import { type VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';

/**
 * The errors of `errors` a component shows now. `errors` and `valid` state the verdict, which a submit needs at
 * once; what the user is shown waits for the user, because a form covered in errors before anything was typed tells
 * the user nothing they can act on.
 *
 * By default an error is shown where `control` is sent at all - its `effectiveAccess` is not `'disabled'` - and
 * either its `origin` is `'server'`, since the server answered something the user did, or the element is `touched`.
 * Without a control, `touched` is the component's own. The `shownErrors` setting replaces the rule with a condition
 * of the application's own, asked for each error with the default answer.
 */
export function selectShownErrors(
  errors: readonly ValidationError[],
  control: FieldBase | undefined,
  touched: boolean,
  settings: VuetifyInputsSettings,
): ValidationError[] {
  const sent = !control || control.effectiveAccess !== 'disabled';
  return errors.filter((error) => {
    const shownByDefault = sent && (error.origin === 'server' || touched);
    return settings.shownErrors ? settings.shownErrors(error, control, shownByDefault) : shownByDefault;
  });
}

/**
 * The errors of `element` to show now, by the rule `selectShownErrors` states and the `shownErrors` setting the
 * application provided. It is what a template rendering errors of its own - a group's, say - binds, so that they
 * appear when the inputs' errors do. Call it in a component's setup, where the settings are injected.
 */
export function useShownErrors(element: MaybeRefOrGetter<FieldBase | undefined>): ComputedRef<ValidationError[]> {
  const settings = inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});
  return computed(() => {
    const control = toValue(element);
    return control ? selectShownErrors(control.errors, control, control.touched, settings) : [];
  });
}
