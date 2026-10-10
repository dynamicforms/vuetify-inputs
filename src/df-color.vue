<template>
  <v-text-field
    v-if="isRendered"
    v-model="value"
    :class="[densityClass, visibilityClass]"
    :clearable="allowNull"
    type="text"
    v-bind="vuetifyBindings"
    @blur="touched = true"
  >
    <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
    <template #message="{ message }"><df-input-hint :message="message" :errors="shownErrors" /></template>
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
import { ValidationError } from '@dynamicforms/vue-forms';
import { ref } from 'vue';

import { DfColorProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfColorProps>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}

const emits = defineEmits<Emits>();

const hexColor = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/;

// without a control the component checks the format itself; a bound control is checked by its own validators
function hexColorErrors(): ValidationError[] {
  const val = value.value;
  if (!val && props.allowNull) return [];
  if (hexColor.test(val ?? '')) return [];
  return [new ValidationError('invalid_hex_color', {}, 'Not a valid hex string.', 'validator')];
}

const { densityClass, isRendered, label, shownErrors, touched, value, visibilityClass, vuetifyBindings } = useInputBase(
  props,
  emits,
  hexColorErrors,
);
const dropdownShown = ref(false);
</script>
