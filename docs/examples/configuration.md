# Configuration

An application states the look of its fields once, when it installs the plugin. `app.use(DynamicFormsInputs, options)`
provides the library's settings to the whole application, and registers the components you ask it to register.
Everything else is per-field, and comes out of the defaults cascade described below.

This page is about configuration. For what the density and variant values look like on screen, and for a live demo of
every combination, see [density](/examples/density).

## Installing the plugin

```typescript
import { DynamicFormsInputs } from '@dynamicforms/vuetify-inputs';
import '@dynamicforms/vuetify-inputs/styles.css';

const app = createApp(MyApp);
app.use(vuetify);
app.use(DynamicFormsInputs, {
  registerComponents: true,
  registerVuetifyComponents: false,
  defaultDensity: 'compact',
  defaultVariant: 'outlined',
  defaultTouchInterval: 90_000,
});
```

The options argument is optional, and so is every option in it: `app.use(DynamicFormsInputs)` is valid and leaves the
baked-in defaults in place. The type is `DynamicFormsInputsOptions`, which is `VuetifyInputsSettings` (the default
settings) plus the two registration flags.

| Option | Type | Default | Description |
|---|---|---|---|
| `registerComponents` | `boolean` | `false` | Registers this library's input components globally |
| `registerVuetifyComponents` | `boolean` | `false` | Registers the Vuetify components the library's templates use |
| `defaultDensity` | `FieldDensity` | unset, so `'default'` applies | Application-wide density for all fields |
| `defaultVariant` | `FieldVariant` | unset, so `'underlined'` applies | Application-wide variant for all fields |
| `defaultTouchInterval` | `number` | unset, so `60000` applies | Milliseconds between `<df-file>`/`<df-image>` keep-alive touches, application-wide |

`FieldDensity` is `'default' | 'comfortable' | 'compact' | 'inline'`, `FieldVariant` is
`'outlined' | 'plain' | 'underlined' | 'filled' | 'solo' | 'solo-inverted' | 'solo-filled'`.

Whatever you pass is provided to the application under the library's settings key, and every field reads
`defaultDensity` and `defaultVariant` from it.

### What `registerComponents` registers

With `registerComponents: true` the plugin registers each of the library's components under its exported name. Vue
resolves those names in kebab-case as well, which is how the examples in this documentation write them:

| Registered name | Written in a template as | Documentation |
|---|---|---|
| `DfActions` | `<df-actions>` | [df-actions](/examples/df-actions) |
| `DfCheckbox` | `<df-checkbox>` | [df-checkbox](/examples/df-checkbox) |
| `DfColor` | `<df-color>` | [df-color](/examples/df-color) |
| `DfDateTime` | `<df-date-time>` | [df-date-time](/examples/df-datetime) |
| `DfFile` | `<df-file>` | [df-file](/examples/df-file) |
| `DfInput` | `<df-input>` | [df-input](/examples/df-input) |
| `DfInputHint` | `<df-input-hint>` | [df-input-hint](/examples/df-input-hint) |
| `DfRtfEditor` | `<df-rtf-editor>` | [df-rtf-editor](/examples/df-rtf-editor) |
| `DfSelect` | `<df-select>` | [df-select](/examples/df-select) |
| `DfTextArea` | `<df-text-area>` | [df-text-area](/examples/df-text-area) |

Leave the flag off and import the components you need in the files that use them:

```typescript
import { DfInput, DfSelect } from '@dynamicforms/vuetify-inputs';
```

### What `registerVuetifyComponents` registers

The library's templates reference Vuetify components by tag name — `<v-text-field>`, `<v-select>`, `<v-menu>` and so on
— and those tags are resolved against globally registered components at runtime. An application that installs Vuetify
with its full component set already has them. One that registers Vuetify components selectively can set
`registerVuetifyComponents: true` and have the plugin register exactly the set the library uses:

`VAutocomplete`, `VBtn`, `VCheckbox`, `VChip`, `VCol`, `VColorPicker`, `VCombobox`, `VConfirmEdit`, `VDatePicker`,
`VField`, `VFileInput`, `VIcon`, `VImg`, `VInput`, `VListItem`, `VMenu`, `VNumberInput`, `VProgressLinear`, `VRow`,
`VSelect`, `VSwitch`, `VTextarea`, `VTextField`, `VTimePicker`.

