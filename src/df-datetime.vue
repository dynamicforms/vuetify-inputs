<template>
  <input-base
    v-bind="props"
    :errors="shownInputErrors"
    :class="densityClass"
    :clearable="clearable"
    @click:clear="clear"
    @blur="touched = true"
  >
    <template #default="slotProps">
      <div
        :class="[
          'd-flex',
          'w-100',
          ['plain', 'underlined'].includes(vuetifyBindings.variant) ? undefined : 'ml-4',
          'df-input-wrapper',
          density,
        ]"
        @keydown.capture="onKeydown"
      >
        <v-text-field
          v-if="['date', 'datetime'].includes(inputType)"
          v-model="dateText"
          class="df-datetime-date"
          style="flex-grow: 4"
          density="compact"
          variant="plain"
          :clearable="false"
          :hide-details="true"
          :readonly="vuetifyBindings.readonly"
          :disabled="vuetifyBindings.disabled"
          :name="`${vuetifyBindings.name}-date`"
          :placeholder="vuetifyBindings.placeholder"
          v-bind="passthroughAttrs"
          @update:model-value="closeMenu('date')"
          @click="dropdown = 'date'"
          @mousedown="markPointerFocus"
          @mouseup="keepSelectionOnPointerFocus"
          @focus="
            selectText($event);
            slotProps.focus();
          "
          @blur="
            closeMenu('date');
            commitDate();
            slotProps.blur();
          "
        >
          <template #default>
            <v-menu v-if="clientRendered" v-model="dateMenuShown" :close-on-content-click="false" activator="parent">
              <div @mousedown.prevent>
                <v-date-picker
                  v-model="pickerDate"
                  :hide-header="true"
                  :first-day-of-week="firstDayOfWeek"
                  :show-adjacent-months="true"
                  :show-week="true"
                  @update:view-mode="viewChanged"
                  @update:month="viewChanged"
                  @update:year="viewChanged"
                  @dblclick="saveOnDoubleClick($event, '.v-date-picker-month__day', saveDate)"
                >
                  <template #actions>
                    <confirm-actions :save="saveDate" :cancel="cancelPicker" :is-pristine="datePristine" />
                  </template>
                </v-date-picker>
              </div>
            </v-menu>
          </template>
        </v-text-field>

        <v-text-field
          v-if="['time', 'datetime'].includes(inputType)"
          v-model="timeText"
          class="df-datetime-time"
          style="flex-grow: 3"
          density="compact"
          variant="plain"
          :clearable="false"
          :hide-details="true"
          :readonly="vuetifyBindings.readonly"
          :disabled="vuetifyBindings.disabled"
          :name="`${vuetifyBindings.name}-time`"
          :placeholder="inputType === 'time' ? vuetifyBindings.placeholder : undefined"
          v-bind="passthroughAttrs"
          @update:model-value="closeMenu('time')"
          @click="dropdown = 'time'"
          @mousedown="markPointerFocus"
          @mouseup="keepSelectionOnPointerFocus"
          @focus="
            selectText($event);
            slotProps.focus();
          "
          @blur="
            closeMenu('time');
            commitTime();
            slotProps.blur();
          "
        >
          <template #default>
            <v-menu v-if="clientRendered" v-model="timeMenuShown" :close-on-content-click="false" activator="parent">
              <div @mousedown.prevent>
                <v-time-picker
                  v-model="pickerTime"
                  v-model:view-mode="timeViewMode"
                  :hide-header="true"
                  format="24hr"
                  @update:view-mode="viewChanged"
                  @dblclick="saveOnDoubleClick($event, '.v-time-picker-clock', saveTime)"
                >
                  <template #actions>
                    <confirm-actions :save="saveTime" :cancel="cancelPicker" :is-pristine="timePristine" />
                  </template>
                </v-time-picker>
              </div>
            </v-menu>
          </template>
        </v-text-field>
      </div>
    </template>
  </input-base>
</template>

<script setup lang="ts">
import { ValidationError } from '@dynamicforms/vue-forms';
import {
  addDays,
  addMonths,
  type Day,
  differenceInCalendarWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  max,
  min,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ref, computed, inject, watch, toRefs, unref } from 'vue';

