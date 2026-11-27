export type FileProgressCallback = (loaded: number, total: number) => void;

/**
 * Thrown by `FileComms.touch` or `FileComms.delete` when the backend confirms the file identifier no longer
 * exists there (e.g. its keep-alive TTL expired). When `touch` throws it while the field still holds the touched
 * identifier, the field is cleared and, where a `control` is bound, `errorText` is shown as a validation error. When
 * `delete` throws it, it is ignored. Any other error thrown by `touch` is ignored; one thrown by `delete` propagates.
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
   * delete is called for a temporary upload the field clears or another upload replaces, and for an upload
   * superseded before it returned. An identifier the field was given, or one that is the bound control's
   * `originalValue`, is not deleted: clearing the field only sets its value to null
   *
   * throw {@link FileGoneError} if the backend reports the file identifier is already gone; any other thrown
   * error is treated as a transient failure
   *
   * @param fileIdentifier the identifier that was returned by upload
   */
  delete: (fileIdentifier: string) => Promise<void>;

  /**
   * touch is called every `touchInterval` milliseconds (the `defaultTouchInterval` setting by default) for a
   * temporary upload, so the backend keeps the file. A temporary upload is the identifier the component's last upload
   * returned, while the field holds it and it is not the bound control's `originalValue`.
   *
   * Throw {@link FileGoneError} when the backend no longer has the file: the field is cleared and the error's text is
   * shown. Any other error is ignored.
   *
   * @param fileIdentifier the identifier that was returned by upload
   */
  touch: (fileIdentifier: string) => Promise<void>;

  /**
   * getDownloadUrl is called when the user asks to download the file currently held by the field. Omit it if
   * the backend offers no way to retrieve an already-uploaded file: the component shows no download control
   * in that case.
   *
   * @param fileIdentifier the identifier that was returned by upload
   * @return a URL the browser can fetch the file from directly (e.g. a signed URL or a same-origin path)
   */
  getDownloadUrl?: (fileIdentifier: string) => string | Promise<string>;
}
