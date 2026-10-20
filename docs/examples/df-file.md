# df-file Component

`df-file` uploads a file through a `FileComms` object, with upload progress, deletion and a periodic keep-alive touch.

## Basic Usage

`df-file` bound to a vue-forms field:

<file-basic/>

## Features

- Binds a `@dynamicforms/vue-forms` element, a `v-model`, or neither
- File upload with a progress bar
- Deletion of a temporary upload when the field is cleared or another upload replaces it
- Downloading the file currently held by the field, where `comms` implements `getDownloadUrl`
- Periodic touches that keep the uploaded file on the backend
- Labels, hints and error messages
- Backend communication through the `FileComms` interface

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

A started upload completes when the field is disabled while it runs: the identifier is still written into it and touched
from then on. A later upload, a clear of the field or a value set on the field while an upload runs supersedes that
upload: it writes nothing into the field, and the identifier it returns is deleted through `comms.delete`.

## Temporary Uploads

The identifier the component's last upload returned is a temporary upload while the field holds it and, where a
`control` is bound, it differs from the control's `originalValue`.

- A temporary upload is touched every `touchInterval` milliseconds.
- Clearing the field deletes a temporary upload through `comms.delete`. Clearing any other identifier, such as one the
  field was given with its record, sets the value to `null` and calls no `comms` method.
- An upload that replaces a temporary upload deletes the replaced one through `comms.delete`.
- Once the identifier is the control's `originalValue` (`control.originalValue = control.value` or a `rebind` after the
  form is saved), it is no longer touched or deleted. Without a `control`, an uploaded identifier is temporary for as
  long as the field holds it.

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
   * Called for a temporary upload the field clears or another upload replaces, and for an upload superseded
   * before it returned. Throw FileGoneError if the backend already reports the identifier as gone; any other
   * thrown error is treated as transient.
   * @param fileIdentifier The identifier that was returned by upload
   */
  delete: (fileIdentifier: string) => Promise<void>;

  /**
   * Called periodically to keep a temporary upload active. Throw FileGoneError if the backend reports the
   * identifier no longer exists — the component then clears the field and, where a `control` is bound, reports an error
   * of code `vuetify-inputs.file_gone` with the error's `errorText` as its detail. Any other thrown error is treated as transient and left to the consumer.
   * @param fileIdentifier The identifier that was returned by upload
   */
  touch: (fileIdentifier: string) => Promise<void>;

  /**
   * Called when the user asks to download the file currently held by the field. Optional - omit it if the
   * backend offers no way to retrieve an already-uploaded file, and the component renders no download button.
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

During an upload the component shows a progress bar from the values passed to `progressCallback` of `upload`.

A temporary upload is touched every `touchInterval` milliseconds (60 seconds by default), so the backend keeps it. If a
touch rejects with a `FileGoneError` while the field still holds the touched identifier, the field is cleared, a
disabled one as well, and, where a `control` is bound, its errors are replaced with one `ValidationError` of code
`vuetify-inputs.file_gone` and origin `'server'`, whose `detail` is the error's `errorText`; the [`errorText`
setting](/examples/localisation#translating-errors) can render another text for the code. Under vue-forms' default
[`ErrorPolicy`](:vue-forms:/api/validators.html#errorpolicy) the field drops the error when a new file is uploaded. Any
other rejection is ignored by the component and left to the application.

An upload that returns and a clear of the field mark the field touched.

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
