import { Editor, Extension, Mark, mergeAttributes } from '@tiptap/core';

import { htmlAttribute } from './attributes';

/**
 * Adds a `class` attribute to paragraph, heading, blockquote and code-block nodes, so the "Style" dropdown's
 * named looks (`h3.category`, `p.info-box`, `pre.fancy-code-dark`...) persist through `getHTML()`/`setContent()`
 * the same way any other node attribute does.
 */
export const ClassAttribute = Extension.create({
  name: 'classAttribute',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote', 'codeBlock'],
        attributes: {
          class: htmlAttribute('class'),
        },
      },
    ];
  },
});

function styledSpanMark(name: string, className: string) {
  return Mark.create({
    name,
    parseHTML() {
      return [{ tag: `span.${className}` }];
    },
    renderHTML({ HTMLAttributes }) {
      return ['span', mergeAttributes(HTMLAttributes, { class: className }), 0];
    },
  });
}

/** Toggle mark wrapping the selection in `<span class="marker">`, behaving like bold/italic over a selection. */
export const Marker = styledSpanMark('marker', 'marker');
/** Toggle mark wrapping the selection in `<span class="spoiler">`, behaving like bold/italic over a selection. */
export const Spoiler = styledSpanMark('spoiler', 'spoiler');

interface BlockStyleDef {
  key: 'ArticleCategory' | 'Title' | 'Subtitle' | 'InfoBox' | 'SideQuote' | 'CodeDark' | 'CodeBright';
  kind: 'heading' | 'paragraph' | 'blockquote' | 'codeBlock';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className: string;
}

interface MarkStyleDef {
  key: 'Marker' | 'Spoiler';
  kind: 'mark';
  markName: 'marker' | 'spoiler';
}

export type StyleDef = BlockStyleDef | MarkStyleDef;

/** The "Style" dropdown's entries, in the order they are listed - element/class pairs the toolbar applies. */
export const STYLE_DEFS: StyleDef[] = [
  { key: 'ArticleCategory', kind: 'heading', level: 3, className: 'category' },
  { key: 'Title', kind: 'heading', level: 2, className: 'document-title' },
  { key: 'Subtitle', kind: 'heading', level: 3, className: 'document-subtitle' },
  { key: 'InfoBox', kind: 'paragraph', className: 'info-box' },
  { key: 'SideQuote', kind: 'blockquote', className: 'side-quote' },
  { key: 'Marker', kind: 'mark', markName: 'marker' },
  { key: 'Spoiler', kind: 'mark', markName: 'spoiler' },
  { key: 'CodeDark', kind: 'codeBlock', className: 'fancy-code fancy-code-dark' },
  { key: 'CodeBright', kind: 'codeBlock', className: 'fancy-code fancy-code-bright' },
];

// The style is read from the block at the selection's anchor; a depth-0 anchor (`AllSelection`) is resolved one
// position in, inside the document's first block.
function anchorPos(editor: Editor) {
  const { state } = editor;
  const { $from } = state.selection;
  if ($from.depth > 0 || state.doc.content.size === 0) return $from;
  return state.doc.resolve(Math.min(1, state.doc.content.size));
}

function anchorNode(editor: Editor) {
  return anchorPos(editor).parent;
}

function anchorAncestor(editor: Editor, typeName: string) {
  const $pos = anchorPos(editor);
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if ($pos.node(depth).type.name === typeName) return $pos.node(depth);
  }
  return null;
}

export function isStyleActive(editor: Editor, def: StyleDef): boolean {
  switch (def.kind) {
    case 'heading':
    case 'paragraph':
    case 'codeBlock': {
      const node = anchorNode(editor);
      return (
        node.type.name === def.kind &&
        node.attrs.class === def.className &&
        (def.level === undefined || node.attrs.level === def.level)
      );
    }
    case 'blockquote': {
      const node = anchorAncestor(editor, 'blockquote');
      return !!node && node.attrs.class === def.className;
    }
    case 'mark':
      return editor.isActive(def.markName);
    default:
      return false;
  }
}

/**
 * Applies (or, over an already-styled block/selection, removes) one "Style" dropdown entry. Block styles both
 * set the node type and its class in one step; the two inline marks toggle over the current selection like bold
 * or italic.
 */
export function applyStyle(editor: Editor, def: StyleDef): void {
  const chain = editor.chain().focus();

  // a whole-document selection is collapsed to its anchor block (`lift` acts only when every touched node
  // matches); marks keep the real range
  const { $from } = editor.state.selection;
  if (def.kind !== 'mark' && $from.depth === 0 && editor.state.doc.content.size > 0) {
    chain.setTextSelection(anchorPos(editor).pos);
  }

  const resetToParagraph = () => chain.setParagraph().updateAttributes('paragraph', { class: null }).run();

  switch (def.kind) {
    case 'heading':
      if (isStyleActive(editor, def)) resetToParagraph();
      else {
        chain.setNode('heading', { level: def.level }).updateAttributes('heading', { class: def.className }).run();
      }
      break;
    case 'paragraph':
      if (isStyleActive(editor, def)) resetToParagraph();
      else chain.setParagraph().updateAttributes('paragraph', { class: def.className }).run();
      break;
    case 'blockquote':
      if (isStyleActive(editor, def)) chain.unsetBlockquote().run();
      else if (anchorAncestor(editor, 'blockquote')) {
        chain.updateAttributes('blockquote', { class: def.className }).run();
      } else chain.setBlockquote().updateAttributes('blockquote', { class: def.className }).run();
      break;
    case 'codeBlock':
      if (isStyleActive(editor, def)) chain.toggleCodeBlock().updateAttributes('paragraph', { class: null }).run();
      else if (anchorNode(editor).type.name === 'codeBlock') {
        chain.updateAttributes('codeBlock', { class: def.className }).run();
      } else chain.setCodeBlock().updateAttributes('codeBlock', { class: def.className }).run();
      break;
    case 'mark':
      chain.toggleMark(def.markName).run();
      break;
    default:
      break;
  }
}
