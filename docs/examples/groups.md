# Groups Example

This example shows two uses of a `Group`: validation errors that belong to no single field, and actions that apply
to all of its fields.

A field validator checks one value. A **group-level validator** checks several values: a total under a limit, two
fields that must match, a date range whose end follows its start. Registered on the `Group`, it puts its error in
`group.errors`, which renders once next to the section, not on every field of the rule. `group.valid` is `false`
while that error is present, even when every field is valid.

A **conditional group** shows and hides a whole section. One `ConditionalVisibilityAction` on the group holds the
condition: the section, its caption and layout included, renders under one `v-if`, and a field added to the section
needs no change to the condition.

## Demo

<GroupErrorsDemo />

The trip starts at 1750 € of a 2000 € budget. When the sum exceeds the limit, by raising any of the three amounts or
by adding a second traveller with the checkbox, the group-level message appears under the totals.

## Source Code

The demo's form, without the cards it is laid out in:

### JavaScript/TypeScript

```js
import { computed } from 'vue';
import {
  ConditionalAccessAction,
  ConditionalVisibilityAction,
  Field,
  Group,
  Operator,
  Statement,
  ValidationError,
  Validators,
} from '@dynamicforms/vue-forms';
import {
  DfCheckbox,
  DfInput,
  DfInputHint,
  useShownErrors,
} from '@dynamicforms/vuetify-inputs';

const budgetLimit = 2000;

// The checkbox that decides whether the second traveller section is on the form
const addTraveller = new Field({ value: false });

const travelling = new Statement(addTraveller, Operator.EQUALS, true);

// A nested group: its fields are addressed as traveller.fields.name, and while it is sent its value is a member of
// form.value. Two actions on it, over one statement: visibility decides whether the template draws the section,
// access whether the form sends it - and validates it
const traveller = new Group(
  { name: new Field({ value: '' }), ticket: new Field({ value: 400 }) },
  { actions: [new ConditionalVisibilityAction(travelling), new ConditionalAccessAction(travelling)] },
);

const form = new Group({
  flights: new Field({ value: 900 }),
  hotel: new Field({ value: 700 }),
  extras: new Field({ value: 150 }),
  addTraveller,
  traveller,
});

function amount(field) {
  return Number(field.value) || 0;
}

function tripTotal() {
  const total = amount(form.fields.flights) + amount(form.fields.hotel) + amount(form.fields.extras);
  return form.fields.addTraveller.value ? total + amount(traveller.fields.ticket) : total;
}

// A validator on the group itself: the rule spans several fields, so the error belongs to the group
form.registerAction(new Validators.Validator(() => {
  const total = tripTotal();
  if (total <= budgetLimit) return null;
  const over = total - budgetLimit;
  return [
    new ValidationError('app.over_budget', { total, over }, `The trip totals ${total} €, which is ${over} € over the budget.`),
  ];
}));

// group.value is reactive, so the total and the rendered form value follow every keystroke
const total = computed(() => tripTotal());

// the group's own errors, shown by the rule the inputs follow
const formErrors = useShownErrors(form);
```

### Vue Template

```vue
<template>
  <v-form @submit.prevent>
    <v-row>
      <v-col cols="12" md="4">
        <df-input :control="form.fields.flights" input-type="number" label="Flights" :min="0" :step="50" />
      </v-col>
      <v-col cols="12" md="4">
        <df-input :control="form.fields.hotel" input-type="number" label="Hotel" :min="0" :step="50" />
      </v-col>
      <v-col cols="12" md="4">
        <df-input :control="form.fields.extras" input-type="number" label="Extras" :min="0" :step="50" />
      </v-col>
    </v-row>

    <df-checkbox :control="form.fields.addTraveller" label="Book a second traveller" />

    <!-- The section is rendered by the visibility of the traveller group -->
    <v-card v-if="traveller.visibility !== 'suppress'" variant="outlined" class="pa-4 mt-2">
      <div class="text-subtitle-1 mb-2">Second traveller</div>
      <df-input :control="traveller.fields.name" label="Full name" />
      <df-input :control="traveller.fields.ticket" input-type="number" label="Ticket" :min="0" :step="50" />
    </v-card>

    <div class="mt-4">
      <strong>Total:</strong> {{ total }} € of {{ budgetLimit }} €
      <!-- group.valid covers the group's own errors as well as its fields' -->
      <v-chip :color="form.valid ? 'success' : 'error'" size="small" class="ml-2">
        {{ form.valid ? 'Within budget' : 'Over budget' }}
      </v-chip>
    </div>

    <!-- The group-level validator's errors, shown once a field of the form is touched -->
    <df-input-hint :errors="formErrors" />

    <pre>{{ JSON.stringify(form.value, null, 2) }}</pre>
  </v-form>
</template>
```

