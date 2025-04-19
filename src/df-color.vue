<template>
  <v-menu
    v-model="dropdownShown"
    location="top start"
    origin="bottom start"
    :close-on-content-click="false"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        v-model="value"
        v-bind="{ ...vuetifyBindings, ...menuProps } as any"
        :clearable="allowNull"
        type="text"
        variant="underlined"
        :rules="rules"
      >
        <template #message><errors-widget :errors="errors"/></template>
        <template #prepend-inner>
          <div
            style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #ccc;"
            :style="{ backgroundColor: value }"
          />
        </template>
      </v-text-field>
    </template>
    <v-color-picker v-model="value" mode="hexa"/>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { BaseEmits, BaseProps, defaultBaseProps, ErrorsWidget, useInputBase } from './helpers';

interface Props extends BaseProps {
  allowNull?: boolean;
}

const props = withDefaults(defineProps<Props>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}

const emits = defineEmits<Emits>();

const { errors, value, vuetifyBindings } = useInputBase(props, emits);
const dropdownShown = ref(false);

const rules = computed<((val: string) => boolean | string)[]>(() => ([
  (val: string) => {
    if (!val && props.allowNull) return true;
    const regex = /^#?([a-fA-F0-9]{6}[a-fA-F0-9]{0,2})$/;
    return regex.test(val) ? true : 'Not a valid hex string.';
  },
]));

function handleClose() {
  dropdownShown.value = false;
}
</script>
