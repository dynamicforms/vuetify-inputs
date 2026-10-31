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
