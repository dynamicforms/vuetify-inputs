import MarkdownIt from 'markdown-it';

import type { MdString } from './render-content';

// the HTML of each MdString rendered so far
const renderedHtml = new WeakMap<MdString, string>();

/** The HTML of an `MdString`, rendered by `markdown-it` with the string's `options` and `plugins`. */
export function renderMarkdown(md: MdString): string {
  let html = renderedHtml.get(md);
  if (html === undefined) {
    const renderer = new MarkdownIt(md.options ?? {});
    (md.plugins ?? []).forEach((plugin) => renderer.use(plugin));
    html = renderer.render(md.toString());
    renderedHtml.set(md, html);
  }
  return html;
}
