<template>
  <v-input
    v-if="visibility !== DisplayMode.SUPPRESS"
    :name="vuetifyBindings.name"
    :density="vuetifyBindings.density"
    :hint="vuetifyBindings.hint"
    :persistent-hint="vuetifyBindings.persistentHint"
    :hide-details="vuetifyBindings.hideDetails"
    :error-messages="vuetifyBindings.errorMessages"
    :class="[
      cssClass,
      {
        'd-none': visibility === DisplayMode.HIDDEN,
        invisible: visibility === DisplayMode.INVISIBLE,
      },
    ]"
  >
    <v-field
      :variant="vuetifyBindings.variant"
      :density="vuetifyBindings.density"
      :label="vuetifyBindings.label"
      :disabled="vuetifyBindings.disabled"
      :clearable="isClearable"
      :persistent-clear="true"
      :dirty="!!value || !!vuetifyBindings.placeholder"
      :active="focused"
      :loading="loading"
      @click:clear="emits('click:clear')"
      @update:focused="(isFocused) => setFocused(isFocused)"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #default="slotProps">
        <div class="d-flex w-100 df-style-resetting df-sub-field"><slot v-bind="slotProps" /></div>
      </template>
      <template #loader="loaderProps"><slot name="loader" v-bind="loaderProps" /></template>
      <template v-if="$slots['prepend-inner']" #prepend-inner="prependInnerProps">
        <slot name="prepend-inner" v-bind="prependInnerProps" />
      </template>
    </v-field>
    <template #message="{ message }">
      <df-input-hint :message="message" :errors="showErrors" />
    </template>
    <template v-if="$slots.prepend" #prepend="prependProps"><slot name="prepend" v-bind="prependProps" /></template>
  </v-input>
</template>

<script setup lang="ts">
import { DisplayMode } from '@dynamicforms/vue-forms';
import { computed, ref, unref } from 'vue';

import DfInputHint from './df-input-hint.vue';
import DfLabel from './df-label.vue';
import { BaseEmits, BaseProps, useInputBase } from './input-base';

const props = defineProps<BaseProps & { loading?: boolean }>();
const emits = defineEmits<BaseEmits & { (e: 'blur'): void }>();

const { label, showErrors, touched, value, visibility, vuetifyBindings } = useInputBase(props, emits);

const isClearable = computed(() => !!(unref(props.clearable) && unref(value)));
const focused = ref<boolean>(false);

function setFocused(isFocused: boolean) {
  focused.value = isFocused;
  if (!isFocused) {
    touched.value = true;
    emits('blur');
  }
}
</script>

<style>
.df-style-resetting .v-field__overlay {
  background-color: transparent;
}
.df-style-resetting .v-field__outline::before,
.df-style-resetting .v-field__outline::after {
  content: none !important;
}

.df-sub-field {
  max-height: var(--v-input-control-height);
}
</style>
