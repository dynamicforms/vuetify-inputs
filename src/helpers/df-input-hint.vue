<template>
  <messages-widget :message="widgetMessage" :classes="widgetClasses" />
</template>

<script setup lang="ts">
import { ClassTypes, MessagesWidget, ValidationError } from '@dynamicforms/vue-forms';
import { computed } from 'vue';

interface Props {
  errors?: string | ValidationError[];
  message?: string | ValidationError[];
  errorClasses?: ClassTypes;
  messageClasses?: ClassTypes;
}

const props = withDefaults(defineProps<Props>(), {
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
