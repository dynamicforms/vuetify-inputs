import Form from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DfFile from '@/df-file.vue';
import { FileComms } from '@/helpers';
import { makeComms, pickFile, touchGone } from '@/test-utils/files';

const GONE = 'The uploaded file is no longer available on the server.';

const pdfFile = (name = 'doc.pdf') => new File([new Uint8Array([37, 80, 68, 70])], name, { type: 'application/pdf' });

describe('DfFile', () => {
  let comms: FileComms;

  const mountFile = (props: Record<string, any> = {}) =>
    mount(DfFile, {
      props: { comms, label: 'Document', ...props },
    });

  beforeEach(() => {
    comms = makeComms(async () => 'file-id-1');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows drag feedback while dragging over the field', async () => {
    const wrapper = mountFile();

    await wrapper.find('input[type="file"]').trigger('dragover');

    expect(wrapper.find('.v-file-input').classes()).toContain('v-file-input--dragging');
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

  it('uploads no file selected on a read-only field', async () => {
    const control = new Form.Field<string | null>({ value: 'file-id-1', access: 'readonly' });
    const wrapper = mountFile({ control });

    await pickFile(wrapper, pdfFile());

    expect(comms.upload).not.toHaveBeenCalled();
    expect(control.value).toBe('file-id-1');
    expect(wrapper.findComponent({ name: 'VField' }).props('clearable')).toBe(false);
  });

  it('marks a bound field touched when the upload returns', async () => {
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountFile({ control });

    await pickFile(wrapper, pdfFile());

    expect(control.value).toBe('file-id-1');
    expect(control.touched).toBe(true);
  });

  it('drops the file_gone error when a new file is uploaded', async () => {
    comms.touch = touchGone(GONE);
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountFile({ control, touchInterval: 1_000 });
    await pickFile(wrapper, pdfFile());
    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();
    expect(control.errors.map((error) => error.code)).toEqual(['vuetify-inputs.file_gone']);

    comms.touch = vi.fn(async () => undefined);
    await pickFile(wrapper, pdfFile());
    await vi.advanceTimersByTimeAsync(0);

    expect(control.value).toBeTruthy();
    expect(control.errors).toHaveLength(0);
  });

  it('takes the css class the bound control carries', () => {
    const control = new Form.Field<string | null>({ value: null, cssClass: 'own-class' });
    const wrapper = mountFile({ control });

    expect(wrapper.find('.v-input').classes()).toContain('own-class');
  });
});
