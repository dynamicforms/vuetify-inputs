<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Number Input Example</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <df-input
              :control="quantityField"
              input-type="number"
              :min="1"
              :max="100"
              :step="1"
              label="Quantity"
              hint="Enter a value between 1 and 100"
            />
          </v-col>

          <v-col cols="12" md="6">
            <df-input
              :control="priceField"
              input-type="number"
              :min="0"
              :max="1000"
              :step="0.01"
              :precision="2"
              label="Price"
              hint="Enter a price between 0 and 1000"
            />
          </v-col>
        </v-row>

        <div class="mt-4">
          <v-btn-group>
            <v-btn @click="increaseQuantity" color="primary" class="mr-2">
              Increase Quantity
            </v-btn>
            <v-btn @click="decreaseQuantity" color="secondary" :disabled="quantityField.value <= 1">
              Decrease Quantity
            </v-btn>
          </v-btn-group>
        </div>

        <div class="mt-4">
          <v-checkbox v-model="allowNull" label="Allow null values" />
        </div>

        <div class="mt-4">
          <strong>Total:</strong> {{ calculateTotal() }}
        </div>

        <div class="values-display mt-4">
          <h3>Current Values:</h3>
          <div class="value-item">
            <strong>Quantity:</strong> {{ quantityField.value }}
            <v-chip
              :color="quantityField.valid ? 'success' : 'error'"
              size="small"
              class="ml-2"
            >
              {{ quantityField.valid ? 'Valid' : 'Invalid' }}
            </v-chip>
          </div>

          <div class="value-item">
            <strong>Price:</strong> {{ priceField.value }}
            <v-chip
              :color="priceField.valid ? 'success' : 'error'"
              size="small"
              class="ml-2"
            >
              {{ priceField.valid ? 'Valid' : 'Invalid' }}
            </v-chip>
          </div>
        </div>

        <div class="mt-4" v-if="quantityField.errors.length > 0 || priceField.errors.length > 0">
          <strong>Validation errors:</strong>
          <ul>
            <li v-for="(error, index) in quantityField.errors" :key="`q-${index}`" class="error-text">
              Quantity: {{ error }}
            </li>
            <li v-for="(error, index) in priceField.errors" :key="`p-${index}`" class="error-text">
              Price: {{ error }}
            </li>
          </ul>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Field } from '@dynamicforms/vue-forms';
import { DfInput } from '../../src';

const allowNull = ref(false);

const quantityField = Field.create({ value: 1 });
const priceField = Field.create({ value: 10.99 });

function increaseQuantity() {
  if (quantityField.value === null) {
    quantityField.value = 1;
  } else {
    quantityField.value = Math.min(100, quantityField.value + 1);
  }
}

function decreaseQuantity() {
  if (quantityField.value === null) {
    quantityField.value = 1;
  } else if (quantityField.value > 1) {
    quantityField.value -= 1;
  }
}

function calculateTotal() {
  if (quantityField.value === null || priceField.value === null) {
    return 'N/A';
  }

  const total = quantityField.value * priceField.value;
  return `$${total.toFixed(2)}`;
}
</script>

<style scoped>
.demo-container {
  margin-bottom: 20px;
}

.values-display {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
}

.value-item {
  margin: 8px 0;
}

.error-text {
  color: #ff5252;
}

:deep(hr) {
  margin: 0 !important;
}
</style>
