# Density and Variant Demo

The demo renders every input component under every density and variant, for checking vertical alignment in tables
and grid layouts.

## Interactive Demo

<density-demo/>

## Features Demonstrated

- **Vertical alignment**: components of different types on one row are aligned
- **Density**: each density (default, compact, comfortable, inline) applies to all components the same way
- **Variant**: every Vuetify variant applies to all components

## Density Options

- **default**: Vuetify's default spacing
- **comfortable**: Vuetify's reduced spacing
- **compact**: Vuetify's smallest spacing
- **inline**: this library's density for inputs inside table cells. It hides the outline and the floating label and
  removes the margins and padding of the remaining elements.

## Variant Options

- **outlined**: Components with visible borders
- **filled**: Components with filled backgrounds
- **underlined**: Components with bottom borders only
- **plain**: Minimal styling with no backgrounds or borders
- **solo**: Elevated appearance with shadows
- **solo-inverted**: Inverted solo variant
- **solo-filled**: Filled solo variant

## Support for setting variant and density on groups of inputs

Every input component takes `variant` and `density` props, and also reads them from the sources below, in descending
priority:

- props: a component with `variant` and/or `density` props uses exactly those values
- the bound element: a `control`'s `density` and `variant` [extended
  properties](/examples/input-base#presentation-carried-by-the-element)
- provide: any ancestor component may `provide` `'field-variant'` and/or `'field-density'`
- global defaults, set when installing the library:
  `app.use(DynamicFormsInputs, { defaultVariant: 'your variant', defaultDensity: 'your density' })`
- built-in defaults:
  - density: `'default'`
  - variant: `'underlined'`

<script setup>
import DensityDemo from '../components/density-demo.vue';
</script>
