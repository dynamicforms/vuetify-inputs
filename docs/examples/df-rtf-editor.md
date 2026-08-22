# df-rtf-editor Component

The df-rtf-editor component provides a rich text editor that fully integrates with both Vuetify and DynamicForms. It
is built on [TipTap](https://tiptap.dev/), with a toolbar assembled from this library's own Vuetify components rather
than a vendor UI, so it follows the application's theme and translations the same way every other field does.

## Basic Usage

Below is an example of the df-rtf-editor component used with DynamicForms:

<rtf-editor-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Headings, bold, italic, block quotes, bulleted and numbered lists
- Images: insert by URL, upload, or paste directly from the clipboard, embedded as base64 `data:` URIs, with
  drag-handle resizing
- Tables, with row and column insertion/deletion
- Links, with an optional `download` attribute
- Pasting a Word or Google Docs selection: formatted text, embedded images and tables come through as structured
  content rather than raw markup clutter
- A "Style" dropdown applying named, class-based looks to the current block or selection
- Media embeds: paste a YouTube or Vimeo URL to insert a responsive player

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| minHeight | `string` | `'7em'` | Minimum height of the editing area |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The HTML content (v-model)
- `label` - Input label
- `hint` - Hint text
- And more...

## Toolbar Features

- **Text formatting**
  - Bold, italic
  - Headings (paragraph, H1-H6)
  
- **Structured content**
  - Bulleted and numbered lists, with indent/outdent
  - Tables — insert, and add/delete rows and columns
  - Block quotes, horizontal line
  
- **Links, images and media**
  - Links, with an optional "Downloadable" attribute (`download="file"`)
  - Images — insert by URL, upload from disk, or paste from the clipboard; all three embed the picture as a base64
    `data:` URI, and a placed image can be resized by dragging its corner and edge handles
  - Media embed — paste a YouTube or Vimeo URL to insert a responsive `<iframe>` player; any other URL is inserted
    as a plain link instead

- **Style dropdown**
  - Applies one of the named looks from [Custom Styles](#custom-styles) to the current block or selection, and
    removes it again on a second click
  
- **Alignment**
  - Left, center, right, justify
  
- **Utilities**
  - Undo/redo, select all
  - A selection popup with bold, italic, link and list toggles
  - Pasting from Word or Google Docs: formatting, embedded images and tables come through structured, with the
    source application's markup clutter stripped

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the HTML content changes

## Working with HTML Content

The editor outputs standard HTML, which can be:

- Stored in a database
- Displayed in web pages
- Exported to various formats

Remember to sanitize HTML content appropriately when displaying user-generated content to prevent XSS attacks.

List items and table cells save their text wrapped in a paragraph (`<li><p>...</p></li>`, `<td><p>...</p></td>`),
so a list or a table read back outside this component - a public page, a PDF export, a templated email - needs
`li p, td p, th p { margin: 0; }` in its own stylesheet, or the browser's default paragraph margin makes every
list item and cell look double-spaced. `<df-rtf-editor>`'s own editing surface already accounts for this; nothing
else that renders the saved HTML does automatically. See the
[migration guide](/guide/migration#list-items-and-table-cells-wrap-their-text-in-a-p-now) for the full rule and
why it's safe against content saved before this behaviour existed.

## Custom Styles

The editor's stylesheet renders several predefined content classes, applied from the toolbar's Style dropdown:

| Style | Element | Class |
|-------|---------|-------|
| Article category | `h3` | `category` |
| Title | `h2` | `document-title` |
| Subtitle | `h3` | `document-subtitle` |
| Info box | `p` | `info-box` |
| Side quote | `blockquote` | `side-quote` |
| Marker | `span` (inline) | `marker` |
| Spoiler | `span` (inline) | `spoiler` |
| Code (dark) | `pre` | `fancy-code fancy-code-dark` |
| Code (bright) | `pre` | `fancy-code fancy-code-bright` |

The block-level styles (everything but Marker and Spoiler) both change the current block's element type and set
its class; Marker and Spoiler toggle over a text selection like bold or italic. Clicking an already-applied style
again removes it, turning the block back into a plain paragraph (or, for Marker/Spoiler, unwrapping the mark).

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
import { Group, Field, ValidationErrorText, Validators } from '@dynamicforms/vue-forms';
import { DfRtfEditor } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  description: new Field({
    value: '<p>Enter a detailed product description here.</p>',
    validators: [
      new Validators.Validator((value) => {
        if (!value || value === '<p></p>') return [new ValidationErrorText('Description is required')];
        if (value.length < 20) return [new ValidationErrorText('Description is too short')];
        return null;
      })
    ]
  })
});
</script>
```

<script setup>
import RtfEditorBasic from '../components/rtf-editor-basic.vue';
</script>
