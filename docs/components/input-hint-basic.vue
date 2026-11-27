<template>
  <div class="demo-container">
    <v-card class="mb-4">
      <v-card-title>Inside an input</v-card-title>
      <v-card-text>
        <p class="mb-4">
          The field has a hint and two validators. The message row shows the hint until the field is touched and
          invalid, and the errors after that. Type a few letters and leave the field.
        </p>

        <!-- #region template -->
        <!-- The hint is shown until the field is touched and invalid -->
        <df-input :control="email" label="Email" hint="We use it for the receipt only" />

        <!-- #endregion template -->

        <div class="mt-2">
          <strong>touched:</strong>
          {{ email.touched }} &nbsp;
          <strong>errors:</strong>
          {{ email.errors.length }}
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>Standalone</v-card-title>
      <v-card-text>
        <!-- #region template -->
        <df-select
          v-model="errorSource"
          :choices="errorSources"
          :allow-null="false"
          label="What the errors prop holds"
          class="mb-4"
        />

        <!-- Standalone, with a plain string in each of the two props -->
        <div class="row-frame">
          <df-input-hint
            :errors="standaloneErrors"
            message="Shown while there is no error"
            message-classes="text-medium-emphasis"
          />
        </div>

        <!-- #endregion template -->

        <p class="mt-4 mb-0">
          The middle option passes three spaces. An
          <code>errors</code>
          string of whitespace only is no error, so the message is shown.
        </p>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>A group's errors</v-card-title>
      <v-card-text>
        <p class="mb-4">
          The rule spans two fields, so its error sits on the group. One
          <code>df-input-hint</code>
          renders it under the pair, with
          <code>errorClasses</code>
          naming a colour of its own.
        </p>

        <!-- #region template -->
        <v-row>
          <v-col cols="12" md="6">
            <df-input :control="credentials.fields.password" input-type="password" label="Password" />
          </v-col>
          <v-col cols="12" md="6">
            <df-input :control="credentials.fields.confirmation" input-type="password" label="Repeat password" />
          </v-col>
        </v-row>

        <!-- The group's own errors, in a colour of their own -->
        <df-input-hint :errors="credentials.errors" error-classes="text-warning font-weight-bold" />
        <!-- #endregion template -->
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
// #region setup
import { Field, Group, ValidationError, Validators } from '@dynamicforms/vue-forms';
import { computed, ref } from 'vue';

import { DfInput, DfInputHint, DfSelect } from '../../src';

const email = new Field<string>({
  value: '',
  validators: [
    new Validators.Required(),
    new Validators.Pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, {
      code: 'app.invalid_email',
      detail: 'An address of the form name@example.com, please',
    }),
  ],
});

const errorSources = [
  { id: 'none', text: 'An empty string' },
  { id: 'blank', text: 'Three spaces' },
  { id: 'text', text: 'An error message' },
];

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
    return [new ValidationError('app.passwords_differ', {}, 'The two entries do not match')];
  }),
);
// #endregion setup
</script>

<style scoped>
.row-frame {
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 0.5rem;
  min-height: 2rem;
}
</style>
