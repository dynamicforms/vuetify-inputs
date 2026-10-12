# df-input-hint Component

`DfInputHint` is the message row of a field: one line under the input that shows the errors when there are any and the
hint otherwise. Every input component in the library renders it. It is also exported for a message row without an
input, e.g. a group's errors, a section caption or a table row.

## Basic Usage

<InputHintBasic />

## Props

| Prop           | Type                                               | Default        | Description                                                       |
|----------------|----------------------------------------------------|----------------|-------------------------------------------------------------------|
| errors         | `string \| (RenderableValue \| ErrorDescription)[]` | `''`           | The errors to render. When not empty, rendered instead of `message` |
| message        | `string \| RenderableValue[]`                      | `''`           | Rendered while there is no error, typically the field's hint    |
| errorClasses   | `ClassTypes`                                       | `'text-error'` | Classes of each rendered message while there are errors           |
| messageClasses | `ClassTypes`                                       | `''`           | Classes of each rendered message while there are none             |

The component renders one row. It renders `errors` when `errors` is a non-empty array or a string with at least one
non-whitespace character, and `message` otherwise. A whitespace-only string is not an error, so a blank string passed
to keep a Vuetify message slot rendered shows the hint. The classes are `errorClasses` while the row renders errors and
`messageClasses` while it renders the message.

