import { flushPromises, mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import { translatableStrings } from '../translations';

import EditorCore from './editor-core.vue';

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
