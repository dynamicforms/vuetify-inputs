import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';

import { MediaEmbed, toEmbedSrc } from './media-embed';

describe('toEmbedSrc', () => {
  it('resolves a youtube watch URL', () => {
    expect(toEmbedSrc('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('resolves a youtu.be short URL', () => {
    expect(toEmbedSrc('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('resolves a youtube shorts URL', () => {
    expect(toEmbedSrc('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('resolves a vimeo URL', () => {
    expect(toEmbedSrc('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871');
  });

  it('returns null for an unrecognized URL', () => {
    expect(toEmbedSrc('https://example.com/video')).toBeNull();
  });

  it('returns null for a malformed URL', () => {
    expect(toEmbedSrc('not a url')).toBeNull();
  });
});

describe('MediaEmbed node', () => {
  function makeEditor() {
    return new Editor({ extensions: [StarterKit.configure({ link: false }), MediaEmbed] });
  }

  it('renders a responsive iframe for the given src', () => {
    const editor = makeEditor();
    editor.commands.insertContent({ type: 'mediaEmbed', attrs: { src: 'https://www.youtube.com/embed/abc123' } });

    const html = editor.getHTML();
    expect(html).toContain('<iframe');
    expect(html).toContain('class="media-embed"');
    expect(html).toContain('src="https://www.youtube.com/embed/abc123"');
    editor.destroy();
  });

  it('round-trips through setContent/getHTML', () => {
    const editor = makeEditor();
    const original = '<p></p><iframe class="media-embed" src="https://player.vimeo.com/video/1"></iframe><p></p>';
    editor.commands.setContent(original);

    expect(editor.getHTML()).toContain('src="https://player.vimeo.com/video/1"');
    editor.destroy();
  });
});
