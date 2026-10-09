# Validators Example

This example demonstrates how to use the validators of `@dynamicforms/vue-forms` with this library's components.

## Demo

Here's a live demo of form validation using various validators:

<ValidatorsFormDemo />

## Source Code

Here's the source code for the demo above:

### JavaScript/TypeScript

```js
import { computed, inject, provide } from 'vue';
import { Group, Field, transaction, ValueChangedAction, Validators } from '@dynamicforms/vue-forms';
import { MdString, vuetifyInputsSettingsKey } from '@dynamicforms/vuetify-inputs';

// Create a form group with validated fields
const validatedForm = new Group({
  // Required field - cannot be empty, and a value of spaces alone is empty too
  username: new Field({
    value: '',
    validators: [new Validators.Required()]
  }),

  // Email field with pattern validation
  email: new Field({
    value: '',
    validators: [
      new Validators.Pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        code: 'email_format',
        detail: 'Please enter a valid email address',
      }),
    ]
  }),

  // Number field with range validation
  age: new Field({
    value: null,
    validators: [new Validators.ValueInRange(18, 100)]
  }),

  // Field with allowed values validation
  role: new Field({
    value: '',
    validators: [new Validators.InAllowedValues(['admin', 'user', 'guest'])]
  }),

  // Text field with length validation
  bio: new Field({
    value: '',
    validators: [new Validators.LengthInRange(10, 200)]
  })
});

// The fields below render the email_format error as markdown; every other error keeps its default text
const settings = inject(vuetifyInputsSettingsKey, {});
provide(vuetifyInputsSettingsKey, {
  ...settings,
  errorText: (error) =>
    error.code === 'email_format'
      ? new MdString('Please enter a valid **email address**')
      : settings.errorText?.(error),
});

// group.valid covers the group's own errors and those of every field it holds
const formValid = computed(() => validatedForm.valid);

// Function to reset the form. The five writes are one transaction, so the group announces one change rather than
// five, and a handler that throws leaves the form as it was.
function resetForm() {
  transaction(() => {
    validatedForm.fields.username.value = '';
    validatedForm.fields.email.value = '';
    validatedForm.fields.age.value = null;
    validatedForm.fields.role.value = '';
    validatedForm.fields.bio.value = '';
  });
}

// A value changed action on the group fires whenever what the group holds changes: a field written. The handler
// stays synchronous: the write that triggers it returns once the chain has run, so nothing
// awaits a promise it hands back.
validatedForm.registerAction(new ValueChangedAction((field, supr, newValue, oldValue) => {
  console.log('Form value has changed');
  return supr(field, newValue, oldValue);
}));
```

Each validator except the email one is built without options, so its error carries the validator's own `code` -
`required`, `value_in_range` and so on - and renders as the `translatableStrings` entry of that name with the error's
`params` substituted: `'Please enter a value'`, `'Value must be between 18 and 100'`. Pass `{ code, detail }` as the
last constructor argument (the only one, for `Required`) to replace them. A component renders an error by its `code`
first: a `detail` given alone does not change what a `translatableStrings` entry renders for the validator's own code,
so a replaced message takes a `code` of its own, whose `detail` renders where no entry has that name.

The email field's error renders as markdown through the [`errorText` setting](/examples/configuration), which the demo
provides for the fields under it under `vuetifyInputsSettingsKey`. An error carries no markdown of its own; the
setting answers an `MdString` for the codes that need one and `undefined` for the rest.

### Vue Template

```vue
<template>
  <div>
    <v-card class="mb-4">
      <v-card-title>Validators Demo</v-card-title>
      <v-card-text>
        <v-form @submit.prevent>
          <!-- Username field (Required) -->
          <df-input
            :control="validatedForm.fields.username"
            label="Username"
            hint="Enter your username"
            class="mb-2"
          />

          <!-- Email field (Pattern) -->
          <df-input
            :control="validatedForm.fields.email"
            label="Email"
            hint="Enter your email address"
            class="mb-2"
          />

          <!-- Age field (ValueInRange) -->
          <df-input
            :control="validatedForm.fields.age"
            input-type="number"
            label="Age"
            :min="1"
            :max="200"
            class="mb-2"
          />

          <!-- Role field (InAllowedValues) -->
          <df-select
            :control="validatedForm.fields.role"
            :choices="[
              { id: 'admin', text: 'Admin' },
              { id: 'user', text: 'User' },
              { id: 'guest', text: 'Guest' }
            ]"
            label="Role"
            class="mb-2"
          />

          <!-- Bio field (LengthInRange) -->
          <df-text-area
            :control="validatedForm.fields.bio"
            label="Bio"
            :rows="4"
            :max-rows="10"
            hint="Enter a short bio (10-200 characters)"
            class="mb-2"
          />
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-btn
          color="primary"
          :disabled="!formValid"
        >
          Submit
        </v-btn>
        <v-btn
          color="secondary"
          @click="resetForm"
          class="ml-2"
        >
          Reset
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card>
      <v-card-title>Form Validation Status</v-card-title>
      <v-card-text>
        <v-alert
          :type="formValid ? 'success' : 'error'"
          class="mb-3"
        >
          Form is {{ formValid ? 'valid' : 'invalid' }}
        </v-alert>
        <pre class="output">{{ JSON.stringify(validatedForm.value, null, 2) }}</pre>
      </v-card-text>
    </v-card>
  </div>
</template>
```

## Key Features Demonstrated

- **Required Validator**: Fails on an empty value - a zero-length string, an empty array, an empty plain object,
  `null` or `undefined`. A string is measured after it is trimmed, so a field holding nothing but spaces is empty
  and invalid; `new Validators.Required({ trim: false })` measures the string as it stands. Only strings are
  trimmed - an array, an object or any other value is measured as it is
- **Pattern Validator**: Tests `String(value)` against a regular expression (email format here)
- **ValueInRange Validator**: Fails when the value is below the minimum or above the maximum, or cannot be compared
  with the bounds. Numbers compare with numbers, strings with strings and dates with dates
- **InAllowedValues Validator**: Restricts input to a predefined set of values, read at each validation rather than
  at construction
- **LengthInRange Validator**: Validates that the length of the value is within the given bounds; strings, arrays
  and plain objects are measured by their own length, anything else by the length of `String(value)`
- **Empty values**: every validator except `Required` passes `null`, `undefined`, `''`, `[]` and `{}`, so the empty
  age, role and bio fields are valid until something is entered; a field that must be filled adds `Required`
- **Form-level Validation**: `group.valid` covers the group's own errors and those of every field it holds
- **Error Display**: Showing validation errors to the user

## Try It Yourself

Experiment with the validators by:
1. Leaving the username empty, or typing nothing but spaces into it
2. Entering an invalid email address
3. Setting age outside the valid range
4. Selecting different role values
5. Entering text that's too short or too long in the bio field

<script setup>
import ValidatorsFormDemo from '../components/validators-demo.vue';
</script>
