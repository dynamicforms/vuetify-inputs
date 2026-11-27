<template>
  <v-progress-linear :model-value="progress" :indeterminate="progress === -1" :aria-label="translate('Uploading')" />
</template>

<script setup lang="ts">
import { translate } from './translations';

/** `progress` is a percentage, -1 while the size of the upload is unknown. */
defineProps<{ progress: number }>();
</script>
