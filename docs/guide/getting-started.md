# Getting Started

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

::: tip
you may also import a list of components like so:

```typescript
import { VuetifyComponents } from '@dynamicforms/vuetify-inputs';

...

Object.entries(VuetifyComponents).map(([name, component]) => app.component(name, component));
```
:::

## Basic Usage

`@dynamicforms/vuetify-inputs` provides Vuetify-based input components that work with `@dynamicforms/vue-forms` for form 
state management.

### Setting up the components

Import the components you need:

```typescript
import { DfSelect, DfTextArea, DfFile } from '@dynamicforms/vuetify-inputs';
```

### Using with DynamicForms

These components are designed to integrate with the `@dynamicforms/vue-forms` library:

```vue
<template>
  <form>
    <!-- Basic text area with DynamicForms integration -->
    <df-text-area
      :control="form.fields.description"
      label="Description"
      hint="Enter a detailed description"
      :rows="5"
      :max-rows="10"
    />
    
    <!-- Select field with choices -->
    <df-select
      :control="form.fields.category"
      :choices="categoryOptions"
      label="Category"
    />
  </form>
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfTextArea, DfSelect } from '@dynamicforms/vuetify-inputs';

// Create a form group with fields
const form = new Group({
  description: Field.create({ value: '' }),
  category: Field.create({ value: null }),
});

// Define options for the select field
const categoryOptions = [
  { id: 1, text: 'Category 1' },
  { id: 2, text: 'Category 2' },
  { id: 3, text: 'Category 3' },
];
</script>
```

### Using without DynamicForms

The components can also be used standalone with v-model:

```vue
<template>
  <df-text-area
    v-model="description"
    label="Description"
    hint="Enter a detailed description"
  />
  
  <df-select
    v-model="selectedCategory"
    :choices="categoryOptions"
    label="Category"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfTextArea, DfSelect } from '@dynamicforms/vuetify-inputs';

const description = ref('');
const selectedCategory = ref(null);
const categoryOptions = [
  { id: 1, text: 'Category 1' },
  { id: 2, text: 'Category 2' },
  { id: 3, text: 'Category 3' },
];
</script>
```

## Available Components

- [**df-actions**](/examples/df-actions): An actions group.
- [**df-checkbox**](/examples/df-checkbox): A checkbox component.
- [**df-color**](/examples/df-color): A color input.
- [**df-date-time**](/examples/df-datetime): A date and time selection component with configurable format and type.
- [**df-file**](/examples/df-file): A file upload component with progress indication.
- [**df-input**](/examples/df-input): A general value input.
- [**df-rtf-editor**](/examples/df-rtf-editor): A RTF editor input.
- [**df-select**](/examples/df-select): A selection component supporting static or dynamic options, multiple selection,
  and tagging.
- [**df-textarea**](/examples/df-text-area): A textarea component with configurable rows and validation.

## Next Steps

Check out the [Examples](/examples/) section to see more advanced usage patterns, or dive into the [API](/api/) 
documentation to learn about all available features.
