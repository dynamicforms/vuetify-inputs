<template>
  <v-input
    v-if="isRendered"
    :name="vuetifyBindings.name"
    :density="vuetifyBindings.density"
    :hint="vuetifyBindings.hint"
    :persistent-hint="vuetifyBindings.persistentHint"
    :hide-details="vuetifyBindings.hideDetails"
    :error-messages="vuetifyBindings.errorMessages"
    :class="[cssClass, visibilityClass]"
  >
    <!-- v-field takes v-input's id, as in Vuetify's own text field: its label's `for` and the messages row's id
         follow from it -->
    <template #default="{ id, hasDetails }">
      <v-field
        :id="id.value"
        :label-id="`${id.value}-label`"
        :details="hasDetails.value"
        :variant="vuetifyBindings.variant"
        :bg-color="vuetifyBindings.bgColor"
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
          <div class="d-flex w-100 df-style-resetting df-sub-field">
            <slot v-bind="{ ...slotProps, props: controlProps(slotProps.props, id.value) }" />
          </div>
        </template>
        <template #loader="loaderProps"><slot name="loader" v-bind="loaderProps" /></template>
        <template v-if="$slots['prepend-inner']" #prepend-inner="prependInnerProps">
          <slot name="prepend-inner" v-bind="prependInnerProps" />
        </template>
      </v-field>
    </template>
    <template #message="{ message }">
      <df-input-hint :message="message" :errors="shownErrors" :hint="vuetifyBindings.hint" />
    </template>
    <template v-if="$slots.prepend" #prepend="prependProps"><slot name="prepend" v-bind="prependProps" /></template>
  </v-input>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue';

import DfInputHint from './df-input-hint.vue';
import DfLabel from './df-label.vue';
import { BaseEmits, BaseProps, type InputBaseControlProps, type InputBaseSlotProps, useInputBase } from './input-base';

const props = defineProps<BaseProps & { loading?: boolean }>();
const emits = defineEmits<BaseEmits & { (e: 'blur'): void }>();
// declared here, so the emitted declarations do not name Vuetify's internal slot types
defineSlots<{
  default?(props: InputBaseSlotProps): any;
  'prepend-inner'?(props: Omit<InputBaseSlotProps, 'props'>): any;
  loader?(props: Record<string, unknown>): any;
  prepend?(props: Record<string, unknown>): any;
}>();

const { isRendered, label, shownErrors, touched, value, visibilityClass, vuetifyBindings } = useInputBase(props, emits);

const isClearable = computed(() => !!(unref(props.clearable) && unref(value) && !vuetifyBindings.value.readonly));
const focused = ref<boolean>(false);

// v-field's control attributes and the control's state, for the element the user operates
function controlProps(fieldProps: Record<string, unknown>, id: string): InputBaseControlProps {
  return {
    ...(fieldProps as { id: string; class: string; 'aria-describedby'?: string }),
    'aria-labelledby': `${id}-label`,
    'aria-label': vuetifyBindings.value.label || undefined,
    'aria-invalid': vuetifyBindings.value['aria-invalid'],
  };
}

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
  min-height: max(
    var(--v-input-control-height, 56px),
    1.5rem + var(--v-field-input-padding-top) + var(--v-field-input-padding-bottom)
  );
}

.df-density-inline .df-sub-field {
  min-height: revert;
}

.rtf-editor .df-sub-field {
  max-height: revert;
}
</style>
