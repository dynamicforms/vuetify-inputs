# InputBase Component

InputBase is the foundation component used by all input components in the `@dynamicforms/vuetify-inputs` library. 
It provides common functionality and properties that are available to all input components.

The foundation has three parts, and this page documents all of them: the props every input takes, the `InputBase`
component that hosts a control which is not a single Vuetify input, and the `useInputBase()` composable that computes
what those inputs bind.

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
| visibility       | `DisplayMode \| string`       | `undefined`    | Component visibility mode (FULL, HIDDEN, INVISIBLE, SUPPRESS), see [Display Modes](#display-modes) |
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
state and the visibility. The `modelValue`, `errors`, `enabled` and `visibility` props are then not consulted at all.

`clearable` is read where the field draws its own clear button: `df-date-time` passes the prop through to
`InputBase`, while `df-file` always draws the button. `df-select` and `df-color` draw theirs from their own
`allowNull` prop. `df-rtf-editor` binds its whole prop set to `InputBase`, so `clearable` reaches it and the button is
drawn, but the component handles no `click:clear`, so pressing it leaves the text standing.

### Presentation carried by the element

A bound `control` carries the presentation the component renders it with. `label`, `placeholder`, `helpText`,
`hint`, `cssClass`, `density` and `variant` are declared on
[`Extras`](:vue-forms:/api/field.html#extended-properties), which is the augmentation point
`@dynamicforms/vue-forms` provides for exactly this, so they are typed on every element in an application that
installs this library — including the fields written inline in a `Group` declaration, which no type argument on the
group can annotate.

State them where the field is declared:

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

They are ordinary extended properties, so `setExtendedValues()` writes them later and the read is tracked — a
label written after the component rendered reaches the screen:

```typescript
form.fields.name.setExtendedValues({ label: 'Name as printed', cssClass: 'text-primary' });
```

**A prop wins.** A call site is more specific than the element it draws, so `<df-input :control="field"
label="At the tag" />` renders the tag's label whatever the field carries. For `density` and `variant` the element
sits second in the cascade, ahead of an injected `field-density` / `field-variant` and ahead of the plugin
defaults — the element is more specific than the section it appears in.

What an element carries is not the same as what it answers for. `enabled`, `visibility`, `errors` and the value are
members of the element itself and are read from there; these seven are what a UI layer attached to it.

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
- the bound element: a `control` carries `density` and `variant` among its
  [extended properties](#presentation-carried-by-the-element), and they apply where the props state nothing
- provide: any parent component may `provide` `'field-variant'` and/or `'field-density'`. If they are set and not
  overridden by specifying props or by the element, they will be used.
- specify global defaults when installing the library:
  `app.use(DynamicFormsInputs, { defaultVariant: 'your variant', defaultDensity: 'your density' })`
- baked-in defaults (when nothing is specified):
    - density: `'default'`
    - variant: `'underlined'`

See [demo](./density.md) to see how densities render for individual variants.

## Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| update:modelValue | `value: T` | Triggered when the value changes. With a control bound, the argument is what the control holds after the write, which is not necessarily what was written |
| click:clear | - | Triggered when the clear button is clicked |

Both events are declared by `BaseEmits`, so every component accepts a listener for them. `click:clear` is emitted by
[InputBase](#the-inputbase-component); `df-date-time` and `df-file` host their control in it and handle the event
themselves, clearing the value and deleting the uploaded file respectively.

## Display Modes

Every input component applies the display mode to its own root element:

- `FULL`: the component renders normally and is available for interaction
- `HIDDEN`: the root element gets the `d-none` class, so the component is not displayed and takes up no space
- `INVISIBLE`: the root element gets the `invisible` class, so the component is not painted but still takes up its space
  in the layout
- `SUPPRESS`: the root element is not rendered in the DOM at all

The mode comes from the `control` when one is bound: `control.visibility` is the answer, and the `visibility` prop is
not consulted. Without a control the prop decides, and when neither is given the mode is `FULL`. A
`ConditionalVisibilityAction` registered on the control therefore shows and hides the input on its own, with no `v-if`
in the template.

The prop is resolved through vue-forms' `DisplayMode.fromAny`, so it takes either the constant - `DisplayMode` is
exported by `@dynamicforms/vue-forms` - or the name of one, matched case-insensitively. These two are the same input:

```vue
<df-input v-model="secret" label="Secret" visibility="hidden" />
<df-input v-model="secret" label="Secret" :visibility="DisplayMode.HIDDEN" />
```

A value that names no constant - a misspelled name, or a number that is none of the four - throws an `Error` naming
the value. The mode is read while the component renders, so that is where the error surfaces; a mode nobody defined
never renders as `FULL`.

## passthroughAttrs

`passthroughAttrs` is the escape hatch present on every input. Whatever it holds is spread into `vuetifyBindings`
last, so a key the library computes is replaced by the one given here, and a key it does not compute is added. The
keys are spelled the way the Vuetify component underneath expects them.

```vue
<df-input
  v-model="email"
  label="Email"
  :passthrough-attrs="{ 'prepend-inner-icon': 'mdi-email', autocomplete: 'email', autofocus: true }"
/>
```

Because the spread comes last, it also overrides what the library decided. The hint is persistent by default; this
one appears only while the field has focus:

```vue
<df-input v-model="note" label="Note" hint="Keep it short" :passthrough-attrs="{ persistentHint: false }" />
```

`df-date-time`, `df-file` and `df-rtf-editor` do not bind `vuetifyBindings` to a single Vuetify input, so each of
them binds `passthroughAttrs` on the control it renders inside `InputBase`: the file input, the editor, and - in the
case of `df-date-time` - both the date and the time text field.

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

## The InputBase component

`InputBase` is a component in its own right, exported from the package as `InputBase`. `df-date-time`, `df-file` and
`df-rtf-editor` are built on it: it draws the Vuetify field - label, hint, error state, clear button, loader - and the
component fills the middle of that field with a control of its own, which is what a single Vuetify input cannot
provide. The plugin's `registerComponents` option does not register it, so a template that uses it imports it.

It takes every prop from the [table above](#common-properties-props), plus one of its own:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| loading | `boolean` | `undefined` | Puts the field in its loading state, which is what the `loader` slot reports as `isActive` |

It emits `BaseEmits` plus one event of its own:

| Event | Arguments | Description |
|-------|-----------|-------------|
| click:clear | - | The clear button was clicked. The button is drawn only while `clearable` is set and the value is not empty |
| blur | - | The hosted control lost focus. `touched` is set to `true` before this is emitted, so a listener already reads the field as touched |

The root element is a `v-input`, rendered only when the display mode is not `SUPPRESS`, carrying the `name`,
`density`, `hint`, `persistent-hint`, `hide-details` and `errorMessages` bindings together with the `cssClass` prop
and the visibility classes. Its `message` slot renders `DfInputHint` with the errors of a touched field. Inside it, a
`v-field` carries the `variant`, `density`, `label` and `disabled` bindings, is `dirty` while there is a value or a
placeholder, is `active` while the hosted control has focus, and takes `loading` from the prop. The field's `label`
slot renders `DfLabel`, so an icon label and an `MdString` label render exactly as they do on the components that
bind a Vuetify input directly. The density class is not applied here: the host binds `:class="densityClass"` on the
`InputBase` element itself.

### Slots

| Slot | Slot props | Description |
|------|------------|-------------|
| default | `props`, `isActive`, `isFocused`, `iconColor`, `controlRef`, `focus()`, `blur()` | The control that fills the field, wrapped in a full-width flex container whose styling neutralises the field's own overlay and outline |
| loader | `color`, `isActive` | Replaces the field's default indeterminate progress bar. It renders whether or not `loading` is set, and `isActive` reports which it is |
| prepend-inner | `isActive`, `isFocused`, `iconColor`, `controlRef`, `focus()`, `blur()` | Content inside the field, before the default slot. Rendered only when the slot is supplied |
| prepend | `id`, `messagesId`, `isDirty`, `isDisabled`, `isReadonly`, `isPristine`, `isValid`, `isValidating`, `hasDetails`, `reset()`, `resetValidation()`, `validate()` | Content outside the field, at the start of the input. Rendered only when the slot is supplied |

The `focus()` and `blur()` functions in the default and `prepend-inner` slot props are what drives the field: the
hosted control calls them from its own focus and blur events, the field paints itself as focused, and on losing focus
`InputBase` marks the field touched and emits `blur`. A control that never calls them leaves the field looking
unfocused and never touched, so validation errors stay hidden.

`df-file` shows all three of the extra slots in one component: a `v-progress-linear` in `loader`, driven by the upload
progress, a paperclip icon in `prepend-inner`, and its `v-file-input` in `default`, routing that input's focus and
blur into `slotProps.focus()` and `slotProps.blur()`. `df-date-time` puts one or two `v-text-field`s in `default` -
plain variant, no details and no clear button of their own - and routes their focus and blur the same way, so the
outer field draws the label, the hint and the one clear button that covers both.

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
function useInputBase<T = any>(props: BaseProps<T>, emit: BaseEmits<T>);
```

`useInputBase()` is the engine every component in this library runs on, and it is a public export: a component that
is not part of the library gets the same value handling, the same error and touched handling, the same density and
variant resolution and the same visibility handling by calling it.

It is called in `setup()`, with the component's own props object and its emit function. If `control` is given and is
not a vue-forms `FieldBase`, the call throws `Error('control prop is not a vue-form control instance')` there and
then, so a control of the wrong kind fails at mount rather than misbehaving later.

### What it returns

| Member | Type | Description |
|--------|------|-------------|
| value | `WritableComputedRef<T>` | The value. Reads from the control, or from `modelValue`, or from an internal ref when neither is given. Writing writes the control, keeps the internal ref in step and emits `update:modelValue` with the value the control ended up holding |
| valid | `ComputedRef<boolean>` | `control.valid`, or `true` when there is no control |
| errors | `ComputedRef<ValidationError[]>` | `control.errors`, or the `errors` prop with each string wrapped in a `ValidationErrorRenderContent` |
| showErrors | `ComputedRef<ValidationError[] \| undefined>` | The same errors once the field is touched, `undefined` before that. This is what gets bound to `DfInputHint` |
| enabled | `ComputedRef<boolean>` | `control.enabled`, or `props.enabled !== false` when there is no control |
| visibility | `ComputedRef<DisplayMode>` | The resolved display mode, see [Display Modes](#display-modes) |
| isRendered | `ComputedRef<boolean>` | `false` only for `SUPPRESS`; it is the `v-if` on the component's root element |
| visibilityClass | `ComputedRef<{ 'd-none': boolean, invisible: boolean }>` | The class object for `HIDDEN` and `INVISIBLE`, to bind on the root element |
| label | `ComputedRef<Label>` | The label as a `Label` instance: a `string` or `MdString` is wrapped, a `Label` is passed through |
| touched | `WritableComputedRef<boolean> \| Ref<boolean>` | Bound to `control.touched` when there is a control, a standalone ref otherwise. Components write `true` to it on blur |
| density | `ComputedRef<FieldDensity>` | The `density` prop, then the control's `extra.density`, then the injected `field-density`, then the plugin's `defaultDensity`, then `'default'` |
| densityClass | `ComputedRef<string>` | `` `df-density-${density}` ``, to bind on the root element |
| vuetifyBindings | `ComputedRef<Record<string, any>>` | Everything to `v-bind` on the Vuetify input, see below |

`placeholder`, `helpText`, `hint`, `cssClass` and the resolved `variant` are not returned separately; they reach the
component through `vuetifyBindings`.

A control may take a different value than the one written - a `ValueChangedAction` that normalises it - or refuse the
write entirely by throwing. `update:modelValue` therefore carries `control.value`, not the written value, and for the
tick after a refused write `value` still reads back what was written, so that the read changes twice and the rendered
control repaints from the value the field actually holds.

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

`errorMessages` carries a single space rather than the messages themselves: it only puts the Vuetify control into its
error state, while the messages are rendered by `DfInputHint` from `showErrors`. That is what lets a vue-forms error
render as markdown or as a component instead of a plain string.

`passthroughAttrs` is spread into this object last, so a caller's attribute wins over every key above - see
[passthroughAttrs](#passthroughattrs).

### Building your own field on it

A component outside the library follows the same shape as the ones inside it: declare `BaseProps` with whatever it
adds, default them with `defaultBaseProps`, call `useInputBase()`, and bind the result.

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
      <template #message="{ message }"><df-input-hint :message="message" :errors="showErrors" /></template>
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

const { densityClass, isRendered, label, showErrors, touched, value, visibilityClass, vuetifyBindings } =
  useInputBase<number>(props, emits);
</script>
```

The component that comes out of this takes a `control` or a `v-model`, hides itself when a
`ConditionalVisibilityAction` says so, follows the application's density and variant, shows its errors once it has
been touched, and accepts `passthroughAttrs` - none of which it had to implement.

## Appearance and Behavior

InputBase uses Vuetify components and follows Vuetify guidelines for appearance and behavior. All components have a 
consistent user experience with:

- Field label display
- Error handling and error message display
- Responsive design
- Support for value clearing
- Support for disabled and read-only modes
