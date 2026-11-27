import { config } from '@vue/test-utils';

/** Runs `mountFn` with `plugins` in place of the Vuetify instance that test-setup registers for every mount. */
export function withPlugins<T>(plugins: typeof config.global.plugins, mountFn: () => T): T {
  const shared = config.global.plugins;
  config.global.plugins = plugins;
  try {
    return mountFn();
  } finally {
    config.global.plugins = shared;
  }
}
