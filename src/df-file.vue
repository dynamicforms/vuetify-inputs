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
      <div
        class="d-flex w-100 position-relative df-input-wrapper"
        :class="[density, { 'df-file-dragging': isDragging }]"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
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
        >
          <template v-if="canDownload" #append-inner>
            <button
              type="button"
              class="df-file-download-btn"
              :title="t.FileDownload"
              :aria-label="t.FileDownload"
              @click.stop.prevent="downloadFile"
            >
              <cached-icon name="mdi-download" />
            </button>
          </template>
        </v-file-input>
      </div>
    </template>
  </input-base>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfFileProps } from './dynamicforms-component-props';
import {
  BaseEmits,
  defaultBaseProps,
  InputBase,
  setFileGoneError,
  translatableStrings,
  useFileTouchKeepAlive,
  useInputBase,
} from './helpers';

const props = withDefaults(defineProps<DfFileProps>(), defaultBaseProps);

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { density, densityClass, touched, value, vuetifyBindings } = useInputBase(props, emits);
const t = translatableStrings;

// State
const currentFile = ref<File | null>(null);
const progress = ref(0);
const fileInputKey = ref(Math.round(Math.random() * 1000));
const selectedFile = ref<File | null>();
const dragCounter = ref(0);
const loading = computed(() => currentFile.value && progress.value < 100);
const isDisabled = computed(() => !!(vuetifyBindings.value.disabled || vuetifyBindings.value.readonly));
const isDragging = computed(() => dragCounter.value > 0);

const fileLabel = computed(() => {
  if (!selectedFile.value && value.value) {
    return value.value;
  }
  return '';
});

const canDownload = computed(() => !selectedFile.value && !!value.value && !!props.comms.getDownloadUrl);

async function downloadFile() {
  if (!value.value || !props.comms.getDownloadUrl) return;

  const url = await props.comms.getDownloadUrl(value.value);
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  link.rel = 'noopener';
  link.click();
}

function resetFileState() {
  value.value = null;
  progress.value = 0;
  fileInputKey.value = Math.round(Math.random() * 1000);
  currentFile.value = null;
  selectedFile.value = null;
  clearTouchInterval();
}

function handleFileGone(errorText: string) {
  resetFileState();
  setFileGoneError(props.control, errorText);
}

const { setupTouchInterval, clearTouchInterval } = useFileTouchKeepAlive(
  value,
  () => props.comms,
  () => props.touchInterval,
  handleFileGone,
);

async function removeFile() {
  if (value.value) {
    await props.comms.delete(value.value);
  }

  resetFileState();
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

function onDragEnter() {
  if (isDisabled.value) return;
  dragCounter.value += 1;
}
function onDragLeave() {
  dragCounter.value = Math.max(0, dragCounter.value - 1);
}
function onDrop(event: DragEvent) {
  dragCounter.value = 0;
  if (isDisabled.value) return;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    selectedFile.value = file;
    upload(file);
  }
}
</script>

<style>
.df-file-download-btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  opacity: 0.7;
}
.df-file-download-btn:hover {
  opacity: 1;
}

.df-file-dragging {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: -2px;
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
