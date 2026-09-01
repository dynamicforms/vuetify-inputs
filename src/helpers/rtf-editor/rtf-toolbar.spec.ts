import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import { translatableStrings, translateStrings } from '../translations';

import RtfToolbar from './rtf-toolbar.vue';

function makeEditor() {
  const editor = new Editor({ extensions: [StarterKit.configure({ link: false })] });
  editor.commands.setContent('<p>hello</p>');
  return editor;
}

describe('RtfToolbar heading dropdown', () => {
  afterEach(() => {
    translateStrings(() => undefined);
  });

  it('shows the English default heading label for a plain paragraph', () => {
    const editor = makeEditor();
    const vuetify = createVuetify({ components });
    const wrapper = mount(RtfToolbar, { props: { editor }, global: { plugins: [vuetify] } });

    expect(wrapper.text()).toContain('Paragraph');

    editor.destroy();
  });

  it('updates the heading label after translateStrings', async () => {
    const editor = makeEditor();
    const vuetify = createVuetify({ components });
    const wrapper = mount(RtfToolbar, { props: { editor }, global: { plugins: [vuetify] } });

    const translations: Partial<Record<keyof typeof translatableStrings, string>> = { Paragraph: 'Odstavek' };
    translateStrings((key) => translations[key]);
    await nextTick();

    expect(wrapper.text()).toContain('Odstavek');

    editor.destroy();
  });
});
