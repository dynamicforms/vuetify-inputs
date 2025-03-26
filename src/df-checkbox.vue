<template>
  <v-checkbox
    v-model="boolValue"
    v-bind="vuetifyBindings"

    density="compact"
    :indeterminate="indeterminate"
    :false-value="false"
    :true-value="true"
    @change="change"
  />
</template>

<script setup lang="ts">
import { clone } from 'lodash-es';
import { computed, watch } from 'vue';

import { BaseEmits, BaseProps, defaultBaseProps, useInputBase } from './helpers';

interface Props extends BaseProps {
  allowNull?: boolean;
}
const props = withDefaults(defineProps<Props>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { value, vuetifyBindings } = useInputBase(props, emits);

const indeterminate = computed(() => props.allowNull && (value.value == null));

const boolValue = computed({
  get(): any { return value.value; },
  set(unused: boolean) { }, // eslint-disable-line @typescript-eslint/no-unused-vars
});

watch(value, (newVal: boolean | null) => {
  if (newVal) value.value = true;
  else if (props.allowNull && newVal == null) value.value = null;
  else value.value = false;
}, { immediate: true });

function change() {
  const oldVal = clone(value.value);
  if (oldVal === true) {
    value.value = props.allowNull ? null : false;
  } else {
    value.value = oldVal === false;
  }
}
</script>
