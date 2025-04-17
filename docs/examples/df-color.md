# df-color Component

The df-color component provides a color selection field that integrates with both Vuetify and DynamicForms. It offers 
a visual color picker interface with hex color input support.

## Basic Usage

Below is an example of the df-color component used with DynamicForms:

<color-basic/>

## Features

- Integration with `@dynamicforms/vue-forms` for state management and validation
- Visual color picker interface based on Vuetify's color picker
- Support for hex color input
- Visual color indicator preview
- Validation for proper hex color format
- Support for clearing the color value

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

The component includes built-in validation for proper hex color format. By default, it validates that the value is:

1. A valid hex color string
2. Has the correct format (#RRGGBB or #RRGGBBAA)

You can extend this validation by adding custom validators to the DynamicForms Field:

```javascript
const colorField = Field.create({
  value: '#FF0000',
  validators: [
    {
      validate: (value) => {
        // Your custom validation logic
        if (value && !value.startsWith('#')) {
          return 'Color must start with #';
        }
        return null; // Return null for valid values
      }
    }
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
import { Field } from '@dynamicforms/vue-forms';
import { DfColor } from '@dynamicforms/vuetify-inputs';

// Valid brand colors
const brandColors = ['#C41E3A', '#1B4D3E', '#0F52BA', '#FFA500'];

const colorField = Field.create({
  value: '#C41E3A',
  validators: [
    {
      validate: (value) => {
        if (!value) return null;
        if (!brandColors.includes(value)) {
          return 'Please select a color from the brand palette';
        }
        return null;
      }
    }
  ]
});
</script>
```

<script setup>
import ColorBasic from '../components/color-basic.vue';
</script>
