<template>
  <v-text-field
    v-if="isRendered"
    v-model="value"
    :class="[densityClass, visibilityClass]"
    :clearable="allowNull"
    type="text"
    v-bind="vuetifyBindings"
    @blur="touched = true"
  >
    <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
    <template #message="{ message }"><df-input-hint :message="message" :errors="shownErrors" /></template>
    <template #prepend-inner>
      <div
        style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #ccc"
        :style="{ backgroundColor: value }"
      />
    </template>
    <template #default>
      <v-menu v-if="clientRendered" v-model="dropdownShown" :close-on-content-click="false" activator="parent">
        <v-confirm-edit v-model="value" hide-actions @cancel="dropdownShown = false" @save="concludeEdit">
          <template #default="{ model: proxyModel, save, cancel, isPristine }">
            <v-card>
              <v-color-picker
                v-model="proxyModel.value"
                mode="hexa"
                @dblclick="saveOnDoubleClick($event, colorChoices, save)"
              />
              <v-card-actions class="justify-end">
                <confirm-actions :save="save" :cancel="cancel" :is-pristine="isPristine" />
              </v-card-actions>
            </v-card>
          </template>
        </v-confirm-edit>
      </v-menu>
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { ValidationError } from '@dynamicforms/vue-forms';
import { ref } from 'vue';

import { DfColorProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';
import { useClientRendered } from './helpers/client-rendered';
import ConfirmActions from './helpers/confirm-actions.vue';
import { usePickerDoubleClick } from './helpers/picker-double-click';

const props = withDefaults(defineProps<DfColorProps>(), { ...defaultBaseProps, allowNull: false });

interface Emits extends BaseEmits {}

const emits = defineEmits<Emits>();

const hexColor = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/;

// without a control the component checks the format itself; a bound control is checked by its own validators
function hexColorErrors(): ValidationError[] {
  const val = value.value;
  if (!val && props.allowNull) return [];
  if (hexColor.test(val ?? '')) return [];
  return [new ValidationError('invalid_hex_color', {}, 'Not a valid hex string.', 'validator')];
}

const { densityClass, isRendered, label, shownErrors, touched, value, visibilityClass, vuetifyBindings } = useInputBase(
  props,
  emits,
  hexColorErrors,
);
const dropdownShown = ref(false);
const clientRendered = useClientRendered();
const colorChoices = '.v-color-picker-canvas';
const { saveOnDoubleClick } = usePickerDoubleClick();

// a value confirmed in the picker concludes the edit: the field may hold no focus to lose
function concludeEdit() {
  dropdownShown.value = false;
  touched.value = true;
}
</script>
