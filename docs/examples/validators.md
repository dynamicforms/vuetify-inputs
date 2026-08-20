# Validators Example

This example demonstrates how to use validators with form fields in `@dynamicforms/vue-forms`.

## Demo

Here's a live demo of form validation using various validators:

<ValidatorsFormDemo />

## Source Code

Here's the source code for the demo above:

### JavaScript/TypeScript

```js
import { computed } from 'vue';
import { Group, Field, MdString, transaction, ValueChangedAction, Validators } from '@dynamicforms/vue-forms';

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
      new Validators.Pattern(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        new MdString('Please enter a valid **email address**'),
      ),
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

// A value changed action on the group fires for a change in any of its fields. The handler stays synchronous:
// the write that triggers it returns once the chain has run, so nothing awaits a promise it hands back.
validatedForm.registerAction(new ValueChangedAction((field, supr, newValue, oldValue) => {
  console.log('Form value has changed');
  return supr(field, newValue, oldValue);
}));
```

Each validator is built without a message here, so the field shows the built-in one - `'Please enter a value'`,
`'Value must be between **18** and **100**'` and so on. Pass a message as the last constructor argument (the first,
for `Required`) to replace it; a plain string renders as text and an `MdString` as markdown, as the email field
shows.

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
- **Pattern Validator**: Tests `String(value)` against a regular expression (email format here), so `undefined` is
  tested as the string `"undefined"`
- **ValueInRange Validator**: Fails when the value is below the minimum, above the maximum, or `undefined`. The
  bounds are compared with `<` and `>`, which coerce `null` to `0`, so the `null` the age field starts out with fails
  a range that begins at 18
- **InAllowedValues Validator**: Restricts input to a predefined set of values, read at each validation rather than
  at construction
- **LengthInRange Validator**: Validates that the length of the value is within the given bounds; strings, arrays
  and plain objects are measured by their own length, anything else by the length of `String(value)`
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
