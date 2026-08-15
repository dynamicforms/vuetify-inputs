<template>
  <div class="validators-form-demo">
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

<script setup>
import { computed } from 'vue';
import { Group, Field, MdString, ValueChangedAction, Validators } from '@dynamicforms/vue-forms';
import { DfInput, DfSelect, DfTextArea } from '../../src'

// Create a form group with validated fields
const validatedForm = new Group({
  // Required field - cannot be empty
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

// Function to reset the form
function resetForm() {
  validatedForm.fields.username.value = '';
  validatedForm.fields.email.value = '';
  validatedForm.fields.age.value = null;
  validatedForm.fields.role.value = '';
  validatedForm.fields.bio.value = '';
}

// A value changed action on the group fires for a change in any of its fields
validatedForm.registerAction(new ValueChangedAction(async (field, supr, newValue, oldValue) => {
  console.log('Form value has changed');
  return supr(field, newValue, oldValue);
}));
</script>

<style>
.validators-form-demo {
  margin: 2rem 0;
}
.output {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
}

hr {
  margin: 0 !important;
}
</style>
