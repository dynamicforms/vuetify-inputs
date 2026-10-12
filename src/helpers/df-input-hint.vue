<template>
  <messages-widget :message="widgetMessage" :classes="widgetClasses" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { DfInputHintProps } from '../dynamicforms-component-props';

import MessagesWidget from './messages-widget.vue';
import { RenderableValue } from './render-content';

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
  if (isError.value) return props.errors;
  const message = props.message;
  if (typeof message === 'string' || Array.isArray(message)) return message;
  return [new RenderableValue(message as Exclude<typeof message, readonly RenderableValue[]>)];
});

const widgetClasses = computed(() => {
  return isError.value ? props.errorClasses : props.messageClasses;
});
</script>

<style scoped></style>
