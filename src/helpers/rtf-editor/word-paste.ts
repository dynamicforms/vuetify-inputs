// Content copied from Word or Google Docs carries mso-* inline styles, Mso*-prefixed classes, namespaced tags
// (o:p, w:sdt, v:shape...), and conditional-compilation comments that are meaningless outside their originating
// document. Left in place, they either render as visible clutter or silently defeat the mark/heading detection
// the editor's own paste parsing relies on (an inline `mso-bidi-font-weight` next to a real `font-weight:bold`
// is harmless, but a class name colliding with one this library uses for content styling would not be).
const NAMESPACED_TAG = /^[a-z][a-z0-9]*:[a-z]/i;
const MSO_STYLE_PROPERTY = /mso-[a-z-]+\s*:[^;]+;?/gi;
const MSO_CLASS = /^Mso/i;
// Word's own cell/table shading (Automatic/theme colours resolved at copy time, not necessarily what the
// document visibly showed) rides along as a plain, non-mso `background`/`background-color` - stripped so a
// pasted table adopts the editor's own theme instead of carrying the source document's shading. Foreground
// `color` is left alone: unlike background shading, it is usually deliberate content styling worth keeping.
const BACKGROUND_STYLE_PROPERTY = /background(?:-color)?\s*:[^;]+;?/gi;

function stripComments(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  const comments: Comment[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) comments.push(node as Comment);
  comments.forEach((comment) => comment.parentNode?.removeChild(comment));
}

function unwrap(element: Element) {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  parent.removeChild(element);
}

function cleanAttributes(element: HTMLElement) {
  const style = element.getAttribute('style');
  if (style != null) {
    const cleaned = style.replace(MSO_STYLE_PROPERTY, '').replace(BACKGROUND_STYLE_PROPERTY, '').trim();
    if (cleaned) element.setAttribute('style', cleaned);
    else element.removeAttribute('style');
  }

  const cssClass = element.getAttribute('class');
  if (cssClass != null) {
    const cleaned = cssClass
      .split(/\s+/)
      .filter((name) => name && !MSO_CLASS.test(name))
      .join(' ');
    if (cleaned) element.setAttribute('class', cleaned);
    else element.removeAttribute('class');
  }

  element.removeAttribute('lang');
  element.removeAttribute('xml:lang');
  element.removeAttribute('id');
  element.removeAttribute('align');
  element.removeAttribute('bgcolor');
}

/**
 * Strips Word/Google Docs clipboard artifacts from pasted HTML before it reaches the editor's schema parser:
 * conditional comments, `<xml>`/`<style>`/`<meta>` blocks, namespaced tags (`o:p`, `w:sdt`, `v:shape`...),
 * `mso-*` inline style properties, `Mso*` classes, `background`/`background-color`/`bgcolor` shading, and
 * `lang`/`id`/`align` attributes. Real formatting left behind (`font-weight`, `<b>`, `<table>`, `<h1>`...) is
 * untouched, since it is what the editor's own extensions parse into marks, headings, lists and tables.
 */
export function stripWordArtifacts(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.body;
  if (!root) return html;

  stripComments(root);
  root.querySelectorAll('xml, style, script, meta, link').forEach((node) => node.remove());

  Array.from(root.querySelectorAll<HTMLElement>('*')).forEach((element) => {
    if (NAMESPACED_TAG.test(element.tagName) || element.tagName === 'FONT') {
      unwrap(element);
      return;
    }
    cleanAttributes(element);
  });

  // A span or div left with no attributes after cleanup is a pure wrapper Word adds around every run of text.
  Array.from(root.querySelectorAll('span, div')).forEach((element) => {
    if (element.attributes.length === 0) unwrap(element);
  });

  return root.innerHTML;
}
