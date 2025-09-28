# Density and Variant Demo

This demo showcases how all input components behave consistently across different density and variant settings.
It's particularly useful for verifying vertical alignment and visual consistency when components are used in tables
or grid layouts.

- **Table Integration**: When inputs need to be embedded in data tables
- **Form Grids**: Creating consistent form layouts with multiple input types
- **Design System Validation**: Ensuring visual consistency across the component library
- **Accessibility Testing**: Verifying that different density levels maintain usability

## Interactive Demo

<density-demo/>

## Features Demonstrated

- **Vertical Alignment**: All components align perfectly regardless of their type
- **Density Consistency**: Each density level (default, compact, comfortable) affects all components uniformly
- **Variant Support**: All Vuetify variants work consistently across components
- **Visual Harmony**: Components maintain visual consistency when used together

## Density Options

- **default**: Standard Vuetify density with normal spacing
- **compact**: Reduced vertical spacing for denser layouts
- **comfortable**: Increased spacing for better accessibility
- **inline**: Minimum exposure for use in e.g. table inline inputs

Inline density is an additional density to Vuetify standard densities which tries to hide excessive elements and reduce
margins & padding for the remaining elements such that size of the control becomes as small as possible.

## Variant Options

- **outlined**: Components with visible borders
- **filled**: Components with filled backgrounds
- **underlined**: Components with bottom borders only
- **plain**: Minimal styling with no backgrounds or borders
- **solo**: Elevated appearance with shadows
- **solo-inverted**: Inverted solo variant
- **solo-filled**: Filled solo variant

## Support for setting variant and density on groups of inputs

All input components in this suite will take props for setting variant and density, but they support mass-assignment as 
well. Here's a list in descending priority:

- props: any component that has variant and/or density set via props will have exactly those values
- provide: any parent component may `provide` `'field-variant'` and/or `'field-density'`. If they are set and not 
  overridden by specifying props, they will be used.
- specify global defaults when installing the library: 
  `app.use(DynamicFormsInputs, { defaultVariant: 'your variant', defaultDensity: 'your density' })`
- baked-in defaults:
  - density: `'default'`
  - variant: `'underlined'`

<script setup>
import DensityDemo from '../components/density-demo.vue';
</script>
