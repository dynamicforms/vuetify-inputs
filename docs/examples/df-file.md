# df-file Component

The df-file component provides a file input field that integrates with both Vuetify and DynamicForms. It includes file 
upload functionality with progress indication and handling for file operations.

## Basic Usage

Below is an example of the df-file component used with DynamicForms:

<file-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management
- File upload with progress indication
- File deletion support
- Downloading the file currently held by the field, where `comms` implements `getDownloadUrl`
- Automatic periodic "touches" to keep uploaded files active
- Customizable labels, hints, and error messages
- Backend communication abstraction through the FileComms interface

## Props

In addition to [common props from InputBase](./input-base), this component requires:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| comms | `FileComms` | **Required** | Object with methods for file operations |
| touchInterval | `number` | `60000` | Milliseconds between keep-alive touches. See [Configuration](/examples/configuration) for setting this application-wide instead |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The file identifier string (v-model)
- `label` - Input label
- `hint` - Hint text
- And more...

## Value Format

The component stores and emits a string identifier for the file, not the file itself. This identifier is:

1. Obtained from the `upload` method in the `comms` object when a file is selected
2. Used in subsequent operations (delete, touch) to reference the file
3. Stored in the form data when using DynamicForms

## FileComms Interface

The `comms` prop requires an object implementing the FileComms interface:

```typescript
interface FileComms {
  /**
   * Called when a file is added and needs to be uploaded
   * @param file The file to be uploaded
   * @param progressCallback Callback function for upload progress
   * @return Promise resolving to file identifier
   */
  upload: (file: File, progressCallback?: FileProgressCallback) => Promise<string>;

  /**
   * Called when the file is removed. Throw FileGoneError if the backend already reports the identifier as
   * gone; any other thrown error is treated as transient.
   * @param fileIdentifier The identifier that was returned by upload
   */
  delete: (fileIdentifier: string) => Promise<void>;

  /**
   * Called periodically to keep the file active. Throw FileGoneError if the backend reports the identifier
   * no longer exists — the component then clears the field and, where a `control` is bound, shows the
   * error's `errorText`. Any other thrown error is treated as transient and left to the consumer.
   * @param fileIdentifier The identifier that was returned by upload
   */
  touch: (fileIdentifier: string) => Promise<void>;

  /**
   * Called when the user asks to download the file currently held by the field. Optional - omit it if the
   * backend offers no way to retrieve an already-uploaded file, and the component draws no download button.
   * @param fileIdentifier The identifier that was returned by upload
   * @return A URL the browser can fetch the file from directly (e.g. a signed URL or a same-origin path)
   */
  getDownloadUrl?: (fileIdentifier: string) => string | Promise<string>;
}

// Progress callback type
type FileProgressCallback = (loaded: number, total: number) => void;

// Thrown by touch/delete to report that the backend has already discarded the file
class FileGoneError extends Error {
  constructor(public errorText: string) {
    super(errorText);
  }
}
```

## Upload Progress

The component displays a progress bar during file upload, using the values provided by the `progressCallback` in the
`upload` method.

After a file has been uploaded to the backend, it is touched every `touchInterval` milliseconds (60 seconds by
default) to let the backend know that it's still relevant. If a touch rejects with a `FileGoneError`, the field is
cleared and, where a `control` is bound, the error's `errorText` is shown as a validation error. Any other rejection
is treated as a transient failure and left to the consumer.

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the file identifier changes

## Examples

### Basic Example with Direct API Communication

```vue
<template>
  <df-file
    v-model="fileId"
    :comms="fileComms"
    label="Upload Document"
    hint="Accepted file formats: PDF, DOCX (max 5MB)"
  />
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { DfFile } from '@dynamicforms/vuetify-inputs';
import { FileGoneError } from '@dynamicforms/vuetify-inputs';

const fileId = ref(null);

// Implementation of FileComms for API communication
const fileComms = {
  upload: async (file, progressCallback) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post('/api/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressCallback) {
          progressCallback(progressEvent.loaded, progressEvent.total);
        }
      }
    });
    
    return response.data.fileId;
  },
  
  delete: async (fileId) => {
    await axios.delete(`/api/files/${fileId}`);
  },
  
  touch: async (fileId) => {
    try {
      await axios.post(`/api/files/${fileId}/touch`);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new FileGoneError('This file is no longer available. Please upload it again.');
      }
      throw err;
    }
  },

  getDownloadUrl: async (fileId) => `/api/files/${fileId}/download`
};
</script>
```

### With DynamicForms Integration

```vue
<template>
  <df-file
    :control="form.fields.document"
    :comms="fileComms"
    label="Upload Document"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfFile } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  document: new Field({ value: null })
});

// Implementation of FileComms (same as above)
const fileComms = {
  // ... implementation as in previous example
};
</script>
```

<script setup>
import FileBasic from '../components/file-basic.vue';
</script>
