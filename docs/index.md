---
layout: home
hero:
  name: DynamicForms Vuetify Inputs
  text: Form fields that match each other
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
features:
  - title: Every field matches every other
    details: A text field, a select, a checkbox and a date picker built from stock Vuetify each carry their own
      height, label placement and bottom margin. These sit on one shared base, so a row that mixes them comes out
      aligned with no per-component tweaking.
    link: /guide/rationale
    linkText: Why the library exists
  - title: A density that fits a table cell
    details: default, comfortable and compact are Vuetify's. inline is this library's own — it strips the outline,
      the floating label and the padding until a field fits inside a table cell, and every component supports it.
    link: /examples/density
    linkText: Density demo
  - title: Set the look once, override anywhere
    details: Density and variant are stated in one of four places and the most specific wins — the prop on the tag,
      then the field itself, then a provide from any ancestor, then the plugin defaults. A whole application
      restyles from one argument; one dialog restyles from one provide.
    link: /examples/configuration
    linkText: Configuration
  - title: The field carries its own presentation
    details: A vue-forms field holds the label, hint, placeholder, css class, density and variant it is drawn with,
      typed on every element. A form declared in code says how it looks where it is declared, and the tags that draw
      it carry no presentation attributes at all.
    link: /examples/input-base#presentation-carried-by-the-element
    linkText: Presentation on the field
---

# @dynamicforms/vuetify-inputs

Input components for data entry, built so that every one of them matches every other.

## What it is

A set of Vuetify fields that share one base, so a row mixing a text field, a select, a checkbox and a date picker
comes out aligned. Two axes carry that: **density** — how vertically compact a field is, `default`, `comfortable`,
`compact` or the `inline` that fits a table cell — and **variant**, the seven Vuetify visual styles. Both are
resolved by the same code for every component, so a change to either moves every field at once.

Bind a field to a [@dynamicforms/vue-forms](:vue-forms:) element and that element owns the value, the validation,
the enabled state and the visibility, and the component draws what it holds. That is what this library was built
for, and it is not what it requires: **every component works just as well with a plain `v-model`, or with no
binding at all.** Reach for them because your form fields should look alike, whether or not you want a form model
behind them — the consistency, the density and variant system, the inline mode and the escape hatches are the same
either way. [Using them without vue-forms](/guide/getting-started#using-without-dynamicforms) is a section of its
own.

[Rationale](/guide/rationale) states the premise in full and lists everything the library does.

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

Neither field is given a density or a variant, so both take whatever the application was configured with, and both
render at the same height with their labels on the same line.

## Where to go next

Install the plugin and write the first form in [Getting Started](/guide/getting-started). See every component under
every density and variant, side by side, in the [density demo](/examples/density). Read the props they all share in
[InputBase](/examples/input-base). The source lives at
[github.com/dynamicforms/vuetify-inputs](https://github.com/dynamicforms/vuetify-inputs).
