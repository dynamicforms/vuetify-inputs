<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Basic Text Input Examples</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <df-select
              v-model="selectedType"
              :choices="inputTypes"
              :allow-null="false"
              label="Select Input Type"
            />
          </v-col>
        </v-row>

        <df-input
          v-model="inputValue"
          :control="inputField"
          :input-type="selectedType"
          :min-length="3"
          :max-length="50"
          :pattern="selectedType === 'email' ? emailPattern : undefined"
          label="Input Field"
          :hint="getHintForType(selectedType)"
        />

        <div class="mt-4">
          <v-btn @click="toggleEnabled" color="primary" class="mr-2">
            {{ inputField.enabled ? 'Disable' : 'Enable' }} Field
          </v-btn>
          <v-btn @click="resetField" color="secondary">
            Reset Field
          </v-btn>
        </div>

        <div class="mt-4">
          <strong>Field value:</strong>
          <pre>{{ inputValue }}</pre>
        </div>

        <div class="mt-4">
          <strong>Field validity:</strong>
          <v-chip :color="inputField.valid ? 'success' : 'error'" class="ml-2">
            {{ inputField.valid ? 'Valid' : 'Invalid' }}
          </v-chip>
        </div>

        <div class="mt-4" v-if="inputField.errors.length > 0">
          <strong>Validation errors:</strong>
          <ul>
            <li v-for="(error, index) in inputField.errors" :key="index" class="error-text">
              {{ error }}
            </li>
          </ul>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Field } from '@dynamicforms/vue-forms';
import { DfInput, DfSelect } from '../../src';

const inputTypes = [
  { text: 'Text', id: 'text' },
  { text: 'Email', id: 'email' },
  { text: 'Password', id: 'password' },
  { text: 'URL', id: 'url' }
];

const selectedType = ref('text');
const inputValue = ref('');
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const inputField = Field.create({ value: '' });

watch(selectedType, (newType) => {
  // Reset field when changing input type
  console.log(newType);
  inputValue.value = '';

  // Set default value based on type
  if (newType === 'text') {
    inputValue.value = 'Sample text';
  } else if (newType === 'email') {
    inputValue.value = '';
  } else if (newType === 'url') {
    inputValue.value = 'https://';
  }
});

function toggleEnabled() {
  inputField.enabled = !inputField.enabled;
}

function resetField() {
  inputValue.value = '';
  inputField.value = '';
}

function getHintForType(type) {
  switch (type) {
    case 'text':
      return 'Enter any text (3-50 characters)';
    case 'email':
      return 'Enter a valid email address';
    case 'password':
      return 'Enter a secure password (min 3 characters)';
    case 'url':
      return 'Enter a valid URL';
    default:
      return '';
  }
}
</script>

<style scoped>
.demo-container {
  margin-bottom: 20px;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
}

.error-text {
  color: #ff5252;
}
</style>
