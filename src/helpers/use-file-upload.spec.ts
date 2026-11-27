import Form, { ValidationError } from '@dynamicforms/vue-forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, ref } from 'vue';

import { FileComms, FileGoneError } from './df-file.interface';
import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from './settings';
import { setFileGoneError, useFileUpload } from './use-file-upload';

import { makeComms, touchGone } from '@/test-utils/files';
import { mockInjectValues } from '@/test-utils/mock-inject';

const GONE = 'The file is gone';

vi.mock('vue', async () => (await import('@/test-utils/mock-inject')).mockVueInject());

const file = (name: string) => new File([new Uint8Array([1])], name);

/** A promise and the functions that settle it, for a backend call answered when the test says so. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** uploads answer with an identifier derived from the file name */
const idFromName = async (f: File) => `id-${f.name}`;

function setup(
  options: {
    initial?: string | null;
    control?: Form.Field<string | null>;
    touchInterval?: number;
    comms?: FileComms;
  } = {},
) {
  const { control } = options;
  // with a control, the value follows it both ways, as useInputBase's does
  const value = control
    ? computed({ get: () => control.value, set: (v) => (control.value = v) })
    : ref<string | null>(options.initial ?? null);
  const comms = options.comms ?? makeComms(idFromName);
  const upload = useFileUpload({
    value,
    touched: ref(false),
    comms: () => comms,
    touchInterval: () => options.touchInterval,
    control: () => control,
  });
  return { value, comms, ...upload };
}

