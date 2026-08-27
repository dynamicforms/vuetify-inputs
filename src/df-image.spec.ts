import Form, { ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import DfImage from '@/df-image.vue';
import { FileComms, FileGoneError } from '@/helpers';

const pngFile = (name = 'photo.png') => new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' });
const textFile = (name = 'notes.txt') => new File(['hello'], name, { type: 'text/plain' });

function fileList(files: File[]): FileList {
  const list = { length: files.length, item: (i: number) => files[i] ?? null } as FileList;
  files.forEach((file, i) => ((list as any)[i] = file));
  return list;
}

describe('DfImage', () => {
  let vuetify: any;
  let comms: FileComms;

  beforeEach(() => {
    vuetify = createVuetify({ components });
    comms = {
      upload: vi.fn(async () => 'https://example.com/uploaded.png'),
      delete: vi.fn(async () => {}),
      touch: vi.fn(async () => {}),
    };
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mountImage = (props: Record<string, any> = {}) =>
    mount(DfImage, {
      props: { comms, label: 'Photo', ...props },
      global: { plugins: [vuetify] },
    });

  const pickImage = async (wrapper: ReturnType<typeof mountImage>, file: File) => {
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: fileList([file]), configurable: true });
    await input.trigger('change');
    await wrapper.vm.$nextTick();
    await vi.advanceTimersByTimeAsync(0);
  };

  it('shows the drop placeholder when no image is set', () => {
    const wrapper = mountImage();

    expect(wrapper.find('.df-image-placeholder').exists()).toBe(true);
    expect(wrapper.find('.df-image-preview').exists()).toBe(false);
  });

  it('renders the existing image straight from modelValue, with no extra lookup', () => {
    const wrapper = mountImage({ modelValue: 'https://example.com/existing.png' });

    const img = wrapper.findComponent({ name: 'VImg' });
    expect(img.exists()).toBe(true);
    expect(img.props('src')).toBe('https://example.com/existing.png');
  });

  it('does not render a download link when no image is set', () => {
    const wrapper = mountImage();

    expect(wrapper.find('.df-image-download-btn').exists()).toBe(false);
  });

  it('renders a download link pointing at the existing image', () => {
    const wrapper = mountImage({ modelValue: 'https://example.com/existing.png' });

    const link = wrapper.find('.df-image-download-btn');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://example.com/existing.png');
  });

  it('uploads a picked image and reflects the returned identifier as modelValue', async () => {
    const wrapper = mountImage();

    await pickImage(wrapper, pngFile());

    expect(comms.upload).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual(['https://example.com/uploaded.png']);
  });

  it('uploads a dropped image', async () => {
    const wrapper = mountImage();

    await wrapper.find('.df-image-wrapper').trigger('drop', { dataTransfer: { files: fileList([pngFile()]) } });
    await vi.advanceTimersByTimeAsync(0);

    expect(comms.upload).toHaveBeenCalledTimes(1);
  });

  it('rejects a dropped non-image file without uploading', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountImage();

    await wrapper.find('.df-image-wrapper').trigger('drop', { dataTransfer: { files: fileList([textFile()]) } });

    expect(comms.upload).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('deletes the uploaded file and clears modelValue on click:clear', async () => {
    const wrapper = mountImage({ modelValue: 'https://example.com/existing.png' });

    await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

    expect(comms.delete).toHaveBeenCalledWith('https://example.com/existing.png');
    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual([null]);
  });

  it('touches the uploaded image at a regular interval', async () => {
    const wrapper = mountImage({ touchInterval: 1_000 });
    await pickImage(wrapper, pngFile());

    await vi.advanceTimersByTimeAsync(1_000);

    expect(comms.touch).toHaveBeenCalledWith('https://example.com/uploaded.png');
  });

  it('clears the field and preview and reports the error on control when touch reports the image is gone', async () => {
    comms.touch = vi.fn(async () => {
      throw new FileGoneError('The uploaded image is no longer available on the server.');
    });
    const control = new Form.Field<string>({ value: '' });
    const wrapper = mountImage({ control, touchInterval: 1_000 });
    await pickImage(wrapper, pngFile());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(control.value).toBeFalsy();
    expect(control.errors).toHaveLength(1);
    expect((control.errors[0] as ValidationErrorRenderContent).resolvedText).toBe(
      'The uploaded image is no longer available on the server.',
    );
    expect(wrapper.findComponent({ name: 'VImg' }).exists()).toBe(false);
  });

  it('clears the field without throwing when touch reports the image is gone and no control is bound', async () => {
    comms.touch = vi.fn(async () => {
      throw new FileGoneError('The uploaded image is no longer available on the server.');
    });
    const wrapper = mountImage({ touchInterval: 1_000 });
    await pickImage(wrapper, pngFile());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual([null]);
  });

  it('leaves the field untouched when touch rejects with a transient error', async () => {
    comms.touch = vi.fn(async () => {
      throw new Error('network hiccup');
    });
    const wrapper = mountImage({ touchInterval: 1_000 });
    await pickImage(wrapper, pngFile());

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual(['https://example.com/uploaded.png']);
  });
});
