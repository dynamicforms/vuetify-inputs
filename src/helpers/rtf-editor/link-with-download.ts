import Link from '@tiptap/extension-link';

/**
 * `Link`, with a `download` attribute the toolbar's "Downloadable" toggle can set - rendered as `download="file"`
 * on the anchor.
 */
export const LinkWithDownload = Link.extend({
  name: 'link',
  addAttributes() {
    return {
      ...this.parent?.(),
      download: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('download'),
        renderHTML: (attributes: Record<string, any>) => (attributes.download ? { download: attributes.download } : {}),
      },
    };
  },
});
