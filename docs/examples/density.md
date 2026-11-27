# Density and Variant Demo

The demo renders every input component under every density and variant, for checking vertical alignment in tables
and grid layouts.

## Interactive Demo

<density-demo/>

## Features Demonstrated

- **Vertical alignment**: components of different types on one row are aligned
- **Density**: each density (default, compact, comfortable, inline) applies to all components the same way
- **Variant**: every Vuetify variant applies to all components
- **Fields with a hint**: on a row whose columns stretch their fields to the row's height, a field's hint or errors
  make the row taller and the controls of all fields stay level

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
- **solo-inverted**: Solo variant whose colours invert while focused
- **solo-filled**: Filled solo variant
- **inverted**: `solo-inverted` with the colours inverted always, not only while focused. Focus shows as in `solo`:
  the label is at full opacity. Rendered as Vuetify's `solo` with `bg-color="surface-variant"`. `df-checkbox` has no
  field and renders as in every other variant

## Where density and variant come from

The order in which a field's density and variant are resolved is described under
[Where density and variant come from](/examples/configuration#where-density-and-variant-come-from).

<script setup>
import DensityDemo from '../components/density-demo.vue';
</script>
