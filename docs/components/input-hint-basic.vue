<template>
  <div class="input-hint-demo">
    <v-card class="mb-4">
      <v-card-title>Inside an input</v-card-title>
      <v-card-text>
        <p class="mb-4">
          The field has a hint and two validators. The message row shows the hint until the field is touched and
          invalid, and the errors after that. Type a few letters and leave the field.
        </p>

        <df-input :control="email" label="Email" hint="We use it for the receipt only" />

        <div class="mt-2">
          <strong>touched:</strong> {{ email.touched }} &nbsp; <strong>errors:</strong> {{ email.errors.length }}
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>Standalone</v-card-title>
      <v-card-text>
        <df-select
          v-model="errorSource"
          :choices="errorSources"
          :allow-null="false"
          label="What the errors prop holds"
          class="mb-4"
        />

        <div class="row-frame">
          <df-input-hint
            :errors="standaloneErrors"
            message="Shown while there is no error"
            message-classes="text-medium-emphasis"
          />
        </div>

        <p class="mt-4 mb-0">
          The middle option passes three spaces. An <code>errors</code> string of whitespace only is no error, so the
          message is shown.
        </p>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>A group's errors</v-card-title>
      <v-card-text>
        <p class="mb-4">
          The rule spans two fields, so its error sits on the group. One
          <code>df-input-hint</code> renders it under the pair, with <code>errorClasses</code> naming a colour of its
          own.
        </p>

        <v-row>
          <v-col cols="12" md="6">
            <df-input :control="credentials.fields.password" input-type="password" label="Password" />
          </v-col>
          <v-col cols="12" md="6">
            <df-input :control="credentials.fields.confirmation" input-type="password" label="Repeat password" />
          </v-col>
        </v-row>

        <df-input-hint :errors="credentials.errors" error-classes="text-warning font-weight-bold" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
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

const standaloneErrors = computed(() => {
  if (errorSource.value === 'blank') return '   ';
  if (errorSource.value === 'text') return 'The value is not one of the allowed ones';
  return '';
});

const credentials = new Group({
  password: new Field<string>({ value: '' }),
  confirmation: new Field<string>({ value: '' }),
});

credentials.registerAction(
  new Validators.Validator(() => {
    const { password, confirmation } = credentials.fields;
    if (!confirmation.value || password.value === confirmation.value) return null;
    return [new ValidationError('app.passwords_differ', {}, 'The two entries do not match')];
  }),
);
</script>

<style scoped>
.input-hint-demo {
  margin: 2rem 0;
}

.row-frame {
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 0.5rem;
  min-height: 2rem;
}
</style>
