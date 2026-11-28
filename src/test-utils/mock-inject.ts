import { vi } from 'vitest';

/** Values the mocked `inject` returns, by injection key. */
export const mockInjectValues = new Map<any, any>();

/** A `vue` module whose `inject` reads `mockInjectValues`, falling back to the given default. */
export async function mockVueInject(): Promise<typeof import('vue')> {
  const actual = await vi.importActual<typeof import('vue')>('vue');
  return {
    ...actual,
    inject: (key: any, defaultValue?: any) => mockInjectValues.get(key) ?? defaultValue,
  };
}
