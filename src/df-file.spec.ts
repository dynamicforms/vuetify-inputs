import Form, { ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
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

  it('deletes the uploaded file and clears modelValue on click:clear', async () => {
    const wrapper = mountFile({ modelValue: 'file-id-1' });

    await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

    expect(comms.delete).toHaveBeenCalledWith('file-id-1');
    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual([null]);
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
    expect((control.errors[0] as ValidationErrorRenderContent).resolvedText).toBe(
      'The uploaded file is no longer available on the server.',
    );
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
