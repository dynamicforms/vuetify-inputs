export type FileProgressCallback = (loaded: number, total: number) => void;

/**
 * Thrown by `FileComms.touch` or `FileComms.delete` when the backend confirms the file identifier no longer
 * exists there (e.g. its keep-alive TTL expired). The component reacts to this specific type by clearing the
 * field and, where a `control` is bound, showing `errorText` as a validation error. Any other thrown error is
 * treated as transient and left entirely to the consumer.
 */
export class FileGoneError extends Error {
  constructor(public errorText: string) {
    super(errorText);
  }
}

export interface FileComms {
  /**
   * upload is called when a file is added to the input and needs to be uploaded to the backend for storage
   * the component will then set its modelValue to the file identifier returned by this function. when the form
   * is posted, only the identifier will be sent to the backend
   *
   * the method may throw an exception which will mean upload failure
   *
   * @param file the file to be uploaded
   * @param progressCallback callback function to call with current upload progress data.
   *  See e.g. axios onUploadProgress for axios post method
   * @return file id
   */
  upload: (file: File, progressCallback?: FileProgressCallback) => Promise<string>;

  /**
   * delete is called when the file is removed from the input and needs to be deleted at the backend
   *
   * throw {@link FileGoneError} if the backend reports the file identifier is already gone; any other thrown
   * error is treated as a transient failure
   *
   * @param fileIdentifier the identifier that was returned by upload
   */
  delete: (fileIdentifier: string) => Promise<void>;

  /**
   * touch is called at a regular interval (see the `touchInterval` prop / `defaultTouchInterval` setting) to let
   * the backend know that the file is still in play and must not be discarded
   *
   * throw {@link FileGoneError} if the backend reports the file identifier no longer exists; any other thrown
   * error is treated as a transient failure and left to the consumer to act on, if at all
   *
   * @param fileIdentifier the identifier that was returned by upload
   */
  touch: (fileIdentifier: string) => Promise<void>;
}
