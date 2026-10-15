<template>
  <input-base v-bind="{ ...props, loading } as any" :class="densityClass" @click:clear="clear" @blur="touched = true">
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
        >
          <template v-if="canDownload" #append-inner>
            <button
              type="button"
              class="df-file-download-btn"
              :title="t('FileDownload')"
              :aria-label="t('FileDownload')"
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
import { computed, ref, watch } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfFileProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, InputBase, translate, useInputBase } from './helpers';
import { useFileUpload } from './helpers/use-file-upload';

const props = withDefaults(defineProps<DfFileProps>(), defaultBaseProps);

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { density, densityClass, touched, value, vuetifyBindings } = useInputBase(props, emits);
const t = translate;

const { currentFile, progress, loading, upload, clear } = useFileUpload({
  value,
  touched,
  comms: () => props.comms,
  touchInterval: () => props.touchInterval,
  control: () => props.control,
});
const selectedFile = ref<File | null>();
// the file input shows the picked file only while the value holds its upload
watch(currentFile, (file) => {
  if (!file) selectedFile.value = null;
});

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

function handleFileChange(file: File | File[]): any {
  // v-file-input's readonly blocks the file dialog but not a drop
  if (vuetifyBindings.value.readonly) {
    selectedFile.value = null;
    return;
  }
  if (file) {
    if (Array.isArray(file)) {
      console.error('Uploading multiple files not supported right now');
    } else {
      upload(file);
    }
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

.df-input-wrapper .v-file-input--dragging {
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: -2px;
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
