<template>
  <div class="container">
    <v-text-field
      v-if="!isNumber"
      v-model="value"
      v-bind="vuetifyBindings"
      variant="underlined"
      :type="inputType"
      :rules="validationRules"
    />
    <v-number-input
      v-else
      v-model="value"
      v-bind="{ ...vuetifyBindings, ...numberInputBindings }"
      density="compact"
      variant="underlined"
      :rules="validationRules"
    />
  </div>
</template>

<script setup lang="ts">
import { isEmpty } from 'lodash-es';
import { computed, toRefs } from 'vue';
import { VNumberInput } from 'vuetify/labs/VNumberInput'; // eslint-disable-line import/extensions

import { BaseEmits, BaseProps, defaultBaseProps, useInputBase } from './helpers';

interface Props extends BaseProps {
  inputType?: 'text' | 'password' | 'email' | 'url' | 'number';
  precision?: number;
  step?: number;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  allowNull?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  ...defaultBaseProps,
  inputType: 'text',
  precision: undefined,
  step: undefined,
  min: undefined,
  max: undefined,
  minLength: undefined,
  maxLength: undefined,
  pattern: undefined,
  allowNull: true,
});

interface Emits extends BaseEmits {
}

const emits = defineEmits<Emits>();

const { value, vuetifyBindings } = useInputBase(props, emits);
const { allowNull, inputType, max, maxLength, minLength, min, pattern, precision, step } = toRefs(props);

const isNumber = computed(() => inputType.value === 'number');
const numberInputBindings = computed(() => (
  !isNumber.value ? {} : { min: min.value, max: max.value, precision: precision.value, step: step.value }
));

const validationRules = computed(() => {
  const rules: any[] = [];

  const addRule = (condition: boolean, validator: (val: any) => true | string) => {
    if (condition) {
      rules.push((val: any) => {
        if (isEmpty(val) && allowNull.value) return true;
        return validator(val);
      });
    }
  };

  addRule(pattern.value !== undefined, (val) => (
    String(val).match(pattern.value!) ? true : 'Value does not match required pattern'
  ));

  addRule(minLength.value !== undefined, (val) => (
    String(val).length >= minLength.value! ? true : `Minimum length: ${minLength.value}`
  ));

  addRule(maxLength.value !== undefined, (val) => (
    String(val).length <= maxLength.value! ? true : `Maximum length: ${maxLength.value}`
  ));

  if (isNumber.value) {
    addRule(min.value !== undefined, (val) => (val >= min.value! ? true : `Minimum value: ${min.value}`));
    addRule(max.value !== undefined, (val) => (val <= max.value! ? true : `Maximum value: ${max.value}`));

    // Validacija številskega formata
    addRule(true, (val) => {
      const isValid = val !== undefined && !Number.isNaN(Number(val)) &&
        !String(val).includes(',') && !String(val).endsWith(',');
      return isValid ? true : 'Not a valid number';
    });
  }

  return rules;
});
</script>

<style scoped>
.container {
  width: 100%;
}
</style>
