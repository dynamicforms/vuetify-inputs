<template>
  <v-text-field
    v-model="value"
    v-bind="vuetifyBindings"
    :class="densityClass"
    :clearable="allowNull"
    type="text"
    :rules="rules"
    @blur="touched = true"
  >
    <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
    <template #message="{ message }"><df-input-hint :message="message" :errors="showErrors" /></template>
    <template #prepend-inner>
      <div
        style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #ccc"
        :style="{ backgroundColor: value }"
      />
    </template>
    <template #default>
      <v-menu v-model="dropdownShown" :close-on-content-click="false" activator="parent">
        <v-color-picker v-model="value" mode="hexa" />
      </v-menu>
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { DfColorProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfColorProps>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}

const emits = defineEmits<Emits>();

const { densityClass, label, showErrors, touched, value, vuetifyBindings } = useInputBase(props, emits);
const dropdownShown = ref(false);

const rules = computed<((val: string) => boolean | string)[]>(() => [
  (val: string) => {
    if (props.control) return true; // if there's a form field, we expect there to be a validator
    if (!val && props.allowNull) return true; // allowed empty values are also not a problem

    const regex = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/;
    return regex.test(val) ? true : 'Not a valid hex string.';
  },
]);
</script>
