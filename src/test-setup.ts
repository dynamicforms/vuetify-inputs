import { vi } from 'vitest';

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
