import { defineComponent, h, onMounted, watch } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { createVuetify, useTheme } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { DynamicFormsInputs } from '../../../src';
import VueMarkdown from 'vue-markdown-render'; // or your preferred markdown component
import '../../../src/helpers/global.css';
import { errorText } from '../../components/demo-error-text';
// import DynamicFormsInputsVuetify from '../../../src/vuetify-components';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // VitePress renders the pages on the server and hydrates them
    const vuetify = createVuetify({
      ssr: true,
      components,
      directives,
      theme: {
        defaultTheme: 'light'
      }
    })

    app.use(vuetify);
    app.use(DynamicFormsInputs, { errorText });
    app.component('VueMarkdown', VueMarkdown); // make sure it's not vue-markdown

    // app.use(DynamicFormsInputsVuetify);
  },
  // the demos follow the site's light / dark appearance. Applied after mounting: the server renders the light theme
  Layout: defineComponent({
    setup() {
      const { isDark } = useData();
      const theme = useTheme();
      onMounted(() => {
        watch(isDark, (dark) => theme.change(dark ? 'dark' : 'light'), { immediate: true });
      });
      return () => h(DefaultTheme.Layout);
    },
  }),
} satisfies Theme
