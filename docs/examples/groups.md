# Groups Example

This example demonstrates two things a `Group` does for a form as a whole: it carries validation
errors that belong to no single field, and it carries actions that govern all of its fields at once.

A field validator answers a question about one value. A **group-level validator** answers a question
that spans several values: a total that must stay under a limit, two fields that must agree, a date
range whose end must follow its start. Registering it on the `Group` puts the resulting error in
`group.errors`, where it renders once, next to the section it describes, instead of being repeated
on every field that took part in the rule. `group.valid` is false while that error stands, even when
every individual field is valid.

A **conditional group** is the right tool when a whole section of the form appears and disappears
together. A single `ConditionalVisibilityAction` on the group that holds the section keeps the
condition in one place: the section renders under one `v-if`, its caption and its layout included,
and adding a field to the section later needs no change to the condition.

## Demo

<GroupErrorsDemo />

The trip starts at 1750 € of a 2000 € budget. Raise any of the three amounts, or tick the checkbox to
add a second traveller, and the group-level message appears under the totals as soon as the sum
crosses the limit.

## Source Code

The demo's form, without the cards it is laid out in:

### JavaScript/TypeScript

```js
import { computed } from 'vue';
import {
  ConditionalVisibilityAction,
  DisplayMode,
  Field,
  Group,
  MdString,
  Operator,
  Statement,
  ValidationErrorRenderContent,
  Validator,
} from '@dynamicforms/vue-forms';
import { DfCheckbox, DfInput, DfInputHint } from '@dynamicforms/vuetify-inputs';

const budgetLimit = 2000;

// The checkbox that decides whether the second traveller section is on the form
const addTraveller = new Field({ value: false });

// A nested group: its fields are addressed as traveller.fields.name, and its value is a member of form.value
const traveller = new Group({
  name: new Field({ value: '' }),
  ticket: new Field({ value: 400 }),
});

// One action on the group: the template renders the whole section under the group's visibility
traveller.registerAction(new ConditionalVisibilityAction(new Statement(addTraveller, Operator.EQUALS, true)));

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
form.registerAction(new Validator(() => {
  const total = tripTotal();
  if (total <= budgetLimit) return null;
  return [
    new ValidationErrorRenderContent(
      new MdString(`The trip totals **${total} €**, which is ${total - budgetLimit} € over the budget.`),
    ),
  ];
}));

// group.value is reactive, so the total and the rendered form value follow every keystroke
const total = computed(() => tripTotal());
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

    <!-- The whole section follows the visibility of the traveller group -->
    <v-card v-if="traveller.visibility !== DisplayMode.SUPPRESS" variant="outlined" class="pa-4 mt-2">
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

    <!-- The group-level validator writes here, so the message belongs to the form, not to any single field -->
    <df-input-hint :errors="form.errors" />

    <pre>{{ JSON.stringify(form.value, null, 2) }}</pre>
  </v-form>
</template>
```

## Rendering group errors

`group.errors` is a `ValidationError[]`, the same type a field exposes, so `DfInputHint` renders it
without any conversion:

```vue
<df-input-hint :errors="form.errors" />
```

`DfInputHint` treats a non-empty `errors` value as an error and applies `errorClasses`
(`text-error` by default); with an empty array it falls back to `message`, so a form that satisfies
the rule shows nothing. Each `ValidationError` chooses its own rendering: plain text, an `MdString`
for markdown, or a component definition.

## Writing a group-level validator

A `Validator` takes a function that returns either `null` (the rule holds) or an array of
`ValidationError` objects. On a group, it runs whenever the value of any field in the group changes,
including fields of nested groups, and it runs once at registration so the form opens in a correct
state. The function reads the fields it needs through `group.fields`:

```js
form.registerAction(new Validator((newValue, oldValue, group) => {
  const { password, confirmation } = group.fields;
  if (!confirmation.value || password.value === confirmation.value) return null;
  return [new ValidationErrorRenderContent('The two passwords do not match')];
}));
```

The validator owns the errors it produces: when the values change so that it returns `null`, its
error is removed from `group.errors` and no other validator's errors are touched.

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
`DisplayMode.FULL` or `DisplayMode.SUPPRESS` as the statement's result changes. `visibility` is a
property of the group alone, so the template consumes it once: render the section under
`v-if="group.visibility !== DisplayMode.SUPPRESS"` and the whole section, its fields included, leaves
the DOM. A field whose own control carries the action needs no `v-if`: the input component bound to
that field reads its control's visibility itself.

`ConditionalEnabledAction` takes the same statement and sets `enabled` instead.
`ConditionalValueAction` takes a statement and the value to assign,
`new ConditionalValueAction(statement, valueWhenTrue)`; it writes that value while the statement
holds and leaves the field alone otherwise.

## Key Features Demonstrated

- **Group-level validator**: a rule over several fields, with its error in `group.errors`
- **Error rendering**: `DfInputHint` renders `group.errors` the same way it renders field errors
- **Group validity**: `group.valid` covers both the group's own errors and those of its fields
- **Conditional group**: one `ConditionalVisibilityAction` shows and hides an entire section
- **Nested group**: `traveller` contributes its own object to `form.value`
- **Reactive value**: `group.value` re-renders the template as fields change

## Try It Yourself

Experiment with the demo by:
1. Raising the flights amount until the total crosses 2000 €
2. Lowering it again to watch the group message disappear
3. Ticking the checkbox to reveal the second traveller and add the ticket to the total
4. Editing the traveller's ticket price and following the total
5. Unticking the checkbox to see the section leave the form

<script setup>
import GroupErrorsDemo from '../components/group-errors-demo.vue';
</script>
