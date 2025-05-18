import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { DynamicFormsInputs } from '../../../src';
// import DynamicFormsInputsVuetify from '../../../src/vuetify-components';
import { VTimePicker } from 'vuetify/labs/VTimePicker'; // eslint-disable-line import/extensions

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    const vuetify = createVuetify({
      components,
      directives,
      theme: {
        defaultTheme: 'light'
      }
    })

    app.use(vuetify);
    app.use(DynamicFormsInputs); //, { defaultVariant: 'underlined' });
    app.component('VTimePicker', VTimePicker);
    // app.use(DynamicFormsInputsVuetify);
  },
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // lahko dodamo custom slote za layout, če bo potrebno
    })
  }
} satisfies Theme
