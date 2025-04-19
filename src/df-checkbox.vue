<template>
  <v-checkbox
    v-model="boolValue"
    v-bind="vuetifyBindings as any"

    density="compact"
    :indeterminate="indeterminate"
    :false-value="false"
    :true-value="true"
    @change="change"
  >
    <template #message><errors-widget :errors="errors"/></template>
  </v-checkbox>
</template>

<script setup lang="ts">
import { clone } from 'lodash-es';
import { computed } from 'vue';

import { BaseEmits, BaseProps, defaultBaseProps, ErrorsWidget, useInputBase } from './helpers';

interface Props extends BaseProps {
  allowNull?: boolean;
}
const props = withDefaults(defineProps<Props>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { errors, value, vuetifyBindings } = useInputBase(props, emits);

const indeterminate = computed(() => props.allowNull && (value.value == null));

const boolValue = computed({
  get(): any { return value.value; },
  set() { },
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
