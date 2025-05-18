import { CkeditorPlugin } from '@ckeditor/ckeditor5-vue';
import { App } from 'vue';

import * as Inputs from './dynamicforms-components';
import { VuetifyInputsSettings, vuetifyInputsSettingsKey } from './helpers';
import * as VuetifyComponents from './vuetify-components';

export * from './helpers';
export * as VuetifyComponents from './vuetify-components';
export * from './dynamicforms-components';

export interface DynamicFormsInputsOptions extends VuetifyInputsSettings {
  registerComponents: boolean;
  registerVuetifyComponents: boolean;
}

export const DynamicFormsInputs = {
  install: (app: App, options?: Partial<DynamicFormsInputsOptions>) => {
    app.use(CkeditorPlugin);
    app.provide(vuetifyInputsSettingsKey, options ?? { });
    if (options?.registerComponents ?? false) {
      Object.entries(Inputs).map(([name, component]) => app.component(name, component));
    }
    if (options?.registerVuetifyComponents ?? false) {
      Object.entries(VuetifyComponents).map(([name, component]) => app.component(name, component));
    }
  },
};
