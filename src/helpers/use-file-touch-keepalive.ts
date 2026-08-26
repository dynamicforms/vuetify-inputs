import Form, { ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { inject, onBeforeUnmount, ref, watch, type Ref } from 'vue';

import { FileComms, FileGoneError } from './df-file.interface';
import { VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';

/**
 * Runs the `comms.touch` keep-alive interval for `<df-file>`/`<df-image>` while `value` holds a file
 * identifier: starts it once `value` becomes truthy, stops it once it doesn't, and stops it on unmount.
 * `onGone` is called with `err.errorText` whenever a touch rejects with a {@link FileGoneError}; any other
 * rejection is left unhandled beyond that (it's a transient failure, for the consumer to act on if at all).
 */
export function useFileTouchKeepAlive(
  value: Ref<string | null>,
  comms: () => FileComms,
  touchIntervalProp: () => number | undefined,
  onGone: (errorText: string) => void,
) {
  const settings = inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});
  const touchIntervalHandle = ref<number | null>(null);

  function clearTouchInterval() {
    if (touchIntervalHandle.value) window.clearInterval(touchIntervalHandle.value);
  }

  function setupTouchInterval() {
    clearTouchInterval();
    const interval = touchIntervalProp() ?? settings.defaultTouchInterval ?? 60_000;
    touchIntervalHandle.value = window.setInterval(() => {
      if (value.value) {
        comms()
          .touch(value.value)
          .catch((err) => {
            if (err instanceof FileGoneError) onGone(err.errorText);
          });
      }
    }, interval);
  }

  onBeforeUnmount(() => clearTouchInterval());
  watch(value, (newValue) => (newValue ? setupTouchInterval() : clearTouchInterval()));

  return { setupTouchInterval, clearTouchInterval };
}

/**
 * Reports a {@link FileGoneError}'s message on `control`, where one is bound. Kept outside the component's own
 * script so the write to `control.errors` isn't seen as a `.vue` component mutating its own prop — the write
 * goes through `Form.FieldBase`'s own setter, the same way `useInputBase`'s `touched` does.
 */
export function setFileGoneError(control: Form.FieldBase | undefined, errorText: string) {
  if (control) control.errors = [new ValidationErrorRenderContent(errorText)];
}
