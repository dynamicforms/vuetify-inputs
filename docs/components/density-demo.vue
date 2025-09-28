<template>
  <div class="density-demo" :class="{ fullscreen }">
    <v-card class="mb-4">
      <v-card-title>Density and Variant Demo</v-card-title>
      <v-card-text>
        <v-row class="mb-6">
          <v-col cols="6" class="d-flex justify-center">
            <df-select
              v-model="selectedVariant"
              :choices="variantOptions"
              label="Select Variant"
              :variant="selectedVariant"
            />
          </v-col>
          <v-col cols="6" class="d-flex justify-center">
            <v-btn color="primary" @click="fullscreen = !fullscreen">
              {{ fullscreen ? 'Return' : 'stretch demo to browser' }}
            </v-btn>
          </v-col>
        </v-row>

        <div class="demo-grid-scroller">
          <div class="demo-grid">
            <!-- Header row -->
            <div class="grid-header">
              <div class="density-label"></div>
              <div
                v-for="component in components"
                :key="component.name"
                class="component-header"
              >
                {{ component.label }}
              </div>
            </div>
            <div style="grid-column: 1/9; border-top: 1px solid #666"/>
            <!-- Density rows -->
            <template v-for="density in densityOptions" :key="density">
              <div class="grid-row">
                <div class="density-label">{{ density }}</div>
                <div
                  v-for="component in components"
                  :key="`${density}-${component.name}`"
                  class="component-cell"
                >
                  <component
                    :is="component.component"
                    v-model="formData[component.model]"
                    :label="component.label"
                    v-bind="component.props"
                    :variant="selectedVariant"
                    :density="density"
                  />
                </div>
              </div>
              <div style="grid-column: 1/9; border-top: 1px solid #666"/>
            </template>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {
  DfInput,
  DfSelect,
  DfCheckbox,
  DfDateTime,
  DfFile,
  DfTextArea,
  DfColor
} from '../../src';

const selectedVariant = ref('outlined');
const fullscreen = ref(false);

const variantOptions = [
  { text: 'Outlined', id: 'outlined' },
  { text: 'Filled', id: 'filled' },
  { text: 'Underlined', id: 'underlined' },
  { text: 'Plain', id: 'plain' },
  { text: 'Solo', id: 'solo' },
  { text: 'Solo Inverted', id: 'solo-inverted' },
  { text: 'Solo Filled', id: 'solo-filled' },
];

const densityOptions = ['default', 'compact', 'comfortable', 'inline'];

const formData = ref({
  input: 'Sample text',
  select: 'option1',
  checkbox: true,
  datetime: new Date().toISOString().split('T')[0],
  file: null,
  textarea: 'Sample text area content',
  color: '#1976d2'
});

const selectChoices = [
  { id: 'option1', text: 'Option 1' },
  { id: 'option2', text: 'Option 2' },
  { id: 'option3', text: 'Option 3' }
];

// Mock file communications for df-file component
const mockFileComms = {
  upload: async (file, progressCallback) => {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 20) {
      if (progressCallback) progressCallback(i, 100);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return `file-${Date.now()}`;
  },
  delete: async (fileId) => {
    console.log('Delete file:', fileId);
  },
  touch: async (fileId) => {
    console.log('Touch file:', fileId);
  }
};

const components = [
  { name: 'input', label: 'df-input', component: DfInput, model: 'input', props: {} },
  { name: 'select', label: 'df-select', component: DfSelect, model: 'select', props: { choices: selectChoices } },
  { name: 'checkbox', label: 'df-checkbox', component: DfCheckbox, model: 'checkbox', props: {} },
  { name: 'datetime', label: 'df-date-time', component: DfDateTime, model: 'datetime', props: { inputType: 'date' } },
  { name: 'file', label: 'df-file', component: DfFile, model: 'file', props: { comms: mockFileComms } },
  { name: 'textarea', label: 'df-text-area', component: DfTextArea, model: 'textarea', props: { rows: 1 } },
  { name: 'color', label: 'df-color', component: DfColor, model: 'color', props: {} }
];
</script>

<style scoped>
.fullscreen {
  position: fixed;
  inset:    0;
  z-index:  1000;
}

.fullscreen > .v-card {
  height: 100%;
}

.demo-grid-scroller {
  overflow-x: scroll;
}

.demo-grid {
  display:               grid;
  grid-template-columns: repeat(4, minmax(8em, max-content)) minmax(11em, max-content) repeat(3, minmax(8em, max-content));
  gap:                   8px;
  align-items:           center;
}

.grid-header {
  display: contents;
}

.grid-row {
  display: contents;
}

.density-label {
  font-weight:   600;
  text-align:    right;
  padding-right: 1em;
  color:         #666;
  font-size:     0.875rem;
}

.component-header {
  font-weight:      600;
  text-align:       center;
  padding:          8px 4px;
  background-color: #f5f5f5;
  border-radius:    4px;
  font-size:        0.75rem;
  color:            #666;
}

.component-cell > * {
  width: 100%;
}
</style>
