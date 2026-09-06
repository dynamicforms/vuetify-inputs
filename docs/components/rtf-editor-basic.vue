<template>
  <div class="demo-container">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        RTF Editor Example
        <div class="d-flex align-center">
          <span class="me-2 text-body-2">Toolbar button size:</span>
          <v-select
            v-model="toolbarButtonSize"
            :items="toolbarButtonSizeOptions"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 10em"
          ></v-select>
        </div>
      </v-card-title>
      <v-card-text>
        <df-rtf-editor
          :control="contentField"
          label="Content"
          hint="Use the rich text editor to format your content"
          :toolbar-button-size="toolbarButtonSize"
        />

        <div class="mt-4">
          <v-btn @click="toggleEnabled" color="primary" class="mr-2">
            {{ contentField.enabled ? 'Disable' : 'Enable' }} Editor
          </v-btn>
          <v-btn @click="resetField" color="secondary">
            Reset Content
          </v-btn>
        </div>

        <div class="mt-4">
          <strong>HTML Output:</strong>
          <pre>{{ contentField.value }}</pre>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { Field } from '@dynamicforms/vue-forms';
import { ref } from 'vue';
import { DfRtfEditor } from '../../src';

const toolbarButtonSizeOptions = ['x-small', 'small', 'default', 'large', 'x-large'];
const toolbarButtonSize = ref('small');

const contentField = new Field({
  value: '<h2>Welcome to RTF Editor</h2><p>This is a <strong>rich text editor</strong> component built on ' +
    '<a href="https://tiptap.dev/">TipTap</a>.</p><p>You can:</p><ul><li>Format text with ' +
    '<strong>bold</strong>, <em>italic</em>, and headings</li><li>Insert links, images, and tables</li>' +
    '<li>Create bulleted and numbered lists</li><li>And much more...</li></ul>'
});

function toggleEnabled() {
  contentField.enabled = !contentField.enabled;
}

function resetField() {
  contentField.value = '<p>Content has been reset.</p>';
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
  max-height: 150px;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 0.8rem;
}

.preview-container {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-top: 0.5rem;
  background-color: #ffffff;
}
</style>
