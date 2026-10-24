<template>
  <v-text-field
    v-if="isRendered && !clientRendered"
    :class="[cssClass, densityClass, visibilityClass]"
    :model-value="chosenText"
    v-bind="vuetifyBindings"
    readonly
  >
    <template #label="labelData"><df-label :data="labelData" :label="label" /></template>
    <template #message="{ message }"><df-input-hint :message="message" :errors="shownErrors" /></template>
  </v-text-field>
  <component
    :is="taggable ? 'v-combobox' : 'v-autocomplete'"
    v-else-if="isRendered"
    ref="dfSelectRef"
    v-model="selected"
    :class="[
      cssClass,
      densityClass,
      visibilityClass,
      { 'df-select-multirow': isMultiline, 'df-select-single': !multiple },
    ]"
    :style="{ '--df-select-search-width': `${(searchText?.length ?? 0) + 1}ch` }"
    :items="options"
    :return-object="false"
    chips
    :auto-select-first="true"
    :closable-chips="allowNull || (multiple && selected.length > 1)"
    :clearable="allowNull && !vuetifyBindings.readonly"
    :multiple="multiple"
    :loading="loading"
    :hide-selected="false"
    :aria-describedby="vuetifyBindings.helpText ? `${vuetifyBindings.name}-help` : null"
    :menu-props="{ maxHeight: '400' }"
    :search="searchText"
    v-bind="vuetifyBindings"
    @update:search="(query: any) => queryOptions(query, undefined)"
    @update:model-value="onSelect"
    @click:clear="onClear"
    @blur="touched = true"
    @mousedown.capture="onMouseDown($event)"
  >
    <template #chip="{ item }">
      <v-chip
        :key="item.value"
        label
        size="small"
        class="d-flex align-middle"
        :variant="multiple ? 'tonal' : 'text'"
        :closable="multiple && (allowNull || selected.length > 1)"
        @click:close="chipClose($event, item.value)"
      >
        <template #prepend>
          <cached-icon v-if="item.raw?.icon" class="me-1" :name="item.raw.icon" />
        </template>
        <span :class="{ 'text-body-1': !multiple }">{{ item.title }}</span>
      </v-chip>
    </template>
    <template #label="labelData">
      <df-label :data="labelData" :label="label" />
    </template>

    <template #item="{ props: prps, item }">
      <v-list-item v-bind="prps">
        <template #prepend>
          <span v-if="item.raw?.icon" class="me-1">
            <cached-icon class="action-icon" :name="item.raw.icon" />
          </span>
        </template>
      </v-list-item>
    </template>
    <template #message="{ message }">
      <df-input-hint :message="message" :errors="shownErrors" />
    </template>
    <template v-if="$slots['append-inner']" #append-inner="props">
      <slot name="append-inner" v-bind="props" />
    </template>
    <template v-if="$slots['prepend-inner']" #prepend-inner="props">
      <slot name="prepend-inner" v-bind="props" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { castArray, isEqual, unionBy } from 'lodash-es';
import { computed, nextTick, onBeforeUnmount, ref, toRefs, unref, watch } from 'vue';
import { CachedIcon } from 'vue-cached-icon';
import { VAutocomplete, VCombobox } from 'vuetify/components';

import { DfSelectProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, SelectChoice, useInputBase } from './helpers';
import { useClientRendered } from './helpers/client-rendered';
import {
  convertItems,
  getSelectedChoices,
  multipleCompliantValue,
  updateSelectedFromValue,
} from './helpers/df-select.helper';

const propsWithDefaults = withDefaults(defineProps<DfSelectProps>(), {
  ...defaultBaseProps,
  choices: undefined,
  multiple: false,
  allowTags: false,
  allowNull: true,
  fetchChoices: undefined,
});

const { choices, multiple, allowTags: taggable, allowNull, cssClass } = toRefs(propsWithDefaults);

interface Emits extends BaseEmits {
  (e: 'update:modelValueDisplay', value: SelectChoice[]): any;
}

