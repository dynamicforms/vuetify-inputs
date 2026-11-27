import Link from '@tiptap/extension-link';

import { htmlAttribute } from './attributes';

/**
 * `Link`, with a `download` attribute the toolbar's "Downloadable" toggle can set - rendered as `download="file"`
 * on the anchor.
 */
export const LinkWithDownload = Link.extend({
  name: 'link',
  addAttributes() {
    return {
      ...this.parent?.(),
      download: htmlAttribute('download'),
    };
  },
});
