<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Image Upload Example</v-card-title>
      <v-card-text>
        <df-image :control="imageField" :comms="imageComms" label="Profile picture" hint="PNG or JPG, max 5MB" />

        <div class="mt-4">
          <v-btn @click="toggleEnabled" color="primary" class="mr-2">
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

// Stands in for an image already stored on the backend - comms.upload() must resolve to the same kind of
// directly-usable URL for a freshly uploaded image to preview and download the same way.
const existingImage =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
      '<rect width="200" height="200" fill="#1976d2"/>' +
      '<text x="50%" y="50%" fill="white" font-size="20" text-anchor="middle" dominant-baseline="middle">Profile</text>' +
      '</svg>'
  );

const imageField = new Field({ value: existingImage });

// Mock implementation of FileComms for demo purposes: upload() must resolve to whatever the <img> src should be
const imageComms = {
  upload: async (file, progressCallback) => {
    const totalSize = file.size;
    let loaded = 0;
    const chunkSize = totalSize / 20;

    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      loaded += chunkSize;
      if (progressCallback) progressCallback(loaded, totalSize);
    }

    return URL.createObjectURL(file);
  },

  delete: async (fileIdentifier) => {
    console.log('Deleting image:', fileIdentifier);
    return Promise.resolve();
  },

  touch: async (fileIdentifier) => {
    console.log('Touching image:', fileIdentifier);
    return Promise.resolve();
  },
};

function toggleEnabled() {
  imageField.enabled = !imageField.enabled;
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
  max-height: 100px;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
