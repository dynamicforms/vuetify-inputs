# Getting Started

## Installation

```bash
npm install @dynamicforms/vuetify-inputs
```

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

- [**df-select**](/examples/df-select): A selection component supporting static or dynamic options, multiple selection,
  and tagging.
- [**df-textarea**](/examples/df-text-area): A textarea component with configurable rows and validation.
- [**df-file**](/examples/df-file): A file upload component with progress indication.

## Next Steps

Check out the [Examples](/examples/) section to see more advanced usage patterns, or dive into the [API](/api/) 
documentation to learn about all available features.
