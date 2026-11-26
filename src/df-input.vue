<template>
  <div
    v-if="isRendered"
    class="df-input-container"
    :class="[densityClass, visibilityClass]"
    @focus.capture="onNumberFocus"
    @focusin="onFocusIn"
    @pointerdown.capture="onEnter"
  >
    <v-text-field
      v-if="!isNumber"
      v-model="value"
      :type="inputType"
      v-bind="vuetifyBindings as any"
      @blur="touched = true"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #message="{ message }">
        <df-input-hint :message="message" :errors="shownErrors" :hint="vuetifyBindings.hint" />
      </template>
    </v-text-field>
    <v-number-input
      v-else
      :model-value="value"
      density="compact"
      control-variant="stacked"
      v-bind="{ ...vuetifyBindings, ...numberInputBindings } as any"
      @update:model-value="onNumberUpdate"
      @blur="touched = true"
    >
      <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
      <template #message="{ message }">
        <df-input-hint :message="message" :errors="shownErrors" :hint="vuetifyBindings.hint" />
      </template>
    </v-number-input>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, shallowRef, toRefs, unref, watch } from 'vue';

import { DfInputProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfInputProps>(), {
  ...defaultBaseProps,
  inputType: 'text',
  precision: null,
  step: undefined,
  min: undefined,
  max: undefined,
});

interface Emits extends BaseEmits {}

const emits = defineEmits<Emits>();

const { densityClass, isRendered, label, shownErrors, touched, value, visibilityClass, vuetifyBindings } = useInputBase(
  props,
  emits,
);
const { inputType, max, min, precision, step } = toRefs(props);

const isNumber = computed(() => inputType.value === 'number');
const numberInputBindings = computed(() =>
  !isNumber.value ? {} : { min: unref(min), max: unref(max), precision: unref(precision), step: unref(step) },
);

// v-number-input corrects a value outside min and max or with more decimals than precision when it is mounted. The
// correction is held until the user enters the field - focuses it or presses one of its controls, which take no
// focus - and written then; until then the field keeps its value.
let entered = false;
let heldCorrection: { value: number | null } | null = null;

function onNumberUpdate(newValue: number | null) {
  if (entered) value.value = newValue;
  else heldCorrection = { value: newValue };
}

function onEnter() {
  if (entered) return;
  entered = true;
  const held = heldCorrection;
  heldCorrection = null;
  if (held) value.value = held.value;
}

// v-number-input trims trailing zeros of the text when it gains focus ("1.00" -> "1"). Replacing the text drops a
// selection of the whole text, so typing appends to the value instead of replacing it. When the whole text was
// selected and v-number-input left the replaced text without a selection, the whole text is selected again.
let pendingSelection: { input: HTMLInputElement; before: string; whole: boolean } | null = null;

function onNumberFocus(event: FocusEvent) {
  const input = event.target;
  if (!isNumber.value || !(input instanceof HTMLInputElement)) return;
  const before = input.value;
  const isWhole = () =>
    before !== '' && input.value === before && input.selectionStart === 0 && input.selectionEnd === before.length;
  const state = { input, before, whole: isWhole() };
  pendingSelection = state;
  // A programmatic select() before focus() shows its selection only after the focus handlers. A pre-flush watcher
  // reads it before v-number-input renders the trimmed text, also when a render is already pending at focus.
  wholeCheck.value = () => {
    state.whole ||= isWhole();
  };
}

const wholeCheck = shallowRef<(() => void) | null>(null);
watch(
  wholeCheck,
  (check) => {
    if (!check) return;
    wholeCheck.value = null;
    check();
  },
  { flush: 'pre' },
);

async function keepWholeSelection(event: FocusEvent) {
  const state = pendingSelection;
  pendingSelection = null;
  if (!state || state.input !== event.target) return;
  await nextTick();
  const { input } = state;
  const lost = input.value !== state.before && input.selectionStart === input.selectionEnd;
  if (state.whole && lost && document.activeElement === input) input.select();
}

function onFocusIn(event: FocusEvent) {
  onEnter();
  keepWholeSelection(event);
}

// a value set from outside replaces the one the held correction was made for
watch(value, () => {
  heldCorrection = null;
});
</script>
