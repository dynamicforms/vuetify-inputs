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
    :label="isFocused ? '' : vuetifyBindings.label"

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
    @focus="isFocused = true"
    @blur="isFocused = false"
  >
    <template #chip="{ item }">
      <v-chip
        :key="item.value"
        label
        size="small"
        :variant="multiple ? 'tonal' : 'text'"
        :closable="multiple"
        @click:close="chipClose(item.value)"
      >
        <template #prepend>
          <span v-if="item.raw?.icon" class="me-1">
            <IonIcon class="action-icon d-inline-block" :name="item.raw.icon"/>
          </span>
        </template>
        {{ item.title }}
      </v-chip>
    </template>

    <template #item="{ props: prps, item }">
      <v-list-item v-bind="prps">
        <template #prepend>
          <span v-if="item.raw?.icon" class="me-1">
            <IonIcon class="action-icon d-inline-block" :name="item.raw.icon"/>
          </span>
        </template>
      </v-list-item>
    </template>
    <template #message="{ message }"><messages-widget :message="message" :errors="errors"/></template>
  </component>
</template>

<script setup lang="ts">
import { DisplayMode } from '@dynamicforms/vue-forms';
import { ref, computed, toRefs, watch, nextTick } from 'vue';
import IonIcon from 'vue-ionicon';

import {
  BaseEmits,
  BaseProps,
  defaultBaseProps,
  MessagesWidget,
  SelectChoice,
  SelectFetchChoices,
  useInputBase,
} from './helpers';
import {
  convertItems,
  getSelectedChoices,
  multipleCompliantValue,
  updateSelectedFromValue,
} from './helpers/df-select.helper';

interface Props extends BaseProps {
  choices?: SelectChoice[];
  multiple?: boolean;
  allowTags?: boolean;
  allowNull?: boolean;
  fetchChoices?: SelectFetchChoices;
}

const propsWithDefaults = withDefaults(defineProps<Props>(), {
  ...defaultBaseProps,
  choices: undefined,
  multiple: false,
  allowTags: false,
  allowNull: true,
  fetchChoices: undefined,
});

const { choices } = propsWithDefaults;
const { multiple, allowTags: taggable, allowNull, cssClass, visibility } = toRefs(propsWithDefaults);
const isFocused = ref(false);

interface Emits extends BaseEmits {
  (e: 'update:modelValueDisplay', value: SelectChoice[]): any;
}

const emits = defineEmits<Emits>();

const { errors, value: resultingValue, vuetifyBindings } = useInputBase(propsWithDefaults, emits);

const selected = ref<any>(null);
const loadedChoices = ref<SelectChoice[]>(choices || []);
const loading = ref<boolean>(false);

const options = computed(() => convertItems(loadedChoices.value));

function emitModelValueDisplay(mcVal: any) {
  emits('update:modelValueDisplay', getSelectedChoices(loadedChoices.value, mcVal));
}

watch(selected, (newValue) => {
  if (vuetifyBindings.value.readonly) return;
  nextTick(() => {
    const mcVal = multipleCompliantValue(newValue, multiple.value);
    emitModelValueDisplay(mcVal);
    resultingValue.value = mcVal;
  });
}, { deep: true });

function onSelect(/* val: any */) {
  if (vuetifyBindings.value.readonly || taggable.value) return;
  const mcVal = multipleCompliantValue(selected.value, multiple.value);
  updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
  resultingValue.value = mcVal;
}

function chipClose(itemValue: any) {
  let mcVal;
  if (multiple.value && Array.isArray(selected.value)) {
    mcVal = multipleCompliantValue(selected.value.filter((v) => v !== itemValue), multiple.value);
  } else {
    mcVal = null;
  }
  updateSelectedFromValue(mcVal, selected, multiple.value, false, loadedChoices.value);
  resultingValue.value = mcVal;
}

async function queryOptions(queryValue?: any, idValue?: any): Promise<void> {
  if (choices || propsWithDefaults.fetchChoices === undefined) return;
  loading.value = true;
  try {
    loadedChoices.value = await propsWithDefaults.fetchChoices(queryValue, idValue);
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
  resultingValue.value = val;
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
.action-icon {
  width: 1.5em;
  height: 1.5em;
}
</style>
