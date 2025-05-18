<template>
  <v-text-field
    v-model="value"
    v-bind="vuetifyBindings"
    :clearable="allowNull"
    type="text"
    :rules="rules"
    @blur="touched = true"
  >
    <template v-if="label.icon" #label="labelData"><df-label :data="labelData" :label="label"/></template>
    <template #message="{ message }"><messages-widget :message="message" :errors="errors"/></template>
    <template #prepend-inner>
      <div
        style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #ccc;"
        :style="{ backgroundColor: value }"
      />
    </template>
    <template #default>
      <v-menu
        v-model="dropdownShown"
        :close-on-content-click="false"
        activator="parent"
      >
        <v-color-picker v-model="value" mode="hexa"/>
      </v-menu>
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { BaseEmits, BaseProps, defaultBaseProps, DfLabel, MessagesWidget, useInputBase } from './helpers';

interface Props extends BaseProps {
  allowNull?: boolean;
}

const props = withDefaults(defineProps<Props>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}

const emits = defineEmits<Emits>();

const { errors, label, touched, value, vuetifyBindings } = useInputBase(props, emits);
const dropdownShown = ref(false);

const rules = computed<((val: string) => boolean | string)[]>(() => ([
  (val: string) => {
    if (props.control) return true; // if there's a form field, we expect there to be a validator
    if (!val && props.allowNull) return true; // allowed empty values are also not a problem

    const regex = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/;
    return regex.test(val) ? true : 'Not a valid hex string.';
  },
]));
</script>
