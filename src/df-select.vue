<template>
  <component
    :is="taggable ? 'v-combobox' : 'v-autocomplete'"
    v-if="isRendered"
    ref="dfSelectRef"
    v-model="selected"
    :class="[cssClass, densityClass, visibilityClass, { 'df-select-multirow': isMultiline }]"
    :items="options"
    :return-object="false"
    chips
    :auto-select-first="true"
    :closable-chips="allowNull || (multiple && selected.length > 1)"
    :clearable="allowNull"
    :multiple="multiple"
    :loading="loading"
    :hide-selected="false"
    :aria-describedby="vuetifyBindings.helpText ? `${vuetifyBindings.name}-help` : null"
    :menu-props="{ maxHeight: '400' }"
    :search="searchText"
    v-bind="vuetifyBindings"
    @update:search="(query: any) => queryOptions(query, undefined)"
    @update:model-value="onSelect"
    @click:clear="selected = null"
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
        :closable="multiple"
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
      <df-input-hint :message="message" :errors="showErrors" />
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
import { computed, nextTick, ref, toRefs, unref, watch } from 'vue';
import { CachedIcon } from 'vue-cached-icon';
import { VAutocomplete, VCombobox } from 'vuetify/components';

import { DfSelectProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfInputHint, DfLabel, SelectChoice, useInputBase } from './helpers';
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
  showErrors,
  touched,
  value: resultingValue,
  visibilityClass,
  vuetifyBindings,
} = useInputBase(propsWithDefaults, emits);

const selected = ref<any>(null);
const takeLoaded = ref(false);
const loaded = ref<SelectChoice[]>([]);
const loadedChoices = computed<SelectChoice[]>(() => (unref(takeLoaded) ? unref(loaded) : unref(choices) || []));
const loading = ref<boolean>(false);

const options = computed(() => convertItems(loadedChoices.value));
const searchText = ref<string | null>(null);
const fetchCounterGlobal = ref(0);
const isMultiline = ref(false);
// Number of fetchChoices calls in flight that resolve ids held by the value (resolveValueChoices()). While any is
// pending, loadedChoices is not yet complete for the value, so `selected` - which only holds ids loadedChoices has a
// choice for - is not written back into the value: that would drop every id still being resolved.
const resolvingValue = ref(0);

if (choices.value?.length && propsWithDefaults.fetchChoices !== undefined) {
  console.warn('Both choices and fetchChoices are set. Only one of them should be set.');
}

function emitModelValueDisplay(mcVal: any) {
  emits('update:modelValueDisplay', getSelectedChoices(loadedChoices.value, mcVal));
}

const setResultingValueGuard = ref(false);

