---
layout: home
hero:
  name: DynamicForms Vuetify
  text: A powerful collection of Vuetify input components
  tagline: Beautifully styled form components that integrate with DynamicForms vue-forms package
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/velis74/dynamicforms-vuetify-inputs
features:
  - title: DynamicForms Integration
    details: Seamlessly works with @dynamicforms/vue-forms for state management and validation
  - title: Vuetify Based
    details: Built on top of Vuetify components for beautiful Material Design styling
  - title: Reactive
    details: Full Vue reactivity support with both v-model and DynamicForms Field controls
  - title: TypeScript Support
    details: Comprehensive type definitions for excellent developer experience
---

# @dynamicforms/vuetify-inputs

A collection of Vuetify-based input components designed to work with @dynamicforms/vue-forms for building powerful, 
reactive form interfaces.

## Introduction

`@dynamicforms/vuetify-inputs` provides the visual layer to complement the logic-focused `@dynamicforms/vue-forms` 
library. Together, they offer a complete solution for creating advanced form interfaces with robust validation, 
state management, and beautiful styling.

The components in this library follow Vuetify's design patterns while adding advanced functionality like dynamic 
option loading, file uploads with progress indication, and seamless integration with the DynamicForms ecosystem.

## Simple Example

```vue
<template>
  <div>
    <df-select
      :control="form.fields.country"
      :choices="countries"
      label="Select a country"
    />
    
    <df-text-area
      :control="form.fields.description"
      label="Description"
      :rows="5"
      :max-rows="10"
    />
    
    <pre>{{ form.value }}</pre>
  </div>
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfSelect, DfTextArea } from '@dynamicforms/vuetify-inputs';

// Create a form with fields
const form = new Group({
  country: Field.create({ value: null }),
  description: Field.create({ value: '' })
});

// Define countries for select
const countries = [
  { id: 'us', text: 'United States' },
  { id: 'ca', text: 'Canada' },
  { id: 'uk', text: 'United Kingdom' },
  // more countries...
];
</script>
```

Ready to get started? Check out the [Getting Started](/guide/getting-started) guide or dive into the 
[Examples](/examples/) for more detailed usage patterns.

<script setup>
</script>
