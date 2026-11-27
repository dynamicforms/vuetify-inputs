# df-image Component

`df-image` is an image upload field: a preview of the current image, a drag & drop zone, a button that opens the
browser's file dialog, and a button that pastes an image from the clipboard. It uses the backend interface of [df-file](./df-file).

## Basic Usage

`df-image` bound to a vue-forms field:

<image-basic/>

## Features

- Preview of the current image
- Drag & drop, and a click-to-browse dialog
- Pasting an image from the clipboard, with the paste button or Ctrl+V
- Upload progress bar
- Deletion of a temporary upload when the field is cleared or another upload replaces it
- Downloading the current image; the value is a URL, so no `comms` method is needed, unlike `df-file`'s
  `getDownloadUrl`
- Periodic touches that keep the uploaded image on the backend
- Labels, hints and error messages
- Backend communication through the `FileComms` interface of `df-file`

## Props

In addition to [common props from InputBase](./input-base), this component requires:

| Prop  | Type        | Default      | Description                            |
|-------|-------------|--------------|-----------------------------------------|
| comms | `FileComms` | **Required** | Object with methods for image operations |
| touchInterval | `number` | `undefined`: the plugin's `defaultTouchInterval`, else `60000` | Milliseconds between keep-alive touches. See [Configuration](/examples/configuration) for setting this application-wide instead |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:

- `control` - DynamicForms field object
- `modelValue` - The image URL (v-model)
- `label` - Input label
- `hint` - Hint text
- And more...

## Value and Backend

The value is the string `comms.upload` resolves to, and the component renders it as the image's `src`. There is no
lookup from an identifier to a URL, so it must be a URL the browser can load. The same URL is passed to `comms.delete`
and `comms.touch`, and is stored in the form data when using DynamicForms.

Otherwise df-file's [FileComms interface](/examples/df-file#filecomms-interface),
[value format](/examples/df-file#value-format), [temporary uploads](/examples/df-file#temporary-uploads) and
[upload progress and `FileGoneError` handling](/examples/df-file#upload-progress) apply unchanged, with the URL in place
of the file identifier. A `FileGoneError` from a touch also clears the preview. `getDownloadUrl` is not used.

## Pasting From the Clipboard

The paste button reads the clipboard with `navigator.clipboard.read()` and uploads the first image it holds, e.g. one
copied with a browser's "Copy image". Chromium asks for the clipboard permission on the first paste; Firefox and Safari
show their own "Paste" prompt on every paste. A refused permission or a dismissed prompt uploads nothing. The button is
shown where the browser offers `navigator.clipboard.read()` (secure contexts only) and the field is neither disabled nor
read-only. It sits at the top right corner, left of the replace button when an image is shown.

Ctrl+V uploads the first image of the pasted data while focus is in the field: on the file input (reached with Tab) or
on the paste button.

## Non-image Files

A dropped, picked or pasted file whose type is not `image/*` is rejected without calling `comms.upload`, and so is a
paste-button click when the clipboard holds no image.

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
import { FileGoneError } from '@dynamicforms/vuetify-inputs';

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
    try {
      await axios.post('/api/images/touch', { url: imageUrl });
    } catch (err) {
      if (err.response?.status === 404) {
        throw new FileGoneError('This image is no longer available. Please upload it again.');
      }
      throw err;
    }
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
