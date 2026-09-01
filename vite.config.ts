/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';
import { configDefaults } from 'vitest/config';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: true
    }),
    visualizer({
      open: false,
      filename: 'coverage/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      // '~': resolve(import.meta.dirname, '../../node_modules'),
    },
    extensions: [
      '.js',
      '.mjs',
      '.ts',
    ],
  },
  build: {
    target: 'es2015',
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['umd', 'es'],
      fileName: 'dynamicforms-vuetify-inputs',
      name: 'dynamicforms-vuetify-inputs.[name]',
    },
    rollupOptions: {
      external: [
        '@dynamicforms/translatable',
        '@dynamicforms/vue-forms',
        '@tiptap/core',
        '@tiptap/extension-image',
        '@tiptap/extension-link',
        '@tiptap/extension-placeholder',
        '@tiptap/extension-table',
        '@tiptap/extension-table-cell',
        '@tiptap/extension-table-header',
        '@tiptap/extension-table-row',
        '@tiptap/extension-text-align',
        '@tiptap/pm',
        /^@tiptap\/pm\/.*/,
        '@tiptap/starter-kit',
        '@tiptap/vue-3',
        /^@tiptap\/vue-3\/.*/,
        'date-fns',
        'lodash-es',
        'vue',
        'vue-cached-icon',
        'vue-markdown-render',
        'vuetify',
        /^vuetify\/.*/,
      ],
      output: {
        globals: (id: string) => id, // all external modules are currently not aliased to anything but their own names
      }
    }
  },
  test: {
    // The e2e/ suite runs under Playwright (`npm run test:e2e`), not vitest - its own test()/expect() aren't
    // vitest's, so it must stay out of vitest's default file discovery.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/**/*'
      ],
      exclude: [
        '**/index.ts',
      ],
    },
    setupFiles: './src/test-setup.ts',
    server: {
      deps: {
        inline: ['vuetify']
      },
    },
    globals: true,
    environment: 'jsdom',
  },
});