describe('useFileUpload', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockInjectValues.clear();
    vi.useFakeTimers();
    // the composable runs outside a component instance, where onBeforeUnmount warns
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    warnSpy.mockRestore();
  });

  describe('touching', () => {
    it('touches an uploaded file at the baked-in 60s default when no prop or setting is given', async () => {
      const { comms, upload } = setup();
      await upload(file('a'));
      await nextTick();

      await vi.advanceTimersByTimeAsync(59_999);
      expect(comms.touch).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(comms.touch).toHaveBeenCalledWith('id-a');
    });

    it('a touchInterval prop overrides the baked-in default', async () => {
      const { comms, upload } = setup({ touchInterval: 5_000 });
      await upload(file('a'));
      await nextTick();

      await vi.advanceTimersByTimeAsync(5_000);
      expect(comms.touch).toHaveBeenCalledTimes(1);
    });

    it('an injected defaultTouchInterval setting is used when no prop is given', async () => {
      mockInjectValues.set(vuetifyInputsSettingsKey, { defaultTouchInterval: 10_000 } as VuetifyInputsSettings);
      const { comms, upload } = setup();
      await upload(file('a'));
      await nextTick();

      await vi.advanceTimersByTimeAsync(10_000);
      expect(comms.touch).toHaveBeenCalledTimes(1);
    });

    it('a touchInterval prop wins over an injected defaultTouchInterval setting', async () => {
      mockInjectValues.set(vuetifyInputsSettingsKey, { defaultTouchInterval: 10_000 } as VuetifyInputsSettings);
      const { comms, upload } = setup({ touchInterval: 3_000 });
      await upload(file('a'));
      await nextTick();

      await vi.advanceTimersByTimeAsync(3_000);
      expect(comms.touch).toHaveBeenCalledTimes(1);
    });

    it('does not touch a value it was given', async () => {
      const { value, comms } = setup({ initial: 'saved', touchInterval: 1_000 });
      value.value = 'other-saved';
      await nextTick();

      await vi.advanceTimersByTimeAsync(10_000);
      expect(comms.touch).not.toHaveBeenCalled();
    });

    it('stops touching once the value no longer holds the upload', async () => {
      const { value, comms, upload } = setup({ touchInterval: 1_000 });
      await upload(file('a'));
      await nextTick();
      await vi.advanceTimersByTimeAsync(1_000);
      expect(comms.touch).toHaveBeenCalledTimes(1);

      value.value = 'other';
      await nextTick();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(comms.touch).toHaveBeenCalledTimes(1);
    });

    it("stops touching once the upload becomes the control's originalValue", async () => {
      const control = new Form.Field<string | null>({ value: null });
      const { comms, upload } = setup({ control, touchInterval: 1_000 });
      await upload(file('a'));
      await nextTick();
      await vi.advanceTimersByTimeAsync(1_000);
      expect(comms.touch).toHaveBeenCalledTimes(1);

      control.originalValue = control.value;
      await nextTick();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(comms.touch).toHaveBeenCalledTimes(1);
    });

    it('clears the value and reports the error when a touch reports the file is gone', async () => {
      const control = new Form.Field<string | null>({ value: null });
      const { comms, upload } = setup({ control, touchInterval: 1_000 });
      comms.touch = touchGone(GONE);
      await upload(file('a'));
      await nextTick();

      await vi.advanceTimersByTimeAsync(1_000);
      expect(control.value).toBeNull();
      expect(control.errors.map((error) => error.code)).toEqual(['vuetify-inputs.file_gone']);
    });

    it('leaves the value as it is when a touch rejects with a transient error', async () => {
      const { value, comms, upload } = setup({ touchInterval: 1_000 });
      comms.touch = vi.fn(async () => {
        throw new Error('network hiccup');
      });
      await upload(file('a'));
      await nextTick();

      await vi.advanceTimersByTimeAsync(1_000);
      expect(value.value).toBe('id-a');
    });

    it('leaves a newer upload in place when a touch of the previous one reports it gone', async () => {
      const { value, comms, upload } = setup({ touchInterval: 1_000 });
      const touch = deferred<void>();
      comms.touch = vi.fn(() => touch.promise);
      await upload(file('a'));
      await nextTick();
      await vi.advanceTimersByTimeAsync(1_000);
      expect(comms.touch).toHaveBeenCalledWith('id-a');

      await upload(file('b'));
      await nextTick();
      touch.reject(new FileGoneError(GONE));
      await vi.advanceTimersByTimeAsync(0);
      expect(value.value).toBe('id-b');
    });
  });

  describe('uploading', () => {
    it('writes only the latest upload when an earlier one answers last', async () => {
      const comms = makeComms(idFromName);
      const answers = { a: deferred<string>(), b: deferred<string>() };
      comms.upload = vi.fn((f: File) => answers[f.name as 'a' | 'b'].promise);
      const { value, upload, currentFile } = setup({ comms });

      const uploadA = upload(file('a'));
      const pickedB = file('b');
      const uploadB = upload(pickedB);
      answers.b.resolve('id-b');
      await uploadB;
      answers.a.resolve('id-a');
      await uploadA;

      expect(value.value).toBe('id-b');
      expect(currentFile.value).toBe(pickedB);
      expect(comms.delete).toHaveBeenCalledWith('id-a');
    });

    it('writes nothing for an upload that answers after a value was set on the field', async () => {
      const comms = makeComms(idFromName);
      const answer = deferred<string>();
      comms.upload = vi.fn(() => answer.promise);
      const { value, upload, currentFile } = setup({ comms });

      const running = upload(file('a'));
      value.value = 'other';
      await nextTick();
      answer.resolve('id-a');
      await running;

      expect(value.value).toBe('other');
      expect(currentFile.value).toBeNull();
      expect(comms.delete).toHaveBeenCalledWith('id-a');
    });

    it('forgets the uploaded file once a value is set on the field', async () => {
      const { value, upload, currentFile } = setup();
      await upload(file('a'));
      expect(currentFile.value).not.toBeNull();

      value.value = 'other';
      await nextTick();
      expect(currentFile.value).toBeNull();
    });

    it('deletes the upload it replaces', async () => {
      const { comms, upload } = setup();
      await upload(file('a'));
      await nextTick();
      await upload(file('b'));

      expect(comms.delete).toHaveBeenCalledWith('id-a');
    });

    it('deletes no file it was given when an upload replaces it', async () => {
      const { comms, upload } = setup({ initial: 'saved' });
      await upload(file('a'));

      expect(comms.delete).not.toHaveBeenCalled();
    });
  });

  describe('clearing', () => {
    it('deletes an upload it clears', async () => {
      const { value, comms, upload, clear } = setup();
      await upload(file('a'));
      await nextTick();

      await clear();
      expect(value.value).toBeNull();
      expect(comms.delete).toHaveBeenCalledWith('id-a');
    });

    it('deletes no file it was given when it clears it', async () => {
      const { value, comms, clear } = setup({ initial: 'saved' });

      await clear();
      expect(value.value).toBeNull();
      expect(comms.delete).not.toHaveBeenCalled();
    });

    it("deletes no upload that became the control's originalValue when it clears it", async () => {
      const control = new Form.Field<string | null>({ value: null });
      const { comms, upload, clear } = setup({ control });
      await upload(file('a'));
      control.originalValue = control.value;

      await clear();
      expect(control.value).toBeNull();
      expect(comms.delete).not.toHaveBeenCalled();
    });

    it('writes nothing for an upload that answers after the field was cleared', async () => {
      const comms = makeComms(idFromName);
      const answer = deferred<string>();
      comms.upload = vi.fn(() => answer.promise);
      const { value, upload, clear } = setup({ comms });

      const running = upload(file('a'));
      await clear();
      answer.resolve('id-a');
      await running;

      expect(value.value).toBeNull();
      expect(comms.delete).toHaveBeenCalledWith('id-a');
    });
  });
});

describe('setFileGoneError', () => {
  it('does nothing when no control is given', () => {
    expect(() => setFileGoneError(undefined, GONE)).not.toThrow();
  });

  it('sets control.errors to a single error carrying the given text', () => {
    const control = new Form.Field<string>({ value: 'file-1' });

    setFileGoneError(control, GONE);

    expect(control.errors).toHaveLength(1);
    expect(control.errors[0]).toBeInstanceOf(ValidationError);
    expect(control.errors[0]).toMatchObject({
      code: 'vuetify-inputs.file_gone',
      detail: GONE,
      origin: 'server',
    });
  });
});
