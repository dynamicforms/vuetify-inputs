<template>
  <messages-widget :message="widgetMessage" :classes="widgetClasses" />
  <div v-if="hiddenHint" class="df-sr-only"><messages-widget :message="hiddenHint" /></div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import type { DfInputHintProps } from '../dynamicforms-component-props';

import { inputContextKey } from './input-context';
import MessagesWidget from './messages-widget.vue';
import { RenderableValue } from './render-content';

const props = withDefaults(defineProps<DfInputHintProps>(), {
  errors: undefined,
  message: '',
  errorClasses: 'text-error',
  messageClasses: '',
  hint: undefined,
});

const input = inject(inputContextKey, null);
const errors = computed(() => props.errors ?? input?.shownErrors.value ?? '');
const hint = computed(() => props.hint ?? input?.hint.value ?? '');

const isError = computed(() => {
  if (errors.value) {
    if (typeof errors.value === 'string') {
      return errors.value.trim().length > 0;
    }
    return errors.value.length > 0;
  }
  return false;
});

function asWidgetMessage(message: DfInputHintProps['message']) {
  if (typeof message === 'string' || Array.isArray(message)) return message;
  return [new RenderableValue(message as Exclude<typeof message, readonly RenderableValue[]>)];
}

const widgetMessage = computed(() => (isError.value ? errors.value : asWidgetMessage(props.message)));

// the hint the errors replace on screen stays in the row, which the control's aria-describedby references
const hiddenHint = computed(() => (isError.value && hint.value ? asWidgetMessage(hint.value) : null));

const widgetClasses = computed(() => {
  return isError.value ? props.errorClasses : props.messageClasses;
});
</script>

<style scoped></style>
