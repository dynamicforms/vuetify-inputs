---
description: 'Live examples of every input, from text and select to date/time, file, rich text and actions.'
---

# Examples

Examples of the components of `@dynamicforms/vuetify-inputs`. Each page has a live demo and its code.

## Density and Variant demo

The [demo](./density) renders every component under every variant and density, and shows the vertical alignment of
their parts.

## Configuration

How an application [configures the library](./configuration): the plugin options, what they register, the stylesheet,
and where a field's density and variant come from.

## Common Base Component

### [InputBase](./input-base)

The base component of all inputs: the props, events and behaviour all input components share.

### [Responsive options](./responsive-render-options)

How an action's breakpoints are resolved, and the rules to follow when building a responsive object of your own on
`ResponsiveRenderOptions`.

## Input Fields

- [df-actions](./df-actions)
- [df-checkbox](./df-checkbox)
- [df-color](./df-color)
- [df-date-time](./df-datetime)
- [df-file](./df-file)
- [df-image](./df-image)
- [df-input](./df-input)
- [df-input-group](./df-input-group)
- [df-input-hint](./df-input-hint)
- [df-rtf-editor](./df-rtf-editor)
- [df-select](./df-select)
- [df-text-area](./df-text-area)

[The fields](/guide/rationale#the-fields) describes what each one is.

## Integration Options

### [Using with vue-forms](:vue-forms:)

The `@dynamicforms/vue-forms` documentation.

### [Validation](./validators)

Various ways to validate input fields.

### [Localisation](./localisation)

The library's own English strings and how to translate them, and the date-fns locale `<df-date-time>` formats and
parses with.

### [Groups](./groups)

Validation errors that belong to a whole section, and conditions that show or hide one.
