export type FileProgressCallback = (loaded: number, total: number) => void;

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
   * @param fileIdentifier the identifier that was returned by upload
   */
  delete: (fileIdentifier: string) => Promise<void>;

  /**
   * touch is called once per minute to let the backend know that the file is still in play and must not be discarded
   * @param fileIdentifier the identifier that was returned by upload
   */
  touch: (fileIdentifier: string) => Promise<void>;
}
