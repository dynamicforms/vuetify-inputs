<template>
  <v-checkbox
    v-model="boolValue"
    v-bind="vuetifyBindings as any"
    density="compact"
    :class="densityClass"
    :indeterminate="indeterminate"
    :false-value="false"
    :true-value="true"
    @change="change"
    @blur="touched = true"
  >
    <template #label="labelData"><df-label :allow-wrap="true" :data="labelData as any" :label="label" /></template>
    <template #message="{ message }"><messages-widget :message="message" :errors="errors" /></template>
  </v-checkbox>
</template>

<script setup lang="ts">
import { clone } from 'lodash-es';
import { computed } from 'vue';

import { DfCheckboxProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfLabel, MessagesWidget, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfCheckboxProps>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { densityClass, errors, label, touched, value, vuetifyBindings } = useInputBase(props, emits);

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
