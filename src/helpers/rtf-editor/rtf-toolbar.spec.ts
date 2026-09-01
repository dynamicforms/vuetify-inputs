import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import { translatableStrings, translateStrings } from '../translations';

import RtfToolbar from './rtf-toolbar.vue';

function makeEditor() {
  const editor = new Editor({
    extensions: [StarterKit.configure({ link: false }), TextAlign.configure({ types: ['heading', 'paragraph'] })],
  });
  editor.commands.setContent('<p>hello world</p>');
  return editor;
}

function mountToolbar(editor: Editor) {
  const vuetify = createVuetify({ components });
  return mount(RtfToolbar, { props: { editor }, global: { plugins: [vuetify] } });
}

function click(wrapper: ReturnType<typeof mountToolbar>, title: string) {
  return wrapper.find(`button[title="${title}"]`).trigger('click');
}

describe('RtfToolbar heading dropdown', () => {
  afterEach(() => {
    translateStrings(() => undefined);
  });

  it('shows the English default heading label for a plain paragraph', () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    expect(wrapper.text()).toContain('Paragraph');

    editor.destroy();
  });

  it('updates the heading label after translateStrings', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    const translations: Partial<Record<keyof typeof translatableStrings, string>> = { Paragraph: 'Odstavek' };
    translateStrings((key) => translations[key]);
    await nextTick();

    expect(wrapper.text()).toContain('Odstavek');

    editor.destroy();
  });
});

describe('RtfToolbar button groups', () => {
  it('undoes and redoes an edit', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    editor.commands.setTextSelection(editor.state.doc.content.size);
    editor.commands.insertContent('!');
    expect(editor.getText()).toContain('!');

    await click(wrapper, 'Undo');
    expect(editor.getText()).not.toContain('!');

    await click(wrapper, 'Redo');
    expect(editor.getText()).toContain('!');

    editor.destroy();
  });

  it('selects all text', async () => {
    const editor = makeEditor();
    editor.commands.setTextSelection(1);
    const wrapper = mountToolbar(editor);

    await click(wrapper, 'Select all');

    expect(editor.state.selection.empty).toBe(false);

    editor.destroy();
  });

  it('toggles bold and italic', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    await click(wrapper, 'Bold');
    expect(editor.isActive('bold')).toBe(true);

    await click(wrapper, 'Italic');
    expect(editor.isActive('italic')).toBe(true);

    editor.destroy();
  });

  it('inserts a horizontal rule and toggles a blockquote', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    await click(wrapper, 'Horizontal line');
    expect(editor.getHTML()).toContain('<hr');

    await click(wrapper, 'Block quote');
    expect(editor.isActive('blockquote')).toBe(true);

    editor.destroy();
  });

  it('opens the link menu without crashing', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    await click(wrapper, 'Link');
    await nextTick();

    editor.destroy();
  });

  it('opens the image menu without crashing', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    await click(wrapper, 'Image');
    await nextTick();

    editor.destroy();
  });

  it('opens the media embed menu without crashing', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    await click(wrapper, 'Insert media');
    await nextTick();

    editor.destroy();
  });

  it('opens the table menu without crashing', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    await click(wrapper, 'Table');
    await nextTick();

    editor.destroy();
  });

  it('cycles through every alignment option', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    for (const [title, name] of [
      ['Align center', 'center'],
      ['Align right', 'right'],
      ['Justify', 'justify'],
      ['Align left', 'left'],
    ] as const) {
      await click(wrapper, title);
      expect(editor.isActive({ textAlign: name })).toBe(true);
    }

    editor.destroy();
  });

  it('toggles lists and indents a nested item', async () => {
    const editor = makeEditor();
    const wrapper = mountToolbar(editor);

    await click(wrapper, 'Bulleted list');
    expect(editor.isActive('bulletList')).toBe(true);

    editor.commands.insertContent('<li>one</li>');
    await click(wrapper, 'Increase indent');
    await click(wrapper, 'Decrease indent');

    await click(wrapper, 'Numbered list');
    expect(editor.isActive('orderedList')).toBe(true);

    editor.destroy();
  });
});
