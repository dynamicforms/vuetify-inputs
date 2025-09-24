import { vi } from 'vitest';

vi.mock('vue-cached-icon', () => ({
  CachedIcon: {
    template: '<div class="cached-icon-wrapper"><svg title="{{ name }}" /></div>',
    props: ['name'],
  },
}));
