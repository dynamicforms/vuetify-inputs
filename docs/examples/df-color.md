# df-color Component

`df-color` is a hex color field with a swatch and Vuetify's color picker.

## Basic Usage

`df-color` bound to a vue-forms field:

<color-basic/>

## Features

- Binds a `@dynamicforms/vue-forms` element, a `v-model`, or neither
- Vuetify's color picker in a menu
- Hex color input
- A swatch of the current color
- Built-in hex format check for the uncontrolled (v-model) case, reported as an `invalid_hex_color` error
- Clearing the value under `allowNull`

## Picking a value

A color chosen in the picker is written to the field when it is confirmed: with OK, or with a double-click on the
color area. Cancel and closing the menu leave the field as it was. A confirmed color marks the field
touched. A value typed into the field is written as it is typed.

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| allowNull | `boolean` | `false` | Whether to allow null (empty) values |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:
- `control` - DynamicForms field object
- `modelValue` - The color value in hex format
- `label` - Input label
- `hint` - Hint text
- And more...

## Color Format

The component accepts and outputs color values in hex format (e.g., `#FF0000` for red). It also supports the 
alpha channel (e.g., `#FF0000FF`).

## Validation

Without a `control`, the component checks the format of the value itself. It accepts a string of 3, 4, 6 or 8
hexadecimal digits with an optional leading `#`: `#f00`, `f00`, `#ff0000`, `#ff0000ff` and `ff0000ff` all pass. An
empty value passes only when `allowNull` is set. Any other value gets an error of code `invalid_hex_color` with the
detail `Not a valid hex string.`, shown once the field is touched and rendered like any other error
(see [Translating errors](/examples/localisation#translating-errors)).

With a bound `control`, the component does not check the value; the field's validators do:

```javascript
const colorField = new Field({
  value: '#FF0000',
  validators: [
    new Validators.Validator((value) => {
      if (value && !value.startsWith('#')) {
        return [new ValidationError('hash_prefix', {}, 'Color must start with #')];
      }
      return null; // Return null for valid values
    })
  ]
});
```

## Events

This component emits all [common events from InputBase](./input-base):
- `update:modelValue` - When the color value changes

## Example: Custom Validation

```vue
<template>
  <df-color
    :control="colorField"
    label="Brand Color"
    hint="Select a color from the brand palette"
  />
</template>

<script setup>
import { Field, ValidationError, Validators } from '@dynamicforms/vue-forms';
import { DfColor } from '@dynamicforms/vuetify-inputs';

// Valid brand colors
const brandColors = ['#C41E3A', '#1B4D3E', '#0F52BA', '#FFA500'];

const colorField = new Field({
  value: '#C41E3A',
  validators: [
    new Validators.Validator((value) => {
      if (!value) return null;
      if (!brandColors.includes(value)) {
        return [new ValidationError('not_brand_color', { allowedValues: brandColors }, 'Please select a color from the brand palette')];
      }
      return null;
    })
  ]
});
</script>
```

<script setup>
import ColorBasic from '../components/color-basic.vue';
</script>
