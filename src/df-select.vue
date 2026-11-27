<template>
  <v-text-field
    v-if="isRendered && !clientRendered"
    :class="[densityClass, visibilityClass]"
    :model-value="chosenText"
    v-bind="vuetifyBindings"
    readonly
  >
    <template #label="labelData"><df-label :data="labelData" /></template>
    <template #message="{ message }">
      <df-input-hint :message="message" />
    </template>
  </v-text-field>
  <component
    :is="taggable ? 'v-combobox' : 'v-autocomplete'"
    v-else-if="isRendered"
    ref="dfSelectRef"
    v-model="selected"
    :class="[densityClass, visibilityClass, { 'df-select-multirow': isMultiline, 'df-select-single': !multiple }]"
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
    :menu-props="{ maxHeight: '400' }"
    :list-props="listProps"
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
        :class="{ 'df-select-rich-chip': isRich(item.raw?.content) }"
        :variant="multiple ? 'tonal' : 'text'"
        :closable="false"
      >
        <template #prepend>
          <cached-icon v-if="item.raw?.icon" class="me-1" :name="item.raw.icon" aria-hidden="true" />
        </template>
        <span :class="{ 'text-body-1': !multiple }">
          <messages-widget v-if="isRich(item.raw?.content)" :message="[choiceRenderable(item.raw.content)]" />
          <template v-else>{{ item.title }}</template>
        </span>
        <!-- VChip's own close button passes its label through Vuetify's locale function, which reads it as a key -->
        <template v-if="multiple && (allowNull || selected.length > 1)" #append>
          <button
            type="button"
            class="v-chip__close"
            :aria-label="t('RemoveChoice', { choice: item.title })"
            @click="chipCloseClick($event, item.value)"
            @keydown="chipCloseKeydown($event, item.value)"
          >
            <v-icon icon="$delete" size="x-small" />
          </button>
        </template>
      </v-chip>
    </template>
    <template #label="labelData">
      <df-label :data="labelData" />
    </template>

    <template #item="{ props: prps, item }">
      <v-list-item v-choice-label="isRich(item.raw?.content)" v-bind="prps">
        <template #prepend>
          <span v-if="item.raw?.icon" class="me-1">
            <cached-icon class="action-icon" :name="item.raw.icon" aria-hidden="true" />
          </span>
        </template>
        <template v-if="isRich(item.raw?.content)" #title>
          <messages-widget :message="[choiceRenderable(item.raw.content)]" />
        </template>
      </v-list-item>
    </template>
    <template #no-data>
      <v-list-item class="df-select-no-data" @vue:mounted="menuEmpty = true" @vue:unmounted="menuEmpty = false">
        <template #title><messages-widget :message="[noDataMessage()]" /></template>
      </v-list-item>
    </template>
    <template #loader="{ color, isActive }">
      <v-progress-linear :active="isActive" :color="color" height="2" indeterminate :aria-label="t('Loading')" />
    </template>
    <template #message="{ message }">
      <df-input-hint :message="message" />
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
import { computed, type Directive, nextTick, onBeforeUnmount, ref, toRefs, unref, watch } from 'vue';
import { CachedIcon } from 'vue-cached-icon';
import { VAutocomplete, VCombobox } from 'vuetify/components';

import { DfSelectProps } from './dynamicforms-component-props';
import {
  BaseEmits,
  defaultBaseProps,
  DfInputHint,
  DfLabel,
  HtmlString,
  MessagesWidget,
  RenderableValue,
  renderContentText,
  SelectChoice,
  translate,
  useInputBase,
} from './helpers';
import { useClientRendered } from './helpers/client-rendered';
import {
  choiceContent,
  choiceText,
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
  noDataText: undefined,
  minQueryLength: 0,
  minQueryText: undefined,
  fetchDebounce: 0,
});

const { choices, multiple, allowTags: taggable, allowNull } = toRefs(propsWithDefaults);

interface Emits extends BaseEmits {
  (e: 'update:modelValueDisplay', value: SelectChoice[]): any;
}

const emits = defineEmits<Emits>();
defineSlots<{
  'append-inner'?: (props: any) => any;
  'prepend-inner'?: (props: any) => any;
}>();

const t = translate;

// a choice text rendered as content rather than as plain text
function isRich(text: unknown): boolean {
  return typeof choiceContent(text) !== 'string';
}

// read on every render, so that a function follows what it answers
function choiceRenderable(text: unknown): RenderableValue {
  return new RenderableValue(() => choiceContent(text));
}

// The accessible name of an option with rendered content: the text of its title, a line break and a block read as a
// space. Without it, the name runs the lines together.
function setChoiceLabel(el: HTMLElement, rich: boolean) {
  const title = el.querySelector('.v-list-item-title');
  if (rich && title) el.setAttribute('aria-label', renderContentText(new HtmlString(title.innerHTML)));
  else el.removeAttribute('aria-label');
}
const vChoiceLabel: Directive<HTMLElement, boolean> = {
  mounted: (el, { value }) => setChoiceLabel(el, value),
  updated: (el, { value }) => setChoiceLabel(el, value),
};

