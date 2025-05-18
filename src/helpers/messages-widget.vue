<template>
  <div v-if="message === ' '" class="custom-error-display text-error">
    <div
      v-for="(err, idx) in errors"
      :key="idx"
      :class="{ 'first-error': idx === 0, 'last-error': idx === errors.length - 1 }"
    >
      <div v-if="err.componentName === 'template'">{{ err.componentBody }}</div>
      <vue-markdown v-else-if="err.componentName === 'vue-markdown'" :source="(<any>err.componentBindings)?.source"/>
      <component :is="err.componentName" v-else v-bind="err.componentBindings">
        {{ err.componentBody }}
      </component>
    </div>
  </div>
  <span v-else>{{ message }}</span>
</template>

<script setup lang="ts">
import { ValidationError } from '@dynamicforms/vue-forms';
import VueMarkdown from 'vue-markdown-render';

interface Props {
  errors: ValidationError[];
  message: string;
}

defineProps<Props>();
</script>

<style scoped>
/* we would like there to be no margins for the displayed errors at the very top and very bottom. rest of it is fine */
.custom-error-display .first-error :deep(*:first-child) {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.custom-error-display .last-error :deep(*:last-child) {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
</style>
