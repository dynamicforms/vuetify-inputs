# InputBase Component

InputBase is the foundation component used by all input components in the `@dynamicforms/vuetify-inputs` library. 
It provides common functionality and properties that are available to all input components.

## Common Properties (Props)

All input components inherit the following properties:

| Property         | Type                  | Default             | Description                                                                                 |
|------------------|-----------------------|---------------------|---------------------------------------------------------------------------------------------|
| control          | `FieldBase`           | `undefined`         | [vue-forms](:vue-forms:) field object for state management integration                      |
| modelValue       | `any`                 | component dependent | The field value (v-model) when used without control                                         |
| label            | `string \| Label \| MdString` | `''`        | Input field label. supports icons by creating a Label class (see below)                     |
| hint             | `string`              | `''`                | Hint text displayed below the input field                                                   |
| helpText         | `string`              | `''`                | Additional help text                                                                        |
| placeholder      | `string`              | `''`                | Placeholder text displayed when the input is empty                                          |
| errors           | `string[]`            | `[]`                | List of errors (used only without control)                                                  |
| enabled          | `boolean`             | `true`              | Whether the input field is enabled                                                          |
| visibility       | `DisplayMode`         | `FULL`              | Component visibility mode (FULL, HIDDEN, INVISIBLE, SUPPRESS), see [Display Modes](#display-modes) |
| cssClass         | `string`              | `''`                | Additional CSS classes                                                                      |
| clearable        | `boolean`             | `true`              | Whether the value can be cleared                                                            |
| passthroughAttrs | `Record<string, any>` | `undefined`         | Additional attributes to pass through to the underlying Vuetify component                   |
| variant          | `FieldVariant`        | `'underlined'`      | Input field variant (outlined, filled, underlined, plain, solo, solo-inverted, solo-filled) |
| density          | `FieldDensity`        | `'default'`         | Input field density (default, comfortable, compact, inline)                                 |

### Density

```typescript
export type VuetifyDensity = 'default' | 'comfortable' | 'compact';
export type FieldDensity = 'default' | 'comfortable' | 'compact' | 'inline';
```

Inline density is an additional density to Vuetify standard densities which tries to hide excessive elements and reduce
margins & padding for the remaining elements such that size of the control becomes as small as possible.

#### Support for setting variant and density on groups of inputs

All input components in this suite will take props for setting variant and density, but they support mass-assignment as
well. Here's a list in descending priority:

- props: any component that has variant and/or density set via props will have exactly those values
- provide: any parent component may `provide` `'field-variant'` and/or `'field-density'`. If they are set and not
  overridden by specifying props, they will be used.
- specify global defaults when installing the library:
  `app.use(DynamicFormsInputs, { defaultVariant: 'your variant', defaultDensity: 'your density' })`
- baked-in defaults (when nothing is specified):
    - density: `'default'`
    - variant: `'underlined'`

See [demo](./density.md) to see how densities render for individual variants.

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: any` | Triggered when the value changes (when used without control) |
| click:clear | - | Triggered when the clear button is clicked |

## Display Modes

Every input component applies the display mode to its own root element:

- `FULL`: the component renders normally and is available for interaction
- `HIDDEN`: the root element gets the `d-none` class, so the component is not displayed and takes up no space
- `INVISIBLE`: the root element gets the `invisible` class, so the component is not painted but still takes up its space
  in the layout
- `SUPPRESS`: the root element is not rendered in the DOM at all

The mode comes from the `control` when one is bound: `control.visibility` takes precedence over the `visibility` prop,
which serves as the value when the component is used without a control. When neither is given, the mode is `FULL`. A
`ConditionalVisibilityAction` registered on the control therefore shows and hides the input on its own, with no `v-if`
in the template.

## Label

Component label may be provided as a string (just like in Vuetify). Alternatively you may choose to add an icon, 
in which case you provide a Label class, e.g. new Label('my label text', 'mdi-abacus'). This will show abacus icon next
to the text.

declaration of the Label class:
```typescript
export class Label {
  constructor(
    public text: string, 
    public icon?: string, 
    public iconComponent: string = 'v-icon'
  ) {}
}
```

Supported icon types are `v-icon`, `v-img` and any other component which takes a single `src: string` parameter.
If you need multiple parameters for your component, wrap it such that the `src` parameter is a JSON serialized string.

## Integration with DynamicForms forms

Each component can be integrated with the DynamicForms state management system via the `control` property:

```vue
<template>
  <df-input
    :control="form.fields.name"
    label="Name"
    hint="Enter your name"
  />
</template>

<script setup>
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfInput } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  name: new Field({ value: '' })
});
</script>
```

## Usage Without DynamicForms

Components can also be used standalone with v-model:

```vue
<template>
  <df-input
    v-model="name"
    label="Name"
    hint="Enter your name"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfInput } from '@dynamicforms/vuetify-inputs';

const name = ref('');
</script>
```

## Appearance and Behavior

InputBase uses Vuetify components and follows Vuetify guidelines for appearance and behavior. All components have a 
consistent user experience with:

- Field label display
- Error handling and error message display
- Responsive design
- Support for value clearing
- Support for disabled and read-only modes
