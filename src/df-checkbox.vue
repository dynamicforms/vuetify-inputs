<template>
  <v-checkbox
    v-model="boolValue"
    density="compact"
    :class="densityClass"
    :indeterminate="indeterminate"
    :false-value="false"
    :true-value="true"
    v-bind="vuetifyBindings as any"
    @change="change"
    @blur="touched = true"
  >
    <template #label="labelData"><df-label :allow-wrap="true" :data="labelData as any" :label="label" /></template>
    <template #message="{ message }"><df-input-hint :message="message" :errors="showErrors" /></template>
  </v-checkbox>
</template>

<script setup lang="ts">
import { clone } from 'lodash-es';
import { computed } from 'vue';

import { DfCheckboxProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfCheckboxProps>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { densityClass, label, showErrors, touched, value, vuetifyBindings } = useInputBase(props, emits);

const indeterminate = computed(() => props.allowNull && value.value == null);

const boolValue = computed({
  get(): any {
    return value.value;
  },
  set() {},
});

function change() {
  const oldVal = clone(value.value);
  if (oldVal === true) {
    value.value = props.allowNull ? null : false;
  } else {
    value.value = oldVal === false;
  }
}
</script>
