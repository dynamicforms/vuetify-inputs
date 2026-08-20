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
  - title: Visual consistency through density
    details: One density prop on every component, resolved by one piece of shared code. default, comfortable and compact
      are Vuetify's; inline is this library's own — it removes the outline, the floating label and the padding, so a
      field fits inside a table cell.
    link: /examples/density
    linkText: Density demo
  - title: All seven variants
    details: outlined, plain, underlined, filled, solo, solo-inverted and solo-filled are accepted by every component,
      and resolved the same way density is. Per-variant spacing corrections keep fields of different types on one
      baseline.
    link: /examples/density
    linkText: Variant demo
  - title: Defaults that cascade
    details: Density and variant are read from the prop, then from an ancestor's provide('field-density') /
      provide('field-variant'), then from the plugin's defaultDensity / defaultVariant, and finally from the baked-in
      'default' and 'underlined'.
    link: /examples/configuration
    linkText: Configuration
  - title: A control, a v-model, or neither
    details: Bind a vue-forms control and the field owns the value, validity, enabled state and visibility. Bind
      v-model and the component reports every change to the parent. Bind neither and it keeps the value itself.
    link: /examples/input-base
    linkText: Common props
  - title: Nine components
    details: df-input, df-text-area, df-select, df-checkbox, df-color, df-date-time, df-file, df-rtf-editor and
      df-actions — every one of them built on the same base, so a prop learnt on one is the same prop on the next.
    link: /examples/
    linkText: All components
  - title: Selection, tagging and ajax
    details: df-select takes a static choices array or an async fetchChoices callback, does single and multiple
      selection, renders the selection as chips with icons, and with allowTags accepts values that are not on the list.
    link: /examples/df-select
    linkText: df-select
  - title: Uploads that talk to your backend
    details: df-file takes a FileComms object with upload, delete and touch. The upload reports progress to a progress
      bar, the field's value is the identifier your backend returned, and touch runs once a minute while a file is
      held.
    link: /examples/df-file
    linkText: df-file
  - title: Rich text on CKEditor 5
    details: df-rtf-editor embeds a configured ClassicEditor — headings, styles, tables, images, links and a balloon
      toolbar — inside the same field frame as every other input, label, hint and errors included.
    link: /examples/df-rtf-editor
    linkText: df-rtf-editor
  - title: An actions bar
    details: df-actions renders an array of Action objects as buttons or text links. Action extends the vue-forms one;
      defaultConfirm and defaultReject colour their buttons primary and secondary, and the closeAction, yesAction and
      noAction factories build the three usual ones.
    link: /examples/df-actions
    linkText: df-actions
  - title: Responsive by breakpoint
    details: An action's render options are stated per breakpoint from xs to xl. A breakpoint states only what it
      changes and everything else keeps cascading up from the smaller ones, so a label drops to an icon on a phone.
    link: /examples/responsive-render-options
    linkText: Responsive options
  - title: Errors, hints and help text
    details: Every input renders its messages through DfInputHint, which takes a control's or a group's errors — plain
      strings, markdown or components — and paints errors over the hint while the field is touched.
    link: /examples/df-input-hint
    linkText: DfInputHint
  - title: Labels with icons and markdown
    details: A label is a plain string, a Label carrying an icon rendered through vue-cached-icon, a v-img or a
      component of your choice, or an MdString rendered as markdown.
    link: /examples/input-base
    linkText: Labels
  - title: Visibility without v-if
    details: A field's DisplayMode decides how the input renders — FULL normally, HIDDEN with no box, INVISIBLE with the
      box but no paint, SUPPRESS not in the DOM at all — so a conditional visibility action shows and hides it for you.
    link: /examples/input-base
    linkText: Display modes
  - title: passthroughAttrs
    details: Every input takes passthroughAttrs, a record merged over the computed Vuetify bindings last, so any prop of
      the underlying Vuetify component is reachable without the wrapper having to declare it.
    link: /examples/input-base
    linkText: The escape hatch
  - title: Localisation
    details: translateStrings() replaces the library's own strings through a callback into your translation machinery,
      and setCkEditorLanguage() hands the editor its language code and translation bundle.
    link: /examples/localisation
    linkText: Localisation
  - title: TypeScript and one plugin call
    details: Props are declared as exported interfaces, values and choices are generic. app.use(DynamicFormsInputs)
      installs the settings and, on request, registers the input components — and Vuetify's own — globally.
    link: /guide/getting-started
    linkText: Getting started
---

# @dynamicforms/vuetify-inputs

Input components for data entry that ends up in form data. This library is the visual implementation of the logical
concepts in [@dynamicforms/vue-forms](:vue-forms:); that library holds the value, the validation and the state, and
this one draws it.

## Why the library exists

A form built from stock Vuetify components drifts. A text field, a select, a checkbox and a date picker each carry
their own idea of height, of label placement and of the margin below the control, and the row they share ends up
ragged. Fixing that per component means a wrapper here, a class there, and a design that has to be maintained in as
many places as there are field types.

This library's premise is that **every field looks and behaves the same regardless of which component it is and where
it appears**. `df-input`, `df-select`, `df-checkbox`, `df-date-time` and the rest sit on one shared base, so mixing
them on a single form row produces an aligned result with no per-component tweaking.

Two axes carry that consistency, and both are resolved by the same code for every component:

- **Density** — the vertical compactness of a field: `default`, `comfortable`, `compact`, or `inline`. The `inline`
  density is not a Vuetify one; it strips the decoration off a field until it is small enough for a table cell.
- **Variant** — the visual style: `outlined`, `plain`, `underlined`, `filled`, `solo`, `solo-inverted` or
  `solo-filled`.

Both are set once at application startup, injected for a section of the page, or given per field, in that order of
increasing precedence. Switching the whole application from `underlined` to `outlined` is one argument in one call.

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
