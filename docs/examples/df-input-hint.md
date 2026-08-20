# df-input-hint Component

`DfInputHint` is the message row of a field: one line under the input that carries the errors when there are any and
the hint when there are none. Every input component in the library renders it, and it is exported on its own for the
places that need a message row without an input — a group's errors, a section caption, a row of a table.

## Basic Usage

<InputHintBasic />

## Props

| Prop           | Type                          | Default        | Description                                                    |
|----------------|-------------------------------|----------------|----------------------------------------------------------------|
| errors         | `string \| ValidationError[]` | `''`           | The errors to render. Anything non-empty here wins over `message` |
| message        | `string \| ValidationError[]` | `''`           | What renders while no error stands, typically the field's hint |
| errorClasses   | `ClassTypes`                  | `'text-error'` | Classes applied to each rendered message while an error stands |
| messageClasses | `ClassTypes`                  | `''`           | Classes applied to each rendered message while none does       |

The component renders one row, never two. `errors` decides which of the two values that row carries: a non-empty
`ValidationError[]`, or a string with at least one non-whitespace character. A string of spaces alone is no error, so a
caller that keeps a Vuetify message slot alive with a blank string still gets the hint. The same choice picks the
classes: `errorClasses` while the row holds errors, `messageClasses` while it holds the message.

`ClassTypes` comes from [vue-forms](:vue-forms:/api/components.html): `ClassType | ClassType[]`, where a `ClassType` is
a class name, an array of class names, or a `Record<string, boolean>` of conditional classes.

## Rendering

`DfInputHint` does not render the text itself. It hands the chosen value and the chosen classes to vue-forms'
[`MessagesWidget`](:vue-forms:/api/components.html), which decides how each message is drawn:

- a `string` renders as a single `<span>`
- a `ValidationError[]` renders one node per error
- each `ValidationError` chooses its own form: plain text, markdown through an `MdString`, or a component of its own
  named by `componentName`

Because the errors keep their own rendering, a validator that phrases its message as an `MdString` renders as markdown
inside the message row, and one that returns a `ValidationError` subclass with a `componentName` renders that component
there. The classes given here are merged with each error's own `extraClasses`.

Markdown needs a globally registered `vue-markdown` component and the vue-forms stylesheet; see
[Markdown Support](:vue-forms:/examples/messages-widget.html) for the details.

## How the inputs use it

Every input component in the library overrides the Vuetify `#message` slot of the control it wraps with the same line:

```vue
<template #message="{ message }"><df-input-hint :message="message" :errors="showErrors" /></template>
```

`message` is what Vuetify hands the slot, which is the `hint` prop: the inputs bind `persistent-hint` always and
`hide-details="auto"`, so the row is there whenever there is something to put in it and gone otherwise. `showErrors` is
the field's errors — `control.errors` when a control is bound, and the `errors` string array wrapped in
`ValidationErrorRenderContent` when the component is used with `v-model` — but only once the field is touched;
before that it is `undefined` and the hint holds the row. `helpText` is not part of this row.

The inputs also report a single blank error message to Vuetify while a touched field is invalid. That is what paints
the control's error state and keeps the message row on screen; the text in the row is `DfInputHint`'s.

The result is the behaviour every field in the library shares: the hint is visible from the start, and the moment the
user leaves an invalid field the errors take the same line, in `text-error`.

## Standalone use

`DfInputHint` is a first-class export, so anything that produces messages can have a row of its own:

```vue
<template>
  <!-- A group-level validator writes to group.errors, which is a ValidationError[] -->
  <df-input-hint :errors="form.errors" />

  <!-- A plain string, with classes of its own -->
  <df-input-hint message="Amounts are in euro" message-classes="text-medium-emphasis text-caption" />

  <!-- A message that turns into an error under a condition the form decides -->
  <df-input-hint :errors="serverError" message="Saved" error-classes="text-warning font-weight-bold" />
</template>

<script setup>
import { DfInputHint } from '@dynamicforms/vuetify-inputs';
</script>
```

`group.errors` is the same `ValidationError[]` a field exposes, so no conversion is needed between a group-level
validator and the row that renders it. See [Groups](/examples/groups) for the validator side of that pairing.

The plugin registers the component globally when it is installed with `registerComponents: true`, under the name
`DfInputHint`, which templates address as `<df-input-hint>`. Without that option, import it where it is used.

## Source Code

The demo, without the cards it is laid out in:

### JavaScript/TypeScript

```ts
import { computed, ref } from 'vue';
import { Field, Group, ValidationErrorRenderContent, Validators } from '@dynamicforms/vue-forms';
import { DfInput, DfInputHint, DfSelect } from '@dynamicforms/vuetify-inputs';

const email = new Field<string>({ value: '' });
email.registerAction(new Validators.Required());
email.registerAction(
  new Validators.Pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'An address of the form name@example.com, please'),
);

const errorSource = ref<'none' | 'blank' | 'text'>('none');

// The middle option is three spaces: a whitespace-only errors string is no error
const standaloneErrors = computed(() => {
  if (errorSource.value === 'blank') return '   ';
  if (errorSource.value === 'text') return 'The value is not one of the allowed ones';
  return '';
});

const credentials = new Group({
  password: new Field<string>({ value: '' }),
  confirmation: new Field<string>({ value: '' }),
});

// A rule over two fields: its error belongs to the group, and one hint row renders it
credentials.registerAction(
  new Validators.Validator(() => {
    const { password, confirmation } = credentials.fields;
    if (!confirmation.value || password.value === confirmation.value) return null;
    return [new ValidationErrorRenderContent('The two entries do not match')];
  }),
);
```

### Vue Template

```vue
<template>
  <!-- The hint holds the row until the field is touched and invalid -->
  <df-input :control="email" label="Email" hint="We use it for the receipt only" />

  <!-- Standalone, fed a plain string on each of the two props -->
  <df-input-hint
    :errors="standaloneErrors"
    message="A message of its own, rendered when no error stands"
    message-classes="text-medium-emphasis"
  />

  <df-input :control="credentials.fields.password" input-type="password" label="Password" />
  <df-input :control="credentials.fields.confirmation" input-type="password" label="Repeat password" />

  <!-- The group's own errors, in a colour of their own -->
  <df-input-hint :errors="credentials.errors" error-classes="text-warning font-weight-bold" />
</template>
```

## Key Features Demonstrated

- **One row, two sources**: errors when there are any, the message otherwise
- **Whitespace is not an error**: a blank `errors` string leaves the message in place
- **Per-state classes**: `errorClasses` and `messageClasses` apply to whichever value is rendered
- **Delegated rendering**: text, markdown and component errors all render through `MessagesWidget`
- **Standalone rows**: a group's errors rendered next to the section they describe

## Try It Yourself

Experiment with the demo by:
1. Leaving the email field empty and clicking away, to watch the hint give up the row to the errors, which both
   validators contribute to and which render one node each
2. Typing an address without an `@` and leaving the field again, to see the second validator's message
3. Switching the standalone row between the empty string, three spaces and a message
4. Typing two different passwords, to bring up the group's error under the pair

<script setup>
import InputHintBasic from '../components/input-hint-basic.vue';
</script>
