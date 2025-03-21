<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Dynamic options loading</v-card-title>
      <v-card-text>
        <div class="mb-4 d-flex">
          <v-checkbox v-model="multiple" label="Multiple choice" />
          <v-checkbox v-model="allowNull" label="Allow null" />
          <v-checkbox v-model="allowTags" label="Allow new value entry" />
        </div>

        <df-select
          v-model="selectedLanguages"
          :fetch-choices="fetchLanguages"
          :multiple="multiple"
          :allow-null="allowNull"
          :allow-tags="allowTags"
          label="Programming languages"
        />

        <div class="mt-4">
          <strong>Selected value:</strong> {{ selectedLanguages }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { DfSelect } from '../../src';

const multiple = ref(false);
const allowNull = ref(true);
const allowTags = ref(false);
const selectedLanguages = ref(null);

// Reset selected value when toggling multiple
watch(multiple, (newValue) => {
  selectedLanguages.value = newValue ? [] : null;
});

const programmingLanguages = [
  { id: 'js', text: 'JavaScript', icon: 'logo-javascript' },
  { id: 'ts', text: 'TypeScript', icon: 'code-slash-outline' },
  { id: 'py', text: 'Python', icon: 'logo-python' },
  { id: 'java', text: 'Java', icon: 'cafe-outline' },
  { id: 'csharp', text: 'C#', icon: 'hash-outline' },
  { id: 'cpp', text: 'C++', icon: 'add-circle-outline' },
  { id: 'go', text: 'Go', icon: 'fish-outline' },
  { id: 'ruby', text: 'Ruby', icon: 'diamond-outline' },
  { id: 'php', text: 'PHP', icon: 'logo-html5' },
  { id: 'swift', text: 'Swift', icon: 'rocket-outline' }
];

// Simulate AJAX loading
const fetchLanguages = async (query) => {
  // console.log('Search query:', query);

  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  if (!query) return programmingLanguages;

  return programmingLanguages.filter(lang =>
    lang.text.toLowerCase().includes(query.toLowerCase())
  );
};
</script>

<style scoped>
.demo-container {
  margin-bottom: 20px;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 100px;
  overflow: auto;
}
</style>
