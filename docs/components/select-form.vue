<template>
  <div class="person-form-demo">
    <v-card class="mb-4">
      <v-card-title>Person Form</v-card-title>
      <v-card-text>
        <v-form @submit.prevent>
          <v-row>
            <v-col cols="12" md="6">
              <df-input :control="personForm.fields.firstName" label="First Name" />
            </v-col>

            <v-col cols="12" md="6">
              <df-input :control="personForm.fields.lastName" label="Last Name" />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <df-input :control="personForm.fields.age" input-type="number" label="Age" />
            </v-col>

            <v-col cols="12" md="6">
              <df-checkbox :control="personForm.fields.active" label="Active" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <df-select :control="personForm.fields.country" :choices="countries" label="Country" />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn-group>
          <v-btn color="primary" @click="toggleField('firstName')">
            {{ personForm.fields.firstName.enabled ? 'Disable' : 'Enable' }}
            First Name
          </v-btn>
          <v-btn color="primary" @click="toggleField('lastName')">
            {{ personForm.fields.lastName.enabled ? 'Disable' : 'Enable' }} Last Name
          </v-btn>
          <v-btn color="primary" @click="toggleField('age')">
            {{ personForm.fields.age.enabled ? 'Disable' : 'Enable' }} Age
          </v-btn>
          <v-btn color="primary" @click="toggleField('country')">
            {{ personForm.fields.country.enabled ? 'Disable' : 'Enable' }}
            Country
          </v-btn>
        </v-btn-group>
      </v-card-actions>
    </v-card>

    <v-card>
      <v-card-title>Form Output</v-card-title>
      <v-card-text>
        <pre class="output">{{ personForm.value }}</pre>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { Group, Field, Validators, ValueChangedAction } from '@dynamicforms/vue-forms';
import { getAllCountries } from 'countries-and-timezones';

import { DfCheckbox, DfInput, DfSelect } from '../../src';

// Create a form group with fields
const personForm = new Group({
  firstName: new Field({ value: 'John' }),
  lastName: new Field({ value: 'Doe' }),
  age: new Field({ value: 30 }),
  active: new Field({ value: true }),
  country: new Field({ value: 'si', validators: [new Validators.Required()] }),
});

const countries = Object.values(getAllCountries()).map((country) => ({
  id: country.id.toLowerCase(),
  text: country.name,
}));
// Function to toggle field enabled state
const toggleField = (fieldName) => {
  const field = personForm.fields[fieldName];
  if (field) {
    field.access = field.enabled ? 'disabled' : 'editable';
  }
};

// A value changed action on the group fires whenever what the group holds changes: a field written
personForm.registerAction(
  new ValueChangedAction(async (field, supr, newValue, oldValue) => {
    return supr(field, newValue, oldValue);
  }),
);
</script>

<style scoped>
.person-form-demo {
  margin: 2rem 0;
}
.output {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
}
</style>
