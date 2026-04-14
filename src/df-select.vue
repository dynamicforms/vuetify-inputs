<template>
  <component
    :is="taggable ? 'v-combobox' : 'v-autocomplete'"
    v-if="visibility !== DisplayMode.SUPPRESS"
    ref="dfSelectRef"
    v-model="selected"
    :class="[
      cssClass,
      densityClass,
      {
        'd-none': visibility === DisplayMode.HIDDEN,
        invisible: visibility === DisplayMode.INVISIBLE,
        'df-select-multirow': isMultiline,
      },
    ]"
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
import { DisplayMode } from '@dynamicforms/vue-forms';
import { unionBy } from 'lodash-es';
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

const { choices, multiple, allowTags: taggable, allowNull, cssClass, visibility } = toRefs(propsWithDefaults);

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
  label,
  showErrors,
  touched,
  value: resultingValue,
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

if (options.value && propsWithDefaults.fetchChoices !== undefined) {
  console.warn('Both options and fetchChoices are set. Only one of them should be set.');
}

function emitModelValueDisplay(mcVal: any) {
  emits('update:modelValueDisplay', getSelectedChoices(loadedChoices.value, mcVal));
}

const setResultingValueGuard = ref(false);

function setResultingValue(newValue: any) {
  setResultingValueGuard.value = true;
  resultingValue.value = newValue;
  nextTick(() => {
    setResultingValueGuard.value = false;
  });
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
    if (vuetifyBindings.value.readonly) return;
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
    if (!setResultingValueGuard.value) {
      const mcVal = multipleCompliantValue(newValue, multiple.value);
      updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
    }
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
    const selectedChoices = getSelectedChoices(
      loadedChoices.value,
      multipleCompliantValue(selected.value, multiple.value),
    );
    const newChoices = await propsWithDefaults.fetchChoices(queryValue, idValue);
    if (fetchCounter !== fetchCounterGlobal.value) return;
    loaded.value = unionBy([...selectedChoices, ...newChoices], 'id');
    takeLoaded.value = true;
  } finally {
    loading.value = false;
  }
}

function initialValueCheck() {
  let val = resultingValue.value;
  if (!allowNull.value && val == null && options.value.length) {
    // Starting settings: check if value is mandatory and select the first item from the options
    val = options.value[0].value;
  }
  val = multipleCompliantValue(val, multiple.value);
  updateSelectedFromValue(val, selected, multiple.value, taggable.value, loadedChoices.value);
  emitModelValueDisplay(val);
  setResultingValue(val);
}

initialValueCheck();

// Starting settings: check if ajax and current value is not loaded yet - then load the value from back-end
if (propsWithDefaults.fetchChoices !== undefined) {
  queryOptions(undefined, resultingValue.value).then(() => {
    initialValueCheck();
  });
}
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
