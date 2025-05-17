<template>
  <div class="container">
    <v-text-field
      v-if="!isNumber"
      v-model="value"
      v-bind="vuetifyBindings as any"
      :type="inputType"
    >
      <template v-if="label.icon" #label="labelData"><df-label :data="labelData" :label="label"/></template>
      <template #message="{ message }"><messages-widget :message="message" :errors="errors"/></template>
    </v-text-field>
    <v-number-input
      v-else
      v-model="value"
      v-bind="{ ...vuetifyBindings, ...numberInputBindings } as any"
      density="compact"
      control-variant="stacked"
    >
      <template v-if="label.icon" #label="labelData"><df-label :data="labelData" :label="label"/></template>
      <template #message="{ message }"><messages-widget :message="message" :errors="errors"/></template>
    </v-number-input>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, unref } from 'vue';

import { BaseEmits, BaseProps, defaultBaseProps, DfLabel, MessagesWidget, useInputBase } from './helpers';

interface Props extends BaseProps {
  inputType?: 'text' | 'password' | 'email' | 'url' | 'number';
  precision?: number | null;
  step?: number;
  min?: number;
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  ...defaultBaseProps,
  inputType: 'text',
  precision: null,
  step: undefined,
  min: undefined,
  max: undefined,
});

interface Emits extends BaseEmits {
}

const emits = defineEmits<Emits>();

const { errors, label, value, vuetifyBindings } = useInputBase(props, emits);
const { inputType, max, min, precision, step } = toRefs(props);

const isNumber = computed(() => inputType.value === 'number');
const numberInputBindings = computed(() => (
  !isNumber.value ? {} : { min: unref(min), max: unref(max), precision: unref(precision), step: unref(step) }
));
</script>

<style scoped>
.container {
  width: 100%;
}
</style>
