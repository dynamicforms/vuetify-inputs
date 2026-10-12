# InputBase Component

The common base of all input components in `@dynamicforms/vuetify-inputs`. This page documents its three parts: the
props every input takes, the `InputBase` component that hosts a control which is not a single Vuetify input, and the
`useInputBase()` composable that computes what the inputs bind.

## Common Properties (Props)

All input components inherit the following properties:

| Property         | Type                          | Default        | Description                                                                                        |
|------------------|-------------------------------|----------------|----------------------------------------------------------------------------------------------------|
| control          | `FieldBase<T>`                | `undefined`    | [vue-forms](:vue-forms:) field object for state management integration                             |
| modelValue       | `T`                           | `undefined`    | The field value (v-model) when used without control                                                |
| label            | `string \| Label \| MdString` | `undefined`    | Input field label. supports icons by creating a Label class (see below)                            |
| hint             | `string`                      | `undefined`    | Hint text displayed below the input field                                                          |
| helpText         | `string`                      | `undefined`    | Placed in `vuetifyBindings.helpText`, which no component renders; `df-select` reads its presence to set `aria-describedby` |
| placeholder      | `string`                      | `undefined`    | Placeholder text displayed when the input is empty                                                 |
| errors           | `string[]`                    | `undefined`    | List of errors (used only without control)                                                         |
| enabled          | `boolean`                     | `undefined`    | The input is enabled unless the prop is `false` (used only without control)                        |
| visibility       | `Visibility`                  | `undefined`    | `'full'`, `'invisible'`, `'hidden'` or `'suppress'`, see [Display Modes](#display-modes)           |
| cssClass         | `string`                      | `undefined`    | Additional CSS classes                                                                             |
| clearable        | `boolean`                     | `true`         | Whether the value can be cleared                                                                   |
| passthroughAttrs | `Record<string, any>`         | `undefined`    | Additional attributes to pass through to the underlying Vuetify component                          |
| variant          | `FieldVariant`                | `'underlined'` | Input field variant (outlined, filled, underlined, plain, solo, solo-inverted, solo-filled)        |
| density          | `FieldDensity`                | `'default'`    | Input field density (default, comfortable, compact, inline)                                        |

A prop that is left out is `undefined`, and [useInputBase()](#useinputbase) reads it as an empty string for the text
props and as an empty array for `errors`. `clearable` is defaulted by `defaultBaseProps`, which every component
spreads into its own `withDefaults`; `variant` and `density` fall back through inject and the plugin settings, as
described under [Density](#density).

When a `control` is bound, it is the source of the value, the touched flag, the errors, the validity, the enabled
state and the visibility. The `modelValue`, `errors`, `enabled` and `visibility` props are then ignored.

`clearable` is read where the field renders its own clear button: `df-date-time` passes the prop through to
`InputBase`, while `df-file` always renders the button. `df-select` and `df-color` render theirs from their own
`allowNull` prop. `df-rtf-editor` binds its whole prop set to `InputBase`, so the button is rendered, but the component
handles no `click:clear`; pressing it leaves the text unchanged.

### Presentation carried by the element

A bound `control` carries the presentation the component renders it with. `label`, `placeholder`, `helpText`,
`hint`, `cssClass`, `density` and `variant` are declared on
[`Extras`](:vue-forms:/api/field-base.html#extended-properties), the augmentation point of `@dynamicforms/vue-forms`,
so they are typed on every element in an application that installs this library, including fields written inline in
a `Group` declaration.

They are set where the field is declared:

```vue
<template>
  <df-input :control="form.fields.name" />
  <df-select :control="form.fields.country" :choices="countries" />
</template>

<script setup>
import { Field, Group } from '@dynamicforms/vue-forms';
import { DfInput, DfSelect } from '@dynamicforms/vuetify-inputs';

const form = new Group({
  name: new Field({ value: '', label: 'Full name', hint: 'As it appears on the document' }),
  country: new Field({ value: null, label: 'Country', density: 'compact' }),
});
</script>
```

They are extended properties: `setExtendedValues()` writes them later, and the read is tracked, so a label written
after the component rendered is rendered:

```typescript
form.fields.name.setExtendedValues({ label: 'Name as printed', cssClass: 'text-primary' });
```

**A prop takes precedence.** `<df-input :control="field" label="At the tag" />` renders the tag's label regardless
of the field's. For `density` and `variant` the element is second in the order, ahead of an injected
`field-density` / `field-variant` and the plugin defaults.

`enabled`, `visibility`, `errors` and the value are members of the element and are read from it, not from these
seven extended properties.

### Density

```typescript
export type VuetifyDensity = 'default' | 'comfortable' | 'compact';
export type FieldDensity = 'default' | 'comfortable' | 'compact' | 'inline';
```

`inline` is a density in addition to Vuetify's. It hides the outline and the floating label and removes the margins
and padding of the remaining elements, so the control takes the least space.

#### Support for setting variant and density on groups of inputs

Every input component takes `variant` and `density` props, and also reads them from the sources below, in
descending priority:

- props: a component with `variant` and/or `density` props uses exactly those values
- the bound element: a `control` carries `density` and `variant` among its
  [extended properties](#presentation-carried-by-the-element), and they apply where the props state nothing
- provide: any ancestor component may `provide` `'field-variant'` and/or `'field-density'`. They apply where neither
  the props nor the element set a value.
- global defaults, set when installing the library:
  `app.use(DynamicFormsInputs, { defaultVariant: 'your variant', defaultDensity: 'your density' })`
- baked-in defaults (when nothing is specified):
    - density: `'default'`
    - variant: `'underlined'`

The [demo](./density.md) renders every density under every variant.

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: T` | Triggered when the value changes. With a control bound, the argument is what the control holds after the write, which is not necessarily what was written |
| click:clear | - | Triggered when the clear button is clicked |

Both events are declared by `BaseEmits`, so every component accepts a listener for them. `click:clear` is emitted by
[InputBase](#the-inputbase-component); `df-date-time` and `df-file` host their control in it and handle the event
themselves, clearing the value and deleting the uploaded file respectively.

## Display Modes

Every input component applies the visibility to its own root element:

- `'full'`: the component renders normally
- `'invisible'`: the root element gets the `invisible` class; the component is not painted and keeps its space in the
  layout
- `'hidden'`: the root element gets the `d-none` class; the component is not displayed and takes no space
- `'suppress'`: the root element is not rendered in the DOM at all

Visibility is presentation only. Whether the bound element is sent and validated is set by its `access`, which the
component reads as `effectiveEnabled` to decide whether it accepts input; see
[what a container serializes](https://docs.velis.si/dynamicforms/vue-forms/api/container#what-a-container-serializes).

With a bound `control`, the visibility is `control.visibility` and the `visibility` prop is ignored. Without a
control it is the prop, and `'full'` when neither is given. A `ConditionalVisibilityAction` registered on the control
therefore shows and hides the input without a `v-if` in the template.

The prop takes one of the four strings, exactly as vue-forms spells them:

```vue
<df-input v-model="secret" label="Secret" visibility="hidden" />
```

Any other value (a misspelled or upper-case name, a number) throws an `Error` naming the value. The visibility is read
while the component renders, so the error is thrown during rendering.

## Shown errors

`errors` and `valid` on a vue-forms element are current from the first render, so a form opened empty is invalid at
once. The errors a component displays are a subset of them, `shownErrors`, selected by this rule:

- nothing where the bound element is sent nowhere (its `effectiveAccess` is `'disabled'`);
- an error whose [origin](https://docs.velis.si/dynamicforms/vue-forms/api/validators#origin) is `'server'`
  immediately, without the field being touched. Under vue-forms' default [`ErrorPolicy`](:vue-forms:/api/validators.html#errorpolicy), the field drops it when it is
  marked touched holding a value other than the one it held when the error was written;
- every other error (a validator's, or one the application wrote) once the field is touched. `form.touched = true`
  sets every member touched, which shows all errors, e.g. on a submit attempt.

Without a control, the errors come from the `errors` prop and are shown once the component is touched. Each string
becomes a `ValidationError` with an empty `code`, the string as its `detail` and the origin `'application'`.

What a shown error renders as is selected by its `code`; see
[df-input-hint](/examples/df-input-hint#rendering).

The application replaces the rule with a condition of its own through the
[`shownErrors` setting](/examples/configuration). It is called for each error with the rule's result and returns
whether the error is shown. An application-defined origin is handled there:

```typescript
app.use(DynamicFormsInputs, {
  // errors a sync with another tab reports are shown at once, everything else as the rule has it
  shownErrors: (error, control, shownByDefault) => error.origin === 'sync' || shownByDefault,
});
```

A template that renders errors of its own, e.g. a group's, selects them by the same rule with `useShownErrors`:

```typescript
import { useShownErrors } from '@dynamicforms/vuetify-inputs';

const formErrors = useShownErrors(form);   // ComputedRef<ValidationError[]>, tracked like every read
```

`selectShownErrors(errors, control, touched, settings)` is the rule itself, for code that has the settings in hand.

## passthroughAttrs

Every input takes `passthroughAttrs`. It is spread into `vuetifyBindings` last: a key the library computes is replaced
by the one given here, and any other key is added. The keys are those of the underlying Vuetify component.

```vue
<df-input
  v-model="email"
  label="Email"
  :passthrough-attrs="{ 'prepend-inner-icon': 'mdi-email', autocomplete: 'email', autofocus: true }"
/>
```

The hint is persistent by default; with this override it is shown only while the field has focus:

```vue
<df-input v-model="note" label="Note" hint="Keep it short" :passthrough-attrs="{ persistentHint: false }" />
```

`df-date-time`, `df-file` and `df-rtf-editor` do not bind `vuetifyBindings` to a single Vuetify input, so each of
them binds `passthroughAttrs` on the control it renders inside `InputBase`: the file input, the editor, and - in the
case of `df-date-time` - both the date and the time text field.

## Label

A label is a string, as in Vuetify, or a `Label` instance, which adds an icon: `new Label('my label text',
'mdi-abacus')` renders the `mdi-abacus` icon next to the text.

Declaration of the `Label` class:
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
A component that needs several parameters is wrapped in one that takes them as a JSON string in `src`.

## Integration with DynamicForms forms

Each component binds a vue-forms element through the `control` prop:

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

Each component also works with `v-model`:

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

## The InputBase component

`InputBase` is a component, exported from the package as `InputBase`. `df-date-time`, `df-file` and `df-rtf-editor`
are built on it: it renders the Vuetify field (label, hint, error state, clear button, loader), and the component
places its own control inside that field. The plugin's `registerComponents` option does not register it, so a template that uses it imports it.

It takes every prop from the [table above](#common-properties-props), plus one of its own:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| loading | `boolean` | `undefined` | Puts the field in its loading state, which is what the `loader` slot reports as `isActive` |

It emits `BaseEmits` plus one event of its own:

| Event | Arguments | Description |
|-------|-----------|-------------|
| click:clear | - | The clear button was clicked. The button is rendered only while `clearable` is set and the value is not empty |
| blur | - | The hosted control lost focus. `touched` is set to `true` before this is emitted, so a listener already reads the field as touched |

The root element is a `v-input`, rendered only when the visibility is not `'suppress'`, carrying the `name`,
`density`, `hint`, `persistent-hint`, `hide-details` and `errorMessages` bindings together with the `cssClass` prop
and the visibility classes. Its `message` slot renders `DfInputHint` with the errors of a touched field. Inside it, a
`v-field` carries the `variant`, `density`, `label` and `disabled` bindings, is `dirty` while there is a value or a
placeholder, is `active` while the hosted control has focus, and takes `loading` from the prop. The field's `label`
slot renders `DfLabel`, so an icon label and an `MdString` label render as on the components that bind a Vuetify
input directly. The density class is not applied here: the host binds `:class="densityClass"` on the
`InputBase` element itself.

### Slots

| Slot | Slot props | Description |
|------|------------|-------------|
| default | `props`, `isActive`, `isFocused`, `iconColor`, `controlRef`, `focus()`, `blur()` | The control that fills the field, wrapped in a full-width flex container whose styling neutralises the field's own overlay and outline |
| loader | `color`, `isActive` | Replaces the field's default indeterminate progress bar. It renders whether or not `loading` is set, and `isActive` reports which it is |
| prepend-inner | `isActive`, `isFocused`, `iconColor`, `controlRef`, `focus()`, `blur()` | Content inside the field, before the default slot. Rendered only when the slot is supplied |
| prepend | `id`, `messagesId`, `isDirty`, `isDisabled`, `isReadonly`, `isPristine`, `isValid`, `isValidating`, `hasDetails`, `reset()`, `resetValidation()`, `validate()` | Content outside the field, at the start of the input. Rendered only when the slot is supplied |

The hosted control calls the `focus()` and `blur()` functions of the default and `prepend-inner` slot props from its
own focus and blur events. `focus()` sets the field's focused state; `blur()` clears it, marks the field touched and
emits `blur`. If the control never calls them, the field is never shown focused and never marked touched, so the
errors that are shown once touched stay hidden.

`df-file` uses all three extra slots: a `v-progress-linear` in `loader`, driven by the upload
progress, a paperclip icon in `prepend-inner`, and its `v-file-input` in `default`, routing that input's focus and
blur into `slotProps.focus()` and `slotProps.blur()`. `df-date-time` puts one or two `v-text-field`s in `default` -
plain variant, no details and no clear button of their own - and routes their focus and blur the same way; the
outer field renders the label, the hint and one clear button for both.

```vue
<template>
  <input-base v-bind="props" :class="densityClass" @click:clear="value = null">
    <template #prepend-inner><v-icon icon="mdi-map-marker" /></template>
    <template #default="slotProps">
      <my-control v-model="value" @focus="slotProps.focus()" @blur="slotProps.blur()" />
    </template>
  </input-base>
</template>

<script setup lang="ts">
import { BaseEmits, BaseProps, defaultBaseProps, InputBase, useInputBase } from '@dynamicforms/vuetify-inputs';

const props = withDefaults(defineProps<BaseProps<string>>(), defaultBaseProps);

interface Emits extends BaseEmits<string> {}
const emits = defineEmits<Emits>();

const { densityClass, value } = useInputBase<string>(props, emits);
</script>
```

## useInputBase()

```typescript
function useInputBase<T = any>(
  props: BaseProps<T>,
  emit: BaseEmits<T>,
  componentErrors?: () => ValidationError[],
);
```

`useInputBase()` is the composable every component in this library calls. It is exported; a component outside the
library that calls it gets the same value, error, touched, density, variant and visibility handling.

It is called in `setup()` with the component's props object and its emit function. If `control` is given and is not a
vue-forms `FieldBase`, the call throws `Error('control prop is not a vue-form control instance')`, so the component
fails at mount.

`componentErrors` returns the errors the component finds in the value itself. They are added to the errors of the
`errors` prop where no `control` is bound; a bound control reports through its own validators. The function is read
inside a computed, so the reactive state it reads, such as `value`, is tracked:

```typescript
const { value, shownErrors } = useInputBase<string>(props, emits, () =>
  /^\d{4}$/.test(value.value ?? '') ? [] : [new ValidationError('invalid_year', {}, 'Not a year.', 'validator')],
);
```

### What it returns

| Member | Type | Description |
|--------|------|-------------|
| value | `WritableComputedRef<T>` | The value. Reads from the control, or from `modelValue`, or from an internal ref when neither is given. Writing writes the control, keeps the internal ref in step and emits `update:modelValue` with the value the control ended up holding |
| valid | `ComputedRef<boolean>` | `control.valid`, or `true` when there is no control |
| errors | `ComputedRef<ValidationError[]>` | `control.errors`, or the `errors` prop with each string wrapped in `new ValidationError('', {}, text, 'application')` |
| shownErrors | `ComputedRef<ValidationError[]>` | The errors to show now, see [Shown errors](#shown-errors). This is what gets bound to `DfInputHint` |
| enabled | `ComputedRef<boolean>` | `control.effectiveEnabled` — `false` where the element or any container above it is disabled — or `props.enabled !== false` when there is no control |
| visibility | `ComputedRef<Visibility>` | The resolved visibility, see [Display Modes](#display-modes) |
| isRendered | `ComputedRef<boolean>` | `false` only for `'suppress'`; it is the `v-if` on the component's root element |
| visibilityClass | `ComputedRef<{ 'd-none': boolean, invisible: boolean }>` | The class object for `'hidden'` and `'invisible'`, to bind on the root element |
| label | `ComputedRef<Label>` | The label as a `Label` instance: a `string` or `MdString` is wrapped, a `Label` is passed through |
| touched | `WritableComputedRef<boolean> \| Ref<boolean>` | Bound to `control.touched` when there is a control, a standalone ref otherwise. Components write `true` to it on blur, and on an edit that ends without a blur: `df-file` and `df-image` when an upload returns or the field is cleared, `df-date-time` when a value picked in its menu is saved or the field is cleared, `df-color` when a color picked in its menu is saved |
| density | `ComputedRef<FieldDensity>` | The `density` prop, then the control's `extra.density`, then the injected `field-density`, then the plugin's `defaultDensity`, then `'default'` |
| densityClass | `ComputedRef<string>` | `` `df-density-${density}` ``, to bind on the root element |
| vuetifyBindings | `ComputedRef<Record<string, any>>` | Everything to `v-bind` on the Vuetify input, see below |

`placeholder`, `helpText`, `hint`, `cssClass` and the resolved `variant` are not returned separately; they reach the
component through `vuetifyBindings`.

A control may hold a different value than the one written (a `ValueChangedAction` that normalises it) or refuse the
write by throwing. `update:modelValue` therefore carries `control.value`, not the written value. For one tick after a
refused write, `value` reads the written value and then the control's, so the rendered control is repainted with the
value the field holds.

### vuetifyBindings

| Key | Value |
|-----|-------|
| name | `control.fieldName`, so the field's name inside its `Group`; `undefined` without a control |
| class | The `cssClass` prop |
| density | The resolved density, with `inline` mapped to `default` - `inline` is carried by `densityClass` instead |
| variant | The resolved variant |
| label | `label.text` |
| errorMessages | A single space when the field is touched and has errors, `undefined` otherwise |
| readonly | `!enabled` |
| disabled | `!enabled` |
| placeholder | The `placeholder` prop, `''` when unset |
| persistent-placeholder | `true` when a placeholder is set |
| hint | The `hint` prop, `''` when unset |
| persistentHint | Always `true` |
| hideDetails | Always `'auto'`, so the details area disappears when there is nothing to show |
| helpText | The `helpText` prop, `''` when unset |

`errorMessages` is a single space, not the messages: it puts the Vuetify control into its error state, and
`DfInputHint` renders the messages from `shownErrors`. An error therefore renders as the content the
[`errorText` setting](/examples/configuration) returns for its `code`: plain text, markdown or a component.

`passthroughAttrs` is spread into this object last and replaces any key above; see
[passthroughAttrs](#passthroughattrs).

### Building your own field on it

A component outside the library has the same structure as the ones inside it: it extends `BaseProps`, defaults them
with `defaultBaseProps`, calls `useInputBase()` and binds the result.

```vue
<template>
  <div v-if="isRendered" class="my-slider-container" :class="[densityClass, visibilityClass]">
    <v-slider
      v-model="value"
      :min="min"
      :max="max"
      :step="step"
      v-bind="vuetifyBindings as any"
      @blur="touched = true"
    >
      <template #label><df-label :label="label" /></template>
      <template #message="{ message }"><df-input-hint :message="message" :errors="shownErrors" /></template>
    </v-slider>
  </div>
</template>

<script setup lang="ts">
import {
  BaseEmits,
  BaseProps,
  defaultBaseProps,
  DfInputHint,
  DfLabel,
  useInputBase,
} from '@dynamicforms/vuetify-inputs';

interface MySliderProps extends BaseProps<number> {
  min?: number;
  max?: number;
  step?: number;
}

const props = withDefaults(defineProps<MySliderProps>(), { ...defaultBaseProps, min: 0, max: 100, step: 1 });

interface Emits extends BaseEmits<number> {}
const emits = defineEmits<Emits>();

const { densityClass, isRendered, label, shownErrors, touched, value, visibilityClass, vuetifyBindings } =
  useInputBase<number>(props, emits);
</script>
```

The resulting component takes a `control` or a `v-model`, applies the visibility a `ConditionalVisibilityAction`
sets, uses the application's density and variant, shows its errors once touched, and accepts `passthroughAttrs`.

## Appearance and Behavior

InputBase is built from Vuetify components. All input components share:

- Field label display
- Error handling and error message display
- Responsive design
- Support for value clearing
- Support for disabled and read-only modes
