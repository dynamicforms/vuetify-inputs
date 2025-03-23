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
    <label v-if="vuetifyBindings.label">{{ vuetifyBindings.label }}</label>
    <v-input
      :error-messages="vuetifyBindings['error-messages']"
      :error-count="vuetifyBindings['error-count']"
      :hint="vuetifyBindings.hint"
      :persistent-hint="vuetifyBindings.persistentHint"
      :hide-details="vuetifyBindings.hideDetails"
    >
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

import { BaseEmits, BaseProps, useInputBase } from './input-base';

const props = defineProps<BaseProps>();
const emits = defineEmits<BaseEmits>();

const { value, visibility, vuetifyBindings } = useInputBase(props, emits);

const isClearable = computed(() => (unref(props.clearable) && unref(value)));
</script>

<style scoped>

</style>
