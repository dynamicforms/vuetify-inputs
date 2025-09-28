<template>
  <input-base
    v-bind="{ ...props, loading } as any"
    :class="densityClass"
    clearable
    @click:clear="removeFile"
    @blur="touched = true"
  >
    <template #prepend-inner><cached-icon name="mdi-paperclip" /></template>
    <template #loader>
      <v-progress-linear
        v-if="currentFile && progress < 100"
        :model-value="progress"
        :indeterminate="progress === -1"
      />
    </template>
    <template #default="slotProps">
      <div class="d-flex w-100 position-relative df-input-wrapper" :class="density">
        <v-file-input
          v-model="selectedFile"
          :label="fileLabel"
          density="compact"
          variant="plain"
          :readonly="vuetifyBindings.readonly"
          :disabled="vuetifyBindings.disabled"
          :name="vuetifyBindings.name"
          :hide-details="true"
          :show-size="true"
          :multiple="false"
          :style="currentFile && progress < 100 ? 'visibility: hidden' : ''"
          :clearable="false"
          v-bind="passthroughAttrs"
          prepend-icon=""
          @update:model-value="handleFileChange"
          @focus="slotProps.focus()"
          @blur="slotProps.blur()"
        />
      </div>
    </template>
  </input-base>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfFileProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, InputBase, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfFileProps>(), defaultBaseProps);

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { densityClass, touched, value, vuetifyBindings } = useInputBase(props, emits);
const touchInterval = ref<number | null>(null);

// State
const currentFile = ref<File | null>(null);
const progress = ref(0);
const fileInputKey = ref(Math.round(Math.random() * 1000));
const selectedFile = ref<File | null>();
const loading = computed(() => currentFile.value && progress.value < 100);

const fileLabel = computed(() => {
  if (!selectedFile.value && value.value) {
    return props.modelValue;
  }
  return '';
});

function clearTouchInterval() {
  if (touchInterval.value) window.clearInterval(touchInterval.value);
}
function setupTouchInterval() {
  clearTouchInterval();
  touchInterval.value = window.setInterval(() => {
    if (value.value) props.comms.touch(value.value);
  }, 60 * 1000);
}

onBeforeUnmount(() => clearTouchInterval());
watch(value, (newValue) => {
  if (newValue) setupTouchInterval();
  else clearTouchInterval();
});

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

  try {
    value.value = await props.comms.upload(file, (loaded: number, total: number) => {
      progress.value = Math.round((loaded * 100) / total);
    });
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
