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
    <label v-if="vuetifyBindings.label" for="#following-v-input"><df-label :label="label"/></label>
    <v-input
      :hint="vuetifyBindings.hint"
      :persistent-hint="vuetifyBindings.persistentHint"
      :hide-details="vuetifyBindings.hideDetails"
    >
      <template #message="{ message }"><messages-widget :message="message" :errors="errors"/></template>
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

import DfLabel from './df-label.vue';
import { BaseEmits, BaseProps, useInputBase } from './input-base';
import MessagesWidget from './messages-widget.vue';

const props = defineProps<BaseProps>();
const emits = defineEmits<BaseEmits>();

const { errors, label, value, visibility, vuetifyBindings } = useInputBase(props, emits);

const isClearable = computed(() => (unref(props.clearable) && unref(value)));
</script>

<style scoped>

</style>