## Rendering group errors

`group.errors` is a `ValidationError[]`, the same type as a field's, and `DfInputHint` renders it without conversion.
The inputs show an error once the field is touched, or immediately if its origin is `'server'`.
[`useShownErrors(form)`](/examples/input-base#shown-errors) applies the same rule to the group's own errors, so the
budget message appears once a field of the form is touched:

```js
const formErrors = useShownErrors(form);
```

```vue
<df-input-hint :errors="formErrors" />
```

Binding `form.errors` directly shows the message whenever the total exceeds the limit, including before any field is
touched.

`DfInputHint` renders a non-empty `errors` value with `errorClasses` (`text-error` by default); for an empty array it
renders `message`, so a form within the budget shows nothing. An error renders as the content the
[`errorText` setting](/examples/localisation#translating-errors) returns for it, which may be plain text, an `MdString`
for markdown or a component definition, and otherwise as its `detail`. The budget error carries `total` and `over` in
its `params`; the docs' `errorText` renders `app.over_budget` from them, as markdown while the
[validation and i18n demo](/examples/validators)'s markdown setting is on.

## Writing a group-level validator

A `Validators.Validator` takes a function that returns either `null` (the rule holds) or an array of
`ValidationError` objects. On a group, it runs whenever the value of any field in the group changes,
including fields of nested groups, and once at registration, so the errors are current when the form opens. The function
reads the fields it needs through `group.fields`:

```js
form.registerAction(new Validators.Validator((newValue, oldValue, group) => {
  const { password, confirmation } = group.fields;
  if (!confirmation.value || password.value === confirmation.value) return null;
  return [new ValidationError('app.passwords_differ', {}, 'The two passwords do not match')];
}));
```

When the validator returns `null`, its own errors are removed from `group.errors`; other validators' errors are
unchanged.

## Conditions on a group

`ConditionalVisibilityAction` takes a `Statement`, which compares an operand to another operand with
an `Operator`. Either operand may be a field, a literal, or a nested `Statement`, so conditions
combine:

```js
const showStatement = new Statement(
  new Statement(form.fields.age, Operator.LT, 30),
  Operator.AND,
  new Statement(form.fields.isStudent, Operator.EQUALS, true),
);
discounts.registerAction(new ConditionalVisibilityAction(showStatement));
```

The action watches every field the statement mentions and sets the group's `visibility` to
`'full'` or `'suppress'` as the statement's result changes. `visibility` is a property of the group only, so the
template reads it once: under `v-if="group.visibility !== 'suppress'"` the whole section, its fields included, is
removed from the DOM. A field whose own control has the action needs no `v-if`: the input component bound to that
field reads its control's visibility.

`visibility` is presentation only: a suppressed section is not rendered, and it is still sent and validated. Whether
the section is part of the form's data is set by its `access`, which `ConditionalAccessAction` sets from the same
statement: `'editable'` while it holds and `'disabled'` otherwise, or the two given accesses. A `'disabled'` group is
left out of `form.value` and none of its fields is validated; `'disabled-null'` sends it as `null`. The group keeps its
fields' values in both cases, so they are sent again when the section is enabled. `ConditionalValueAction` takes a
statement and the value to assign, `new ConditionalValueAction(statement, valueWhenTrue)`; it writes that value while
the statement holds and leaves the field alone otherwise.

## Key Features Demonstrated

- **Group-level validator**: a rule over several fields, with its error in `group.errors`
- **Error rendering**: `DfInputHint` renders `group.errors` the same way it renders field errors
- **Group validity**: `group.valid` covers both the group's own errors and those of its fields
- **Conditional group**: a `ConditionalVisibilityAction` and a `ConditionalAccessAction` over one statement show,
  send and validate an entire section together
- **Nested group**: `traveller` contributes its own object to `form.value` while it is sent
- **Reactive value**: `group.value` re-renders the template as fields change

## Try It Yourself

In the demo:

1. Raise the flights amount until the total exceeds 2000 €
2. Lower it again; the group message disappears
3. Tick the checkbox; the second traveller is shown and the ticket is added to the total
4. Edit the traveller's ticket price; the total follows
5. Untick the checkbox; the section is removed from the form and from its value

<script setup>
import GroupErrorsDemo from '../components/group-errors-demo.vue';
</script>
