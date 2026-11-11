# df-input-group Component

`df-input-group` is one field's frame around several inputs: one label, one variant and density, one message row. Its
children render inside the frame without frames, floating labels or message rows of their own. A set of checkboxes
that belong together is the typical content: the group gives them the frame the other fields of a form have, once,
instead of a frame and its margins around each checkbox.

## Basic Usage

<InputGroupBasic />

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| control | `FieldBase` | | The bound element: a `Group` or `List` holding the children's elements, or a single field |
| label | `RenderContentNonCallable \| Label` | | The group's label, floating like the label of a field with a value |
| hint | `string` | | Shown in the message row while there is no error |
| errors | `ErrorInput[]` | | Errors to show without a control, as on every input |
| direction | `'row' \| 'wrap' \| 'column'` | `'row'` | The layout of the children, see [Direction](#direction) |
| variant | `FieldVariant` | | The frame's variant, resolved as on every input |
| density | `FieldDensity` | | The frame's density, resolved as on every input |
| enabled | `boolean` | | Without a control: `false` draws the frame disabled. With one, the frame is drawn disabled where the element's `effectiveAccess` is `'disabled'` or `'disabled-null'` |
| visibility | `Visibility` | | Without a control: the group's visibility |
| cssClass | `string` | | Classes of the group's root |

`label`, `hint`, `variant`, `density` and `cssClass` are read from the bound element's extended
properties where the prop is not given, as on every input (see
[Presentation carried by the element](/examples/input-base#presentation-carried-by-the-element)).

The group's value is not written: the children are bound to their own elements.

## Children

The group provides `'field-variant'` `'plain'` and `'field-density'` `'inline'` to everything in its slot. A child
without its own `variant` or `density` prop or extended property takes them: no outline or background, no floating
label, no margins. The children's message rows are hidden; the group's row shows their errors (see [Errors](#errors)).

A checkbox keeps its label beside the box. A text input in a group has no label of its own, so a group of such inputs
names them in the group's label or in placeholders.

## Direction

- `row`: the children on one line. The group is as high as a field of the same density, and the first line of its
  content is level with the text of the fields beside it. Children that do not fit scroll horizontally.
- `wrap`: the children on as many lines as the width needs.
- `column`: one child per line.

## Errors

With a `Group` or `List` bound, the message row shows the errors of the container and of every element in it, each
selected by the [shown errors](/examples/input-base#shown-errors) rule with its own `touched`: the container's own
first, then its members' in their order. With a single field bound, it shows that field's errors, and without a
control, the `errors` prop. The frame is in its error state while any of these is shown.

`selectShownErrorsDeep(element, settings)` is the selection the group uses, exported for templates that render a
container's errors elsewhere.

## Focus

The frame is focused while any of its children has the focus, and shows it as a focused field of its variant does.

## Visibility and access

The group's visibility follows the bound element, or the `visibility` prop without one. Enabled state and access of
the children come from their own elements, which take them from the container in vue-forms.

## Source Code

### JavaScript/TypeScript

```ts
import { Field, Group, ValidationError, Validators } from '@dynamicforms/vue-forms';
import { DfCheckbox, DfInput, DfInputGroup } from '@dynamicforms/vuetify-inputs';

const days = new Group(
  Object.fromEntries(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => [day, new Field({ value: false })])),
);
days.registerAction(
  new Validators.Validator(() =>
    Object.values(days.value).some(Boolean) ? null : [new ValidationError('app.no_day', {}, 'Choose at least one day')],
  ),
);

const form = new Group({
  name: new Field({ value: 'Swimming' }),
  days,
  hours: new Field({ value: '17:00' }),
});
```

### Vue Template

```vue
<template>
  <v-row>
    <v-col cols="3"><df-input :control="form.fields.name" label="Course" /></v-col>
    <v-col cols="6">
      <df-input-group :control="form.fields.days" label="Days" hint="At least one day" direction="wrap">
        <df-checkbox v-for="(field, day) in form.fields.days.fields" :key="day" :control="field" :label="day" />
      </df-input-group>
    </v-col>
    <v-col cols="3"><df-input :control="form.fields.hours" label="Hours" /></v-col>
  </v-row>
</template>
```

## Try It Yourself

1. Switch the variant and density: the group's frame changes with the fields beside it
2. Switch the direction to `row` and `column`
3. Tick a day and untick it, then leave the group: the group's validator error replaces the hint

<script setup>
import InputGroupBasic from '../components/input-group-basic.vue';
</script>
