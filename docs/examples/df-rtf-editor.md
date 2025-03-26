# DfRtfEditor Component

The DfRtfEditor component provides a rich text editor that fully integrates with both Vuetify and DynamicForms. It uses CKEditor 5 as its foundation to offer advanced text formatting capabilities.

## Basic Usage

Below is an example of the DfRtfEditor component used with DynamicForms:

<rtf-editor-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Advanced text formatting with CKEditor 5
- Support for images, tables, lists, links, and other rich content
- Customizable toolbar with common formatting options
- Full HTML editing capabilities

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| control | `Field` | `undefined` | DynamicForms field object |
| modelValue | `string` | `''` | The HTML content (v-model) when used without control |
| label | `string` | `''` | Input label |
| hint | `string` | `''` | Hint text displayed below the input |
| helpText | `string` | `''` | Additional help text |
| enabled | `boolean` | `true` | Whether the editor is enabled |
| visibility | `DisplayMode` | `FULL` | Visibility mode of the component |
| cssClass | `string` | `''` | Additional CSS classes |

## Toolbar Options

The DfRtfEditor includes a comprehensive toolbar with the following features:

- Text formatting (bold, italic)
- Headings and paragraph styles
- Lists (bulleted and numbered)
- Links and media embedding
- Tables with formatting options
- Text alignment
- And more...

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: string` | Emitted when the HTML content changes (when used without control) |

## Working with HTML Content

The editor outputs standard HTML, which can be:

- Stored in a database
- Displayed in web pages
- Exported to various formats

Remember to sanitize HTML content appropriately when displaying user-generated content to prevent XSS attacks.

<script setup>
import RtfEditorBasic from '../components/rtf-editor-basic.vue';
</script>
