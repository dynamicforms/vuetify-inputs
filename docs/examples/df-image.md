# df-image Component

`df-image` is an image upload field: a preview of the current image, a drag & drop zone, and a button that opens the
browser's file dialog. It uses the backend interface of [df-file](./df-file).

## Basic Usage

`df-image` bound to a vue-forms field:

<image-basic/>

## Features

- Preview of the current image
- Drag & drop, and a click-to-browse dialog
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
| touchInterval | `number` | `60000` | Milliseconds between keep-alive touches. See [Configuration](/examples/configuration) for setting this application-wide instead |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:

- `control` - DynamicForms field object
- `modelValue` - The image URL (v-model)
- `label` - Input label
- `hint` - Hint text
- And more...

## Value Format

The component stores and displays a URL string, not the file itself:

1. `comms.upload` resolves to the URL the component renders as the image's `src`. There is no lookup from an
   identifier to a URL, so the returned value must be a URL the browser can load.
2. The same value is used in subsequent operations (delete, touch) to reference the image.
3. It is stored in the form data when using DynamicForms.

A started upload completes when the field is disabled while it runs: the URL is still written into it and touched from
then on. A later upload, a clear of the field or a value set on the field while an upload runs supersedes that upload:
it writes nothing into the field, and the URL it returns is deleted through `comms.delete`.

## Temporary Uploads

The URL the component's last upload returned is a temporary upload while the field holds it and, where a `control` is
bound, it differs from the control's `originalValue`.

- A temporary upload is touched every `touchInterval` milliseconds.
- Clearing the field deletes a temporary upload through `comms.delete`. Clearing any other URL, such as one the field
  was given with its record, sets the value to `null` and calls no `comms` method.
- An upload that replaces a temporary upload deletes the replaced one through `comms.delete`.
- Once the URL is the control's `originalValue` (`control.originalValue = control.value` or a `rebind` after the form is
  saved), it is no longer touched or deleted. Without a `control`, an uploaded URL is temporary for as long as the field
  holds it.

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
   * Called for a temporary upload the field clears or another upload replaces, and for an upload superseded
   * before it returned. Throw FileGoneError if the backend already reports the identifier as gone; any other
   * thrown error is treated as transient.
   * @param fileIdentifier The URL that was returned by upload
   */
  delete: (fileIdentifier: string) => Promise<void>;

  /**
   * Called periodically to keep a temporary upload active. Throw FileGoneError if the backend reports the
   * identifier no longer exists — the component then clears the field and, where a `control` is bound, reports an error
   * of code `vuetify-inputs.file_gone` with the error's `errorText` as its detail. Any other thrown error is treated as transient and left to the consumer.
   * @param fileIdentifier The URL that was returned by upload
   */
  touch: (fileIdentifier: string) => Promise<void>;
}

// Progress callback type
type FileProgressCallback = (loaded: number, total: number) => void;

// Thrown by touch/delete to report that the backend has already discarded the image
class FileGoneError extends Error {
  constructor(public errorText: string) {
    super(errorText);
  }
}
```

`FileComms` also declares an optional `getDownloadUrl`, used by `df-file`; `df-image` ignores it, because its value is
the URL.

## Upload Progress

During an upload the component shows a progress bar from the values passed to `progressCallback` of `upload`.

A temporary upload is touched every `touchInterval` milliseconds (60 seconds by default), so the backend keeps it. If a
touch rejects with a `FileGoneError` while the field still holds the touched URL, the field and preview are cleared, a
disabled field as well, and, where a `control` is bound, its errors are replaced with one `ValidationError` of code
`vuetify-inputs.file_gone` and origin `'server'`, whose `detail` is the error's `errorText`; the [`errorText`
setting](/examples/localisation#translating-errors) can render another text for the code. Under vue-forms' default
[`ErrorPolicy`](:vue-forms:/api/validators.html#errorpolicy) the field drops the error when a new image is uploaded. Any
other rejection is ignored by the component and left to the application.

An upload that returns and a clear of the field mark the field touched.

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
