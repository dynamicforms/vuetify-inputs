<template>
  <v-input
    v-if="isRendered"
    class="df-input-group"
    :class="[densityClass, visibilityClass, vuetifyBindings.class]"
    :density="vuetifyBindings.density"
    :hint="vuetifyBindings.hint"
    :persistent-hint="true"
    hide-details="auto"
    :error-messages="groupErrors.length > 0 ? ' ' : undefined"
  >
    <v-field
      :variant="vuetifyBindings.variant"
      :bg-color="vuetifyBindings.bgColor"
      :density="vuetifyBindings.density"
      :label="vuetifyBindings.label"
      :disabled="vuetifyBindings.disabled"
      :error="groupErrors.length > 0"
      :dirty="true"
      :active="true"
      :focused="focused"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #default="{ props: fieldProps }">
        <div
          v-bind="fieldProps"
          class="df-input-group-content"
          :class="`df-input-group--${direction}`"
          @focusin="focused = true"
          @focusout="onFocusout"
        >
          <slot />
        </div>
      </template>
    </v-field>
    <template #message="{ message }">
      <df-input-hint :message="message" :errors="groupErrors" :hint="vuetifyBindings.hint" />
    </template>
  </v-input>
</template>

<script setup lang="ts">
import { computed, inject, provide, ref } from 'vue';

import { DfInputGroupProps } from './dynamicforms-component-props';
import { DfInputHint, DfLabel, useInputBase } from './helpers';
import { type VuetifyInputsSettings, vuetifyInputsSettingsKey } from './helpers/settings';
import { selectShownErrorsDeep } from './helpers/shown-errors';

const props = withDefaults(defineProps<DfInputGroupProps>(), { enabled: undefined, direction: 'row' });
const emits = defineEmits<{ (e: 'update:modelValue', value: any): void; (e: 'click:clear'): void }>();

const settings = inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});
const { densityClass, isRendered, label, shownErrors, visibilityClass, vuetifyBindings } = useInputBase(props, emits);

// the children render inside this field's frame, without frames, labels or message rows of their own
provide('field-variant', 'plain');
provide('field-density', 'inline');

// a bound container shows the errors of every element in it; otherwise the errors of the control or the errors prop
const groupErrors = computed(() =>
  props.control ? selectShownErrorsDeep(props.control, settings) : shownErrors.value,
);

const focused = ref(false);
function onFocusout(event: FocusEvent) {
  const target = event.currentTarget as HTMLElement;
  if (!target.contains(event.relatedTarget as Node | null)) focused.value = false;
}
</script>

<style>
.df-input-group .df-input-group-content {
  display: flex;
  align-items: center;
  gap: 4px 16px;
  width: 100%;
  max-height: revert;
}
.df-input-group .df-input-group--row {
  flex-wrap: nowrap;
  overflow-x: auto;
}
.df-input-group .df-input-group--wrap {
  flex-wrap: wrap;
}
.df-input-group .df-input-group--column {
  flex-direction: column;
  align-items: stretch;
}
.df-input-group .df-input-group-content > * {
  flex: 0 0 auto;
  width: auto;
}
.df-input-group .df-input-group-content .v-input__details {
  display: none;
}
</style>
