import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { describe, expect, it } from 'vitest';

import { applyStyle, ClassAttribute, isStyleActive, Marker, Spoiler, STYLE_DEFS } from './block-styles';

function makeEditor(content: string) {
  const editor = new Editor({ extensions: [StarterKit.configure({ link: false }), ClassAttribute, Marker, Spoiler] });
  editor.commands.setContent(content);
  editor.commands.selectAll();
  return editor;
}

function styleFor(key: (typeof STYLE_DEFS)[number]['key']) {
  return STYLE_DEFS.find((def) => def.key === key)!;
}

describe('applyStyle / isStyleActive', () => {
  it.each(STYLE_DEFS)('applies and reverts $key', (def) => {
    const editor = makeEditor('<p>hello world</p>');

    applyStyle(editor, def);
    expect(isStyleActive(editor, def)).toBe(true);

    applyStyle(editor, def);
    expect(isStyleActive(editor, def)).toBe(false);

    editor.destroy();
  });

  it('leaves no class attribute behind once a heading style is reverted', () => {
    const editor = makeEditor('<p>hello</p>');
    const def = styleFor('Title');

    applyStyle(editor, def);
    applyStyle(editor, def);

    expect(editor.getHTML()).not.toContain('class=');
    editor.destroy();
  });

  it('leaves no class attribute behind once a code-block style is reverted', () => {
    const editor = makeEditor('<p>hello</p>');
    const def = styleFor('CodeDark');

    applyStyle(editor, def);
    applyStyle(editor, def);

    expect(editor.getHTML()).not.toContain('class=');
    editor.destroy();
  });

  it('switches between two heading styles without leaving the previous class behind', () => {
    const editor = makeEditor('<p>hello</p>');

    applyStyle(editor, styleFor('Title'));
    applyStyle(editor, styleFor('ArticleCategory'));

    expect(editor.getHTML()).toContain('category');
    expect(editor.getHTML()).not.toContain('document-title');
    editor.destroy();
  });

  it('does not double-wrap when SideQuote is applied over a plain blockquote', () => {
    const editor = makeEditor('<blockquote><p>quote</p></blockquote>');

    applyStyle(editor, styleFor('SideQuote'));

    expect(editor.getHTML().match(/<blockquote/g)).toHaveLength(1);
    expect(editor.getHTML()).toContain('side-quote');
    editor.destroy();
  });

  it('unwraps the blockquote entirely when SideQuote is toggled off', () => {
    const editor = makeEditor('<p>quote</p>');
    const def = styleFor('SideQuote');

    applyStyle(editor, def);
    expect(editor.getHTML()).toContain('<blockquote');

    applyStyle(editor, def);
    expect(editor.getHTML()).not.toContain('<blockquote');
    editor.destroy();
  });

  it('toggles Marker as an inline mark over a text selection', () => {
    const editor = makeEditor('<p>hello world</p>');
    const def = styleFor('Marker');

    applyStyle(editor, def);
    expect(editor.getHTML()).toContain('<span class="marker">');

    applyStyle(editor, def);
    expect(editor.getHTML()).not.toContain('marker');
    editor.destroy();
  });

  it('toggles Spoiler as an inline mark over a text selection', () => {
    const editor = makeEditor('<p>hello world</p>');
    const def = styleFor('Spoiler');

    applyStyle(editor, def);
    expect(editor.getHTML()).toContain('<span class="spoiler">');

    applyStyle(editor, def);
    expect(editor.getHTML()).not.toContain('spoiler');
    editor.destroy();
  });
});
