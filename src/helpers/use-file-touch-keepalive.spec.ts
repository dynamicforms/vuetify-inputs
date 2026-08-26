import Form, { ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { FileComms, FileGoneError } from './df-file.interface';
import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from './settings';
import { setFileGoneError, useFileTouchKeepAlive } from './use-file-touch-keepalive';

const mockInjectValues = new Map<any, any>();
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    inject: (key: any, defaultValue?: any) => mockInjectValues.get(key) ?? defaultValue,
  };
});

function makeComms(touch = vi.fn(async () => {})): FileComms {
  return { upload: vi.fn(), delete: vi.fn(), touch };
}

describe('useFileTouchKeepAlive', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockInjectValues.clear();
    vi.useFakeTimers();
    // onBeforeUnmount warns when called outside a component instance, which every case here does by design
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    warnSpy.mockRestore();
  });

  it('does not touch while value is empty', async () => {
    const value = ref<string | null>(null);
    const comms = makeComms();
    useFileTouchKeepAlive(
      value,
      () => comms,
      () => undefined,
      vi.fn(),
    );

    await vi.advanceTimersByTimeAsync(120_000);

    expect(comms.touch).not.toHaveBeenCalled();
  });

  it('touches at the baked-in 60s default when no prop or setting is given', async () => {
    const value = ref<string | null>('file-1');
    const comms = makeComms();
    const { setupTouchInterval } = useFileTouchKeepAlive(
      value,
      () => comms,
      () => undefined,
      vi.fn(),
    );
    setupTouchInterval();

    await vi.advanceTimersByTimeAsync(59_999);
    expect(comms.touch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(comms.touch).toHaveBeenCalledWith('file-1');
  });

  it('a touchInterval prop overrides the baked-in default', async () => {
    const value = ref<string | null>('file-1');
    const comms = makeComms();
    const { setupTouchInterval } = useFileTouchKeepAlive(
      value,
      () => comms,
      () => 5_000,
      vi.fn(),
    );
    setupTouchInterval();

    await vi.advanceTimersByTimeAsync(5_000);
    expect(comms.touch).toHaveBeenCalledTimes(1);
  });

  it('an injected defaultTouchInterval setting is used when no prop is given', async () => {
    mockInjectValues.set(vuetifyInputsSettingsKey, { defaultTouchInterval: 10_000 } as VuetifyInputsSettings);
    const value = ref<string | null>('file-1');
    const comms = makeComms();
    const { setupTouchInterval } = useFileTouchKeepAlive(
      value,
      () => comms,
      () => undefined,
      vi.fn(),
    );
    setupTouchInterval();

    await vi.advanceTimersByTimeAsync(10_000);
    expect(comms.touch).toHaveBeenCalledTimes(1);
  });

  it('a touchInterval prop wins over an injected defaultTouchInterval setting', async () => {
    mockInjectValues.set(vuetifyInputsSettingsKey, { defaultTouchInterval: 10_000 } as VuetifyInputsSettings);
    const value = ref<string | null>('file-1');
    const comms = makeComms();
    const { setupTouchInterval } = useFileTouchKeepAlive(
      value,
      () => comms,
      () => 3_000,
      vi.fn(),
    );
    setupTouchInterval();

    await vi.advanceTimersByTimeAsync(3_000);
    expect(comms.touch).toHaveBeenCalledTimes(1);
  });

  it('starts touching once value becomes truthy, and stops once it clears', async () => {
    const value = ref<string | null>(null);
    const comms = makeComms();
    useFileTouchKeepAlive(
      value,
      () => comms,
      () => 1_000,
      vi.fn(),
    );

    value.value = 'file-1';
    await nextTick();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(comms.touch).toHaveBeenCalledTimes(1);

    value.value = null;
    await nextTick();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(comms.touch).toHaveBeenCalledTimes(1);
  });

  it('calls onGone with errorText when touch rejects with a FileGoneError', async () => {
    const comms = makeComms(
      vi.fn(async () => {
        throw new FileGoneError('The uploaded file is no longer available.');
      }),
    );
    const value = ref<string | null>('file-1');
    const onGone = vi.fn();
    const { setupTouchInterval } = useFileTouchKeepAlive(
      value,
      () => comms,
      () => 1_000,
      onGone,
    );
    setupTouchInterval();

    await vi.advanceTimersByTimeAsync(1_000);

    expect(onGone).toHaveBeenCalledWith('The uploaded file is no longer available.');
  });

  it('does not call onGone for a transient (non-FileGoneError) rejection', async () => {
    const comms = makeComms(
      vi.fn(async () => {
        throw new Error('network hiccup');
      }),
    );
    const value = ref<string | null>('file-1');
    const onGone = vi.fn();
    const { setupTouchInterval } = useFileTouchKeepAlive(
      value,
      () => comms,
      () => 1_000,
      onGone,
    );
    setupTouchInterval();

    await vi.advanceTimersByTimeAsync(1_000);

    expect(onGone).not.toHaveBeenCalled();
  });
});

describe('setFileGoneError', () => {
  it('does nothing when no control is given', () => {
    expect(() => setFileGoneError(undefined, 'The file is gone')).not.toThrow();
  });

  it('sets control.errors to a single error carrying the given text', () => {
    const control = new Form.Field<string>({ value: 'file-1' });

    setFileGoneError(control, 'The file is gone');

    expect(control.errors).toHaveLength(1);
    expect(control.errors[0]).toBeInstanceOf(ValidationErrorRenderContent);
    expect((control.errors[0] as ValidationErrorRenderContent).resolvedText).toBe('The file is gone');
  });
});
