import { Field } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from '../settings';
import { translate } from '../translations';

import EditorCore from './editor-core.vue';

import DfRtfEditor from '@/df-rtf-editor.vue';

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

describe('EditorCore writes only what the user edits', () => {
  const html = '<p>Hello <b>world</b></p>';

  it('does not write its own serialization of the value when it mounts', async () => {
    const vuetify = createVuetify({ components });
    const wrapper = mount(EditorCore, { props: { modelValue: html }, global: { plugins: [vuetify] } });
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('leaves a bound field unchanged when it mounts', async () => {
    const vuetify = createVuetify({ components });
    const control = new Field<string>({ value: html });
    mount(DfRtfEditor, { props: { control }, global: { plugins: [vuetify] } });
    await flushPromises();

    expect(control.value).toBe(html);
    expect(control.isChanged).toBe(false);
  });

  it('does not write the value when it is disabled or enabled', async () => {
    const vuetify = createVuetify({ components });
    const wrapper = mount(EditorCore, { props: { modelValue: html }, global: { plugins: [vuetify] } });
    await flushPromises();

    await wrapper.setProps({ disabled: true });
    await wrapper.setProps({ disabled: false });
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
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

    expect(promptSpy).toHaveBeenCalledWith(translate('LinkUrl'));

    promptSpy.mockRestore();
  });

  it('prompts with the translate setting the component reads, from an event handler', async () => {
    const vuetify = createVuetify({ components });
    const settings: VuetifyInputsSettings = { translate: (key) => `app:${key}` };
    const wrapper = mount(EditorCore, {
      props: { modelValue: '<p>hello world</p>' },
      global: { plugins: [vuetify], provide: { [vuetifyInputsSettingsKey]: settings } },
    });
    await flushPromises();

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);

    (wrapper.vm as unknown as { toggleBubbleLink: () => void }).toggleBubbleLink();

    expect(promptSpy).toHaveBeenCalledWith('app:LinkUrl');

    promptSpy.mockRestore();
  });
});
