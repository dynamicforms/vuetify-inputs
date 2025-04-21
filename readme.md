# @dynamicforms/vuetify-inputs

Visual components based on Vuetify library to support @dynamicforms/vue-forms.

## Introduction

`@dynamicforms/vuetify-inputs` provides input components for data entry that will be stored in form data. It is the 
visual implementation of logical concepts from 
[@dynamicforms/vue-forms](https://github.com/velis74/dynamicforms-vue-forms).

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

In your main.py
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

Detailed documentation is available as a VitePress site in the `/docs` folder. To view the documentation locally:

```bash
npm run docs:dev
```

## Available Components

- **df-select**: A selection component supporting static or dynamic options, multiple selection, and tagging
- **df-textarea**: A textarea component with configurable rows and validation
- **df-file**: A file upload component with progress indication
- **InputBase**: The base component for all input elements

## TypeScript Support

The library is written in TypeScript and provides full type definitions for all components and interfaces.

## License

MIT
