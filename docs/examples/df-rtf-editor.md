# df-rtf-editor Component

The df-rtf-editor component provides a rich text editor that fully integrates with both Vuetify and DynamicForms. It 
uses CKEditor 5 as its foundation to offer advanced text formatting capabilities.

## Basic Usage

Below is an example of the df-rtf-editor component used with DynamicForms:

<rtf-editor-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Advanced text formatting with CKEditor 5
- Support for images, tables, lists, links, and other rich content
- Customizable toolbar with common formatting options
- Full HTML editing capabilities
- Custom styling for common content elements

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| minHeight | `string` | `'7em'` | Minimum height of the editor |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The HTML content (v-model)
- `label` - Input label
- `hint` - Hint text
- And more...

## Toolbar Features

The editor includes a comprehensive toolbar with the following features:

- **Text formatting**
  - Bold, italic
  - Text styles (including custom styles)
  - Headings (H1-H6)
  
- **Structured content**
  - Bulleted and numbered lists
  - Indentation controls
  - Tables with formatting options
  - Block quotes
  
- **Media and links**
  - Links with custom attributes
  - Media embedding
  - Image insertion and formatting
  
- **Layout and alignment**
  - Text alignment options
  - Horizontal line
  
- **Utilities**
  - Undo/redo
  - Copy/paste with format preservation
  - Paste from Office documents
  - Paste from Markdown
  - Accessibility help

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the HTML content changes

## Working with HTML Content

The editor outputs standard HTML, which can be:

- Stored in a database
- Displayed in web pages
- Exported to various formats

Remember to sanitize HTML content appropriately when displaying user-generated content to prevent XSS attacks.

## Custom Styles

The editor includes several predefined custom styles that can be applied to content:

- Article category
- Document title and subtitle
- Info box with custom border and background
- Side quote with decorative elements
- Text markers and spoilers
- Code blocks with syntax highlighting (dark and bright themes)

## Examples

### Basic Usage with v-model

```vue
<template>
  <df-rtf-editor
    v-model="content"
    label="Article Content"
    hint="Use the formatting toolbar to style your content"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfRtfEditor } from '@dynamicforms/vuetify-inputs';

const content = ref('<h2>Welcome</h2><p>This is a <strong>rich text editor</strong>.</p>');
</script>
```

### With DynamicForms Integration

```vue
<template>
  <df-rtf-editor
    :control="form.fields.description"
    label="Product Description"
    hint="Format the product description with rich text"
    min-height="15em"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfRtfEditor } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  description: Field.create({
    value: '<p>Enter a detailed product description here.</p>',
    validators: [
      {
        validate: (value) => {
          if (!value || value === '<p></p>') return 'Description is required';
          if (value.length < 20) return 'Description is too short';
          return null;
        }
      }
    ]
  })
});
</script>
```

<script setup>
import RtfEditorBasic from '../components/rtf-editor-basic.vue';
</script>