`ErrorDescription` is vue-forms' read-only shape of an error (`code`, `params`, `detail`, `origin`), which every
`ValidationError` implements. `ClassTypes` is `ClassType | ClassType[]`, where a `ClassType` is a class name, an array
of class names, or a `Record<string, boolean>` of conditional classes. Both `ClassTypes` and `RenderableValue` are
exported by this library; see [Render content](#render-content).

## Rendering

`DfInputHint` passes the selected value and classes to `MessagesWidget`, which renders each message:

- a `string` renders as a single `<span>`
- an array renders one node per item
- an error renders as the content the `errorText` setting returns for it, and as its `detail` where that setting is
  not given or returns `undefined` (see [Translating errors](/examples/localisation#translating-errors))
- a `RenderableValue` renders its own content: plain text, markdown or a component

An error carries no markdown or component of its own. An error renders as markdown or as a component when the
`errorText` setting returns an `MdString` or a `SimpleComponentDef` for its code. The classes given here
are merged with each `RenderableValue`'s own `classes`.

Markdown renders through `vue-markdown-render`, which `MessagesWidget` imports itself; the library's stylesheet
removes the outer margins of a markdown message.

## Render content

`MessagesWidget`, `RenderableValue`, `MdString` and the render-content types are exported from
`@dynamicforms/vuetify-inputs`.

```typescript
class MdString extends String {
  constructor(value: string, options?: any, plugins?: any[]);
}

interface SimpleComponentDef {
  componentName: string;
  componentProps?: Record<any, any>;
  componentVHtml?: string;
}

type RenderContentNonCallable = string | MdString | SimpleComponentDef;
type RenderContent = RenderContentNonCallable | (() => RenderContentNonCallable);
type RenderContentRef = RenderContent | Ref<RenderContent>;

class RenderableValue {
  constructor(content?: RenderContentRef, classes?: ClassTypes);
}
```

| Content | Renders as |
|---|---|
| `string` | a `<div>` holding the text |
| `MdString` | markdown, through `vue-markdown-render` with the string's `options` and `plugins` |
| `SimpleComponentDef` | the component named by `componentName`, with `componentProps` as its props and `componentVHtml` as its inner HTML. A common HTML element name renders as that element; any other name is resolved as a globally registered component |

A `RenderableValue` reads a ref or a function on every render, so a changed content is rendered without constructing a
new value. `isSimpleComponentDef(content)` and `isCallableFunction(content)` tell the forms apart.

`MessagesWidget` takes two props:

| Prop | Type | Description |
|---|---|---|
| message | `string \| (RenderableValue \| ErrorDescription)[]` | A plain text, or the items to render, each in its own element |
| classes | `ClassTypes` | Classes for every rendered item, beside the item's own `classes` |

## How the inputs use it

Every input component in the library overrides the Vuetify `#message` slot of the control it wraps with the same line:

```vue
<template #message="{ message }"><df-input-hint :message="message" :errors="shownErrors" /></template>
```

`message` is what Vuetify passes to the slot, the `hint` prop. The inputs bind `persistent-hint` and
`hide-details="auto"`, so the row is rendered when it has content and removed otherwise. `shownErrors` is the subset of
the field's errors that is shown now (see [Shown errors](/examples/input-base#shown-errors)): an error of origin
`'server'` immediately, every other once the field is touched. The field's errors are `control.errors` when a control is
bound, and otherwise the `errors` prop, each string wrapped in a `ValidationError` with an empty `code` and the string
as its `detail`. While `shownErrors` is empty, the row shows the hint. `helpText` is not part of this row.

While a touched field is invalid, the inputs also pass a single blank error message to Vuetify. It sets the control's
error state and keeps the message row rendered; the text in the row is rendered by `DfInputHint`.

The hint is therefore visible from the start, and once the user leaves an invalid field the errors replace it on the
same line, in `text-error`.

## Standalone use

`DfInputHint` is exported and renders any messages on a row of its own:

```vue
<template>
  <!-- A group-level validator writes to group.errors, which is a ValidationError[] -->
  <df-input-hint :errors="form.errors" />

  <!-- A plain string, with classes of its own -->
  <df-input-hint message="Amounts are in euro" message-classes="text-medium-emphasis text-caption" />

  <!-- The message, or the error while serverError is not empty -->
  <df-input-hint :errors="serverError" message="Saved" error-classes="text-warning font-weight-bold" />
</template>

<script setup>
import { DfInputHint } from '@dynamicforms/vuetify-inputs';
</script>
```

`group.errors` is a `ValidationError[]`, as a field's is, and is passed without conversion. See
[Groups](/examples/groups) for group-level validators.

The plugin registers the component globally when it is installed with `registerComponents: true`, under the name
`DfInputHint`, which templates address as `<df-input-hint>`. Without that option, import it where it is used.

## Source Code

The demo, without the cards it is laid out in:

### JavaScript/TypeScript

```ts
import { computed, ref } from 'vue';
import { Field, Group, ValidationError, Validators } from '@dynamicforms/vue-forms';
import { DfInput, DfInputHint, DfSelect } from '@dynamicforms/vuetify-inputs';

const email = new Field<string>({
  value: '',
  validators: [
    new Validators.Required(),
    new Validators.Pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, {
      code: 'invalid_email',
      detail: 'An address of the form name@example.com, please',
    }),
  ],
});

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
    return [new ValidationError('passwords_differ', {}, 'The two entries do not match')];
  }),
);
```

### Vue Template

```vue
<template>
  <!-- The hint is shown until the field is touched and invalid -->
  <df-input :control="email" label="Email" hint="We use it for the receipt only" />

  <!-- Standalone, with a plain string in each of the two props -->
  <df-input-hint
    :errors="standaloneErrors"
    message="Shown while there is no error"
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
- **Rendering errors**: each error renders through `MessagesWidget`, as the `errorText` setting's content for it or
  as its `detail`
- **Standalone rows**: a group's errors rendered next to the section they describe

## Try It Yourself

Experiment with the demo by:
1. Leaving the email field empty and clicking away, to watch the hint give up the row to the errors, which both
   validators contribute to and which render one node each
2. Typing an address without an `@` and leaving the field again, to see the second validator's message, which its
   own `code` and `detail` replace
3. Switching the standalone row between the empty string, three spaces and a message
4. Typing two different passwords, to bring up the group's error under the pair

<script setup>
import InputHintBasic from '../components/input-hint-basic.vue';
</script>
