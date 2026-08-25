import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import DfImage from '@/df-image.vue';
import { FileComms } from '@/helpers';

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
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  const mountImage = (props: Record<string, any> = {}) =>
    mount(DfImage, {
      props: { comms, label: 'Photo', ...props },
      global: { plugins: [vuetify] },
    });

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

  it('uploads a picked image and reflects the returned identifier as modelValue', async () => {
    const wrapper = mountImage();

    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: fileList([pngFile()]), configurable: true });
    await input.trigger('change');
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(comms.upload).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual(['https://example.com/uploaded.png']);
  });

  it('uploads a dropped image', async () => {
    const wrapper = mountImage();

    await wrapper.find('.df-image-wrapper').trigger('drop', { dataTransfer: { files: fileList([pngFile()]) } });
    await new Promise((resolve) => setTimeout(resolve, 0));

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
});
