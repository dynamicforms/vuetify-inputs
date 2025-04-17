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
- Automatic periodic "touches" to keep uploaded files active
- Customizable labels, hints, and error messages
- Backend communication abstraction through the FileComms interface

## Props

In addition to [common props from InputBase](./input-base), this component requires:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| comms | `FileComms` | **Required** | Object with methods for file operations |

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
   * Called when the file is removed
   * @param fileIdentifier The identifier that was returned by upload
   */
  delete: (fileIdentifier: string) => Promise<void>;

  /**
   * Called periodically to keep the file active
   * @param fileIdentifier The identifier that was returned by upload
   */
  touch: (fileIdentifier: string) => Promise<void>;
}

// Progress callback type
type FileProgressCallback = (loaded: number, total: number) => void;
```

## Upload Progress

The component displays a progress bar during file upload, using the values provided by the `progressCallback` in the
`upload` method.

After a file has been uploaded to the backend, it will be touched every 60 seconds to let the backend know that it's still 
relevant.

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
    await axios.post(`/api/files/${fileId}/touch`);
  }
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
  document: Field.create({ value: null })
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
