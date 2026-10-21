<template>
  <v-text-field
    v-if="isRendered"
    v-model="value"
    :class="[densityClass, visibilityClass]"
    :clearable="allowNull && !vuetifyBindings.readonly"
    type="text"
    v-bind="vuetifyBindings"
    @blur="commitTyped"
    @keydown.enter="commitTyped"
  >
    <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
    <template #message="{ message }"><df-input-hint :message="message" :errors="shownErrors" /></template>
    <template #prepend-inner>
      <div
        style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #ccc"
        :style="{ backgroundColor: swatchColor }"
      />
    </template>
    <template #default>
      <v-menu
        v-if="clientRendered"
        v-model="dropdownShown"
        :close-on-content-click="false"
        :disabled="vuetifyBindings.readonly"
        activator="parent"
        min-width="0"
      >
        <v-confirm-edit
          :model-value="value"
          hide-actions
          @update:model-value="commitPicked"
          @cancel="dropdownShown = false"
          @save="concludeEdit"
        >
          <template #default="{ model: proxyModel, save, cancel, isPristine }">
            <v-card class="df-color-picker">
              <hexagon-palette
                v-if="picker === 'hexagon'"
                v-model="proxyModel.value"
                :rings="hexagonRings"
                :levels="lightnessLevels"
                @update:model-value="previewPicked"
                @dblclick="saveOnDoubleClick($event, hexagonChoices, save)"
              />
              <v-color-picker
                v-else
                v-model="proxyModel.value"
                :mode="alpha ? 'hexa' : 'hex'"
                :modes="alpha ? undefined : opaqueModes"
                elevation="0"
                @update:model-value="previewPicked"
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
import { computed, ref, watch } from 'vue';

import { DfColorProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';
import { useClientRendered } from './helpers/client-rendered';
import ConfirmActions from './helpers/confirm-actions.vue';
import { namespaced } from './helpers/error-namespace';
import HexagonPalette from './helpers/hexagon-palette.vue';
import { usePickerDoubleClick } from './helpers/picker-double-click';

const props = withDefaults(defineProps<DfColorProps>(), {
  ...defaultBaseProps,
  allowNull: false,
  alpha: true,
  normalize: undefined,
  picker: 'generic',
  hexagonRings: 5,
  lightnessLevels: () => [0.45, 0.6, 0.75],
});

interface Emits extends BaseEmits {
  (e: 'preview', value: string | null): void;
}

const emits = defineEmits<Emits>();

const hexColor = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{4}|[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/;
const opaqueHexColor = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;
// the picker's modes without an alpha channel, offered under `alpha: false`
const opaqueModes = ['hex', 'rgb', 'hsl'] as const;

/** Whether `color` is a hex color of the format the `alpha` prop allows. */
function isValidColor(color: string | null | undefined): color is string {
  return (props.alpha ? hexColor : opaqueHexColor).test(color ?? '');
}

/** `color` as `normalize` returns it, for a valid color; any other value as it is. */
function normalized(color: string | null | undefined): string | null {
  if (!color) return null;
  return props.normalize && isValidColor(color) ? props.normalize(color) : color;
}

// without a control the component checks the format itself; a bound control is checked by its own validators
function hexColorErrors(): ValidationError[] {
  const val = value.value;
  if (!val && props.allowNull) return [];
  if (isValidColor(val)) return [];
  if (props.alpha) {
    return [new ValidationError(namespaced('invalid_hex_color'), {}, 'Not a valid hex string.', 'validator')];
  }
  const detail = 'Not a valid hex string without alpha.';
  return [new ValidationError(namespaced('invalid_opaque_hex_color'), {}, detail, 'validator')];
}

const { densityClass, isRendered, label, shownErrors, touched, value, visibilityClass, vuetifyBindings } = useInputBase(
  props,
  emits,
  hexColorErrors,
);
const dropdownShown = ref(false);
const clientRendered = useClientRendered();
const colorChoices = '.v-color-picker-canvas';
const hexagonChoices = '.df-hexagon-cell';
const { saveOnDoubleClick } = usePickerDoubleClick();

const swatchColor = computed(() => normalized(value.value) ?? undefined);

// a typed value is written as typed; it is normalized when the field loses focus or Enter commits it
function commitTyped() {
  touched.value = true;
  const val = value.value;
  const committed = normalized(val);
  if (committed !== null && committed !== val) value.value = committed;
}

// the picker's model keeps the raw color, so its handle stays under the pointer; the saved value is normalized
function commitPicked(color: string | null) {
  value.value = (normalized(color) ?? color) as string;
}

function previewPicked(color: string | null) {
  if (dropdownShown.value) emits('preview', normalized(color));
}

watch(dropdownShown, (shown) => emits('preview', shown ? normalized(value.value) : null));

// a value confirmed in the picker concludes the edit: the field may hold no focus to lose
function concludeEdit() {
  dropdownShown.value = false;
  touched.value = true;
}
</script>
