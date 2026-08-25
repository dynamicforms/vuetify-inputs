<template>
  <input-base
    v-bind="{ ...props, loading } as any"
    class="df-image-field"
    :class="densityClass"
    clearable
    @click:clear="removeFile"
    @blur="touched = true"
  >
    <template #prepend-inner><cached-icon name="mdi-image" /></template>
    <template #loader>
      <v-progress-linear
        v-if="currentFile && progress < 100"
        :model-value="progress"
        :indeterminate="progress === -1"
      />
    </template>
    <template #default="slotProps">
      <!-- click.stop: v-field's own click handler calls preventDefault whenever the click target isn't already
           the focused element, which would silently cancel a <label>'s file-picker default action before it
           can reach the input it targets. -->
      <div
        class="d-flex w-100 position-relative df-input-wrapper df-image-wrapper"
        :class="[density, { 'df-image-dragging': isDragging, 'df-image-disabled': isDisabled }]"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
        @click.stop
      >
        <input
          :id="fileInputId"
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="df-image-native-input"
          :disabled="isDisabled"
          :name="vuetifyBindings.name"
          @change="onNativeChange"
          @focus="slotProps.focus()"
          @blur="slotProps.blur()"
        />
        <label v-if="previewUrl" :for="fileInputId" class="df-image-preview-label">
          <v-img
            :src="previewUrl"
            class="df-image-preview"
            :style="currentFile && progress < 100 ? 'visibility: hidden' : ''"
          />
        </label>
        <label v-else :for="fileInputId" class="df-image-placeholder">
          <cached-icon name="mdi-tray-arrow-up" />
          <span>{{ t.ImageDropHint }}</span>
        </label>
        <label v-if="previewUrl && !isDisabled" :for="fileInputId" class="df-image-replace-btn" :title="t.ImageReplace">
          <cached-icon name="mdi-pencil" />
        </label>
      </div>
    </template>
  </input-base>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfImageProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, InputBase, translatableStrings, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfImageProps>(), defaultBaseProps);

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { density, densityClass, touched, value, vuetifyBindings } = useInputBase(props, emits);
const t = translatableStrings;
const touchInterval = ref<number | null>(null);
const fileInputId = useId();

// State
const currentFile = ref<File | null>(null);
const progress = ref(0);
const objectUrl = ref<string | null>(null);
const dragCounter = ref(0);
const fileInputRef = ref<HTMLInputElement | null>(null);

const loading = computed(() => currentFile.value && progress.value < 100);
const isDisabled = computed(() => !!(vuetifyBindings.value.disabled || vuetifyBindings.value.readonly));
const isDragging = computed(() => dragCounter.value > 0);
const previewUrl = computed<string | null>(() => objectUrl.value ?? (value.value ? (value.value as string) : null));

function clearTouchInterval() {
  if (touchInterval.value) window.clearInterval(touchInterval.value);
}
function setupTouchInterval() {
  clearTouchInterval();
  touchInterval.value = window.setInterval(() => {
    if (value.value) props.comms.touch(value.value);
  }, 60 * 1000);
}

function revokeObjectUrl() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }
}

onBeforeUnmount(() => {
  clearTouchInterval();
  revokeObjectUrl();
});
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
  currentFile.value = null;
  revokeObjectUrl();
  clearTouchInterval();
}

async function upload(file: File) {
  progress.value = -1;
  currentFile.value = file;
  revokeObjectUrl();
  objectUrl.value = URL.createObjectURL(file);

  try {
    value.value = await props.comms.upload(file, (loaded: number, total: number) => {
      progress.value = Math.round((loaded * 100) / total);
    });
    progress.value = 100;
    setupTouchInterval();
  } catch (err) {
    progress.value = 0;
    currentFile.value = null;
    revokeObjectUrl();
    throw err;
  }
}

function handleFile(file: File) {
  if (!file.type.startsWith('image/')) {
    console.error('Only image files are supported');
    return;
  }
  upload(file);
}

function onNativeChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) handleFile(file);
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
  if (file) handleFile(file);
}
</script>

<style>
/* .df-sub-field caps itself at the height of a single-line input; without lifting that cap here, the taller
   image area would keep the field's own layout box small and just paint over whatever follows it on the page. */
.df-image-field .df-sub-field {
  max-height: revert;
}

.df-image-wrapper {
  height: 160px;
  border: 1px dashed rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  overflow: hidden;
}
.df-image-wrapper.df-image-dragging {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
}
.df-image-wrapper.df-image-disabled .df-image-placeholder,
.df-image-wrapper.df-image-disabled .df-image-preview-label {
  cursor: not-allowed;
}

/* Visually hidden but focusable (keyboard-reachable) and clickable via its <label>s. */
.df-image-native-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}
.df-image-native-input:focus-visible ~ label {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.df-image-preview-label,
.df-image-preview {
  display: block;
  width: 100%;
  height: 100%;
}
/* a host page's own typography reset (e.g. margin on bare <img> tags) would otherwise offset v-img's <img> from
   the box it's meant to fill exactly, clipping it against .df-image-wrapper's overflow:hidden */
.df-image-preview img {
  margin: 0;
}
.df-image-preview-label {
  cursor: pointer;
}

.df-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
}

.df-image-replace-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  background-color: rgba(var(--v-theme-surface), 0.9);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>
