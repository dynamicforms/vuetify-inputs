/**
 * The time after a picker changes its view during which a double-click does not confirm. It is longer than the
 * double-click interval of common systems (500 ms on Windows, less on macOS and GNOME), so where the first click of a
 * double-click changes the view - an hour switching the clock to the minutes, a month switching to its days - the
 * second click, which lands on a choice the user did not aim at, does not confirm it.
 */
export const viewSettleMs = 600;

/**
 * Double-click confirmation for a picker inside `v-confirm-edit`: a double-click on a choice selects it and confirms
 * it, as a choice followed by OK does. `viewChanged` is bound to the picker's `update:viewMode`.
 */
export function usePickerDoubleClick() {
  let viewChangedAt = Number.NEGATIVE_INFINITY;

  return {
    viewChanged(): void {
      viewChangedAt = Date.now();
    },
    /** Calls `save` for a double-click on an element matching `selector`, unless the view changed just before. */
    saveOnDoubleClick(event: MouseEvent, selector: string, save: () => void): void {
      if (Date.now() - viewChangedAt < viewSettleMs) return;
      if (event.target instanceof Element && event.target.closest(selector)) save();
    },
  };
}
