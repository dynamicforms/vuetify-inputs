# Configuration

`app.use(DynamicFormsInputs, options)` provides the library's settings to the whole application and registers the
components the options select. Per-field values are resolved by the order described below.

[Density](/examples/density) shows every density and variant combination in a live demo.

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

The options argument and every option in it are optional: `app.use(DynamicFormsInputs)` keeps the built-in defaults. The type is `DynamicFormsInputsOptions`, which is `VuetifyInputsSettings` (the default
settings) plus the two registration flags.

| Option | Type | Default | Description |
|---|---|---|---|
| `registerComponents` | `boolean` | `false` | Registers this library's input components globally |
| `registerVuetifyComponents` | `boolean` | `false` | Registers the Vuetify components the library's templates use |
| `defaultDensity` | `FieldDensity` | unset, so `'default'` applies | Application-wide density for all fields |
| `defaultVariant` | `FieldVariant` | unset, so `'underlined'` applies | Application-wide variant for all fields |
| `defaultTouchInterval` | `number` | unset, so `60000` applies | Milliseconds between `<df-file>`/`<df-image>` keep-alive touches, application-wide |
| `shownErrors` | `(error, control, shownByDefault) => boolean` | unset, so the default rule applies | Whether a component shows an error. Called for each error with the default rule's result; its return value is used. See [Shown errors](/examples/input-base#shown-errors) |
| `errorText` | `ErrorText`: `(error: ErrorDescription) => RenderContentNonCallable \| undefined` | unset | The content an error renders as: a string, an `MdString` for markdown, an `HtmlString` for HTML or a `SimpleComponentDef` for a component. `undefined` renders the error's `detail`. It runs while the errors are rendered, and what it reads reactively is tracked. See [Translating errors](/examples/localisation#translating-errors) |

`FieldDensity` is `'default' | 'comfortable' | 'compact' | 'inline'`, `FieldVariant` is
`'outlined' | 'plain' | 'underlined' | 'filled' | 'solo' | 'solo-inverted' | 'solo-filled'`.

The options are provided to the application under the library's settings key, and every field reads
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
| `DfImage` | `<df-image>` | [df-image](/examples/df-image) |
| `DfInput` | `<df-input>` | [df-input](/examples/df-input) |
| `DfInputHint` | `<df-input-hint>` | [df-input-hint](/examples/df-input-hint) |
| `DfLabel` | `<df-label>` | [input base: Label](/examples/input-base#label) |
| `DfRtfEditor` | `<df-rtf-editor>` | [df-rtf-editor](/examples/df-rtf-editor) |
| `DfSelect` | `<df-select>` | [df-select](/examples/df-select) |
| `DfTextArea` | `<df-text-area>` | [df-text-area](/examples/df-text-area) |

Without the flag, the components are imported in the files that use them:

```typescript
import { DfInput, DfSelect } from '@dynamicforms/vuetify-inputs';
```

### What `registerVuetifyComponents` registers

The library's templates reference Vuetify components by tag name (`<v-text-field>`, `<v-select>`, `<v-menu>`, ...),
resolved against globally registered components at runtime. An application that installs Vuetify with its full
component set has them registered. One that registers Vuetify components selectively sets
`registerVuetifyComponents: true`, and the plugin registers the set the library uses:

`VAutocomplete`, `VBtn`, `VBtnGroup`, `VBtnToggle`, `VCard`, `VCardActions`, `VCheckbox`, `VChip`, `VCol`,
`VColorPicker`, `VCombobox`, `VConfirmEdit`, `VDatePicker`, `VDivider`, `VField`, `VFileInput`, `VIcon`, `VImg`,
`VInput`, `VList`, `VListItem`, `VListItemTitle`, `VMenu`, `VNumberInput`, `VProgressLinear`, `VRow`, `VSelect`,
`VSwitch`, `VTextarea`, `VTextField`, `VTimePicker`.

The same set is exported as `VuetifyComponents`, for registering it under names of the application's choice:

```typescript
import { VuetifyComponents } from '@dynamicforms/vuetify-inputs';

Object.entries(VuetifyComponents).map(([name, component]) => app.component(name, component));
```

## The stylesheet

```typescript
import '@dynamicforms/vuetify-inputs/styles.css';
```

The stylesheet is a single file with every style the components need beyond Vuetify's own:

- the margins that keep fields of different types on one baseline. Each density and variant combination sets its own
  offsets through CSS variables on `.v-field`, so a text field, a select and a checkbox on the same row are aligned.
- the `inline` density, which Vuetify does not have. The rules under `.df-density-inline` hide field outlines and
  floating labels and reduce padding and minimum heights to fit a table cell.
- the `invisible` class for the visibility `'invisible'`: it hides an element and keeps its box. Vuetify has `d-none`,
  used for `'hidden'`, but no class that keeps the box.
- the components' own styles: the `df-actions` button group, the multi-row select, label layout, the cached-icon
  wrapper, and the RTF editor's toolbar and content area, styled to follow the application's Vuetify theme.

Each component puts its resolved density on its root element as `df-density-default`, `df-density-comfortable`,
`df-density-compact` or `df-density-inline`, and the rules above select by those classes. Without the import, fields
render unaligned and `inline` density renders like `default`.

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

The density is the first value that is set, in this order: the component's `density` prop, the `density` among the
bound element's [extended properties](/examples/input-base#presentation-carried-by-the-element), a `field-density`
provided by any ancestor, `defaultDensity` from the plugin options, and `'default'`. The order for variant is the same
and ends in `'underlined'`: the tag, then the field, then the section, then the application.

A section, e.g. a dialog's form or a table's rows, sets its own values with `provide`:

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

Every field below that `provide` renders inline and plain, except the checkbox, whose prop sets `compact`.

The provided values are plain strings, not refs. They are read once, when the field's setup runs, so the `provide`
must precede the field's creation; a `provide` in an ancestor's setup does, since its children are created afterwards.
A value provided or changed later does not apply to existing fields.

## Summary

| Where | How | Applies to | Takes precedence over |
|---|---|---|---|
| Component | `density` / `variant` prop | that one field | everything below |
| Ancestor component | `provide('field-density' / 'field-variant', value)` | the subtree below it | plugin options |
| Plugin install | `defaultDensity` / `defaultVariant` option | the whole application | the baked-in values |
| Built in | — | anything left unset | — (`'default'` and `'underlined'`) |

The settings key itself is exported as `vuetifyInputsSettingsKey`, so a subtree may provide a whole
`VuetifyInputsSettings` object of its own, which replaces the plugin's settings for the fields under it. For density and
variant alone, `field-density` and `field-variant` are shorter.

The per-field props and the rest of the props every component shares are documented in
[input base](/examples/input-base).
