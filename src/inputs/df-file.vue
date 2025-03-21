<template>
  <input-base v-bind="{ value, vuetifyBindings }">
    <div style="position: relative; width: 100%">
      <v-progress-linear
        v-if="currentFile && progress < 100"
        :model-value="progress"
        :indeterminate="progress === -1"
        height="10"
        style="position: absolute; top: 50%; transform: translateY(-50%); width: 100%;"
      />
      <v-file-input
        v-model="selectedFile"
        :label="fileLabel"
        :readonly="vuetifyBindings.readonly"
        :disabled="vuetifyBindings.disabled"
        :name="vuetifyBindings.name"
        :show-size="true"
        :multiple="false"
        clearable
        :style="currentFile && progress < 100 ? 'visibility: hidden' : ''"
        @update:model-value="handleFileChange"
        @click:clear="removeFile"
      />
    </div>
  </input-base>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue';

import { BaseEmits, BaseProps, defaultBaseProps, FileComms, InputBase, useInputBase } from './helpers';

interface Props extends BaseProps {
  comms: FileComms;
}
const props = withDefaults(defineProps<Props>(), defaultBaseProps);

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { value, vuetifyBindings } = useInputBase(props, emits);
const touchInterval = ref<number | null>(null);

// State
const currentFile = ref<File | null>(null);
const progress = ref(0);
const fileInputKey = ref(Math.round(Math.random() * 1000));
const selectedFile = ref<File | null>();

const fileLabel = computed(() => {
  if (!selectedFile.value && value.value) {
    return props.modelValue;
  }
  return '';
});

function clearTouchInterval() { if (touchInterval.value) window.clearInterval(touchInterval.value); }
function setupTouchInterval() {
  clearTouchInterval();
  touchInterval.value = window.setInterval(() => {
    if (value.value) props.comms.touch(value.value);
  }, 60 * 1000);
}

onBeforeUnmount(() => clearTouchInterval());
watch(value, (newValue) => { if (newValue) setupTouchInterval(); else clearTouchInterval(); });

async function removeFile() {
  if (value.value) {
    await props.comms.delete(value.value);
  }

  value.value = null;
  progress.value = 0;
  fileInputKey.value = Math.round(Math.random() * 1000);
  currentFile.value = null;
  selectedFile.value = null;
  clearTouchInterval();
}

async function upload(file: File) {
  progress.value = -1;
  currentFile.value = file;

  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    value.value = await props.comms.upload(
      file,
      (loaded: number, total: number) => {
        progress.value = Math.round((loaded * 100) / total);
      },
    );
    progress.value = 100;
    setupTouchInterval();
  } catch (err) {
    progress.value = 0;
    currentFile.value = null;
    fileInputKey.value = Math.round(Math.random() * 1000);
    selectedFile.value = null;
    throw err;
  }
}

function handleFileChange(file: File | File[]): any {
  if (file) {
    if (Array.isArray(file)) {
      console.error('Uploading multiple files not supported right now');
    } else {
      upload(file);
    }
  }
}
</script>