const dfSelectRef = ref<InstanceType<typeof VAutocomplete> | InstanceType<typeof VCombobox> | null>(null);

const {
  densityClass,
  isRendered,
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
// select shows the value it holds and does not drop those ids from it. An id whose text is blank gets no choice: an
// option and a chip without text have no accessible name. A taggable select shows such ids by itself.
const displayChoices = computed<SelectChoice[]>(() => {
  const loadedList = loadedChoices.value;
  const mcVal = currentValue();
  if (taggable.value || mcVal == null || valueChoicesPending.value) return loadedList;
  const unknown = castArray(mcVal).filter(
    (val) => String(val).trim() !== '' && !loadedList.some((choice) => choice.id === val),
  );
  if (!unknown.length) return loadedList;
  return [...loadedList, ...unknown.map((val): SelectChoice => ({ id: val, text: String(val) }))];
});

// The blank ids of a multiple value that no choice covers. The select shows no selection for them, and its writes
// keep them in the value.
function withHiddenIds(ids: any[]): any[] {
  const mcVal = currentValue();
  if (taggable.value || !multiple.value || mcVal == null) return ids;
  const hidden = castArray(mcVal).filter(
    (val) => !ids.includes(val) && !displayChoices.value.some((choice) => choice.id === val),
  );
  return hidden.length ? [...ids, ...hidden] : ids;
}

const options = computed(() => convertItems(displayChoices.value));
// The menu's list is a listbox only while it shows options; a list (role list) does not allow aria-multiselectable,
// which the autocomplete passes in either case. The no-data item is mounted while the list shows no options.
const menuEmpty = ref(false);
const listProps = computed(() => ({ 'aria-multiselectable': multiple.value && !menuEmpty.value ? true : undefined }));
const chosenText = computed(() =>
  getSelectedChoices(displayChoices.value, currentValue())
    .map((choice) => choiceText(choice.text))
    .join(', '),
);
const searchText = ref<string | null>(null);
const fetchCounterGlobal = ref(0);
const isMultiline = ref(false);
// Number of query fetches in flight.
const searching = ref(0);
const loading = computed(() => searching.value > 0 || resolvingValue.value > 0);
// a query fetch waiting for fetchDebounce
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const debouncePending = ref(false);

function fetchesChoices(): boolean {
  return !choices.value && propsWithDefaults.fetchChoices !== undefined;
}

function isShortQuery(query: any): boolean {
  return fetchesChoices() && String(query ?? '').length < propsWithDefaults.minQueryLength;
}

// the content the menu shows when it has no choices to show
function noDataMessage(): RenderableValue {
  if (isShortQuery(searchText.value)) {
    return new RenderableValue(
      propsWithDefaults.minQueryText ?? t('MinQuery', { count: propsWithDefaults.minQueryLength }),
    );
  }
  if (loading.value || debouncePending.value) return new RenderableValue(t('Loading'));
  return new RenderableValue(propsWithDefaults.noDataText ?? t('NoChoices'));
}

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

// The only place the select writes into the value; the select shows the written value. It is called from the user's
// edits only: setting the select up, mounting it, loading choices or a value set from outside leave the value as it is.
function setResultingValue(newValue: any) {
  syncSelected(newValue);
  writeCount++;
  setResultingValueGuard.value = true;
  try {
    resultingValue.value = newValue;
  } finally {
    // A write the control does not take verbatim never reaches the guarded watch: restore the chips from what the
    // control holds. Deep comparison: multiple selection reads back as a new array. Next tick: under v-model the parent
    // passes modelValue back on re-render; an earlier read reverts the write, and the two swap values without end.
    nextTick(() => {
      const current = currentValue();
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
  // a mousedown on a chip's close button or inside it
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
// Number of selections onSelect() has yet to write. Until then the select shows the selection, not the value.
let selectsPending = 0;
// choices loaded, replaced or resolved for the value: the select shows the value against them
watch(displayChoices, () => {
  if (!selectsPending) syncSelected(currentValue());
});
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
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  cancelDebounce();
});
watch(
  () => vuetifyBindings.value.readonly,
  (readonly) => {
    if (readonly) cancelDebounce();
  },
);

// a changed minQueryLength applies to the search text as it is
watch(
  () => propsWithDefaults.minQueryLength,
  () => {
    if (inBrowser) queryOptions(searchText.value, undefined, true);
  },
);

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
  selectsPending++;
  if (!taggable.value) resetQuery();
  const writesBefore = writeCount;
  nextTick(() => {
    selectsPending--;
    if (writeCount !== writesBefore) return;
    const mcVal = multipleCompliantValue(
      multiple.value && Array.isArray(selected.value) ? withHiddenIds(selected.value) : selected.value,
      multiple.value,
    );
    setResultingValue(mcVal);
  });
}

// the clear button is offered under allowNull only
function onClear() {
  if (vuetifyBindings.value.readonly) return;
  setResultingValue(null);
}

// closing the last chip of a multiple select leaves an empty array; returns whether the chip was removed
function chipClose(event: Event, itemValue: any): boolean {
  event.stopPropagation();
  if (vuetifyBindings.value.readonly) return false;
  const remaining =
    multiple.value && Array.isArray(selected.value) ? selected.value.filter((v) => v !== itemValue) : [];
  if (!allowNull.value && !remaining.length) return false;
  const mcVal = multipleCompliantValue(withHiddenIds(remaining), multiple.value);
  setResultingValue(mcVal);
  return true;
}

function chipCloseClick(event: MouseEvent, itemValue: any) {
  event.preventDefault();
  chipClose(event, itemValue);
}

// Enter and Space on a chip's close button remove the chip; the autocomplete does not see the key, as its Enter opens
// the menu. A held Space removes one chip only. Focus moves to the close button of the chip that takes the removed
// one's place, else to the input.
function chipCloseKeydown(event: KeyboardEvent, itemValue: any) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const button = event.currentTarget as Element;
  event.preventDefault();
  if (event.key === ' ' && event.repeat) {
    event.stopPropagation();
    return;
  }
  const root: Element | undefined = dfSelectRef.value?.$el;
  const buttons = root ? Array.from(root.querySelectorAll('.v-chip__close')) : [];
  const index = buttons.indexOf(button);
  if (!chipClose(event, itemValue)) return;
  nextTick(() => {
    const remaining = root ? Array.from(root.querySelectorAll<HTMLElement>('.v-chip__close')) : [];
    const next = remaining[Math.min(index, remaining.length - 1)];
    if (next) next.focus();
    else dfSelectRef.value?.focus();
  });
}

function cancelDebounce() {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = null;
  debouncePending.value = false;
}

// The ids of the chosen choices: of the selection while onSelect() has yet to write it, else of the value and the
// selection.
function chosenIds(): any[] {
  const sources = selectsPending ? [selected.value] : [currentValue(), selected.value];
  return sources.flatMap((val) => (val == null ? [] : castArray(val)));
}

// The loaded choices reduced to the chosen ones; a query fetch in flight is dropped.
function keepChosenChoices() {
  fetchCounterGlobal.value++;
  const ids = chosenIds();
  loaded.value = loadedChoices.value.filter((choice) => ids.includes(choice.id));
  takeLoaded.value = true;
}

function isEmptyValue(value: any): boolean {
  return value == null || (Array.isArray(value) && !value.length);
}

/**
 * Sets the search text and loads the choices for it. A query shorter than minQueryLength is not fetched: the loaded
 * choices are reduced to the chosen ones, and a non-empty `idValue` is fetched at once for its choices only. With
 * fetchDebounce, the fetch of a non-empty query waits until the query has not changed for that long, unless
 * `immediate` is set.
 */
function queryOptions(queryValue?: any, idValue?: any, immediate = false): void {
  if (vuetifyBindings.value.readonly) return;
  searchText.value = queryValue;
  if (!fetchesChoices()) return;
  cancelDebounce();
  if (isShortQuery(queryValue)) {
    keepChosenChoices();
    if (!isEmptyValue(idValue)) fetchQuery(queryValue, idValue, true);
    return;
  }
  const delay = propsWithDefaults.fetchDebounce;
  // an emptied search text is one action, not typing: it is fetched at once
  if (immediate || !(delay > 0) || String(queryValue ?? '') === '') {
    fetchQuery(queryValue, idValue);
    return;
  }
  debouncePending.value = true;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    debouncePending.value = false;
    fetchQuery(queryValue, idValue);
  }, delay);
}

// With `chosenOnly`, only the fetched choices of the value are taken.
async function fetchQuery(queryValue: any, idValue: any, chosenOnly = false): Promise<void> {
  const fetchChoices = propsWithDefaults.fetchChoices;
  if (fetchChoices === undefined) return;
  const fetchCounter = ++fetchCounterGlobal.value;
  searching.value++;
  try {
    const fetched = await fetchChoices(queryValue, idValue);
    if (fetchCounter !== fetchCounterGlobal.value) return;
    const ids = chosenOnly ? chosenIds() : [];
    const newChoices = chosenOnly ? fetched.filter((choice) => ids.includes(choice.id)) : fetched;
    // Taken after the fetch, from the value: choices resolveValueChoices() loaded while this call was in flight
    // must survive the search results replacing the rest.
    const selectedChoices = getSelectedChoices(loadedChoices.value, currentValue());
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
  if (!resolveValueChoices(currentValue())) queryOptions(undefined, resultingValue.value, true);
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

.v-chip.df-select-rich-chip {
  height: auto;
  min-height: var(--v-chip-height);
  padding-block: 2px;
  white-space: normal;
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
