---
title: 'Vuetify 3 Form Inputs for Vue 3'
description: 'Vuetify 3 input fields with one density and variant system and an inline mode for table cells, bound to @dynamicforms/vue-forms fields or to v-model.'
layout: home
hero:
  name: DynamicForms Vuetify Inputs
  text: Form fields with one layout
  tagline: Vuetify input components with one density and variant system — set globally, injected per section, overridden
    per field, with an inline mode that fits a table cell.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Examples
      link: /examples/
    - theme: alt
      text: View on GitHub
      link: https://github.com/dynamicforms/vuetify-inputs
    - theme: alt
      text: Changelog
      link: /guide/changelog
features:
  - title: One layout for every field
    details: Stock Vuetify text fields, selects, checkboxes and date pickers differ in height, label placement and
      bottom margin. These components share one base, so a row that mixes them is aligned without per-component
      adjustments.
    link: /guide/rationale
    linkText: Why the library exists
  - title: A density that fits a table cell
    details: default, comfortable and compact are Vuetify's. inline is this library's own; it removes the outline,
      the floating label and the padding, so that a field fits inside a table cell. Every component supports it.
    link: /examples/density
    linkText: Density demo
  - title: Set the look once, override anywhere
    details: Density and variant are set in one of four places and the most specific applies; the prop on the tag,
      then the field itself, then a provide from any ancestor, then the plugin defaults. The application is restyled
      by one plugin option, one dialog by one provide.
    link: /examples/configuration
    linkText: Configuration
  - title: The field carries its own presentation
    details: A vue-forms field holds the label, hint, placeholder, css class, density and variant it is rendered
      with, typed on every element. A form declared in code sets its presentation where it is declared, and the
      tags that render it need no presentation attributes.
    link: /examples/input-base#presentation-carried-by-the-element
    linkText: Presentation on the field
---

# @dynamicforms/vuetify-inputs

Vuetify input components for data entry with one shared layout.

## What it is

A set of Vuetify fields that share one base, so a row mixing a text field, a select, a checkbox and a date picker
is aligned. The layout is set on two axes: **density**, the vertical compactness of a field (`default`,
`comfortable`, `compact`, or `inline` for a table cell), and **variant**, the seven Vuetify visual styles. Both are
resolved by the same code for every component; a change to either applies to every field.

A field bound to a [@dynamicforms/vue-forms](:vue-forms:) element takes the value, the validation, the enabled state
and the visibility from the element and renders them. **Every component also works with a plain `v-model`, or with
no binding.** The density and variant system, the inline mode and `passthroughAttrs` apply in all three cases. See
[Using them without vue-forms](/guide/getting-started#using-without-dynamicforms).

[Rationale](/guide/rationale) lists everything the library does.

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
import { Field, Group } from '@dynamicforms/vue-forms';
import { DfSelect, DfTextArea } from '@dynamicforms/vuetify-inputs';

// Create a form with fields
const form = new Group({
  country: new Field({ value: null }),
  description: new Field({ value: '' }),
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

Neither field sets a density or a variant, so both take the application's configured values, and both render at the
same height with their labels on the same line.

## Where to go next

- [Getting Started](/guide/getting-started): installing the plugin and a first form.
- [Density demo](/examples/density): every component under every density and variant.
- [InputBase](/examples/input-base): the props all components share.

The source is at
[github.com/dynamicforms/vuetify-inputs](https://github.com/dynamicforms/vuetify-inputs).
