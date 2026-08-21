# Getting Started

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

::: tip
you may also import a list of components like so:

```typescript
import { VuetifyComponents } from '@dynamicforms/vuetify-inputs';

...

Object.entries(VuetifyComponents).map(([name, component]) => app.component(name, component));
```
:::

### Resolving a component by its tag

A rendering layer that reads a component out of a map rather than through Vue's resolver - one that draws a
serialized layout naming `df-select`, say - is handed `dfInputComponentsByTag`, which holds every component of
this library under the tag that names it. `DfInputComponentTag` is the union of those tags.

```typescript
import { dfInputComponentsByTag } from '@dynamicforms/vuetify-inputs';

const components = { ...dfInputComponentsByTag, ...myOwnComponents };
```

This is the map [`@dynamicforms/vuetify-modal-form-kit`](:vuetify-modal-form-kit:) hands its layout renderer, and
using it instead of a list of your own is what keeps a component this library gains from going unresolved.

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

- [**InputBase**](/examples/input-base): The base component for all input elements
- [**df-actions**](/examples/df-actions): An actions group.
- [**df-checkbox**](/examples/df-checkbox): A checkbox component.
- [**df-color**](/examples/df-color): A color input.
- [**df-date-time**](/examples/df-datetime): A date and time selection component with configurable format and type.
- [**df-file**](/examples/df-file): A file upload component with progress indication.
- [**df-input**](/examples/df-input): A general value input.
- [**df-input-hint**](/examples/df-input-hint): Renders a field's or a group's errors, falling back to its hint text.
- [**df-rtf-editor**](/examples/df-rtf-editor): A RTF editor input.
- [**df-select**](/examples/df-select): A selection component supporting static or dynamic options, multiple selection,
  and tagging.
- [**df-text-area**](/examples/df-text-area): A textarea component with configurable rows and validation.

## Localisation

The library renders a few English strings of its own — the labels of the predefined actions and the entries of the two
dropdowns the RTF editor adds to CKEditor's toolbar. `translateStrings()` replaces them, `setCkEditorLanguage()` sets
CKEditor's interface language, and `DateTimeLocaleConfig` sets the date-fns locale `<df-date-time>` formats and parses
with.

[Localisation](/examples/localisation) lists every translatable key with its default and where it appears, and carries
a worked example that keeps all three on the application's current locale.

## Next Steps

Check out the [Examples](/examples/) section to see more advanced usage patterns to learn about all available features.
