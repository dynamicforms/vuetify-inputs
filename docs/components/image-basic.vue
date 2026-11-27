<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Image Upload Example</v-card-title>
      <v-card-text>
        <df-image :control="imageField" :comms="imageComms" label="Profile picture" hint="PNG or JPG, max 5MB" />

        <div class="mt-4">
          <v-btn color="primary" class="mr-2" @click="toggleEnabled">
            {{ imageField.enabled ? 'Disable' : 'Enable' }} Field
          </v-btn>
        </div>

        <div class="mt-4">
          <strong>Field value (image URL):</strong>
          <pre>{{ imageField.value || 'No image uploaded' }}</pre>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { Field } from '@dynamicforms/vue-forms';

import { DfImage } from '../../src';

import { mockFileComms } from './demo-file-comms';

// Stands in for an image already stored on the backend - comms.upload() must resolve to the same kind of
// directly-usable URL for a freshly uploaded image to preview and download the same way.
const existingImage =
  'data:image/svg+xml;base64,' +
  globalThis.btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
      '<rect width="200" height="200" fill="#1976d2"/>' +
      '<text x="50%" y="50%" fill="white" font-size="20" text-anchor="middle" dominant-baseline="middle">' +
      'Profile</text>' +
      '</svg>',
  );

const imageField = new Field({ value: existingImage });

// upload() resolves to whatever the <img> src should be
const imageComms = mockFileComms({ result: (file) => URL.createObjectURL(file) });

function toggleEnabled() {
  imageField.access = imageField.enabled ? 'disabled' : 'editable';
}
</script>

<style scoped>
.demo-container {
  margin: 1rem 0;
}

pre {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  padding: 0.5rem;
  border-radius: 4px;
  max-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
