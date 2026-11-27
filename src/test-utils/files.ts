import { vi } from 'vitest';

import { FileComms } from '@/helpers/df-file.interface';

/** A `FileComms` whose members are `vi.fn` mocks; `upload` resolves through the given function. */
export function makeComms(upload: (file: File) => Promise<string> = async () => 'file-id'): FileComms {
  return {
    upload: vi.fn(upload),
    delete: vi.fn(async () => {}),
    touch: vi.fn(async () => {}),
  };
}
