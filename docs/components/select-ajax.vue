<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Dynamic options loading</v-card-title>
      <v-card-text>
        <div class="mb-4 d-flex">
          <df-checkbox v-model="multiple" label="Multiple choice" />
          <df-checkbox v-model="allowNull" label="Allow null" />
          <df-checkbox v-model="allowTags" label="Allow new value entry" />
          <df-checkbox v-model="minQuery" label="Minimum query of two letters" />
        </div>

        <df-select
          v-model="selectedLanguages"
          :fetch-choices="fetchLanguages"
          :multiple="multiple"
          :allow-null="allowNull"
          :allow-tags="allowTags"
          :min-query-length="minQuery ? 2 : 0"
          min-query-text="Type at least two letters of the language name."
          no-data-text="No languages found."
          :fetch-debounce="300"
          :label="new Label('Programming languages', 'mdi-abacus')"
        />

        <div class="mt-4">
          <strong>Selected value:</strong>
          {{ selectedLanguages }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

import { DfCheckbox, DfSelect, HtmlString, Label } from '../../src';

const multiple = ref(false);
const allowNull = ref(true);
const allowTags = ref(false);
const minQuery = ref(false);
const selectedLanguages = ref(null);

// Reset selected value when toggling multiple
watch(multiple, (newValue) => {
  selectedLanguages.value = newValue ? [] : null;
});

const programmingLanguages = [
  { id: 'js', name: 'JavaScript', typing: 'Dynamically typed', icon: 'mdi-language-javascript' },
  { id: 'ts', name: 'TypeScript', typing: 'Statically typed', icon: 'mdi-language-typescript' },
  { id: 'py', name: 'Python', typing: 'Dynamically typed', icon: 'mdi-language-python' },
  { id: 'java', name: 'Java', typing: 'Statically typed', icon: 'mdi-language-java' },
  { id: 'csharp', name: 'C#', typing: 'Statically typed', icon: 'mdi-language-csharp' },
  { id: 'cpp', name: 'C++', typing: 'Statically typed', icon: 'mdi-language-cpp' },
  { id: 'go', name: 'Go', typing: 'Statically typed', icon: 'mdi-language-go' },
  { id: 'ruby', name: 'Ruby', typing: 'Dynamically typed', icon: 'mdi-language-ruby' },
  { id: 'php', name: 'PHP', typing: 'Dynamically typed', icon: 'mdi-language-php' },
  { id: 'swift', name: 'Swift', typing: 'Statically typed', icon: 'mdi-language-swift' },
];

// the name on the first line, the typing discipline on the second
const toChoice = ({ id, name, typing, icon }) => ({ id, icon, text: new HtmlString(`${name}<br>${typing}`) });

// Simulate AJAX loading
const fetchLanguages = async (query) => {
  // console.log('Search query:', query);

  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const search = (query ?? '').toLowerCase();
  return programmingLanguages.filter((lang) => lang.name.toLowerCase().includes(search)).map(toChoice);
};
</script>

<style scoped>
.demo-container {
  margin-bottom: 20px;
}

pre {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  padding: 10px;
  border-radius: 4px;
  max-height: 100px;
  overflow: auto;
}
</style>
