<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Color Picker Example</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <df-color
              :control="colorField"
              label="Choose a color"
              hint="Click to select a color or enter hex value"
            />
          </v-col>

          <v-col cols="12" md="6">
            <df-color
              v-model="directColor"
              label="Direct v-model color"
              hint="Using v-model directly without Field control"
              :allow-null="true"
            />
          </v-col>
        </v-row>

        <div class="mt-4">
          <v-btn @click="toggleEnabled" color="primary" class="mr-2">
            {{ colorField.enabled ? 'Disable' : 'Enable' }} Field
          </v-btn>
          <v-btn @click="resetField" color="secondary" class="mr-2">
            Reset Field
          </v-btn>
          <v-btn-group>
            <v-btn @click="setColor('#FF0000')" color="red">Red</v-btn>
            <v-btn @click="setColor('#00FF00')" color="green">Green</v-btn>
            <v-btn @click="setColor('#0000FF')" color="blue">Blue</v-btn>
          </v-btn-group>
        </div>

        <div class="mt-4">
          <strong>Field value:</strong> {{ colorField.value || 'No color selected' }}
        </div>

        <div class="mt-4">
          <strong>Direct v-model value:</strong> {{ directColor || 'No color selected' }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {Field, MdString, Validators} from '@dynamicforms/vue-forms';
import { DfColor } from '../../src';

const colorField = Field.create({
  value: '#42A5F5',
  validators: [
    new Validators.Pattern(
      /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/,
      new MdString('Please enter a valid **hex color code** (e.g., *#FF0000* or *#FF0000FF*)'),
    ),
  ]
});

const directColor = ref('#81C784');

function toggleEnabled() {
  colorField.enabled = !colorField.enabled;
}

function resetField() {
  colorField.value = '#42A5F5';
}

function setColor(color) {
  colorField.value = color;
}
</script>

<style scoped>
.demo-container {
  margin-bottom: 20px;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-text {
  color: #ff5252;
}
</style>
