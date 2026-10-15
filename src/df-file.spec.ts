import Form from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import DfFile from '@/df-file.vue';
import { FileComms, FileGoneError } from '@/helpers';

const pdfFile = (name = 'doc.pdf') => new File([new Uint8Array([37, 80, 68, 70])], name, { type: 'application/pdf' });

function fileList(files: File[]): FileList {
  // v-file-input spreads `target.files`, so the mock has to be a real (iterable) array, not just array-like
  const list = files as unknown as FileList;
  (list as any).item = (i: number) => files[i] ?? null;
  return list;
}

describe('DfFile', () => {
  let vuetify: any;
  let comms: FileComms;

  const mountFile = (props: Record<string, any> = {}) =>
    mount(DfFile, {
      props: { comms, label: 'Document', ...props },
      global: { plugins: [vuetify] },
    });

  const pickFile = async (wrapper: ReturnType<typeof mountFile>, file: File) => {
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: fileList([file]), configurable: true });
    await input.trigger('change');
    await wrapper.vm.$nextTick();
    await vi.advanceTimersByTimeAsync(0);
  };

  beforeEach(() => {
    vuetify = createVuetify({ components });
    comms = {
      upload: vi.fn(async () => 'file-id-1'),
      delete: vi.fn(async () => {}),
      touch: vi.fn(async () => {}),
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uploads a picked file and reflects the returned identifier as modelValue', async () => {
    const wrapper = mountFile();

    await pickFile(wrapper, pdfFile());

    expect(comms.upload).toHaveBeenCalledTimes(1);
    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual(['file-id-1']);
  });

  it('shows drag feedback while dragging over the field', async () => {
    const wrapper = mountFile();

    await wrapper.find('input[type="file"]').trigger('dragover');

    expect(wrapper.find('.v-file-input').classes()).toContain('v-file-input--dragging');
  });

  it('deletes a file it uploaded and clears modelValue on click:clear', async () => {
    const wrapper = mountFile();
    await pickFile(wrapper, pdfFile());

    await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

    expect(comms.delete).toHaveBeenCalledWith('file-id-1');
    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual([null]);
  });

  it('clears a file it was given without deleting it', async () => {
    const control = new Form.Field<string | null>({ value: 'file-id-1' });
    const wrapper = mountFile({ control });

    await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

    expect(comms.delete).not.toHaveBeenCalled();
    expect(control.value).toBeNull();
  });

  it('shows no clear button with clearable false', () => {
    const wrapper = mountFile({ modelValue: 'file-id-1', clearable: false });

    expect(wrapper.findComponent({ name: 'VField' }).props('clearable')).toBe(false);
  });

  it('shows a value set on the field after an upload as the file label', async () => {
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountFile({ control });
    await pickFile(wrapper, pdfFile());

    control.value = 'other.pdf';
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'VFileInput' }).props('label')).toBe('other.pdf');
  });

  it('shows an existing control-bound value as the file label', () => {
    const control = new Form.Field<string>({ value: 'fonti/existing.ttf' });
    const wrapper = mountFile({ control });

    expect(wrapper.findComponent({ name: 'VFileInput' }).props('label')).toBe('fonti/existing.ttf');
  });

  it('does not render a download control when comms has no getDownloadUrl', () => {
    const wrapper = mountFile({ modelValue: 'doc.pdf' });

    expect(wrapper.find('.df-file-download-btn').exists()).toBe(false);
  });

  it('downloads the existing file through comms.getDownloadUrl', async () => {
    comms.getDownloadUrl = vi.fn(async () => 'blob:mock-url');
    const wrapper = mountFile({ modelValue: 'doc.pdf' });

    await wrapper.find('.df-file-download-btn').trigger('click');

    expect(comms.getDownloadUrl).toHaveBeenCalledWith('doc.pdf');
  });

  it('touches the uploaded file at a regular interval', async () => {
    const wrapper = mountFile({ touchInterval: 1_000 });
    await pickFile(wrapper, pdfFile());

    await vi.advanceTimersByTimeAsync(1_000);

    expect(comms.touch).toHaveBeenCalledWith('file-id-1');
  });

  it('uploads no file selected on a read-only field', async () => {
    const control = new Form.Field<string | null>({ value: 'file-id-1', access: 'readonly' });
    const wrapper = mountFile({ control });

    await pickFile(wrapper, pdfFile());

    expect(comms.upload).not.toHaveBeenCalled();
    expect(control.value).toBe('file-id-1');
    expect(wrapper.findComponent({ name: 'VField' }).props('clearable')).toBe(false);
  });

  it('keeps the uploaded file when the field is disabled while the upload runs', async () => {
    let finishUpload!: (id: string) => void;
    comms.upload = vi.fn(() => new Promise<string>((resolve) => (finishUpload = resolve)));
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountFile({ control, touchInterval: 1_000 });
    await pickFile(wrapper, pdfFile());

    control.access = 'disabled';
    finishUpload('file-id-1');
    await vi.advanceTimersByTimeAsync(1_000);

    expect(control.value).toBe('file-id-1');
    expect(comms.touch).toHaveBeenCalledWith('file-id-1');
  });

  it('clears the field and reports the error on control when touch reports the file is gone', async () => {
    comms.touch = vi.fn(async () => {
      throw new FileGoneError('The uploaded file is no longer available on the server.');
    });
    const control = new Form.Field<string>({ value: '' });
    const wrapper = mountFile({ control, touchInterval: 1_000 });
    await pickFile(wrapper, pdfFile());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(control.value).toBeFalsy();
    expect(control.errors).toHaveLength(1);
    expect(control.errors[0].detail).toBe('The uploaded file is no longer available on the server.');
  });

  it('marks a bound field touched when the upload returns', async () => {
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountFile({ control });

    await pickFile(wrapper, pdfFile());

    expect(control.value).toBe('file-id-1');
    expect(control.touched).toBe(true);
  });

  it('drops the file_gone error when a new file is uploaded', async () => {
    comms.touch = vi.fn(async () => {
      throw new FileGoneError('The uploaded file is no longer available on the server.');
    });
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountFile({ control, touchInterval: 1_000 });
    await pickFile(wrapper, pdfFile());
    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();
    expect(control.errors.map((error) => error.code)).toEqual(['file_gone']);

    comms.touch = vi.fn(async () => undefined);
    await pickFile(wrapper, pdfFile());
    await vi.advanceTimersByTimeAsync(0);

    expect(control.value).toBeTruthy();
    expect(control.errors).toHaveLength(0);
  });

  it('clears a disabled field when touch reports the file is gone', async () => {
    comms.touch = vi.fn(async () => {
      throw new FileGoneError('The uploaded file is no longer available on the server.');
    });
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountFile({ control, touchInterval: 1_000 });
    await pickFile(wrapper, pdfFile());
    await vi.advanceTimersByTimeAsync(0);
    expect(control.value).toBe('file-id-1');

    control.access = 'disabled';
    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(control.value).toBeNull();
    expect(control.errors).toHaveLength(1);
  });

  it('clears the field without throwing when touch reports the file is gone and no control is bound', async () => {
    comms.touch = vi.fn(async () => {
      throw new FileGoneError('The uploaded file is no longer available on the server.');
    });
    const wrapper = mountFile({ touchInterval: 1_000 });
    await pickFile(wrapper, pdfFile());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual([null]);
  });

  it('leaves the field untouched when touch rejects with a transient error', async () => {
    comms.touch = vi.fn(async () => {
      throw new Error('network hiccup');
    });
    const wrapper = mountFile({ touchInterval: 1_000 });
    await pickFile(wrapper, pdfFile());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual(['file-id-1']);
  });
});