import { DfDateTimeProps } from './dynamicforms-component-props';
import {
  BaseEmits,
  DateTimeLocaleConfig,
  defaultBaseProps,
  InputBase,
  useInputBase,
  type VuetifyInputsSettings,
  vuetifyInputsSettingsKey,
} from './helpers';
import { useClientRendered } from './helpers/client-rendered';
import ConfirmActions from './helpers/confirm-actions.vue';
import { parseDateInput, parseTimeInput, setInputError } from './helpers/date-time-input';
import { usePickerDoubleClick } from './helpers/picker-double-click';

const props = withDefaults(defineProps<DfDateTimeProps>(), {
  ...defaultBaseProps,
  inputType: 'datetime',
  displayFormatDate: 'P',
  displayFormatTime: 'p',
});

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const settings = inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});
const currentLocale = computed(
  () => props.locale ?? unref(settings.dateTimeLocale) ?? unref(DateTimeLocaleConfig.dateTimeLocale),
);
const firstDayOfWeek = computed(() => currentLocale.value.options?.weekStartsOn ?? 1);
// a typed date or time that cannot be read leaves the value as it is and reports an error until it is corrected
const dateInvalid = ref(false);
const timeInvalid = ref(false);
const invalidDateError = new ValidationError('invalid_date', {}, 'Not a valid date.', 'application');
const invalidTimeError = new ValidationError('invalid_time', {}, 'Not a valid time.', 'application');
const inputErrors = () => [
  ...(dateInvalid.value ? [invalidDateError] : []),
  ...(timeInvalid.value ? [invalidTimeError] : []),
];

const { density, densityClass, touched, value, vuetifyBindings } = useInputBase<string | null>(props, emits);
// without a control, input-base shows the errors it is given; a bound control holds them in its own errors
const shownInputErrors = computed(() => [...(props.errors ?? []), ...inputErrors()]);
const { inputType, displayFormatDate, displayFormatTime } = toRefs(props);

const dropdown = ref('');
const clientRendered = useClientRendered();
const dateMenuShown = computed({
  get() {
    return !vuetifyBindings.value.readonly && unref(dropdown) === 'date';
  },
  set(newValue: boolean) {
    dropdown.value = newValue ? 'date' : '';
  },
});
const timeMenuShown = computed({
  get() {
    return !vuetifyBindings.value.readonly && unref(dropdown) === 'time';
  },
  set(newValue: boolean) {
    dropdown.value = newValue ? 'time' : '';
  },
});

// a value picked in the menu or cleared concludes the edit: the field may hold no focus to lose
function concludeEdit() {
  dropdown.value = '';
  touched.value = true;
}

// typing into a field or leaving it closes its menu: the arrow keys then move the caret instead of the picker
function closeMenu(which: 'date' | 'time') {
  if (dropdown.value === which) dropdown.value = '';
}

function cancelPicker() {
  dropdown.value = '';
}

const { viewChanged, saveOnDoubleClick } = usePickerDoubleClick();

function clear() {
  value.value = null;
  showValue();
  touched.value = true;
}

const formatNaive = (val: Date) => `${format(val, 'yyyy-MM-dd')}T${format(val, 'HH:mm')}:00`;

const valueISOFull = ref<string | null>(null);
// the date and time parts of `base` with one of them replaced by the same part of `newISOValue`
function mergeParts(base: string, newISOValue: string, dateOrTimeIdx: number) {
  const vif = base.split(/[TZ]/g);
  vif[dateOrTimeIdx] = newISOValue.split(/[TZ]/g)[dateOrTimeIdx];
  return vif;
}

const naiveFromParts = (vif: string[]) => formatNaive(new Date(`${vif[0]}T${vif[1].split('.')[0]}`));

