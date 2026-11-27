import { Field } from '@dynamicforms/vue-forms';
import type { Editor } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { vi } from 'vitest';

import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from '../settings';
import { translate } from '../translations';

import EditorCore from './editor-core.vue';

import DfRtfEditor from '@/df-rtf-editor.vue';

async function mountEditor(modelValue: string, settings?: VuetifyInputsSettings) {
  const wrapper = mount(EditorCore, {
    props: { modelValue },
    global: settings ? { provide: { [vuetifyInputsSettingsKey]: settings } } : {},
  });
  await flushPromises();
  const vm = wrapper.vm as unknown as { editor: Editor; toggleBubbleLink(): void };
  return { wrapper, vm };
}

describe('EditorCore empty-content modelValue', () => {
  it('emits an empty string, not the empty paragraph HTML, when the document is cleared', async () => {
    const { wrapper, vm } = await mountEditor('<p>hello world</p>');

    vm.editor.commands.clearContent();
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);
  });

  it('still emits HTML when the document holds only an image', async () => {
    const { wrapper, vm } = await mountEditor('');

    vm.editor.commands.setContent('<img src="data:image/png;base64,x">');
    await flushPromises();

    const lastEmit = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as string;
    expect(lastEmit).toContain('<img');
  });
});

describe('EditorCore writes only what the user edits', () => {
  const html = '<p>Hello <b>world</b></p>';

  it('does not write its own serialization of the value when it mounts', async () => {
    const { wrapper } = await mountEditor(html);

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('leaves a bound field unchanged when it mounts', async () => {
    const control = new Field<string>({ value: html });
    mount(DfRtfEditor, { props: { control } });
    await flushPromises();

    expect(control.value).toBe(html);
    expect(control.isChanged).toBe(false);
  });

  it('does not write the value when it is made read-only or editable', async () => {
    const { wrapper } = await mountEditor(html);

    await wrapper.setProps({ readonly: true });
    await wrapper.setProps({ readonly: false });
    await flushPromises();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});

describe('EditorCore bubble menu link prompt', () => {
  it('prompts for a URL using the translated LinkUrl label', async () => {
    const { vm } = await mountEditor('<p>hello world</p>');

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);

    vm.toggleBubbleLink();

    expect(promptSpy).toHaveBeenCalledWith(translate('LinkUrl'));

    promptSpy.mockRestore();
  });

  it('prompts with the translate setting the component reads, from an event handler', async () => {
    const settings: VuetifyInputsSettings = { translate: (key) => `app:${key}` };
    const { vm } = await mountEditor('<p>hello world</p>', settings);

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);

    vm.toggleBubbleLink();

    expect(promptSpy).toHaveBeenCalledWith('app:LinkUrl');

    promptSpy.mockRestore();
  });
});
