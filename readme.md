# @dynamicforms/vuetify-inputs

Vuetify input components with guaranteed visual consistency across all form fields — unified density/variant system, globally configurable, with inline mode for table cells. Built for [@dynamicforms/vue-forms](https://github.com/dynamicforms/vue-forms).

## Introduction

`@dynamicforms/vuetify-inputs` provides input components for data entry, built so that every one of them matches
every other.

Hand a component an element of [@dynamicforms/vue-forms](https://github.com/dynamicforms/vue-forms) and that element
owns the value, the validation, the enabled state and the visibility, and the component draws what it holds. That is
what the library was built for, and it is not what it requires: every component works just as well with a plain
`v-model`, or with no binding at all. The visual consistency, the density and variant system and the inline mode for
table cells are the same either way, so the components are worth reaching for whether or not you want a form model
behind them.

## Design Goals

The primary goal of this library is **visual consistency**: every input component should look and behave the same
regardless of which component is used or where it appears in the application. This means that mixing `df-input`,
`df-select`, `df-checkbox`, `df-date-time`, and others on the same form row should produce a coherent, aligned result
without any per-component tweaking.

To achieve this, the library introduces a **density/variant system** that applies uniformly to all components:

- **Density** controls the vertical compactness of a component and can be set globally, injected per-section, or
  overridden per-component. Supported values are `default`, `comfortable`, `compact`, and `inline`.
- **Variant** controls the visual style (e.g. `outlined`, `underlined`, `filled`, `solo`, …) and follows the same
  hierarchy.
- The `inline` density is a custom extension beyond standard Vuetify — it strips labels and decorations so components
  render cleanly inside table cells.

Global defaults can be set once at application startup via `VuetifyInputsSettings` and propagated down through Vue's
provide/inject, so the entire application can switch density or variant with a single change.

The [density example](https://docs.velis.si/dynamicforms/vuetify-inputs/examples/density.html) in the documentation
demonstrates all components rendered side-by-side across every density and variant combination to verify alignment and
consistent appearance.

## What matters most

- **Every field matches every other**: one shared base, so a row mixing a text field, a select, a checkbox and a
  date picker comes out aligned with no per-component tweaking
- **A density that fits a table cell**: `default`, `comfortable` and `compact` are Vuetify's; `inline` is this
  library's own, and strips a field of its decoration until it fits inside a cell
- **Set the look once, override anywhere**: density and variant are read from the prop, then the field, then a
  `provide` from any ancestor, then the plugin defaults — most specific first
- **The field carries its own presentation**: a `@dynamicforms/vue-forms` field holds the label, hint, placeholder,
  css class, density and variant it is drawn with, so a form declared in code needs no presentation attributes on
  the tags that draw it

## Everything else it does

- **Ten components**: `df-input`, `df-text-area`, `df-select`, `df-checkbox`, `df-color`, `df-date-time`, `df-file`,
  `df-rtf-editor`, `df-actions` and `df-input-hint`
- **A control, a v-model, or neither**: a bound element owns the value, validity, touched, enabled and visibility;
  `v-model` reports changes to the parent; neither keeps the value internally
- **Errors, hints and help text** in one row, rendered through vue-forms' `MessagesWidget`, so an error may be
  plain text, markdown or a component of its own
- **Labels with icons and markdown**, through the `Label` class and `MdString`
- **Visibility through `DisplayMode`** — `FULL`, `HIDDEN`, `INVISIBLE`, `SUPPRESS` — and enablement that follows the
  containing section
- **`passthroughAttrs`**: any prop of the underlying Vuetify component, without this library declaring it
- **Actions**: the `Action` class with render options, `defaultConfirm` / `defaultReject`, the ready-made
  close/yes/no factories, and per-breakpoint render options from `xs` to `xl`
- **Selection**: static choices or an async `fetchChoices`, single or multiple, chips with icons, free values with
  `allowTags`
- **Uploads**: a `FileComms` object with upload progress, delete and a periodic touch
- **Rich text**: a configured CKEditor 5 inside the same field frame as every other input
- **Localisable**: `translateStrings()` replaces the library's own strings, `setCkEditorLanguage()` sets the RTF
  editor's interface language, and `DateTimeLocaleConfig` sets the date-fns locale dates are formatted and parsed
  with
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

- **InputBase**: The base component for all input elements
- **DfLabel**: Renders a label - plain text, markdown or an icon - the way every input renders its own
- **df-actions**: An actions group.
- **df-checkbox**: A checkbox component.
- **df-color**: A color input.
- **df-date-time**: A date and time selection component with configurable format and type.
- **df-file**: A file upload component with progress indication
- **df-input**: A general value input.
- **df-input-hint**: Renders a field's or a group's errors, falling back to its hint text.
- **df-rtf-editor**: A RTF editor input.
- **df-select**: A selection component supporting static or dynamic options, multiple selection, and tagging
- **df-text-area**: A textarea component with configurable rows and validation

## TypeScript Support

The library is written in TypeScript and provides full type definitions for all components and interfaces.

## License

MIT
