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
- Built-in hex format check for the uncontrolled (v-model) case, reported as a `vuetify-inputs.invalid_hex_color` error
  (`vuetify-inputs.invalid_opaque_hex_color` under `alpha: false`)
- Colors with or without an alpha channel (`alpha`)
- Mapping of the chosen color to the stored value (`normalize`)
- A `preview` event with the pending color while the picker is open
- A hexagon palette of OKLCH colors in place of Vuetify's picker (`picker="hexagon"`)
- Clearing the value under `allowNull`

## Picking a value

A color chosen in the picker is written to the field when it is confirmed: with OK, or with a double-click on the
color area. Cancel and closing the menu leave the field as it was. A confirmed color marks the field
touched. A value typed into the field is written as it is typed.

The menu is as wide as the picker, independent of the width of the field.

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| allowNull | `boolean` | `false` | Whether to allow null (empty) values |
| alpha | `boolean` | `true` | Whether the color has an alpha channel. `true`: the picker runs in `hexa` mode with the alpha slider. `false`: the picker runs in `hex` mode, offers only the `hex`, `rgb` and `hsl` modes, has no alpha slider, and the format check accepts only 3 or 6 hex digits |
| normalize | `(value: string) => string` | `undefined` | Maps a valid color to the value the component stores and shows (see [Normalizing the color](#normalizing-the-color)) |
| picker | `'generic' \| 'hexagon'` | `'generic'` | The picker in the menu: `'generic'` is Vuetify's color picker, `'hexagon'` the [hexagon palette](#hexagon-palette) |
| hexagonRings | `number` | `5` | The number of rings of the hexagon palette, the centre cell counted as the first: `1 + 3·n·(n − 1)` cells (3 → 19, 4 → 37, 5 → 61) |
| lightnessLevels | `number \| number[]` | `undefined` | The OKLCH lightness (0..1) the hexagon palette offers: the full range, `n` evenly spaced levels, or the given levels (see [Lightness](#lightness)) |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:

- `control` - DynamicForms field object
- `modelValue` - The color value in hex format
- `label` - Input label
- `hint` - Hint text
- And more...

## Color Format

The component accepts and outputs color values in hex format (e.g., `#FF0000` for red). With `alpha` (the default) it
also supports the alpha channel (e.g., `#FF0000FF`); with `alpha: false` the value has no alpha channel.

## Hexagon palette

With `picker="hexagon"` the menu shows a palette of hexagon cells in place of Vuetify's color picker. The cells
of one lightness are shown at a time:

- the centre cell is the grey (OKLCH chroma 0) of the lightness;
- ring `r` holds `6·r` cells; ring `r` starts `r` cells up and to the left of the centre and runs clockwise. Cell `i`
  of side `a` (0..5) has the hue `(a + i/r) / 6 × 360°`;
- a cell of ring `r` has the chroma `r / (hexagonRings − 1)` of the largest chroma its hue has inside sRGB at the
  lightness, so the outer ring holds the most saturated color of each hue. At lightness 0 every cell is black, at 1
  every cell is white.

A cell's color is written as `#rrggbb`. A click on a cell makes it the pending color; OK writes it, Cancel leaves the
field as it was, and a double-click on a cell writes it at once. `normalize` and `preview` apply to the cells as to
the generic picker. When the menu opens, the palette marks the cell nearest to the value by OKLab distance.

### Lightness

`lightnessLevels` sets the lightness the palette offers, and the control under the palette that selects it:

| `lightnessLevels` | Levels | Control |
|-------------------|--------|---------|
| `undefined` (default), an empty array, or a number that is not an integer of at least 1 | any lightness from 0 to 1 | a slider over a black-to-white gradient of the centre grey |
| `1` | the single level 0.5 | none |
| an integer `n` ≥ 2 | `n` levels evenly spaced from 0 to 1, both included (`6` → 0, 0.2, 0.4, 0.6, 0.8, 1) | see below |
| an array | the given levels, sorted ascending | see below |

Between 2 and 15 levels are a row of square buttons, one per level and filled with the level's grey. The levels share
the width of the palette in equal columns; each square is as wide as its column but no higher than a cell of the
palette, and is centred in its column. 16 or more levels are a single bar of contiguous segments, one per level and
filled with the level's grey, at most as high as a cell. Both are a `radiogroup` with the selected level outlined. A
click selects a level; the arrow keys select the neighbouring level and Home and End the first and the last one.

When the menu opens, the palette shows the exact OKLCH lightness of the value on the slider, or the level nearest to
it. A change of the lightness moves a selected cell to the same place at the new lightness, so the pending color
follows the slider or the level.

### Accessibility

The palette is a `radiogroup` of `radio` cells, each labelled with its hex value. The arrow keys move the focus
between neighbouring cells, and Enter or Space makes the focused cell the pending color. The labels are the library's
strings (see [The strings the library owns](/examples/localisation#the-strings-the-library-owns)): `ColorPalette`
for the palette, `LightnessRange` for the slider and the level selectors, and `Lightness` for a level button or
segment.

<color-hexagon/>

```vue
<df-color
  v-model="color"
  label="6 levels"
  picker="hexagon"
  :lightness-levels="6"
  @preview="previewColor = $event"
/>
```

Without `lightnessLevels` the same palette offers the full lightness range with a slider.

## Normalizing the color

`normalize` receives a color that passes the format check of the current `alpha` setting and returns the color the
component uses in its place:

- the swatch in the field shows `normalize(value)`;
- a color confirmed in the picker is written as `normalize(color)`;
- a color typed into the field is written as typed, and replaced with `normalize(value)` when the field loses focus or
  Enter is pressed;
- `preview` events carry `normalize(color)`.

The picker's own model keeps the color as the user picks it, so the handle stays under the pointer while dragging. A
value that does not pass the format check is not passed to `normalize`.

<color-normalize/>

```vue
<template>
  <df-color
    v-model="color"
    label="Web-safe color"
    :alpha="false"
    :normalize="webSafe"
    @preview="previewColor = $event"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DfColor } from '@dynamicforms/vuetify-inputs';

const color = ref('#336699');
const previewColor = ref<string | null>(null);

// rounds each channel to the nearest multiple of 0x33
function webSafe(value: string): string {
  let hex = value.replace('#', '');
  if (hex.length === 3) hex = [...hex].map((digit) => digit + digit).join('');
  const channels = [0, 2, 4].map((start) => Math.round(parseInt(hex.slice(start, start + 2), 16) / 0x33) * 0x33);
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
</script>
```

## Validation

Without a `control`, the component checks the format of the value itself. It accepts a string of 3, 4, 6 or 8
hexadecimal digits with an optional leading `#`: `#f00`, `f00`, `#ff0000`, `#ff0000ff` and `ff0000ff` all pass. An
empty value passes only when `allowNull` is set. Any other value gets an error of code
`vuetify-inputs.invalid_hex_color` with the detail `Not a valid hex string.`, shown once the field is touched and
rendered like any other error (see [Translating errors](/examples/localisation#translating-errors)).

Under `alpha: false` the component accepts only 3 or 6 hexadecimal digits with an optional leading `#`: `#f00`, `f00`,
`#ff0000` and `ff0000` pass, `#ff0000ff` does not. Any other value gets an error of code
`vuetify-inputs.invalid_opaque_hex_color` with the detail `Not a valid hex string without alpha.`

With a bound `control`, the component does not check the value; the field's validators do:

```javascript
const colorField = new Field({
  value: '#FF0000',
  validators: [
    new Validators.Validator((value) => {
      if (value && !value.startsWith('#')) {
        return [new ValidationError('app.hash_prefix', {}, 'Color must start with #')];
      }
      return null; // Return null for valid values
    })
  ]
});
```

## Events

This component emits all [common events from InputBase](./input-base):

- `update:modelValue` - When the color value changes

In addition:

| Event | Payload | Description |
|-------|---------|-------------|
| preview | `string \| null` | While the picker is open: the pending color, once when the picker opens and on every change in the picker; normalized when `normalize` is given. `null` when the picker closes, by OK, Cancel, a double-click or a click outside |

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
        return [new ValidationError('app.not_brand_color', { allowedValues: brandColors }, 'Please select a color from the brand palette')];
      }
      return null;
    })
  ]
});
</script>
```

<script setup>
import ColorBasic from '../components/color-basic.vue';
import ColorHexagon from '../components/color-hexagon.vue';
import ColorNormalize from '../components/color-normalize.vue';
</script>
