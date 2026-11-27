<template>
  <div
    v-if="isRendered"
    class="df-input-container"
    :class="[densityClass, visibilityClass]"
    @focus.capture="onNumberFocus"
    @beforeinput.capture="onNumberBeforeInput"
    @paste.capture="onNumberPaste"
    @focusin="onFocusIn"
    @pointerdown.capture="onEnter"
  >
    <component
      :is="isNumber ? 'v-number-input' : 'v-text-field'"
      v-bind="fieldBindings"
      @update:model-value="onModelUpdate"
      @blur="touched = true"
    >
      <template #label="labelData"><df-label :data="labelData" /></template>
      <template #message="{ message }">
        <df-input-hint :message="message" />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, shallowRef, toRefs, unref, watch } from 'vue';
import { useLocale } from 'vuetify';

import { DfInputProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, useInputBase } from './helpers';
import { normalizeDecimalSeparators } from './helpers/decimal-separator';
import { useSettings } from './helpers/use-settings';

const props = withDefaults(defineProps<DfInputProps>(), {
  ...defaultBaseProps,
  inputType: 'text',
  precision: null,
  step: undefined,
  min: undefined,
  max: undefined,
  anyDecimalSeparator: undefined,
});

interface Emits extends BaseEmits {}

const emits = defineEmits<Emits>();

const { densityClass, isRendered, touched, value, visibilityClass, vuetifyBindings } = useInputBase(props, emits);
const { inputType, max, min, precision, step } = toRefs(props);
const settings = useSettings();
const { decimalSeparator: localeDecimalSeparator } = useLocale();

const isNumber = computed(() => inputType.value === 'number');
// what v-number-input takes where vuetifyBindings states nothing else
const numberInputDefaults: Record<string, unknown> = { density: 'compact', controlVariant: 'stacked' };
// the bindings of the field component the input type renders
const fieldBindings = computed((): Record<string, unknown> => {
  if (!isNumber.value) return { modelValue: value.value, type: inputType.value, ...vuetifyBindings.value };
  return {
    modelValue: value.value,
    ...numberInputDefaults,
    ...vuetifyBindings.value,
    min: unref(min),
    max: unref(max),
    precision: unref(precision),
    step: unref(step),
  };
});

// v-number-input corrects a value outside min and max or with more decimals than precision when it is mounted. The
// correction is held until the user enters the field - focuses it or presses one of its controls, which take no
// focus - and written then; until then the field keeps its value.
let entered = false;
let heldCorrection: { value: number | null } | null = null;

function onModelUpdate(newValue: any) {
  if (isNumber.value) onNumberUpdate(newValue);
  else value.value = newValue;
}

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

// With anyDecimalSeparator, a typed "." or "," is replaced by the decimal separator v-number-input uses, and pasted
// text is converted to it. The replacement text is dispatched as a beforeinput event, so v-number-input filters it
// as it filters typed text.
const anyDecimalSeparator = computed(
  () => isNumber.value && (props.anyDecimalSeparator ?? settings.anyDecimalSeparator ?? false),
);
const decimalSeparator = computed<string>(() => {
  const attrs = props.passthroughAttrs ?? {};
  return (attrs.decimalSeparator ?? attrs['decimal-separator'])?.[0] || localeDecimalSeparator.value;
});
let forwarding = false;

function editedInput(event: Event): HTMLInputElement | null {
  const input = event.target;
  if (forwarding || !anyDecimalSeparator.value || !(input instanceof HTMLInputElement)) return null;
  return input.readOnly || input.disabled ? null : input;
}

function insertText(input: HTMLInputElement, text: string) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const before = new InputEvent('beforeinput', {
    data: text,
    inputType: 'insertText',
    bubbles: true,
    cancelable: true,
  });
  forwarding = true;
  try {
    input.dispatchEvent(before);
  } finally {
    forwarding = false;
  }
  if (before.defaultPrevented) return;
  input.setRangeText(text, start, end, 'end');
  input.dispatchEvent(new InputEvent('input', { data: text, inputType: 'insertText', bubbles: true }));
}

function onNumberBeforeInput(event: InputEvent) {
  const input = editedInput(event);
  if (!input || event.isComposing || (event.data !== '.' && event.data !== ',')) return;
  const { value, selectionStart, selectionEnd } = input;
  const kept = value.slice(0, selectionStart ?? value.length) + value.slice(selectionEnd ?? value.length);
  const hasSeparator = kept.includes(decimalSeparator.value);
  if (event.data === decimalSeparator.value && !hasSeparator) return;
  event.preventDefault();
  event.stopPropagation();
  if (!hasSeparator) insertText(input, decimalSeparator.value);
}

function onNumberPaste(event: ClipboardEvent) {
  const input = editedInput(event);
  const text = event.clipboardData?.getData('text/plain').trim();
  if (!input || !text) return;
  event.preventDefault();
  insertText(input, normalizeDecimalSeparators(text, decimalSeparator.value));
}

// a value set from outside replaces the one the held correction was made for
watch(value, () => {
  heldCorrection = null;
});
</script>
