<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Basic example</v-card-title>
      <v-card-text>
        <df-select
          v-model="selectedFruit"
          :choices="fruits"
          label="Choose your fruit"
          :multiple="true"
        />

        <div class="mt-4">
          <strong>Selected value:</strong> {{ selectedFruit }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import { DfSelect } from '../../src';

const selectedFruit = ref('cherry');
const fruits = [
  { id: 'apple', text: 'Apple' },
  { id: 'banana', text: 'Banana' },
  { id: 'cherry', text: 'Cherry' },
  { id: 'durian', text: 'Durian' },
  { id: 'elder', text: 'Elderflower' }
];
</script>

<style scoped>
.demo-container {
  margin-bottom: 20px;
}
</style>
