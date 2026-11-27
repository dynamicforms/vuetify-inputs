import { config, enableAutoUnmount } from '@vue/test-utils';
import { afterEach, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

vi.mock('vue-cached-icon', () => ({
  CachedIcon: {
    template: '<div class="cached-icon-wrapper"><svg title="{{ name }}" /></div>',
    props: ['name'],
  },
}));

// jsdom has no ResizeObserver, which Vuetify's progress circular (a loading button) uses; the stub never reports
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not define visualViewport, and Vuetify's overlay positioning references it bare (a ReferenceError)
globalThis.visualViewport = null;

// every mount gets this Vuetify instance; a test that needs another one replaces config.global.plugins for its mount
config.global.plugins = [createVuetify({ components, directives })];

// unmounts every mounted wrapper after its test
enableAutoUnmount(afterEach);

// restores the English defaults that a test may have replaced with translateStrings; imported here, not at the top,
// so that a spec's vi.mock('vue') applies to the helpers the import loads
afterEach(async () => (await import('@/helpers/translations')).translateStrings((key) => key));
