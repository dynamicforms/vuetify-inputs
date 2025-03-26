<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>RTF Editor Example</v-card-title>
      <v-card-text>
        <df-rtf-editor
          :control="contentField"
          label="Content"
          hint="Use the rich text editor to format your content"
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
import { DfRtfEditor } from '../../src';

const contentField = Field.create({
  value: '<h2>Welcome to RTF Editor</h2><p>This is a <strong>rich text editor</strong> component that uses ' +
    '<a href="https://ckeditor.com/">CKEditor</a> as its foundation.</p><p>You can:</p><ul><li>Format text with ' +
    '<strong>bold</strong>, <em>italic</em>, and other styles</li><li>Insert links, images, and media</li>' +
    '<li>Create lists and tables</li><li>And much more...</li></ul>'
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
