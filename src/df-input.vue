<template>
  <div class="container">
    <v-text-field
      v-if="!isNumber"
      v-model="value"
      v-bind="vuetifyBindings as any"
      variant="underlined"
      :type="inputType"
    >
      <template #message><errors-widget :errors="errors"/></template>
    </v-text-field>
    <v-number-input
      v-else
      v-model="value"
      v-bind="{ ...vuetifyBindings, ...numberInputBindings } as any"
      density="compact"
      control-variant="stacked"
      variant="underlined"
    >
      <template #message><errors-widget :errors="errors"/></template>
    </v-number-input>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';

import { BaseEmits, BaseProps, defaultBaseProps, ErrorsWidget, useInputBase } from './helpers';

interface Props extends BaseProps {
  inputType?: 'text' | 'password' | 'email' | 'url' | 'number';
  precision?: number;
  step?: number;
  min?: number;
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  ...defaultBaseProps,
  inputType: 'text',
  precision: undefined,
  step: undefined,
  min: undefined,
  max: undefined,
});

interface Emits extends BaseEmits {
}

const emits = defineEmits<Emits>();

const { errors, value, vuetifyBindings } = useInputBase(props, emits);
const { inputType, max, min, precision, step } = toRefs(props);

const isNumber = computed(() => inputType.value === 'number');
const numberInputBindings = computed(() => (
  !isNumber.value ? {} : { min: min.value, max: max.value, precision: precision.value, step: step.value }
));
</script>

<style scoped>
.container {
  width: 100%;
}
</style>