// Reading the field's value (dateOrTimeIdx -1) only sets what the control shows: the field keeps the string it holds
// until the user edits the date or the time. parseISO reads a date without a time as local midnight, where the Date
// constructor reads it as UTC midnight and shows the previous day west of Greenwich.
function setValueISOFull(newISOValue: string | null, dateOrTimeIdx: number) {
  if (newISOValue == null) {
    valueISOFull.value = null;
  } else if (dateOrTimeIdx === -1) {
    if (unref(inputType) === 'time') {
      valueISOFull.value = naiveFromParts(mergeParts(formatNaive(new Date()), `T${newISOValue}`, 1));
    } else {
      valueISOFull.value = formatNaive(parseISO(newISOValue));
    }
  } else {
    const vif = mergeParts(valueISOFull.value ?? formatNaive(new Date()), newISOValue, dateOrTimeIdx);
    valueISOFull.value = naiveFromParts(vif);
    if (unref(inputType) === 'date') value.value = vif[0];
    else if (unref(inputType) === 'time') value.value = valueISOFull.value.split('T')[1];
    // the offset is the one in force on the date written, not today's: across a DST change the two differ by an hour
    else value.value = valueISOFull.value + format(new Date(valueISOFull.value), 'XXX');
  }
}

watch(value, (newValue: string | null) => setValueISOFull(newValue, -1), { immediate: true });

const valueAsDate = computed({
  get() {
    const uValue = unref(valueISOFull);
    if (uValue == null) return null;
    const res = new Date(uValue);
    return !Number.isNaN(res.getTime()) ? res : null;
  },
  set(newValue: Date) {
    setValueISOFull(formatNaive(newValue), 0);
  },
});

const valueAsTimeString = computed({
  get() {
    const val = unref(valueISOFull);
    if (val == null) return '';
    const vif = val.split(/[TZ]/g);
    return vif[1].split('.')[0];
  },
  set(newValue: string) {
    setValueISOFull(`T${newValue}`, 1);
  },
});

// The choice in an open picker. OK, Enter and a double-click write it into the value; it is reset to the value when
// the menu opens or the value changes.
const pickerDate = ref<Date | null>(null);
const pickerTime = ref('');
const timeViewMode = ref<'hour' | 'minute' | 'second'>('hour');
watch(
  [dropdown, valueAsDate],
  ([shown], [shownBefore]) => {
    pickerDate.value = valueAsDate.value;
    pickerTime.value = valueAsTimeString.value;
    if (shown !== shownBefore) timeViewMode.value = 'hour';
  },
  { immediate: true },
);
const datePristine = computed(() => pickerDate.value?.getTime() === valueAsDate.value?.getTime());
const timePristine = computed(() => pickerTime.value.slice(0, 5) === valueAsTimeString.value.slice(0, 5));

function saveDate() {
  if (!datePristine.value && pickerDate.value) valueAsDate.value = pickerDate.value;
  concludeEdit();
}

function saveTime() {
  if (!timePristine.value && pickerTime.value) valueAsTimeString.value = pickerTime.value;
  concludeEdit();
}

const dateSteps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

// The calendar shows a month as rows of weeks. Left and right step one day within a row; from its last column right
// goes to the first column of the same row of the next month, and from its first column left goes to the last column of
// the same row of the previous month. A cell of that row outside that month is replaced by the month's nearest day.
function stepDate(date: Date, key: string) {
  const weekOptions = { weekStartsOn: firstDayOfWeek.value as Day };
  const toNext = key === 'ArrowRight' && isSameDay(date, endOfWeek(date, weekOptions));
  const toPrevious = key === 'ArrowLeft' && isSameDay(date, startOfWeek(date, weekOptions));
  if (!toNext && !toPrevious) return addDays(date, dateSteps[key]);

  const row = differenceInCalendarWeeks(date, startOfMonth(date), weekOptions);
  const month = startOfMonth(addMonths(date, toNext ? 1 : -1));
  const rowStart = addDays(startOfWeek(month, weekOptions), row * 7);
  if (toNext) return max([month, min([rowStart, startOfWeek(endOfMonth(month), weekOptions)])]);
  return min([addDays(rowStart, 6), endOfMonth(month)]);
}

const timeSteps: Record<string, number> = { ArrowLeft: -60, ArrowRight: 60, ArrowUp: 1, ArrowDown: -1 };

