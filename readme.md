# @dynamicforms/vuetify-inputs

Vuetify input components that share one layout: one density and variant system, set for the application, a section
or a field, with an inline density for table cells. Built for
[@dynamicforms/vue-forms](https://github.com/dynamicforms/vue-forms).

## Main features

- **One layout for every field**: the components share one base, so a row mixing a text field, a select, a checkbox
  and a date picker is aligned without per-component adjustments
- **A density that fits a table cell**: `default`, `comfortable` and `compact` are Vuetify's; `inline` is this
  library's own: it removes the outline, the floating label and the padding, so that a field fits inside a table cell
- **Set the look once, override anywhere**: density and variant are read from the prop, then the field, then a
  `provide` from any ancestor, then the plugin defaults — most specific first
- **The field carries its own presentation**: a `@dynamicforms/vue-forms` field holds the label, hint, placeholder,
  css class, density and variant it is drawn with, so a form declared in code needs no presentation attributes on
  the tags that draw it

The [density example](https://docs.velis.si/dynamicforms/vuetify-inputs/examples/density.html) renders every component
side by side in every density and variant.

## Further features

- **Thirteen components**: `df-input`, `df-text-area`, `df-select`, `df-checkbox`, `df-color`, `df-date-time`,
  `df-file`, `df-image`, `df-rtf-editor`, `df-actions`, `df-input-hint`, `df-input-group` and `df-label`
- **A control, a v-model, or neither**: a bound element owns the value, validity, touched, enabled and visibility;
  `v-model` reports changes to the parent; neither keeps the value internally
- **Errors and hints** in one row, rendered through the library's own `MessagesWidget`; an error
  renders as the plain text, markdown or component the application's `errorText` setting returns for its code and
  params, or as its English `detail`, and is shown by one rule an application can replace — the server's at once,
  every other once the field is touched
- **Labels with icons, markdown, HTML or a component**, through the `Label` class, `MdString`, `HtmlString` and
  `SimpleComponentDef`
- **Visibility** — `'full'`, `'invisible'`, `'hidden'`, `'suppress'` — and enablement that follows the
  containing section
- **`passthroughAttrs`**: any prop of the underlying Vuetify component, without this library declaring it
- **Actions**: the `Action` class with render options, `defaultConfirm` / `defaultReject`, and per-breakpoint render
  options from `xs` to `xl`
- **Selection**: static choices or an async `fetchChoices`, single or multiple, chips with icons, free values with
  `allowTags`
- **Uploads**: a `FileComms` object with upload progress, delete and a periodic touch
- **Rich text**: TipTap with a Vuetify toolbar, inside the same field frame as every other input
- **Localisable**: `translateStrings()`, or the `translate` setting per app, connects the library's own strings,
  including every RTF editor toolbar label and `<df-image>`/`<df-file>`'s upload and download prompts, to the
  application's translation function; the `errorText` setting translates errors; `DateTimeLocaleConfig`, or the
  `dateTimeLocale` setting per app, sets the date-fns locale dates are formatted and parsed with — see the [localisation
  example](https://docs.velis.si/dynamicforms/vuetify-inputs/examples/localisation.html) for every key and a worked
  example
- **TypeScript**: every component's props are an exported interface, and the definitions ship with the build

## Installation

```bash
npm install @dynamicforms/vuetify-inputs
```

In your main.ts

```typescript
import { DynamicFormsInputs } from '@dynamicforms/vuetify-inputs';
import '@dynamicforms/vuetify-inputs/styles.css';

...
const app = createApp(MyApp);
app.use(router);
app.use(vuetify);
// registers the library for use and optionally inputs globally
app.use(DynamicFormsInputs, { registerComponents: true, registerVuetifyComponents: false });
```

## Basic Usage Example

The library offers various components, including:

```vue
<template>
  <div>
    <df-select
      :control="form.fields.country"
      :choices="countries"
      label="Select Country"
    />
    
    <df-text-area
      :control="form.fields.description"
      label="Description"
      :rows="5"
      :max-rows="10"
    />
    
    <df-file
      :control="form.fields.document"
      :comms="fileComms"
      label="Upload Document"
    />
  </div>
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfSelect, DfTextArea, DfFile } from '@dynamicforms/vuetify-inputs';

// Create a form with fields
const form = new Group({
  country: new Field({ value: null }),
  description: new Field({ value: '' }),
  document: new Field({ value: null })
});

// Define options for the select field
const countries = [
  { id: 'us', text: 'United States' },
  { id: 'ca', text: 'Canada' },
  { id: 'uk', text: 'United Kingdom' },
  // more countries...
];

// Communication for file field
const fileComms = {
  upload: async (file, progressCallback) => {
    // Upload implementation
  },
  delete: async (fileId) => {
    // Delete implementation
  },
  touch: async (fileId) => {
    // Touch implementation
  }
};
</script>
```

## Documentation

Detailed documentation is available at [https://docs.velis.si/dynamicforms/vuetify-inputs](https://docs.velis.si/dynamicforms/vuetify-inputs).

## Available Components

- **InputBase**: The field frame that df-date-time, df-file, df-image and df-rtf-editor place their control in
- **DfLabel**: Renders a label - plain text, markdown, HTML or a component, with an icon - the way every input renders
  its own
- **df-actions**: An actions group.
- **df-checkbox**: A checkbox component.
- **df-color**: A colour input.
- **df-date-time**: A date and time selection component with configurable format and type.
- **df-file**: A file upload component with progress indication
- **df-image**: An image upload with a preview, drag and drop and paste
- **df-input**: A general value input.
- **df-input-group**: One field's frame, label and message row around several inputs, e.g. a set of checkboxes
- **df-input-hint**: Renders a field's or a group's errors, falling back to its hint text.
- **df-rtf-editor**: A RTF editor input.
- **df-select**: A selection component supporting static or dynamic options, multiple selection, and tagging
- **df-text-area**: A textarea component with configurable rows and validation

## TypeScript Support

The library is written in TypeScript and provides full type definitions for all components and interfaces.

## License

MIT