The same set is exported as `VuetifyComponents`, so you can register it yourself if you want control over the names:

```typescript
import { VuetifyComponents } from '@dynamicforms/vuetify-inputs';

Object.entries(VuetifyComponents).map(([name, component]) => app.component(name, component));
```

## The stylesheet

```typescript
import '@dynamicforms/vuetify-inputs/styles.css';
```

The stylesheet is a single file and carries everything the components need beyond Vuetify's own styles:

- the margin arithmetic that keeps fields of different types on one baseline. Each density and variant combination
  contributes its own offsets through CSS variables on `.v-field`, which is what makes a text field, a select and a
  checkbox on the same row line up.
- the `inline` density. Vuetify has no such density, so the rules under `.df-density-inline` produce it: field outlines
  and floating labels are hidden, padding and minimum heights are cut to what a table cell can hold.
- the `invisible` class for `DisplayMode.INVISIBLE`. Vuetify ships `d-none` for `HIDDEN`, but nothing that hides an
  element while keeping its box, and that distinction is the point of the two modes.
- the components' own styles: the `df-actions` button group, the multi-row select, label layout, the cached-icon
  wrapper, and the RTF editor's toolbar and content area, styled to follow the application's Vuetify theme.

Each component puts its resolved density on its root element as `df-density-default`, `df-density-comfortable`,
`df-density-compact` or `df-density-inline`, and the rules above key off those classes. Without the import, fields still
render, but nothing aligns and `inline` density looks like `default`.

## Where density and variant come from

Both values are resolved the same way, in one place, when the field is created:

```typescript
const injectedDensity = inject<FieldDensity | null>('field-density', null);
const injectedVariant = inject<FieldVariant | null>('field-variant', null);
const extra = computed(() => props.control?.extra ?? {});

const density = computed(
  () => props.density ?? extra.value.density ?? injectedDensity ?? settings.defaultDensity ?? 'default',
);
const variant = computed(
  () => props.variant ?? extra.value.variant ?? injectedVariant ?? settings.defaultVariant ?? 'underlined',
);
```

So a `density` prop on the component wins over everything; failing that, the `density` the bound element carries
among its [extended properties](/examples/input-base#presentation-carried-by-the-element); failing that, a
`field-density` provided by any ancestor; failing that, `defaultDensity` from the plugin options; and failing that,
`'default'`. The chain for variant is identical and ends in `'underlined'`. The order runs from the most specific
statement to the least: the tag, then the field, then the section, then the application.

A section that wants its own look provides the values, which is what a dialog does for its form and a table does for its
rows:

```vue
<template>
  <tr>
    <td><df-input :control="row.fields.name" /></td>
    <td><df-select :control="row.fields.country" :choices="countries" /></td>
    <td><df-checkbox :control="row.fields.active" density="compact" /></td>
  </tr>
</template>

<script setup lang="ts">
import { provide } from 'vue';

provide('field-density', 'inline');
provide('field-variant', 'plain');
</script>
```

Every field below that `provide` renders inline and plain, except the checkbox, whose prop states otherwise.

Provide plain strings, not refs: the value is taken as it is. It is also read once, when the field's setup runs, so the
`provide` has to be in place before the field is created — an ancestor providing in its own setup satisfies that, since
its children are created afterwards. A value provided or changed later does not reach fields that already exist.

## Summary

| Where | How | Applies to | Beats |
|---|---|---|---|
| Component | `density` / `variant` prop | that one field | everything below |
| Ancestor component | `provide('field-density' / 'field-variant', value)` | the subtree below it | plugin options |
| Plugin install | `defaultDensity` / `defaultVariant` option | the whole application | the baked-in values |
| Baked in | — | anything left unstated | — (`'default'` and `'underlined'`) |

The settings key itself is exported as `vuetifyInputsSettingsKey`, so a subtree may provide a whole
`VuetifyInputsSettings` object of its own and replace the plugin's defaults for the fields under it. For a section of a
form, `field-density` and `field-variant` are the shorter way to say the same thing.

The per-field props and the rest of the props every component shares are documented in
[input base](/examples/input-base).
