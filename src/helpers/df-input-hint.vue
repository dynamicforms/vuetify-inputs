<template>
  <messages-widget :message="widgetMessage" :classes="widgetClasses" />
</template>

<script setup lang="ts">
import { MessagesWidget } from '@dynamicforms/vue-forms';
import { computed } from 'vue';

import type { DfInputHintProps } from '../dynamicforms-component-props';

const props = withDefaults(defineProps<DfInputHintProps>(), {
  errors: '',
  message: '',
  errorClasses: 'text-error',
  messageClasses: '',
});

const isError = computed(() => {
  if (props.errors) {
    if (typeof props.errors === 'string') {
      return props.errors.trim().length > 0;
    }
    return props.errors.length > 0;
  }
  return false;
});

const widgetMessage = computed(() => {
  return isError.value ? props.errors : props.message;
});

const widgetClasses = computed(() => {
  return isError.value ? props.errorClasses : props.messageClasses;
});
</script>

<style scoped></style>
