---
description: 'API reference with live examples for each input: text, select, date/time, file, image, rich-text, checkbox, colour and action buttons.'
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

### [df-actions](./df-actions)

A component for rendering a group of actions.

### [df-checkbox](./df-checkbox)

A component for checkbox / ternary selection.

### [df-color](./df-color)

A color input.

### [df-date-time](./df-datetime)

A component for date and time selection.

### [df-file](./df-file)

A component for file uploads.

### [df-image](./df-image)

A component for image uploads, with a preview, drag & drop, and a browse dialog.

### [df-input](./df-input)

A component for general data entry.

### [df-input-hint](./df-input-hint)

The message row every input renders: errors when there are any, the hint otherwise. Also usable without an input, for a group's
errors.

### [**df-rtf-editor**](./df-rtf-editor)

A RTF editor input.

### [df-select](./df-select)

A component for selecting values from a list. The examples show:

- Basic usage with a static list
- Advanced features (multiple selection, AJAX loading, icons)
- Integration with DynamicForms

### [df-text-area](./df-text-area)

A component for multi-line text input.

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
