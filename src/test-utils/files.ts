import { vi } from 'vitest';

import { FileComms, FileGoneError } from '@/helpers/df-file.interface';

/** A `FileComms` whose members are `vi.fn` mocks; `upload` resolves through the given function. */
export function makeComms(upload: (file: File) => Promise<string> = async () => 'file-id'): FileComms {
  return {
    upload: vi.fn(upload),
    delete: vi.fn(async () => {}),
    touch: vi.fn(async () => {}),
  };
}

/** A `FileList` mock; v-file-input spreads `target.files`, so it is a real (iterable) array with an `item` method. */
export function fileList(files: File[]): FileList {
  const list = [...files] as unknown as FileList;
  (list as any).item = (i: number) => files[i] ?? null;
  return list;
}

/** the first bytes of a PNG file */
export const PNG_BYTES = new Uint8Array([137, 80, 78, 71]);

export const pngFile = (name = 'picture.png') => new File([PNG_BYTES], name, { type: 'image/png' });

/** A `touch` mock that reports the file as gone on the server. */
export const touchGone = (message: string) =>
  vi.fn(async () => {
    throw new FileGoneError(message);
  });
