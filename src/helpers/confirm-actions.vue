<template>
  <v-btn variant="text" :text="t('$vuetify.confirmEdit.cancel')" @click="cancel" />
  <v-btn variant="text" :disabled="isPristine" :text="t('$vuetify.confirmEdit.ok')" @click="save" />
</template>

<script setup lang="ts">
import { useLocale } from 'vuetify';

/**
 * The Cancel and OK of a `v-confirm-edit`, from its default slot's `save`, `cancel` and `isPristine`. Cancel is
 * enabled while nothing has changed, so it closes the picker; `v-confirm-edit`'s own actions disable both until a
 * change.
 */
defineProps<{ save: () => void; cancel: () => void; isPristine: boolean }>();

const { t } = useLocale();
</script>
