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
          <v-btn color="primary" class="mr-2" @click="toggleEnabled">
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
              <cached-icon style="color: green" name="mdi-check" />
            </li>
          </ul>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { Field } from '@dynamicforms/vue-forms';
import { ref } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfFile } from '../../src';

import { mockFileComms } from './demo-file-comms';

const fileField = new Field({
  value: 'contracts/existing-agreement.pdf',
});

const uploadedFiles = ref([]);

const fileComms = mockFileComms({
  steps: 1000,
  stepMs: 3,
  result: (file) => `file-${Date.now()}-${file.name}`,
  onUpload: (file) => uploadedFiles.value.push(file),
  onDelete: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    uploadedFiles.value = [];
  },
  // a real backend resolves to a signed URL or a same-origin download path
  getDownloadUrl: (fileIdentifier) =>
    URL.createObjectURL(
      new Blob([`Hello world!\n\nThis is a mock download standing in for: ${fileIdentifier}`], { type: 'text/plain' }),
    ),
});

function toggleEnabled() {
  fileField.access = fileField.enabled ? 'disabled' : 'editable';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script>
