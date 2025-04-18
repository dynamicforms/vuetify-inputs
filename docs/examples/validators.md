# Validators Example

This example demonstrates how to use validators with form fields in `@dynamicforms/vue-forms`.

## Demo

Here's a live demo of form validation using various validators:

<ValidatorsFormDemo />

## Source Code

Here's the source code for the demo above:

### JavaScript/TypeScript

```js
import { Group, Field, MdString, ValueChangedAction, Validators } from '@dynamicforms/vue-forms';

// Create a form group with validated fields
const validatedForm = new Group({
  // Required field - cannot be empty
  username: Field.create({ 
    value: '', 
    validators: [new Validators.Required('Username is required')]
  }),
  
  // Email field with pattern validation
  email: Field.create({ 
    value: '', 
    validators: [
      new Validators.Pattern(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        new MdString('Please enter a valid **email address**'),
      ),
    ]
  }),
  
  // Number field with range validation
  age: Field.create({ 
    value: 18, 
    validators: [
      new Validators.ValueInRange(18, 100, 'Age must be between 18 and 100')
    ]
  }),
  
  // Field with allowed values validation
  role: Field.create({ 
    value: '', 
    validators: [
      new Validators.InAllowedValues(
        ['admin', 'user', 'guest'], 
        'Role must be one of: admin, user, or guest'
      )
    ]
  }),
  
  // Text field with length validation
  bio: Field.create({
    value: '',
    validators: [
      new Validators.LengthInRange(10, 200, 'Bio must be between 10 and 200 characters')
    ]
  })
});

// Create a reactive reference for form output and validation status
const formOutput = validatedForm.reactiveValue;
const formValid = computed(() => {
  return Object.values(validatedForm.fields).every(field => field.valid);
});

// Register a value changed action to update form output display
validatedForm.registerAction(new ValueChangedAction(async (field, supr, newValue, oldValue) => {
  return supr(field, newValue, oldValue);
}));
```

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
      </v-card-actions>
    </v-card>

    <v-card>
      <v-card-title>Form Validation Status</v-card-title>
      <v-card-text>
        <p>Form is {{ formValid ? 'valid' : 'invalid' }}</p>
        <pre class="output">{{ JSON.stringify(formOutput, null, 2) }}</pre>
      </v-card-text>
    </v-card>
  </div>
</template>
```

## Key Features Demonstrated

- **Required Validator**: Ensures a field is not empty
- **Pattern Validator**: Validates content against a regular expression (email format)  
- **ValueInRange Validator**: Ensures a numeric value is within specified bounds
- **InAllowedValues Validator**: Restricts input to a predefined set of values
- **LengthInRange Validator**: Validates that the input length is within specified bounds
- **Form-level Validation**: Tracking overall form validity based on individual field states
- **Error Display**: Showing validation errors to the user

## Try It Yourself

Experiment with the validators by:
1. Leaving fields empty
2. Entering an invalid email address
3. Setting age outside the valid range
4. Selecting different role values
5. Entering text that's too short or too long in the bio field

<script setup>
import { computed } from 'vue';
import ValidatorsFormDemo from '../components/validators-demo.vue';

function getErrorMessages(field) {
  if (!field.errors || field.errors.length === 0) return [];
  return field.errors.map(error => {
    if (error.componentBody) return error.componentBody;
    if (error.text) return error.text;
    return 'Validation error';
  });
}
</script>
