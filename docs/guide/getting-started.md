---
description: 'Install @dynamicforms/vuetify-inputs, set the app-wide density and variant in the plugin, and render vue-forms fields or v-model values.'
---

# Getting Started

## Installation

```bash
npm install @dynamicforms/vuetify-inputs
```

In your main.ts

```typescript
import { DynamicFormsInputs } from '@dynamicforms/vuetify-inputs';
import '@dynamicforms/vuetify-inputs/styles.css';

const app = createApp(MyApp);
app.use(vuetify);
app.use(DynamicFormsInputs);
```

[Configuration](/examples/configuration) describes the plugin options, among them the global registration of the
components and of the Vuetify components they use, and the `VuetifyComponents` export.

### Resolving a component by its tag

`dfInputComponentsByTag` holds every component of this library under its tag, for a rendering layer that looks a
component up in a map instead of through Vue's resolver, e.g. one that renders a serialized layout naming
`df-select`. `DfInputComponentTag` is the union of those tags.

```typescript
import { dfInputComponentsByTag } from '@dynamicforms/vuetify-inputs';

const components = { ...dfInputComponentsByTag, ...myOwnComponents };
```

[`@dynamicforms/vuetify-modal-form-kit`](:vuetify-modal-form-kit:) passes this map to its layout renderer. A
component added to this library in a later version is in the map; a hand-written list does not contain it.

## Basic Usage

`@dynamicforms/vuetify-inputs` provides Vuetify-based input components that work with `@dynamicforms/vue-forms` for form
state management.

### Setting up the components

Import the components you need:

```typescript
import { DfSelect, DfTextArea, DfFile } from '@dynamicforms/vuetify-inputs';
```

### Using with DynamicForms

A component bound to a `@dynamicforms/vue-forms` element through `control`:

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
  description: new Field({ value: '' }),
  category: new Field({ value: null }),
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

The components also work with `v-model`:

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

[The fields](/guide/rationale#the-fields) lists every component with what it is.
[InputBase](/examples/input-base) describes the frame and the props they share.

## Localisation

[Localisation](/examples/localisation) describes how the library's own strings, its errors and the date-fns locale of
`<df-date-time>` follow the application's language.

## Next Steps

The [Examples](/examples/) section documents every component and feature.
