import { Fragment, Node as PMNode, Schema, Slice } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import { describe, expect, it, vi } from 'vitest';

import { createImagePasteHandler, extractImageFiles, fileToDataUrl } from './image-paste';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
    image: {
      inline: true,
      group: 'inline',
      atom: true,
      attrs: { src: { default: null } },
      toDOM: (node) => ['img', { src: node.attrs.src }],
    },
  },
  marks: {},
});

function pngFile(name = 'picture.png'): File {
  return new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' });
}

function fakeClipboardEvent(files: File[], hasHtml = false): ClipboardEvent {
  const items = files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file }));
  const dataTransfer = { items, files, getData: () => (hasHtml ? '<p>x</p>' : '') } as unknown as DataTransfer;
  return { clipboardData: dataTransfer, preventDefault: vi.fn() } as unknown as ClipboardEvent;
}

function docWith(...nodes: PMNode[]) {
  return schema.node('doc', null, [schema.node('paragraph', null, nodes)]);
}

function fakeView(doc: PMNode) {
  const state = EditorState.create({ schema, doc });
  return { state, dispatch: vi.fn() };
}

describe('fileToDataUrl', () => {
  it('embeds the file as a base64 data: URI', async () => {
    const url = await fileToDataUrl(pngFile());

    expect(url).toMatch(/^data:image\/png;base64,/);
  });
});

describe('extractImageFiles', () => {
  it('reads image files off clipboard items', () => {
    const files = extractImageFiles(fakeClipboardEvent([pngFile()]).clipboardData);

    expect(files).toHaveLength(1);
    expect(files[0].type).toBe('image/png');
  });

  it('falls back to dataTransfer.files when items carries none', () => {
    const file = pngFile();
    const dataTransfer = { items: [], files: [file], getData: () => '' } as unknown as DataTransfer;

    expect(extractImageFiles(dataTransfer)).toEqual([file]);
  });

  it('returns an empty array when the clipboard carries no files', () => {
    expect(extractImageFiles({ items: [], files: [], getData: () => '' } as unknown as DataTransfer)).toEqual([]);
  });

  it('returns an empty array for a null DataTransfer', () => {
    expect(extractImageFiles(null)).toEqual([]);
  });
});

describe('createImagePasteHandler', () => {
  it('returns false and leaves the default paste alone when there are no image files', () => {
    const handler = createImagePasteHandler(() => undefined);
    const event = fakeClipboardEvent([]);
    const view = fakeView(docWith());

    const handled = handler(view as any, event, Slice.empty);

    expect(handled).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('replaces an already-parsed <img> placeholder with the pasted file, in document order', async () => {
    // The base document is what the editor already holds; the slice is the pasted content ProseMirror parsed
    // from the clipboard HTML, still to be inserted - the two must stay independent or the placeholder's
    // (correctly unmodified) copy in the base doc gets mistaken for the one the paste is meant to update.
    const placeholder = schema.node('image', { src: 'file:///word-temp/image1.png' });
    const view = fakeView(docWith());
    const slice = new Slice(Fragment.from(placeholder), 0, 0);

    const handler = createImagePasteHandler(() => undefined);
    const event = fakeClipboardEvent([pngFile()]);

    const handled = handler(view as any, event, slice);
    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();

    await vi.waitFor(() => expect(view.dispatch).toHaveBeenCalled());

    const dispatchedTransaction = view.dispatch.mock.calls[0][0];
    const resultingDoc = dispatchedTransaction.doc as PMNode;
    let sawSrc = '';
    resultingDoc.descendants((node: PMNode) => {
      if (node.type.name === 'image') sawSrc = node.attrs.src;
    });
    expect(sawSrc).toMatch(/^data:image\/png;base64,/);
  });

  it('inserts new image nodes via the editor when the paste carried no HTML placeholder for them', async () => {
    const doc = docWith();
    const view = fakeView(doc);
    const slice = new Slice(doc.content.firstChild!.content, 0, 0);

    const run = vi.fn();
    const insertContent = vi.fn(() => ({ run }));
    const focus = vi.fn(() => ({ insertContent }));
    const chain = vi.fn(() => ({ focus }));
    const editor = { chain } as any;

    const handler = createImagePasteHandler(() => editor);
    const event = fakeClipboardEvent([pngFile()]);

    const handled = handler(view as any, event, slice);
    expect(handled).toBe(true);

    await vi.waitFor(() => expect(chain).toHaveBeenCalled());
    expect(insertContent).toHaveBeenCalledWith([expect.objectContaining({ type: 'image' })]);
    expect(run).toHaveBeenCalled();
  });
});
