<template>
  <div
    v-if="isRendered"
    class="df-input-container"
    :class="[densityClass, visibilityClass]"
    @focusin="onEnter"
    @pointerdown.capture="onEnter"
  >
    <v-text-field
      v-if="!isNumber"
      v-model="value"
      :type="inputType"
      v-bind="vuetifyBindings as any"
      @blur="touched = true"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #message="{ message }"><df-input-hint :message="message" :errors="shownErrors" /></template>
    </v-text-field>
    <v-number-input
      v-else
      :model-value="value"
      density="compact"
      control-variant="stacked"
      v-bind="{ ...vuetifyBindings, ...numberInputBindings } as any"
      @update:model-value="onNumberUpdate"
      @blur="touched = true"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #message="{ message }"><df-input-hint :message="message" :errors="shownErrors" /></template>
    </v-number-input>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, unref, watch } from 'vue';

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

const { densityClass, isRendered, label, shownErrors, touched, value, visibilityClass, vuetifyBindings } = useInputBase(
  props,
  emits,
);
const { inputType, max, min, precision, step } = toRefs(props);

const isNumber = computed(() => inputType.value === 'number');
const numberInputBindings = computed(() =>
  !isNumber.value ? {} : { min: unref(min), max: unref(max), precision: unref(precision), step: unref(step) },
);

// v-number-input corrects a value outside min and max or with more decimals than precision when it is mounted. The
// correction is held until the user enters the field - focuses it or presses one of its controls, which take no
// focus - and written then; until then the field keeps its value.
let entered = false;
let heldCorrection: { value: number | null } | null = null;

function onNumberUpdate(newValue: number | null) {
  if (entered) value.value = newValue;
  else heldCorrection = { value: newValue };
}

function onEnter() {
  if (entered) return;
  entered = true;
  const held = heldCorrection;
  heldCorrection = null;
  if (held) value.value = held.value;
}

// a value set from outside replaces the one the held correction was made for
watch(value, () => {
  heldCorrection = null;
});
</script>
