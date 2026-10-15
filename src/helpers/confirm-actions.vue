<template>
  <v-btn variant="text" :text="translate('Cancel')" @click="cancel" />
  <v-btn variant="text" :disabled="isPristine" :text="translate('Ok')" @click="save" />
</template>

<script setup lang="ts">
import { translate } from './translations';

/**
 * The Cancel and OK of a picker whose choice is written on confirmation: `save` writes the choice, `cancel` discards
 * it and `isPristine` is set while the choice equals the value. Cancel is enabled while nothing has changed, so it
 * closes the picker; `v-confirm-edit`'s own actions disable both until a change. The labels are the library's strings
 * `Cancel` and `Ok`.
 */
defineProps<{ save: () => void; cancel: () => void; isPristine: boolean }>();
</script>
