# df-image Component

The df-image component provides an image upload field: a preview of the current image, a drag & drop zone, and a
button that opens the browser's file dialog. It shares its backend communication contract with [df-file](./df-file).

## Basic Usage

Below is an example of the df-image component used with DynamicForms:

<image-basic/>

## Features

- Preview of the current image, shown as soon as one is set
- Drag & drop, and a click-to-browse dialog
- Upload progress indication
- Image deletion support
- Automatic periodic "touches" to keep uploaded images active
- Customizable labels, hints, and error messages
- Backend communication abstraction through the same `FileComms` interface as `df-file`

## Props

In addition to [common props from InputBase](./input-base), this component requires:

| Prop  | Type        | Default      | Description                            |
|-------|-------------|--------------|-----------------------------------------|
| comms | `FileComms` | **Required** | Object with methods for image operations |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The image URL (v-model)
- `label` - Input label
- `hint` - Hint text
- And more...

## Value Format

The component stores and displays a URL string, not the file itself:

1. `comms.upload` resolves to the URL the component renders as the image's `src` - there is no separate lookup
   for turning an identifier into a display URL, so whatever it returns must already be usable as one.
2. The same value is used in subsequent operations (delete, touch) to reference the image.
3. It is stored in the form data when using DynamicForms.

## FileComms Interface

The `comms` prop requires an object implementing the same `FileComms` interface `df-file` uses:

```typescript
interface FileComms {
  /**
   * Called when an image is picked, dropped, or selected via the dialog, and needs to be uploaded
   * @param file The image file to be uploaded
   * @param progressCallback Callback function for upload progress
   * @return Promise resolving to the URL the component displays the image from
   */
  upload: (file: File, progressCallback?: FileProgressCallback) => Promise<string>;

  /**
   * Called when the image is removed
   * @param fileIdentifier The URL that was returned by upload
   */
  delete: (fileIdentifier: string) => Promise<void>;

  /**
   * Called periodically to keep the image active
   * @param fileIdentifier The URL that was returned by upload
   */
  touch: (fileIdentifier: string) => Promise<void>;
}

// Progress callback type
type FileProgressCallback = (loaded: number, total: number) => void;
```

## Upload Progress

The component displays a progress bar during upload, using the values provided by the `progressCallback` in the
`upload` method.

After an image has been uploaded to the backend, it will be touched every 60 seconds to let the backend know that
it's still relevant.

## Non-image Files

A dropped or picked file whose type is not `image/*` is rejected without calling `comms.upload`.

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the image URL changes

## Examples

### Basic Example with Direct API Communication

```vue
<template>
  <df-image
    v-model="imageUrl"
    :comms="imageComms"
    label="Profile picture"
    hint="PNG or JPG, max 5MB"
  />
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { DfImage } from '@dynamicforms/vuetify-inputs';

const imageUrl = ref(null);

// Implementation of FileComms for API communication
const imageComms = {
  upload: async (file, progressCallback) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/images', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressCallback) {
          progressCallback(progressEvent.loaded, progressEvent.total);
        }
      }
    });

    return response.data.url;
  },

  delete: async (imageUrl) => {
    await axios.delete('/api/images', { params: { url: imageUrl } });
  },

  touch: async (imageUrl) => {
    await axios.post('/api/images/touch', { url: imageUrl });
  }
};
</script>
```

### With DynamicForms Integration

```vue
<template>
  <df-image
    :control="form.fields.avatar"
    :comms="imageComms"
    label="Profile picture"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfImage } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  avatar: new Field({ value: null })
});

// Implementation of FileComms (same as above)
const imageComms = {
  // ... implementation as in previous example
};
</script>
```

<script setup>
import ImageBasic from '../components/image-basic.vue';
</script>
