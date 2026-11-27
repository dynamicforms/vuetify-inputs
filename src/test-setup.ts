import { config, enableAutoUnmount } from '@vue/test-utils';
import { afterEach, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { translateStrings } from '@/helpers/translations';

vi.mock('vue-cached-icon', () => ({
  CachedIcon: {
    template: '<div class="cached-icon-wrapper"><svg title="{{ name }}" /></div>',
    props: ['name'],
  },
}));

// jsdom implements no ResizeObserver, and Vuetify's progress circular - what a `loading` button draws - observes
// its own size. A stub that never reports is enough for a component test: nothing here measures.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom has no `visualViewport` at all - not even as an `undefined` property - so a bare reference to it (as
// Vuetify's overlay positioning does) throws a ReferenceError instead of short-circuiting on optional chaining.
globalThis.visualViewport = null;

// every mount gets this Vuetify instance; a test that needs another one replaces config.global.plugins for its mount
config.global.plugins = [createVuetify({ components, directives })];

// unmounts every mounted wrapper after its test
enableAutoUnmount(afterEach);

// restores the English defaults that a test may have replaced with translateStrings
afterEach(() => translateStrings((key) => key));