// a step of the picker's time in minutes, wrapping around midnight
function stepTime(minutes: number) {
  const now = new Date();
  const [hours, mins] = pickerTime.value ? pickerTime.value.split(':').map(Number) : [now.getHours(), now.getMinutes()];
  const total = (((hours * 60 + mins + minutes) % 1440) + 1440) % 1440;
  const pad = (n: number) => n.toString().padStart(2, '0');
  pickerTime.value = `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  timeViewMode.value = Math.abs(minutes) === 60 ? 'hour' : 'minute';
}

// Runs in the capture phase, before the menu's own handler, which moves the focus into the menu on an up or down arrow
// and so out of the field, which closes the menu.
function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  const which = target.closest('.df-datetime-date') ? 'date' : target.closest('.df-datetime-time') ? 'time' : null;
  if (which == null || vuetifyBindings.value.readonly) return;
  const shown = dropdown.value === which;
  const handled = () => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (event.key === 'Enter') {
    if (shown) (which === 'date' ? saveDate : saveTime)();
    else if (which === 'date') commitDate();
    else commitTime();
  } else if (event.key === ' ') {
    // the text as shown opens the picker; text being typed takes the space
    if (which === 'date' ? dateText.value !== dateDisplay.value : timeText.value !== timeDisplay.value) return;
    handled();
    dropdown.value = which;
  } else if (event.key === 'Escape' && shown) {
    handled();
    cancelPicker();
  } else if (shown && event.key in dateSteps) {
    handled();
    if (which === 'date') pickerDate.value = stepDate(pickerDate.value ?? new Date(), event.key);
    else stepTime(timeSteps[event.key]);
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    handled();
    dropdown.value = which;
  }
}

// Focus selects the text, so typing replaces it. A focusing click would put the caret at the pointer on mouseup and
// remove the selection.
let pointerFocus = false;
function selectText(event: FocusEvent) {
  (event.target as HTMLInputElement).select();
}
function markPointerFocus(event: MouseEvent) {
  pointerFocus = event.target instanceof HTMLInputElement && event.target !== document.activeElement;
}
function keepSelectionOnPointerFocus(event: MouseEvent) {
  if (pointerFocus) event.preventDefault();
  pointerFocus = false;
}

const dateDisplay = computed(() => {
  const vad = unref(valueAsDate);
  return vad == null ? '' : format(vad, unref(displayFormatDate), { locale: currentLocale.value });
});
const timeDisplay = computed(() => {
  const vad = unref(valueAsDate);
  return vad == null ? '' : format(vad, unref(displayFormatTime), { locale: currentLocale.value });
});

// The fields hold the text as typed; it is read into the value when the field loses focus or on Enter, and replaced
// by the formatted value once it is read or the value changes.
const dateText = ref('');
const timeText = ref('');

function showValue() {
  dateText.value = dateDisplay.value;
  timeText.value = timeDisplay.value;
  dateInvalid.value = false;
  timeInvalid.value = false;
}
watch([dateDisplay, timeDisplay], showValue, { immediate: true });

watch([dateInvalid, timeInvalid], ([date, time]) => {
  if (!props.control) return;
  setInputError(props.control, 'invalid_date', date ? invalidDateError : null);
  setInputError(props.control, 'invalid_time', time ? invalidTimeError : null);
});

function clearFromText() {
  value.value = null;
  showValue();
}

function commitDate() {
  if (vuetifyBindings.value.readonly || dateText.value === dateDisplay.value) return;
  if (!dateText.value.trim()) {
    clearFromText();
    return;
  }
  const date = parseDateInput(dateText.value, unref(displayFormatDate), currentLocale.value, new Date());
  if (date == null) {
    dateInvalid.value = true;
    return;
  }
  dateInvalid.value = false;
  setValueISOFull(formatNaive(date), 0);
  dateText.value = dateDisplay.value;
}

function commitTime() {
  if (vuetifyBindings.value.readonly || timeText.value === timeDisplay.value) return;
  if (!timeText.value.trim()) {
    clearFromText();
    return;
  }
  const time = parseTimeInput(timeText.value, unref(displayFormatTime), currentLocale.value);
  if (time == null) {
    timeInvalid.value = true;
    return;
  }
  timeInvalid.value = false;
  const pad = (n: number) => n.toString().padStart(2, '0');
  setValueISOFull(`T${pad(time.hours)}:${pad(time.minutes)}:00`, 1);
  timeText.value = timeDisplay.value;
}
</script>
