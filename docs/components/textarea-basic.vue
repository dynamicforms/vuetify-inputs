<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>TextArea Example</v-card-title>
      <v-card-text>
        <df-text-area
          :control="descriptionField"
          label="Description"
          hint="Enter a detailed description"
          :rows="5"
          :max-rows="10"
        />

        <div class="mt-4">
          <v-btn @click="toggleEnabled" color="primary" class="mr-2">
            {{ descriptionField.enabled ? 'Disable' : 'Enable' }} Field
          </v-btn>
          <v-btn @click="resetField" color="secondary">
            Reset Field
          </v-btn>
        </div>

        <div class="mt-4">
          <strong>Field value:</strong>
          <pre>{{ descriptionField.value }}</pre>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { Field } from '@dynamicforms/vue-forms';
import { DfTextArea } from '../../src';

const descriptionField = Field.create({
  value: 'This is a sample description text that demonstrates the text area component with DynamicForms integration.',
});

function toggleEnabled() {
  descriptionField.enabled = !descriptionField.enabled;
}

function resetField() {
  descriptionField.value = '';
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
