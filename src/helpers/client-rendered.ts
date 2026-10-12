import { onMounted, type Ref, shallowRef } from 'vue';
import { useDisplay } from 'vuetify';

/**
 * Whether a part of a component that renders only in the browser is rendered now: a menu, a picker, an autocomplete.
 *
 * - On the server: `false`.
 * - In the browser, where Vuetify is created with `ssr: true`: `false` until the component is mounted, so the first
 *   render matches the server's and hydrates, then `true`.
 * - In the browser otherwise: `true` from the start.
 *
 * Vuetify's menus are not rendered on the server: each one rendered there stays in memory after the request.
 */
export function useClientRendered(): Ref<boolean> {
  if (typeof window === 'undefined') return shallowRef(false);
  if (!useDisplay().ssr) return shallowRef(true);
  const rendered = shallowRef(false);
  onMounted(() => {
    rendered.value = true;
  });
  return rendered;
}
