import { Fragment, Node as PMNode, Slice } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import { Editor } from '@tiptap/vue-3';

/** Reads a `File` into a base64 `data:` URI - the same embedding an uploaded or dropped image goes through. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * The image files carried alongside (or instead of) HTML on a clipboard paste. Copying a picture out of another
 * app, or a Word/Docs selection that contains embedded pictures, delivers the pixel data this way rather than as
 * an inline `data:` URI in the HTML - `items` covers Chromium and Firefox, `files` is the fallback where a
 * browser only populates that.
 */
export function extractImageFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return [];
  const files: File[] = [];
  Array.from(dataTransfer.items || []).forEach((item) => {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file && file.type.startsWith('image/')) files.push(file);
    }
  });
  if (files.length === 0) {
    Array.from(dataTransfer.files || []).forEach((file) => {
      if (file.type.startsWith('image/')) files.push(file);
    });
  }
  return files;
}

function countImageNodes(fragment: Fragment): number {
  let count = 0;
  fragment.forEach((node) => {
    if (node.type.name === 'image') count += 1;
    else if (node.content.size) count += countImageNodes(node.content);
  });
  return count;
}

function replaceImageSources(fragment: Fragment, urls: string[], cursor: { index: number }): Fragment {
  const children: PMNode[] = [];
  fragment.forEach((node) => {
    if (node.type.name === 'image' && cursor.index < urls.length) {
      children.push(node.type.create({ ...node.attrs, src: urls[cursor.index] }, node.content, node.marks));
      cursor.index += 1;
    } else if (node.content.size) {
      children.push(node.copy(replaceImageSources(node.content, urls, cursor)));
    } else {
      children.push(node);
    }
  });
  return Fragment.fromArray(children);
}

/**
 * A `handlePaste` for `editorProps`: when the clipboard carries image files, embeds each as a base64 `data:` URI
 * and either drops it into the `<img>` placeholders the pasted HTML already parsed into (order-matched - the
 * shape a Word/Docs selection with embedded pictures takes once `transformPastedHTML` and the schema have parsed
 * it into `slice`), or, where the paste held no HTML worth keeping, inserts the images as new nodes at the
 * selection. Non-image pastes are left to the editor's default handling by returning `false`.
 */
export function createImagePasteHandler(getEditor: () => Editor | undefined) {
  return (view: EditorView, event: ClipboardEvent, slice: Slice): boolean => {
    const files = extractImageFiles(event.clipboardData);
    if (files.length === 0) return false;

    event.preventDefault();

    Promise.all(files.map(fileToDataUrl)).then((urls) => {
      if (countImageNodes(slice.content) > 0) {
        const content = replaceImageSources(slice.content, urls, { index: 0 });
        const newSlice = new Slice(content, slice.openStart, slice.openEnd);
        view.dispatch(view.state.tr.replaceSelection(newSlice).scrollIntoView());
        return;
      }

      getEditor()
        ?.chain()
        .focus()
        .insertContent(urls.map((src) => ({ type: 'image', attrs: { src } })))
        .run();
    });

    return true;
  };
}
