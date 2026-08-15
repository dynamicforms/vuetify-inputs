<template>
  <div v-if="isRendered" class="df-textarea-container" :class="[densityClass, visibilityClass]">
    <v-textarea
      v-model="value"
      :class="cssClass"
      :rows="rows"
      :auto-grow="(maxRows || 0) > 0"
      :max-rows="maxRows"
      v-bind="vuetifyBindings as any"
      @blur="touched = true"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #message="{ message }"><df-input-hint :message="message" :errors="showErrors" /></template>
    </v-textarea>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';

import { DfTextAreaProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfTextAreaProps>(), {
  ...defaultBaseProps,
  rows: undefined,
  maxRows: undefined,
});

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { densityClass, isRendered, label, showErrors, touched, value, visibilityClass, vuetifyBindings } = useInputBase(
  props,
  emits,
);
const { cssClass } = toRefs(props);
</script>