function setResultingValue(newValue: any) {
  setResultingValueGuard.value = true;
  try {
    resultingValue.value = newValue;
  } finally {
    // The guard suppresses the watch that pushes the model's value back into `selected`. A write the control does
    // not take verbatim - a ValueChangedAction that writes another value back, a disabled field that drops it, a
    // handler that throws and unwinds it - never reaches that watch, so the chips would go on showing a selection
    // the control never took. Comparing what the control holds against what was written is what restores it, and
    // it needs a deep comparison: for multiple selection the value reads back as a different array holding the
    // same items.
    if (!isEqual(multipleCompliantValue(resultingValue.value, multiple.value), newValue)) {
      updateSelectedFromValue(
        multipleCompliantValue(resultingValue.value, multiple.value),
        selected,
        multiple.value,
        taggable.value,
        loadedChoices.value,
      );
    }
    nextTick(() => {
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

watch(
  selected,
  (newValue) => {
    if (vuetifyBindings.value.readonly || resolvingValue.value > 0) return;
    nextTick(() => {
      const mcVal = multipleCompliantValue(newValue, multiple.value);
      emitModelValueDisplay(mcVal);
      setResultingValue(mcVal);
    });
  },
  { deep: true },
);
watch(
  resultingValue,
  (newValue: any) => {
    if (setResultingValueGuard.value) return;
    const mcVal = multipleCompliantValue(newValue, multiple.value);
    const resolved = resolveValueChoices(mcVal);
    updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
    resolved?.then(() => {
      // A value set while this call was in flight started its own resolution and owns `selected` from then on.
      if (!isEqual(multipleCompliantValue(resultingValue.value, multiple.value), mcVal)) return;
      updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
    });
  },
  { deep: true },
);

watch(setResultingValueGuard, () => {
  if (!setResultingValueGuard.value) {
    checkMultiline();
  }
});

function resetQuery() {
  if (searchText.value != null && searchText.value.length > 0) {
    searchText.value = null;
    queryOptions();
  }
}

function onSelect(/* val: any */) {
  resetQuery();
  if (vuetifyBindings.value.readonly || taggable.value) return;
  const mcVal = multipleCompliantValue(selected.value, multiple.value);
  updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
  setResultingValue(mcVal);
}

function chipClose(event: MouseEvent, itemValue: any) {
  event.stopPropagation();
  if (vuetifyBindings.value.readonly || taggable.value) {
    if (taggable.value) {
      selected.value = selected.value.filter((v: any) => v !== itemValue);
    }
    return;
  }
  let mcVal;
  if (multiple.value && Array.isArray(selected.value)) {
    mcVal = multipleCompliantValue(
      selected.value.filter((v) => v !== itemValue),
      multiple.value,
    );
  } else {
    mcVal = null;
  }
  updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
  setResultingValue(mcVal);
}

async function queryOptions(queryValue?: any, idValue?: any): Promise<void> {
  if (vuetifyBindings.value.readonly) return;
  searchText.value = queryValue;
  if (choices.value || propsWithDefaults.fetchChoices === undefined) return;
  const fetchCounter = ++fetchCounterGlobal.value;
  loading.value = true;
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
  } finally {
    loading.value = false;
  }
}

/**
 * Loads the choices for the ids in `mcVal` that loadedChoices has none for, through fetchChoices' idValue. Returns
 * null when there is nothing to load: no fetchChoices, a taggable select (its value is not limited to choices), or
 * every id already has its choice. An id fetchChoices returns no choice for stays without one, and the next
 * reconciliation against loadedChoices drops it from the value.
 */
function resolveValueChoices(mcVal: any): Promise<void> | null {
  const fetchChoices = propsWithDefaults.fetchChoices;
  if (fetchChoices === undefined || taggable.value || mcVal == null) return null;
  const unresolved = castArray(mcVal).filter((val) => !loadedChoices.value.some((choice) => choice.id === val));
  if (!unresolved.length) return null;
  resolvingValue.value++;
  loading.value = true;
  return (async () => {
    try {
      const newChoices = await fetchChoices(undefined, multiple.value ? unresolved : unresolved[0]);
      loaded.value = unionBy([...loadedChoices.value, ...newChoices], 'id');
      takeLoaded.value = true;
    } finally {
      resolvingValue.value--;
      loading.value = false;
    }
  })();
}

function initialValueCheck() {
  let val = resultingValue.value;
  if (!allowNull.value && val == null && options.value.length) {
    // Starting settings: check if value is mandatory and select the first item from the options
    val = options.value[0].value;
  }
  val = multipleCompliantValue(val, multiple.value);
  updateSelectedFromValue(val, selected, multiple.value, taggable.value, loadedChoices.value);
  if (resolvingValue.value > 0) return;
  emitModelValueDisplay(val);
  setResultingValue(val);
}

// Starting settings: with fetchChoices, a value is first resolved into its choices and only then reconciled against
// them. Anything else - an empty value, a taggable select - goes through queryOptions() with the value as idValue.
let initialLoad: Promise<void> | null = null;
if (propsWithDefaults.fetchChoices !== undefined) {
  initialLoad =
    resolveValueChoices(multipleCompliantValue(resultingValue.value, multiple.value)) ??
    queryOptions(undefined, resultingValue.value);
}

initialValueCheck();

initialLoad?.then(() => {
  initialValueCheck();
});
</script>

<style scoped>
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
