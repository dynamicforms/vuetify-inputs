<template>
  <div class="df-textarea-container" :class="densityClass">
    <v-textarea
      v-if="visibility !== DisplayMode.SUPPRESS"
      v-model="value"
      :class="[
        cssClass,
        {
          'd-none': visibility === DisplayMode.HIDDEN,
          invisible: visibility === DisplayMode.INVISIBLE,
        },
      ]"
      :rows="rows"
      :auto-grow="(maxRows || 0) > 0"
      :max-rows="maxRows"
      v-bind="vuetifyBindings as any"
      @blur="touched = true"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #message="{ message }"><messages-widget :message="message" :errors="errors" /></template>
    </v-textarea>
  </div>
</template>

<script setup lang="ts">
import { DisplayMode } from '@dynamicforms/vue-forms';
import { toRefs } from 'vue';

import { DfTextAreaProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfLabel, MessagesWidget, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfTextAreaProps>(), {
  ...defaultBaseProps,
  rows: undefined,
  maxRows: undefined,
});

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { densityClass, errors, label, touched, value, vuetifyBindings } = useInputBase(props, emits);
const { cssClass, visibility } = toRefs(props);
</script>
