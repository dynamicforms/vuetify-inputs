/**
 * Calls `save` for a double-click on an element matching `selector`. In a picker inside `v-confirm-edit`, a
 * double-click on a choice selects it and confirms it, as a choice followed by OK does.
 */
export function saveOnDoubleClick(event: MouseEvent, selector: string, save: () => void): void {
  if (event.target instanceof Element && event.target.closest(selector)) save();
}
