import { mergeAttributes, Node } from '@tiptap/core';

/** The embeddable player URL of a YouTube or Vimeo watch, share, embed or Shorts URL; `null` for any other URL. */
export function toEmbedSrc(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, '');

  if (host === 'youtube.com') {
    const id = parsed.searchParams.get('v');
    if (id) return `https://www.youtube.com/embed/${id}`;
    const embedMatch = parsed.pathname.match(/^\/embed\/([\w-]+)/);
    if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([\w-]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    return null;
  }

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === 'vimeo.com') {
    const id = parsed.pathname.split('/').filter(Boolean).pop();
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}

/**
 * A responsive `<iframe>` block for a recognised video URL (YouTube, Vimeo) - saved in `getHTML()` output as a
 * plain `iframe.media-embed`, with the responsive 16:9 sizing coming from the editor's own CSS rather than
 * inline styles, so the saved HTML stays provider-agnostic.
 */
export const MediaEmbed = Node.create({
  name: 'mediaEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'iframe.media-embed' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'iframe',
      mergeAttributes(
        {
          class: 'media-embed',
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
        },
        HTMLAttributes,
      ),
    ];
  },
});
