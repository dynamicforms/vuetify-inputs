import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'DynamicForms Vuetify Inputs',
  description: 'A collection of base input fields supporting @dynamicforms/vue-forms',
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/index' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/getting-started#installation' },
            { text: 'Basic Usage', link: '/guide/getting-started#basic-usage' },
            { text: 'Using with DynamicForms', link: '/guide/getting-started#using-with-dynamicforms' },
            { text: 'Using without DynamicForms', link: '/guide/getting-started#using-without-dynamicforms' },
            { text: 'Available Components', link: '/guide/getting-started#available-components' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'df-file', link: '/examples/df-file' },
            { text: 'df-select', link: '/examples/df-select' },
            { text: 'df-text-area', link: '/examples/df-text-area' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/velis74/dynamicforms-vuetify-inputs' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Jure Erznožnik'
    }
  }
});

