<template>
  <div class="df-input-container" :class="densityClass">
    <v-text-field
      v-if="!isNumber"
      v-model="value"
      :type="inputType"
      v-bind="vuetifyBindings as any"
      @blur="touched = true"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #message="{ message }"><df-input-hint :message="message" :errors="showErrors" /></template>
    </v-text-field>
    <v-number-input
      v-else
      v-model="value"
      density="compact"
      control-variant="stacked"
      v-bind="{ ...vuetifyBindings, ...numberInputBindings } as any"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #message="{ message }"><df-input-hint :message="message" :errors="showErrors" /></template>
    </v-number-input>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, unref } from 'vue';

import { DfInputProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfInputProps>(), {
  ...defaultBaseProps,
  inputType: 'text',
  precision: null,
  step: undefined,
  min: undefined,
  max: undefined,
});

interface Emits extends BaseEmits {}

const emits = defineEmits<Emits>();

const { densityClass, label, showErrors, touched, value, vuetifyBindings } = useInputBase(props, emits);
const { inputType, max, min, precision, step } = toRefs(props);

const isNumber = computed(() => inputType.value === 'number');
const numberInputBindings = computed(() =>
  !isNumber.value ? {} : { min: unref(min), max: unref(max), precision: unref(precision), step: unref(step) },
);
</script>
