<template>
  <messages-widget :message="widgetMessage" :classes="widgetClasses" />
  <div v-if="hiddenHint" class="df-sr-only"><messages-widget :message="hiddenHint" /></div>
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
  hint: '',
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

function asWidgetMessage(message: DfInputHintProps['message']) {
  if (typeof message === 'string' || Array.isArray(message)) return message;
  return [new RenderableValue(message as Exclude<typeof message, readonly RenderableValue[]>)];
}

const widgetMessage = computed(() => (isError.value ? props.errors : asWidgetMessage(props.message)));

// the hint the errors replace on screen stays in the row, which the control's aria-describedby references
const hiddenHint = computed(() => (isError.value && props.hint ? asWidgetMessage(props.hint) : null));

const widgetClasses = computed(() => {
  return isError.value ? props.errorClasses : props.messageClasses;
});
</script>

<style scoped></style>
