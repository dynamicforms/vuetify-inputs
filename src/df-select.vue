<template>
  <component
    :is="taggable ? 'v-combobox' : 'v-autocomplete'"
    v-if="visibility !== DisplayMode.SUPPRESS"
    v-model="selected"
    :class="[
      cssClass,
      {
        'd-none': visibility === DisplayMode.HIDDEN,
        invisible: visibility === DisplayMode.INVISIBLE,
      },
    ]"
    :items="options"
    :return-object="false"
    v-bind="vuetifyBindings"
    :label="vuetifyBindings.label"
    chips
    :auto-select-first="true"
    :closable-chips="allowNull || (multiple && selected.length > 1)"
    :clearable="allowNull"
    :multiple="multiple"
    :loading="loading"
    :hide-selected="false"
    :aria-describedby="vuetifyBindings.helpText ? `${vuetifyBindings.name}-help` : null"
    :menu-props="{ maxHeight: '400' }"
    hide-details="auto"
    @update:search="(query: any) => queryOptions(query, undefined)"
    @update:model-value="onSelect"
    @click:clear="selected = null"
    @blur="touched = true"
  >
    <template v-if="label.icon" #label="labelData">
      <df-label :data="labelData" :label="label" />
    </template>
    <template #chip="{ item }">
      <v-chip
        :key="item.value"
        label
        size="small"
        class="d-flex align-middle"
        :variant="multiple ? 'tonal' : 'text'"
        :closable="multiple"
        @click:close="chipClose(item.value)"
      >
        <template #prepend>
          <cached-icon v-if="item.raw?.icon" class="me-1" :name="item.raw.icon" />
        </template>
        <span :class="{ 'text-body-1': !multiple }">{{ item.title }}</span>
      </v-chip>
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
      <messages-widget :message="message" :errors="errors" />
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
import { ref, computed, toRefs, watch, nextTick, unref } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfSelectProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, DfLabel, MessagesWidget, SelectChoice, useInputBase } from './helpers';
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

const { errors, label, touched, value: resultingValue, vuetifyBindings } = useInputBase(propsWithDefaults, emits);

const selected = ref<any>(null);
const takeLoaded = ref(false);
const loaded = ref<SelectChoice[]>([]);
const loadedChoices = computed<SelectChoice[]>(() => (unref(takeLoaded) ? unref(loaded) : unref(choices) || []));
const loading = ref<boolean>(false);

const options = computed(() => convertItems(loadedChoices.value));

if (options.value && propsWithDefaults.fetchChoices !== undefined) {
  console.warn('Both options and fetchChoices are set. Only one of them should be set.');
}

function emitModelValueDisplay(mcVal: any) {
  emits('update:modelValueDisplay', getSelectedChoices(loadedChoices.value, mcVal));
}

let setResultingValueGuard = false;

function setResultingValue(newValue: any) {
  setResultingValueGuard = true;
  resultingValue.value = newValue;
  nextTick(() => {
    setResultingValueGuard = false;
  });
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
    if (!setResultingValueGuard) {
      const mcVal = multipleCompliantValue(newValue, multiple.value);
      updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
    }
  },
  { deep: true },
);

function onSelect(/* val: any */) {
  if (vuetifyBindings.value.readonly || taggable.value) return;
  const mcVal = multipleCompliantValue(selected.value, multiple.value);
  updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
  setResultingValue(mcVal);
}

function chipClose(itemValue: any) {
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
  if (choices.value || propsWithDefaults.fetchChoices === undefined) return;
  loading.value = true;
  try {
    const selectedChoices = getSelectedChoices(
      loadedChoices.value,
      multipleCompliantValue(selected.value, multiple.value),
    );
    const newChoices = await propsWithDefaults.fetchChoices(queryValue, idValue);
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
