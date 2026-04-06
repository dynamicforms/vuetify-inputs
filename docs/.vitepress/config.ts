import type { Plugin } from 'vite';
import vuetify from 'vite-plugin-vuetify';
import { defineConfig } from 'vitepress';
import { crosslinksConfig } from 'vitepress-plugin-crosslinks';

// CKEditor uses browser APIs (document.createElement) at module initialization time,
// which causes VitePress SSR pre-rendering to fail. This plugin replaces all CKEditor
// imports with no-op stubs during SSR so pages can be pre-rendered safely.
// In the browser, the real modules are loaded normally.
const ssrCkeditorStub: Plugin = {
  name: 'ssr-ckeditor-stub',
  enforce: 'pre',
  resolveId(id, _importer, options) {
    if (options?.ssr && (id === 'ckeditor5' || id.startsWith('@ckeditor/'))) {
      return '\0ck-ssr-stub';
    }
  },
  load(id) {
    if (id === '\0ck-ssr-stub') {
      return `
class NoopClass {}
const noop = () => {};
export default NoopClass;
export const CkeditorPlugin = { install: noop };
export const Ckeditor = NoopClass;
export const ClassicEditor = NoopClass;
export const AccessibilityHelp = NoopClass;
export const Alignment = NoopClass;
export const Autoformat = NoopClass;
export const AutoImage = NoopClass;
export const AutoLink = NoopClass;
export const Autosave = NoopClass;
export const BalloonToolbar = NoopClass;
export const Base64UploadAdapter = NoopClass;
export const BlockQuote = NoopClass;
export const Bold = NoopClass;
export const CloudServices = NoopClass;
export const Essentials = NoopClass;
export const GeneralHtmlSupport = NoopClass;
export const Heading = NoopClass;
export const HorizontalLine = NoopClass;
export const ImageBlock = NoopClass;
export const ImageCaption = NoopClass;
export const ImageInline = NoopClass;
export const ImageInsertViaUrl = NoopClass;
export const ImageResize = NoopClass;
export const ImageStyle = NoopClass;
export const ImageToolbar = NoopClass;
export const ImageUpload = NoopClass;
export const Indent = NoopClass;
export const IndentBlock = NoopClass;
export const Italic = NoopClass;
export const Link = NoopClass;
export const List = NoopClass;
export const MediaEmbed = NoopClass;
export const Paragraph = NoopClass;
export const PasteFromMarkdownExperimental = NoopClass;
export const PasteFromOffice = NoopClass;
export const SelectAll = NoopClass;
export const Style = NoopClass;
export const Table = NoopClass;
export const TableCellProperties = NoopClass;
export const TableColumnResize = NoopClass;
export const TableProperties = NoopClass;
export const TableToolbar = NoopClass;
export const TextTransformation = NoopClass;
export const Undo = NoopClass;
`;
    }
  },
};

export default defineConfig({
  title: 'DynamicForms Vuetify Inputs',
  description: 'A collection of base input fields supporting @dynamicforms/vue-forms',
  markdown: {
    config: crosslinksConfig({
      projects: {
        'vue-forms': 'https://docs.velis.si/dynamicforms/vue-forms',
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
          text: 'API with Examples',
          items: [
            { text: 'input base', link: '/examples/input-base' },
            { text: 'validation', link: '/examples/validators' },
            { text: 'density', link: '/examples/density' },
            { text: 'df-actions', link: '/examples/df-actions' },
            { text: 'df-checkbox', link: '/examples/df-checkbox' },
            { text: 'df-color', link: '/examples/df-color' },
            { text: 'df-date-time', link: '/examples/df-datetime' },
            { text: 'df-file', link: '/examples/df-file' },
            { text: 'df-input', link: '/examples/df-input' },
            { text: 'df-rtf-editor', link: '/examples/df-rtf-editor' },
            { text: 'df-select', link: '/examples/df-select' },
            { text: 'df-text-area', link: '/examples/df-text-area' },
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
  },
  vite: {
    plugins: [vuetify(), ssrCkeditorStub],
    optimizeDeps: {
      include: ['vuetify'],
    },
    ssr: {
      noExternal: [
        /vuetify/,
      ],
    }
  },
});

