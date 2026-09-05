import { flushPromises, mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import { translatableStrings } from '../translations';

import EditorCore from './editor-core.vue';

describe('EditorCore empty-content modelValue', () => {
  it('emits an empty string, not the empty paragraph HTML, when the document is cleared', async () => {
    const vuetify = createVuetify({ components });
    const wrapper = mount(EditorCore, {
      props: { modelValue: '<p>hello world</p>' },
      global: { plugins: [vuetify] },
    });
    await flushPromises();

    (wrapper.vm as unknown as { editor: { commands: { clearContent: () => void } } }).editor.commands.clearContent();
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
  });

  it('still emits HTML when the document holds only an image', async () => {
    const vuetify = createVuetify({ components });
    const wrapper = mount(EditorCore, {
      props: { modelValue: '' },
      global: { plugins: [vuetify] },
    });
    await flushPromises();

    (
      wrapper.vm as unknown as { editor: { commands: { setContent: (content: string) => void } } }
    ).editor.commands.setContent('<img src="data:image/png;base64,x">');
    await flushPromises();

    const lastEmit = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as string;
    expect(lastEmit).toContain('<img');
  });
});

describe('EditorCore bubble menu link prompt', () => {
  it('prompts for a URL using the translated LinkUrl label', async () => {
    const vuetify = createVuetify({ components });
    const wrapper = mount(EditorCore, {
      props: { modelValue: '<p>hello world</p>' },
      global: { plugins: [vuetify] },
    });
    await flushPromises();

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);

    (wrapper.vm as unknown as { toggleBubbleLink: () => void }).toggleBubbleLink();

    expect(promptSpy).toHaveBeenCalledWith(translatableStrings.LinkUrl);

    promptSpy.mockRestore();
  });
});
