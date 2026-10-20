import Form, { ValidationError } from '@dynamicforms/vue-forms';
import { computed, inject, onBeforeUnmount, ref, watch, type Ref } from 'vue';

import { FileComms, FileGoneError } from './df-file.interface';
import { namespaced } from './error-namespace';
import { VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';

export interface FileUploadOptions {
  value: Ref<string | null>;
  touched: Ref<boolean>;
  comms: () => FileComms;
  touchInterval: () => number | undefined;
  control: () => Form.FieldBase | undefined;
}

/**
 * The upload state of `<df-file>`/`<df-image>`.
 *
 * An identifier is a temporary upload while the value holds the identifier this component's last upload returned
 * and, where a `control` is bound, that identifier is not the control's `originalValue`. Only a temporary upload is
 * touched every `touchInterval` milliseconds and deleted through `comms.delete` when the field is cleared or another
 * upload replaces it. An identifier the field was given, or one that became the control's `originalValue` (a saved
 * form), is neither touched nor deleted.
 *
 * Only the latest upload writes into the value. An upload superseded by another upload, a clear or a value set on the
 * field while it runs writes nothing, and the identifier it returns is deleted. A touch that rejects with a
 * {@link FileGoneError} clears the field only while the value still holds the touched identifier.
 */
export function useFileUpload({ value, touched, comms, touchInterval, control }: FileUploadOptions) {
  const settings = inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});

  // the file of the latest upload, kept once it succeeds; null when the value holds no upload of this component
  const currentFile = ref<File | null>(null);
  const progress = ref(0);
  const loading = computed(() => !!currentFile.value && progress.value < 100);

  const ownUpload = ref<string | null>(null);
  const temporaryUpload = computed(() => {
    const id = ownUpload.value;
    if (!id || value.value !== id) return null;
    const ctrl = control();
    return ctrl && ctrl.originalValue === id ? null : id;
  });

  let uploadSeq = 0;
  let inFlight = false;

  function deleteQuietly(id: string) {
    comms()
      .delete(id)
      .catch((err) => {
        if (!(err instanceof FileGoneError)) throw err;
      });
  }

  function reset() {
    uploadSeq++;
    inFlight = false;
    ownUpload.value = null;
    currentFile.value = null;
    progress.value = 0;
  }

  // a value set on the field from outside supersedes an upload in flight and the file shown for the last one
  watch(value, (newValue) => {
    if (inFlight || (currentFile.value && newValue !== ownUpload.value)) {
      uploadSeq++;
      inFlight = false;
      currentFile.value = null;
      progress.value = 0;
    }
  });

  async function upload(file: File) {
    const seq = ++uploadSeq;
    inFlight = true;
    currentFile.value = file;
    progress.value = -1;
    let id: string;
    try {
      id = await comms().upload(file, (loaded: number, total: number) => {
        if (seq === uploadSeq) progress.value = Math.round((loaded * 100) / total);
      });
    } catch (err) {
      if (seq !== uploadSeq) return;
      inFlight = false;
      currentFile.value = null;
      progress.value = 0;
      throw err;
    }
    if (seq !== uploadSeq) {
      deleteQuietly(id);
      return;
    }
    const replaced = temporaryUpload.value;
    inFlight = false;
    ownUpload.value = id;
    value.value = id;
    progress.value = 100;
    // a picked file concludes the edit: the file dialog and a drop have no blur of the field
    touched.value = true;
    if (replaced && replaced !== id) deleteQuietly(replaced);
  }

  async function clear() {
    const temporary = temporaryUpload.value;
    reset();
    value.value = null;
    touched.value = true;
    if (temporary) {
      try {
        await comms().delete(temporary);
      } catch (err) {
        if (!(err instanceof FileGoneError)) throw err;
      }
    }
  }

  let touchHandle: number | null = null;
  function stopTouching() {
    if (touchHandle != null) window.clearInterval(touchHandle);
    touchHandle = null;
  }
  watch(temporaryUpload, (id) => {
    stopTouching();
    if (!id) return;
    const interval = touchInterval() ?? settings.defaultTouchInterval ?? 60_000;
    touchHandle = window.setInterval(() => {
      comms()
        .touch(id)
        .catch((err) => {
          if (!(err instanceof FileGoneError) || value.value !== id) return;
          reset();
          value.value = null;
          setFileGoneError(control(), err.errorText);
        });
    }, interval);
  });
  onBeforeUnmount(stopTouching);

  return { currentFile, progress, loading, upload, clear };
}

/**
 * Reports a {@link FileGoneError}'s message on `control`, where one is bound. Kept outside the component's own
 * script so the write to `control.errors` isn't seen as a `.vue` component mutating its own prop — the write
 * goes through `Form.FieldBase`'s own setter, the same way `useInputBase`'s `touched` does.
 */
export function setFileGoneError(control: Form.FieldBase | undefined, errorText: string) {
  if (control) control.errors = [new ValidationError(namespaced('file_gone'), {}, errorText, 'server')];
}
