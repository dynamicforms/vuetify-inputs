import type { FileComms } from '../../src';

export interface MockFileCommsOptions {
  /** number of progress reports during an upload */
  steps?: number;
  /** milliseconds between two progress reports */
  stepMs?: number;
  /** the identifier an upload of `file` resolves to */
  result: (file: File) => string;
  /** called when an upload completes */
  onUpload?: (file: File) => void;
  /** called when a file is deleted, awaited before the deletion resolves */
  onDelete?: (fileIdentifier: string) => void | Promise<void>;
  getDownloadUrl?: FileComms['getDownloadUrl'];
}

/** FileComms that simulates upload progress and logs delete and touch to the console */
export function mockFileComms(options: MockFileCommsOptions): FileComms {
  const { steps = 20, stepMs = 30, result, onUpload, onDelete, getDownloadUrl } = options;
  return {
    upload: async (file, progressCallback) => {
      for (let i = 1; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepMs));
        progressCallback?.((file.size * i) / steps, file.size);
      }
      onUpload?.(file);
      return result(file);
    },
    delete: async (fileIdentifier) => {
      console.log('Deleting file:', fileIdentifier);
      await onDelete?.(fileIdentifier);
    },
    touch: async (fileIdentifier) => {
      console.log('Touching file:', fileIdentifier);
    },
    getDownloadUrl,
  };
}
