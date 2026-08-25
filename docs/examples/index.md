# Examples

This section contains a collection of practical examples demonstrating the usage of various components from the 
`@dynamicforms/vuetify-inputs` library. Each example includes a working demo component and its corresponding code.

## Density and Variant demo

This [demo](./density) showcases support for various component variants and densities. It also demonstrates vertical 
alignment of component parts so that your forms look perfectly aligned in all respects. 

## Configuration

How an application [configures the library](./configuration): the plugin options, what they register, the stylesheet,
and where a field's density and variant come from.

## Common Base Component

### [InputBase](./input-base)

The base component for all input elements. Contains documentation about common props, events, and behavior shared by 
all input components.

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

The message row every input renders: errors when there are any, the hint otherwise. Usable on its own for a group's
errors.

### [**df-rtf-editor**](./df-rtf-editor)

A RTF editor input.

### [df-select](./df-select)

A component for selecting values from a list. The examples showcase:
- Basic usage with a static list
- Advanced features (multiple selection, AJAX loading, icons)
- Integration with DynamicForms

### [df-text-area](./df-text-area)

A component for multi-line text input.

## Integration Options

### [Using with vue-forms](:vue-forms:)

Examples of integrating Vuetify input fields with the `@dynamicforms/vue-forms` library. 

### [Validation](./validators)

Various ways to validate input fields.

### [Localisation](./localisation)

The library's own English strings and how to translate them, and the date-fns locale `<df-date-time>` formats and
parses with.

### [Groups](./groups)

Validation errors that belong to a whole section, and conditions that show or hide one.
