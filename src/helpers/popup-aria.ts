import type { Directive } from 'vue';

/**
 * `activatorProps` of a `v-menu` with `activator="parent"` in a field: the field's `div.v-field` keeps the menu's
 * events and loses the ARIA attributes the menu would set on it, which a role-less element may not carry.
 */
export const fieldMenuActivatorProps = {
  'aria-haspopup': null,
  'aria-expanded': null,
  'aria-controls': null,
  'aria-owns': null,
};

/**
 * The ARIA attributes of a text input that opens a dialog popup while the focus stays in the input: `aria-haspopup`,
 * `aria-expanded`, and `aria-controls` while the popup is shown. The input's `role` is set by `vInputRole`. An input
 * without a popup (read-only, or before the menu renders) gets none.
 */
export function dialogPopupAria(hasPopup: boolean, expanded: boolean, popupId: string) {
  if (!hasPopup) return {};
  return {
    'aria-haspopup': 'dialog',
    'aria-expanded': String(expanded),
    'aria-controls': expanded ? popupId : undefined,
  };
}

/** `contentProps` of the popup `dialogPopupAria` points to, named by `aria-labelledby` or `aria-label`. */
export const dialogPopupContentProps = (
  popupId: string,
  name: { 'aria-labelledby'?: string; 'aria-label'?: string },
) => ({
  id: popupId,
  role: 'dialog',
  'aria-labelledby': name['aria-labelledby'] || undefined,
  'aria-label': name['aria-labelledby'] ? undefined : name['aria-label'] || undefined,
});

function setInputRole(el: HTMLElement, role: string | undefined) {
  const input = el.querySelector('input');
  if (!input) return;
  if (role) input.setAttribute('role', role);
  else input.removeAttribute('role');
}

/**
 * Sets the `role` of the first `<input>` in the element, `undefined` removes it. `v-text-field`'s `role` prop also
 * gives the role to its `div.v-field`.
 */
export const vInputRole: Directive<HTMLElement, string | undefined> = {
  mounted: (el, { value }) => setInputRole(el, value),
  updated: (el, { value }) => setInputRole(el, value),
};
