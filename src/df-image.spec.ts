import Form from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DfImage from '@/df-image.vue';
import { FileComms } from '@/helpers';
import { fileList, makeComms, pickFile, PNG_BYTES, pngFile, touchGone } from '@/test-utils/files';

const GONE = 'The uploaded image is no longer available on the server.';

const textFile = (name = 'notes.txt') => new File(['hello'], name, { type: 'text/plain' });

describe('DfImage', () => {
  let comms: FileComms;

  beforeEach(() => {
    comms = makeComms(async () => 'https://example.com/uploaded.png');
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

  it('shows the image of a value set on the field after an upload', async () => {
    const control = new Form.Field<string | null>({ value: null });
    const wrapper = mountImage({ control });
    await pickFile(wrapper, pngFile());
    expect(wrapper.findComponent({ name: 'VImg' }).props('src')).toBe('blob:mock-url');

    control.value = 'https://example.com/other.png';
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'VImg' }).props('src')).toBe('https://example.com/other.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('clears the preview when touch reports the image is gone', async () => {
    comms.touch = touchGone(GONE);
    const wrapper = mountImage({ touchInterval: 1_000 });
    await pickFile(wrapper, pngFile());
    expect(wrapper.findComponent({ name: 'VImg' }).exists()).toBe(true);

    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'VImg' }).exists()).toBe(false);
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
      const blob = new Blob([PNG_BYTES], { type: 'image/png' });
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
