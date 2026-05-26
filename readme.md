# @dynamicforms/vuetify-inputs

Vuetify input components with guaranteed visual consistency across all form fields — unified density/variant system, globally configurable, with inline mode for table cells. Built for [@dynamicforms/vue-forms](https://github.com/dynamicforms/vue-forms).

## Introduction

`@dynamicforms/vuetify-inputs` provides input components for data entry that will be stored in form data. It is the 
visual implementation of logical concepts from
[@dynamicforms/vue-forms](https://github.com/dynamicforms/vue-forms).

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

The [density example](/docs/examples/density.md) in the documentation demonstrates all components rendered side-by-side across every density
and variant combination to verify alignment and consistent appearance.

## Features

- **DynamicForms Integration**: Seamlessly works with `@dynamicforms/vue-forms` for state management and validation
- **Vuetify Based**: Built on top of Vuetify components for beautiful Material Design styling
- **Reactive**: Full Vue reactivity support with both v-model and DynamicForms Field controls
- **TypeScript Support**: Comprehensive type definitions for excellent developer experience
- **Highly opinionated**: Opinionated to ensure uniform look throughout the application. 

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
  country: Field.create({ value: null }),
  description: Field.create({ value: '' }),
  document: Field.create({ value: null })
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
- **df-actions**: An actions group.
- **df-checkbox**: A checkbox component.
- **df-color**: A color input.
- **df-date-time**: A date and time selection component with configurable format and type.
- **df-file**: A file upload component with progress indication
- **df-input**: A general value input.
- **df-rtf-editor**: A RTF editor input.
- **df-select**: A selection component supporting static or dynamic options, multiple selection, and tagging
- **df-text-area**: A textarea component with configurable rows and validation

## TypeScript Support

The library is written in TypeScript and provides full type definitions for all components and interfaces.

## License

MIT
