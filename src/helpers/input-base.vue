<template>
  <div
    v-if="visibility !== DisplayMode.SUPPRESS"
    :class="[
      cssClass,
      {
        'd-none': visibility === DisplayMode.HIDDEN,
        invisible: visibility === DisplayMode.INVISIBLE,
      },
    ]"
  >
    <label v-if="vuetifyBindings.label" for="#following-v-input">{{ vuetifyBindings.label }}</label>
    <v-input
      :hint="vuetifyBindings.hint"
      :persistent-hint="vuetifyBindings.persistentHint"
      :hide-details="vuetifyBindings.hideDetails"
    >
      <template #message><errors-widget :errors="errors"/></template>
      <slot/>
      <template v-if="isClearable" #append>
        <v-icon @click="emits('click:clear')">mdi-close-circle</v-icon>
      </template>
    </v-input>
  </div>
</template>

<script setup lang="ts">
import { DisplayMode } from '@dynamicforms/vue-forms';
import { computed, unref } from 'vue';

import ErrorsWidget from './errors-widget.vue';
import { BaseEmits, BaseProps, useInputBase } from './input-base';

const props = defineProps<BaseProps>();
const emits = defineEmits<BaseEmits>();

const { errors, value, visibility, vuetifyBindings } = useInputBase(props, emits);

const isClearable = computed(() => (unref(props.clearable) && unref(value)));
</script>

<style scoped>

</style>