const emits = defineEmits<Emits>();
defineSlots<{
  'append-inner'?: (props: any) => any;
  'prepend-inner'?: (props: any) => any;
}>();

const dfSelectRef = ref<InstanceType<typeof VAutocomplete> | InstanceType<typeof VCombobox> | null>(null);

const {
  densityClass,
  isRendered,
  label,
  shownErrors,
  touched,
  value: resultingValue,
  visibilityClass,
  vuetifyBindings,
} = useInputBase(propsWithDefaults, emits);

// on the server and until it renders in the browser, the select is a text field holding the chosen choices' text:
// Vuetify's autocomplete keeps its menu in memory after a server render
const clientRendered = useClientRendered();
const inBrowser = typeof window !== 'undefined';
const selected = ref<any>(null);
const takeLoaded = ref(false);
const loaded = ref<SelectChoice[]>([]);
const loadedChoices = computed<SelectChoice[]>(() => (unref(takeLoaded) ? unref(loaded) : unref(choices) || []));
// Number of fetchChoices calls in flight that resolve ids held by the value (resolveValueChoices()).
const resolvingValue = ref(0);
// The choices for the value are not known yet while they are being fetched, and on the server for a select with
// fetchChoices, which does not fetch there.
const valueChoicesPending = computed(
  () => resolvingValue.value > 0 || (propsWithDefaults.fetchChoices !== undefined && !inBrowser),
);

function currentValue() {
  return multipleCompliantValue(resultingValue.value, multiple.value);
}

// The loaded choices and, for every id of the value that none of them covers, a choice whose text is the id: the
// select shows the value it holds and does not drop those ids from it. A taggable select shows such ids by itself.
const displayChoices = computed<SelectChoice[]>(() => {
  const loadedList = loadedChoices.value;
  const mcVal = currentValue();
  if (taggable.value || mcVal == null || valueChoicesPending.value) return loadedList;
  const unknown = castArray(mcVal).filter((val) => !loadedList.some((choice) => choice.id === val));
  if (!unknown.length) return loadedList;
  return [...loadedList, ...unknown.map((val): SelectChoice => ({ id: val, text: String(val) }))];
});

const options = computed(() => convertItems(displayChoices.value));
const chosenText = computed(() =>
  getSelectedChoices(displayChoices.value, currentValue())
    .map((choice) => choice.text)
    .join(', '),
);
const searchText = ref<string | null>(null);
const fetchCounterGlobal = ref(0);
const isMultiline = ref(false);
// Number of queryOptions() calls in flight.
const searching = ref(0);
const loading = computed(() => searching.value > 0 || resolvingValue.value > 0);

if (choices.value?.length && propsWithDefaults.fetchChoices !== undefined) {
  console.warn('Both choices and fetchChoices are set. Only one of them should be set.');
}

let emittedDisplay: SelectChoice[] | null = null;

function emitModelValueDisplay() {
  if (valueChoicesPending.value) return;
  const display = getSelectedChoices(displayChoices.value, currentValue());
  if (emittedDisplay !== null && isEqual(display, emittedDisplay)) return;
  emittedDisplay = display;
  emits('update:modelValueDisplay', display);
}

// sets what the select shows; the value is not written
function syncSelected(value: any) {
  updateSelectedFromValue(value, selected, multiple.value, taggable.value, displayChoices.value);
}

const setResultingValueGuard = ref(false);
// Number of writes into the value. A write onSelect() defers is dropped when another write is made before it.
let writeCount = 0;

// The only place the select writes into the value. It is called from the user's edits only: setting the select up,
// mounting it, loading choices or a value set from outside leave the value as it is.
function setResultingValue(newValue: any) {
  writeCount++;
  setResultingValueGuard.value = true;
  try {
    resultingValue.value = newValue;
  } finally {
    // The guard suppresses the watch that pushes the model's value back into `selected`. A write the control does not
    // take verbatim - a ValueChangedAction that writes another value back, a handler that throws and unwinds it - never
    // reaches that watch, so the chips would go on showing a selection the control never took. Comparing what the
    // control holds against what was written is what restores it, and it needs a deep comparison: for multiple
    // selection the value reads back as a different array holding the same items. The comparison waits for the next
    // tick: under v-model the parent passes the written value back as modelValue only when it re-renders, and a read
    // before that sees the previous value, reverts the selection and emits it, which the parent passes back in turn -
    // the two keep swapping values without end.
    nextTick(() => {
      const current = multipleCompliantValue(resultingValue.value, multiple.value);
      if (!isEqual(current, newValue)) {
        syncSelected(current);
      }
      setResultingValueGuard.value = false;
    });
  }
}

