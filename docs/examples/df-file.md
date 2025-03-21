# DfFile Component

The DfFile component provides a file input field that integrates with both Vuetify and DynamicForms. It includes file 
upload functionality with progress indication and handling for file operations.

## Basic Usage

Below is an example of the DfFile component used with DynamicForms:

<file-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management
- File upload with progress indication
- File deletion support
- Customizable labels, hints, and error messages
- Backend communication abstraction through the FileComms interface

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| control | `Field` | `undefined` | DynamicForms field object |
| modelValue | `string` | `null` | The file identifier (v-model) when used without control |
| comms | `FileComms` | **Required** | Object with methods for file operations |
| label | `string` | `''` | Input label |
| hint | `string` | `''` | Hint text displayed below the input |
| helpText | `string` | `''` | Additional help text |
| enabled | `boolean` | `true` | Whether the input is enabled |
| visibility | `DisplayMode` | `FULL` | Visibility mode of the component |
| cssClass | `string` | `''` | Additional CSS classes |

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

After a file has been uploaded to the backend, it will be touched every 60 seconds to let backend know that it's still 
relevant.

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: string` | Emitted when the file identifier changes (when used without control) |

<script setup>
import FileBasic from '../components/file-basic.vue';
</script>
