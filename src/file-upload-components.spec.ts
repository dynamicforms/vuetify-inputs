import Form from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DfFile from '@/df-file.vue';
import DfImage from '@/df-image.vue';
import { FileComms } from '@/helpers';
import { makeComms, pickFile, pngFile, touchGone } from '@/test-utils/files';

const GONE = 'The uploaded file is no longer available on the server.';

const pdfFile = () => new File([new Uint8Array([37, 80, 68, 70])], 'doc.pdf', { type: 'application/pdf' });

describe.each([
  { name: 'DfFile', component: DfFile, file: pdfFile, id: 'file-id-1', existing: 'file-id-1' },
  {
    name: 'DfImage',
    component: DfImage,
    file: pngFile,
    id: 'https://example.com/uploaded.png',
    existing: 'https://example.com/existing.png',
  },
])('$name file upload', ({ component, file, id, existing }) => {
  let comms: FileComms;

  const mountInput = (props: Record<string, any> = {}) =>
    mount(component, { props: { comms, label: 'Upload', ...props } });

  beforeEach(() => {
    comms = makeComms(async () => id);
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('names the progress bar shown while a file uploads', async () => {
    comms.upload = vi.fn(() => new Promise<string>(() => {}));
    const wrapper = mountInput();

    await pickFile(wrapper, file());

    expect(wrapper.find('.v-field__loader [role="progressbar"]').attributes('aria-label')).toBe('Uploading');
  });

  it('uploads a picked file and reflects the returned identifier as modelValue', async () => {
    const wrapper = mountInput();

    await pickFile(wrapper, file());

    expect(comms.upload).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([id]);
  });

  it('deletes a file it uploaded and clears modelValue on click:clear', async () => {
    const wrapper = mountInput();
    await pickFile(wrapper, file());

    await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

    expect(comms.delete).toHaveBeenCalledWith(id);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null]);
  });

  it('clears a file it was given without deleting it', async () => {
    const control = new Form.Field<string | null>({ value: existing });
    const wrapper = mountInput({ control });

    await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

    expect(comms.delete).not.toHaveBeenCalled();
    expect(control.value).toBeNull();
  });

  it('shows no clear button with clearable false', () => {
    const wrapper = mountInput({ modelValue: existing, clearable: false });

    expect(wrapper.findComponent({ name: 'VField' }).props('clearable')).toBe(false);
  });

  it('touches the uploaded file at a regular interval', async () => {
    const wrapper = mountInput({ touchInterval: 1_000 });
    await pickFile(wrapper, file());

    await vi.advanceTimersByTimeAsync(1_000);

    expect(comms.touch).toHaveBeenCalledWith(id);
  });

  it('keeps the uploaded file when the field is disabled while the upload runs', async () => {
    let finishUpload!: (id: string) => void;
    comms.upload = vi.fn(() => new Promise<string>((resolve) => (finishUpload = resolve)));
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountInput({ control, touchInterval: 1_000 });
    await pickFile(wrapper, file());

    control.access = 'disabled';
    finishUpload(id);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(control.value).toBe(id);
    expect(comms.touch).toHaveBeenCalledWith(id);
  });

  it('clears the field and reports the error on control when touch reports the file is gone', async () => {
    comms.touch = touchGone(GONE);
    const control = new Form.Field<string>({ value: '' });
    const wrapper = mountInput({ control, touchInterval: 1_000 });
    await pickFile(wrapper, file());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(control.value).toBeFalsy();
    expect(control.errors).toHaveLength(1);
    expect(control.errors[0].detail).toBe(GONE);
  });

  it('clears a disabled field when touch reports the file is gone', async () => {
    comms.touch = touchGone(GONE);
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountInput({ control, touchInterval: 1_000 });
    await pickFile(wrapper, file());
    await vi.advanceTimersByTimeAsync(0);
    expect(control.value).toBe(id);

    control.access = 'disabled';
    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(control.value).toBeNull();
    expect(control.errors).toHaveLength(1);
  });

  it('clears the field without throwing when touch reports the file is gone and no control is bound', async () => {
    comms.touch = touchGone(GONE);
    const wrapper = mountInput({ touchInterval: 1_000 });
    await pickFile(wrapper, file());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null]);
  });

  it('leaves the field untouched when touch rejects with a transient error', async () => {
    comms.touch = vi.fn(async () => {
      throw new Error('network hiccup');
    });
    const wrapper = mountInput({ touchInterval: 1_000 });
    await pickFile(wrapper, file());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([id]);
  });
});
