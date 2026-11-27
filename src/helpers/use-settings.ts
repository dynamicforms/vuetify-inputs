import { inject } from 'vue';

import { type VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';

/** The settings the app installed the library with; `{}` where it installed none. Called in a component's setup. */
export function useSettings(): VuetifyInputsSettings {
  return inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});
}
