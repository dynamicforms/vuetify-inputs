import vuetify from 'vite-plugin-vuetify';
import { defineConfig } from 'vitepress';
import { crosslinksConfig } from 'vitepress-plugin-crosslinks';
import ssrCkeditorStub from './ssr-ckeditor-stub';

export default defineConfig({
  title: 'DynamicForms Vuetify Inputs',
  description: 'A collection of base input fields supporting @dynamicforms/vue-forms',
  markdown: {
    config: crosslinksConfig({
      projects: {
        'vue-forms': 'https://docs.velis.si/dynamicforms/vue-forms',
        'vuetify-modal-form-kit': 'https://docs.velis.si/dynamicforms/vuetify-modal-form-kit',
      },
    }),
  },
  ignoreDeadLinks: [
    /^http:\/\/localhost/,
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/examples/index' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Rationale',
          items: [
            { text: 'Why the library exists', link: '/guide/rationale' },
          ]
        },
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/getting-started#installation' },
            { text: 'Basic Usage', link: '/guide/getting-started#basic-usage' },
            { text: 'Using with DynamicForms', link: '/guide/getting-started#using-with-dynamicforms' },
            { text: 'Using without DynamicForms', link: '/guide/getting-started#using-without-dynamicforms' },
            { text: 'Available Components', link: '/guide/getting-started#available-components' },
          ]
        },
        {
          text: 'Migration',
          items: [
            { text: 'Changelog', link: '/guide/changelog' },
            { text: 'Migration guide', link: '/guide/migration' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'API with Examples',
          items: [
            { text: 'input base', link: '/examples/input-base' },
            { text: 'validation', link: '/examples/validators' },
            { text: 'groups', link: '/examples/groups' },
            { text: 'density', link: '/examples/density' },
            { text: 'configuration', link: '/examples/configuration' },
            { text: 'responsive options', link: '/examples/responsive-render-options' },
            { text: 'localisation', link: '/examples/localisation' },
            { text: 'df-actions', link: '/examples/df-actions' },
            { text: 'df-checkbox', link: '/examples/df-checkbox' },
            { text: 'df-color', link: '/examples/df-color' },
            { text: 'df-date-time', link: '/examples/df-datetime' },
            { text: 'df-file', link: '/examples/df-file' },
            { text: 'df-input', link: '/examples/df-input' },
            { text: 'df-input-hint', link: '/examples/df-input-hint' },
            { text: 'df-rtf-editor', link: '/examples/df-rtf-editor' },
            { text: 'df-select', link: '/examples/df-select' },
            { text: 'df-text-area', link: '/examples/df-text-area' },
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dynamicforms/vuetify-inputs' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Jure Erznožnik'
    }
  },
  vite: {
    plugins: [vuetify(), ssrCkeditorStub],
    optimizeDeps: {
      include: ['vuetify'],
    },
    ssr: {
      noExternal: [
        /vuetify/,
        'isomorphic-dompurify',
        'vue-cached-icon',
      ],
    }
  },
});

