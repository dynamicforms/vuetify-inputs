<template>
  <v-btn variant="text" :text="translate('Cancel')" @click="cancel" />
  <v-btn variant="text" :disabled="isPristine" :text="translate('Ok')" @click="save" />
</template>

<script setup lang="ts">
import { translate } from './translations';

/**
 * The Cancel and OK of a `v-confirm-edit`, from its default slot's `save`, `cancel` and `isPristine`. Cancel is
 * enabled while nothing has changed, so it closes the picker; `v-confirm-edit`'s own actions disable both until a
 * change. The labels are the library's strings `Cancel` and `Ok`.
 */
defineProps<{ save: () => void; cancel: () => void; isPristine: boolean }>();
</script>
