<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>DateTime Example</v-card-title>
      <v-card-text>
        <df-date-time
          :control="dateTimeField"
          label="Select date and time"
          hint="Click to select date and time"
        />

        <div class="mt-4">
          <v-btn @click="toggleEnabled" color="primary" class="mr-2">
            {{ dateTimeField.enabled ? 'Disable' : 'Enable' }} field
          </v-btn>
          <v-btn @click="resetField" color="secondary">
            Reset field
          </v-btn>
        </div>

        <div class="mt-4">
          <strong>Field value:</strong>
          <pre>{{ dateTimeField.value == null ? 'null' : dateTimeField.value }}</pre>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mt-4">
      <v-card-title>Date Only Example</v-card-title>
      <v-card-text>
        <df-date-time
          :control="dateField"
          label="Select date"
          input-type="date"
          display-format="dd.MM.yyyy"
          hint="Date only, no time"
        />

        <div class="mt-4">
          <strong>Field value:</strong>
          <pre>{{ dateField.value == null ? 'null' : dateField.value }}</pre>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mt-4">
      <v-card-title>Time Only Example</v-card-title>
      <v-card-text>
        <df-date-time
          :control="timeField"
          label="Select time"
          input-type="time"
          display-format="HH:mm:ss"
          hint="Time only, no date"
        />

        <div class="mt-4">
          <strong>Field value:</strong>
          <pre>{{ timeField.value == null ? 'null' : timeField.value }}</pre>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { Field } from '@dynamicforms/vue-forms';
import { DfDateTime } from '../../src';

const dateTimeField = Field.create({
  value: new Date().toISOString(),
});

const dateField = Field.create({
  value: new Date().toISOString().split('T')[0]
});

const timeField = Field.create({
  value: new Date().toISOString().split('T')[1].split('.')[0]
});

function toggleEnabled() {
  dateTimeField.enabled = !dateTimeField.enabled;
}

function resetField() {
  dateTimeField.value = new Date().toISOString();
}
</script>

<style scoped>
.demo-container {
  margin: 1rem 0;
}

pre {
  background-color: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  max-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
