import Form from '@dynamicforms/vue-forms';
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

  it('marks a bound field touched when the upload of a dropped image returns', async () => {
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountImage({ control });

    await wrapper.find('.df-image-wrapper').trigger('drop', { dataTransfer: { files: fileList([pngFile()]) } });
    await vi.advanceTimersByTimeAsync(0);

    expect(control.value).toBe('https://example.com/uploaded.png');
    expect(control.touched).toBe(true);
  });

  it('rejects a dropped non-image file without uploading', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountImage();

    await wrapper.find('.df-image-wrapper').trigger('drop', { dataTransfer: { files: fileList([textFile()]) } });

    expect(comms.upload).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('deletes an image it uploaded and clears modelValue on click:clear', async () => {
    const wrapper = mountImage();
    await pickImage(wrapper, pngFile());

    await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

    expect(comms.delete).toHaveBeenCalledWith('https://example.com/uploaded.png');
    const emitted = wrapper.emitted('update:modelValue') as any[];
    expect(emitted[emitted.length - 1]).toEqual([null]);
  });

  it('clears an image it was given without deleting it', async () => {
    const control = new Form.Field<string | null>({ value: 'https://example.com/existing.png' });
    const wrapper = mountImage({ control });

    await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

    expect(comms.delete).not.toHaveBeenCalled();
    expect(control.value).toBeNull();
  });

  it('shows no clear button with clearable false', () => {
    const wrapper = mountImage({ modelValue: 'https://example.com/existing.png', clearable: false });

    expect(wrapper.findComponent({ name: 'VField' }).props('clearable')).toBe(false);
  });

  it('shows the image of a value set on the field after an upload', async () => {
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountImage({ control });
    await pickImage(wrapper, pngFile());
    expect(wrapper.findComponent({ name: 'VImg' }).props('src')).toBe('blob:mock-url');

    control.value = 'https://example.com/other.png';
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'VImg' }).props('src')).toBe('https://example.com/other.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('touches the uploaded image at a regular interval', async () => {
    const wrapper = mountImage({ touchInterval: 1_000 });
    await pickImage(wrapper, pngFile());

    await vi.advanceTimersByTimeAsync(1_000);

    expect(comms.touch).toHaveBeenCalledWith('https://example.com/uploaded.png');
  });

  it('keeps the uploaded image when the field is disabled while the upload runs', async () => {
    let finishUpload!: (id: string) => void;
    comms.upload = vi.fn(() => new Promise<string>((resolve) => (finishUpload = resolve)));
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountImage({ control, touchInterval: 1_000 });
    await pickImage(wrapper, pngFile());

    control.access = 'disabled';
    finishUpload('https://example.com/uploaded.png');
    await vi.advanceTimersByTimeAsync(1_000);

    expect(control.value).toBe('https://example.com/uploaded.png');
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
    expect(control.errors[0].detail).toBe('The uploaded image is no longer available on the server.');
    expect(wrapper.findComponent({ name: 'VImg' }).exists()).toBe(false);
  });

  it('clears a disabled field when touch reports the image is gone', async () => {
    comms.touch = vi.fn(async () => {
      throw new FileGoneError('The uploaded image is no longer available on the server.');
    });
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountImage({ control, touchInterval: 1_000 });
    await pickImage(wrapper, pngFile());
    await vi.advanceTimersByTimeAsync(0);
    expect(control.value).toBe('https://example.com/uploaded.png');

    control.access = 'disabled';
    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(control.value).toBeNull();
    expect(control.errors).toHaveLength(1);
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

  describe('clipboard', () => {
    const setClipboard = (read?: () => Promise<any[]>) =>
      Object.defineProperty(navigator, 'clipboard', {
        value: read ? { read: vi.fn(read) } : undefined,
        configurable: true,
      });
    const clipboardItem = (types: string[], blob: Blob) => ({ types, getType: vi.fn(async () => blob) });

    afterEach(() => setClipboard());

    it('shows no paste button where the browser cannot read the clipboard', async () => {
      setClipboard();
      const wrapper = mountImage();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.df-image-paste-btn').exists()).toBe(false);
    });

    it('shows no paste button on a disabled field', async () => {
      setClipboard(async () => []);
      const wrapper = mountImage({ control: new Form.Field<string | null>({ value: null, access: 'disabled' }) });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.df-image-paste-btn').exists()).toBe(false);
    });

    it('moves the paste button next to the replace button when an image is shown', async () => {
      setClipboard(async () => []);
      const empty = mountImage();
      const filled = mountImage({ modelValue: 'https://example.com/existing.png' });
      await empty.vm.$nextTick();
      await filled.vm.$nextTick();

      expect(empty.find('.df-image-paste-btn').classes()).not.toContain('df-image-paste-btn-shifted');
      expect(filled.find('.df-image-paste-btn').classes()).toContain('df-image-paste-btn-shifted');
    });

    it('uploads the image the paste button reads from the clipboard', async () => {
      const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
      setClipboard(async () => [clipboardItem(['text/html', 'image/png'], blob)]);
      const wrapper = mountImage();
      await wrapper.vm.$nextTick();

      await wrapper.find('.df-image-paste-btn').trigger('click');
      await vi.advanceTimersByTimeAsync(0);

      expect(comms.upload).toHaveBeenCalledTimes(1);
      const file = (comms.upload as any).mock.calls[0][0] as File;
      expect(file.type).toBe('image/png');
      expect(file.name).toBe('clipboard.png');
    });

    it('uploads nothing when the clipboard holds no image', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      setClipboard(async () => [clipboardItem(['text/plain'], new Blob(['hello']))]);
      const wrapper = mountImage();
      await wrapper.vm.$nextTick();

      await wrapper.find('.df-image-paste-btn').trigger('click');
      await vi.advanceTimersByTimeAsync(0);

      expect(comms.upload).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('uploads nothing when reading the clipboard is refused', async () => {
      setClipboard(async () => {
        throw new DOMException('denied', 'NotAllowedError');
      });
      const wrapper = mountImage();
      await wrapper.vm.$nextTick();

      await wrapper.find('.df-image-paste-btn').trigger('click');
      await vi.advanceTimersByTimeAsync(0);

      expect(comms.upload).not.toHaveBeenCalled();
    });

    it('uploads an image pasted with Ctrl+V', async () => {
      const wrapper = mountImage();
      const file = pngFile();

      await wrapper.find('.df-image-wrapper').trigger('paste', {
        clipboardData: { items: [{ kind: 'file', getAsFile: () => file }], files: fileList([file]) },
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(comms.upload).toHaveBeenCalledWith(file, expect.any(Function));
    });

    it('ignores a Ctrl+V paste on a disabled field', async () => {
      const wrapper = mountImage({ control: new Form.Field<string | null>({ value: null, access: 'disabled' }) });
      const file = pngFile();

      await wrapper.find('.df-image-wrapper').trigger('paste', {
        clipboardData: { items: [{ kind: 'file', getAsFile: () => file }], files: fileList([file]) },
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(comms.upload).not.toHaveBeenCalled();
    });
  });
});