function getFullWidth(item: HTMLElement | null) {
  if (!item) return 0;
  const rect = item.getBoundingClientRect();
  const style = window.getComputedStyle(item);

  return rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
}

function checkMultiline() {
  if (multiple.value && allowNull.value && selected.value != null && selected.value.length > 0 && dfSelectRef.value) {
    const dfSelect = dfSelectRef.value.$el;
    const inputWidth = dfSelect.querySelector('.v-input__control')?.clientWidth;
    const container = dfSelect.querySelector('.v-field__input');
    const items = container.querySelectorAll('.v-autocomplete__selection, .v-combobox__selection');

    const style = window.getComputedStyle(container);
    let selectedWidth = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);

    items.forEach((item: HTMLElement) => {
      selectedWidth += getFullWidth(item);
    });

    const clearableWidth = getFullWidth(dfSelect.querySelector('.v-field .v-field__clearable'));
    const appendWidth = getFullWidth(dfSelect.querySelector('.v-field .v-field__append-inner'));
    const chipGap = 2;
    isMultiline.value = inputWidth - selectedWidth - items.length * chipGap - appendWidth < clearableWidth;
  } else {
    isMultiline.value = false;
  }
}

function onMouseDown(event: MouseEvent) {
  // če je klik na close ikoni ali njenem childu
  const target = event.target;
  if (target instanceof HTMLElement && target.closest('.v-chip__close')) {
    event.stopPropagation();
    event.preventDefault();
  }
}

// a value set from outside the component: its choices are resolved and the select shows it
watch(
  resultingValue,
  (newValue: any) => {
    if (setResultingValueGuard.value) return;
    const mcVal = multipleCompliantValue(newValue, multiple.value);
    resolveValueChoices(mcVal);
    syncSelected(mcVal);
  },
  { deep: true },
);
// choices loaded, replaced or resolved for the value: the select shows the value against them
watch(displayChoices, () => syncSelected(currentValue()));
watch([displayChoices, valueChoicesPending, resultingValue], emitModelValueDisplay, { deep: true });

watch(selected, () => nextTick(checkMultiline), { deep: true });

// the chips wrap differently once the field's width changes; a change of its height alone leaves the layout as it is
let observedWidth = 0;
const resizeObserver =
  typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(([entry]) => {
        const width = entry.contentRect.width;
        if (width === observedWidth) return;
        observedWidth = width;
        checkMultiline();
      });
watch(
  () => dfSelectRef.value?.$el as Element | undefined,
  (el) => {
    resizeObserver?.disconnect();
    observedWidth = 0;
    if (el instanceof Element) resizeObserver?.observe(el);
  },
);
onBeforeUnmount(() => resizeObserver?.disconnect());

function resetQuery() {
  if (searchText.value != null && searchText.value.length > 0) {
    searchText.value = null;
    queryOptions();
  }
}

// Vuetify reports a clear as a selection of nothing and emits click:clear after it: the write waits a tick, and
// onClear() writes in its place. A taggable select keeps the search text: a single combobox selects as it is typed.
function onSelect(/* val: any */) {
  if (vuetifyBindings.value.readonly) return;
  if (!taggable.value) resetQuery();
  const writesBefore = writeCount;
  nextTick(() => {
    if (writeCount !== writesBefore) return;
    const mcVal = multipleCompliantValue(selected.value, multiple.value);
    syncSelected(mcVal);
    setResultingValue(mcVal);
  });
}

