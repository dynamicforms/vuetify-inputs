<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>File Upload Example</v-card-title>
      <v-card-text>
        <df-file
          :control="fileField"
          :comms="fileComms"
          label="Upload Document"
          hint="Accepted file formats: PDF, DOCX, TXT (max 5MB)"
        />

        <div class="mt-4">
          <v-btn @click="toggleEnabled" color="primary" class="mr-2">
            {{ fileField.enabled ? 'Disable' : 'Enable' }} Field
          </v-btn>
        </div>

        <div class="mt-4">
          <strong>Field value (file ID):</strong>
          <pre>{{ fileField.value || 'No file uploaded' }}</pre>
        </div>

        <div v-if="uploadedFiles.length > 0" class="mt-4">
          <strong>Uploaded files:</strong>
          <ul>
            <li v-for="(file, index) in uploadedFiles" :key="index">
              {{ file.name }} ({{ formatFileSize(file.size) }})
              <v-icon color="green">check</v-icon>
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
import { DfFile } from '../../src';

const fileField = Field.create({
  value: null
});

const uploadedFiles = ref([]);

// Mock implementation of FileComms for demo purposes
const fileComms = {
  upload: async (file, progressCallback) => {
    // Simulate network delay and progress updates
    const totalSize = file.size;
    let loaded = 0;
    const chunkSize = totalSize / 10;

    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      loaded += chunkSize;
      if (progressCallback) {
        progressCallback(loaded, totalSize);
      }
    }

    // Store the uploaded file in our local array
    uploadedFiles.value.push(file);

    // Return a mock file ID
    return `file-${Date.now()}-${file.name}`;
  },

  delete: async (fileIdentifier) => {
    // In a real implementation, this would call an API to delete the file
    console.log('Deleting file:', fileIdentifier);
    await new Promise(resolve => setTimeout(resolve, 500));

    // For demo purposes, we'll just clear our local array
    uploadedFiles.value = [];

    return Promise.resolve();
  },

  touch: async (fileIdentifier) => {
    // In a real implementation, this would call an API to "touch" the file
    console.log('Touching file:', fileIdentifier);
    return Promise.resolve();
  }
};

function toggleEnabled() {
  fileField.enabled = !fileField.enabled;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