// the clear button is offered under allowNull only
function onClear() {
  if (vuetifyBindings.value.readonly) return;
  syncSelected(null);
  setResultingValue(null);
}

// closing the last chip of a multiple select leaves an empty array
function chipClose(event: MouseEvent, itemValue: any) {
  event.stopPropagation();
  if (vuetifyBindings.value.readonly) return;
  const remaining =
    multiple.value && Array.isArray(selected.value) ? selected.value.filter((v) => v !== itemValue) : [];
  if (!allowNull.value && !remaining.length) return;
  const mcVal = multipleCompliantValue(remaining, multiple.value);
  syncSelected(mcVal);
  setResultingValue(mcVal);
}

async function queryOptions(queryValue?: any, idValue?: any): Promise<void> {
  if (vuetifyBindings.value.readonly) return;
  searchText.value = queryValue;
  if (choices.value || propsWithDefaults.fetchChoices === undefined) return;
  const fetchCounter = ++fetchCounterGlobal.value;
  searching.value++;
  try {
    const newChoices = await propsWithDefaults.fetchChoices(queryValue, idValue);
    if (fetchCounter !== fetchCounterGlobal.value) return;
    // Taken after the fetch, from the value: choices resolveValueChoices() loaded while this call was in flight
    // must survive the search results replacing the rest.
    const selectedChoices = getSelectedChoices(
      loadedChoices.value,
      multipleCompliantValue(resultingValue.value, multiple.value),
    );
    loaded.value = unionBy([...selectedChoices, ...newChoices], 'id');
    takeLoaded.value = true;
  } catch (error) {
    // a failed fetch leaves the choices as they are; a rejection out of here would be unhandled
    console.error(error);
  } finally {
    searching.value--;
  }
}

/**
 * Loads the choices for the ids in `mcVal` that loadedChoices has none for, through fetchChoices' idValue. Returns
 * null when there is nothing to load: no fetchChoices, a taggable select (its value is not limited to choices), or
 * every id already has its choice. An id fetchChoices returns no choice for is shown with a choice whose text is the
 * id (displayChoices).
 */
function resolveValueChoices(mcVal: any): Promise<void> | null {
  const fetchChoices = propsWithDefaults.fetchChoices;
  if (fetchChoices === undefined || taggable.value || mcVal == null) return null;
  const unresolved = castArray(mcVal).filter((val) => !loadedChoices.value.some((choice) => choice.id === val));
  if (!unresolved.length) return null;
  resolvingValue.value++;
  return (async () => {
    try {
      const newChoices = await fetchChoices(undefined, multiple.value ? unresolved : unresolved[0]);
      loaded.value = unionBy([...loadedChoices.value, ...newChoices], 'id');
      takeLoaded.value = true;
    } catch (error) {
      console.error(error);
    } finally {
      resolvingValue.value--;
    }
  })();
}

// Starting settings: with fetchChoices, the ids of the value are resolved into their choices. Anything else - an
// empty value, a taggable select - goes through queryOptions() with the value as idValue. On the server nothing is
// fetched: the server does not wait for a fetch, so its result would not reach the HTML.
if (propsWithDefaults.fetchChoices !== undefined && inBrowser) {
  if (!resolveValueChoices(currentValue())) queryOptions(undefined, resultingValue.value);
}
syncSelected(currentValue());
emitModelValueDisplay();
</script>

<style scoped>
/* Vuetify gives the search input a minimum width of 64px, which wraps it under a long chip of a single select before
   anything is typed. The input's minimum width is the text typed into it, up to the width of the
   field: it stays beside the chip while the text fits there, and wraps to a line of its own when it does not */
.df-select-single :deep(.v-field__input > input) {
  min-width: min(var(--df-select-search-width), 100%);
}

.df-select-multirow :deep(.v-field__clearable) {
  position: absolute;
}

.df-select-multirow :deep(.v-field__append-inner) {
  margin-top: 24px;
}

.df-select-multirow :deep(.v-autocomplete .v-field:not(.v-field--focused) input) {
  min-width: 24px;
}
</style>
