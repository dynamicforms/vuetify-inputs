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
          isFramelessVariant(vuetifyBindings.variant) ? undefined : 'ml-4',
          'df-input-wrapper',
          density,
        ]"
        @keydown.capture="onKeydown"
      >
        <span
          v-for="part in parts"
          :id="partNameId(part.which)"
          :key="part.which"
          class="df-sr-only"
          v-text="partLabel(part.which)"
        />
        <v-text-field
          v-for="(part, index) in parts"
          :id="index === 0 ? slotProps.props.id : undefined"
          :key="part.which"
          v-model="part.text.value"
          v-input-role="hasPopup ? 'combobox' : undefined"
          :class="`df-datetime-${part.which}`"
          :style="{ flexGrow: part.flexGrow }"
          density="compact"
          variant="plain"
          :clearable="false"
          :hide-details="true"
          :readonly="vuetifyBindings.readonly"
          :disabled="vuetifyBindings.disabled"
          :name="partName(part.which)"
          v-bind="{ ...partAttrs(part.which, slotProps.props), ...passthroughAttrs }"
          :placeholder="index === 0 ? vuetifyBindings.placeholder : undefined"
          @update:model-value="closeMenu(part.which)"
          @click="dropdown = part.which"
          @mousedown="markPointerFocus"
          @mouseup="keepSelectionOnPointerFocus"
          @focus="
            selectText($event);
            slotProps.focus();
          "
          @blur="
            closeMenu(part.which);
            commitPart(part.which);
            slotProps.blur();
          "
        >
          <template #default>
            <v-menu
              v-if="clientRendered"
              v-model="part.menuShown.value"
              :close-on-content-click="false"
              activator="parent"
              :activator-props="fieldMenuActivatorProps"
              :content-props="
                dialogPopupContentProps(popupId(part.which), {
                  'aria-labelledby': partAttrs(part.which, slotProps.props)['aria-labelledby'],
                })
              "
            >
              <v-confirm-edit v-model="part.model.value" hide-actions @cancel="dropdown = ''" @save="concludeEdit">
                <template #default="{ model: proxyModel, save, cancel, isPristine }">
                  <v-date-picker
                    v-if="part.which === 'date'"
                    :ref="(el) => bindEdit('date', el, { model: proxyModel, save, cancel })"
                    v-model="proxyModel.value"
                    :hide-header="true"
                    :first-day-of-week="firstDayOfWeek"
                    :show-adjacent-months="true"
                    :show-week="true"
                    @mousedown.prevent
                    @update:view-mode="viewChanged"
                    @update:month="viewChanged"
                    @update:year="viewChanged"
                    @dblclick="saveOnDoubleClick($event, '.v-date-picker-month__day', save)"
                  >
                    <template #actions>
                      <confirm-actions :save="save" :cancel="cancel" :is-pristine="isPristine" />
                    </template>
                  </v-date-picker>
                  <v-time-picker
                    v-else
                    :ref="(el) => bindEdit('time', el, { model: proxyModel, save, cancel })"
                    v-model="proxyModel.value"
                    v-model:view-mode="timeViewMode"
                    :hide-header="true"
                    format="24hr"
                    @mousedown.prevent
                    @update:view-mode="viewChanged"
                    @dblclick="saveOnDoubleClick($event, '.v-time-picker-clock', save)"
                  >
                    <template #actions>
                      <confirm-actions :save="save" :cancel="cancel" :is-pristine="isPristine" />
                    </template>
                  </v-time-picker>
                </template>
              </v-confirm-edit>
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
import { ref, computed, watch, toRefs, unref, useId, type Ref } from 'vue';

import { DfDateTimeProps } from './dynamicforms-component-props';
import {
  BaseEmits,
  DateTimeLocaleConfig,
  defaultBaseProps,
  InputBase,
  type InputBaseControlProps,
  translate,
  useInputBase,
} from './helpers';
import { useClientRendered } from './helpers/client-rendered';
import ConfirmActions from './helpers/confirm-actions.vue';
import { controlAria } from './helpers/control-aria';
import { parseDateInput, parseTimeInput, setInputError } from './helpers/date-time-input';
import { namespaced } from './helpers/error-namespace';
import { isFramelessVariant } from './helpers/frameless-variant';
import { usePickerDoubleClick } from './helpers/picker-double-click';
import { dialogPopupAria, dialogPopupContentProps, fieldMenuActivatorProps, vInputRole } from './helpers/popup-aria';
import { fromWallClock, isKnownTimeZone, wallClockIn } from './helpers/time-zone';
import { useSettings } from './helpers/use-settings';

const props = withDefaults(defineProps<DfDateTimeProps>(), {
  ...defaultBaseProps,
  inputType: 'datetime',
  displayFormatDate: 'P',
  displayFormatTime: 'p',
  timeZone: undefined,
});

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const settings = useSettings();
const currentLocale = computed(
  () => props.locale ?? unref(settings.dateTimeLocale) ?? unref(DateTimeLocaleConfig.dateTimeLocale),
);
const firstDayOfWeek = computed(() => currentLocale.value.options?.weekStartsOn ?? 1);
// a typed date or time that cannot be read leaves the value as it is and reports an error until it is corrected
const dateInvalid = ref(false);
const timeInvalid = ref(false);
const invalidDateError = new ValidationError(namespaced('invalid_date'), {}, 'Not a valid date.', 'application');
const invalidTimeError = new ValidationError(namespaced('invalid_time'), {}, 'Not a valid time.', 'application');
const inputErrors = () => [
  ...(dateInvalid.value ? [invalidDateError] : []),
  ...(timeInvalid.value ? [invalidTimeError] : []),
];

const { density, densityClass, shownErrors, touched, value, vuetifyBindings } = useInputBase<string | null>(
  props,
  emits,
  inputErrors,
);
const t = translate;
// without a control, input-base shows the errors it is given; a bound control holds them in its own errors
const shownInputErrors = computed(() => [...(props.errors ?? []), ...inputErrors()]);
const { inputType, displayFormatDate, displayFormatTime } = toRefs(props);

// The zone of the value's wall-clock time: 'wall' (no offset), an IANA name, or undefined for the browser's zone.
// Time mode is always 'wall', date mode always the browser's zone.
const zone = computed(() => {
  if (inputType.value === 'time') return 'wall';
  if (inputType.value === 'date') return undefined;
  const timeZone = props.timeZone ?? settings.timeZone;
  return timeZone == null || timeZone === 'wall' || isKnownTimeZone(timeZone) ? timeZone : undefined;
});
const ianaZone = computed(() => (zone.value === 'wall' ? undefined : zone.value));

// Each part is named by the field label and its own name; the field label's `for` is the first part's id.
type DateTimePart = 'date' | 'time';
const nameId = useId();
const partLabel = (which: DateTimePart) => t(which === 'date' ? 'Date' : 'Time');
const partNameId = (which: DateTimePart) => `${nameId}-${which}`;
const popupId = (which: DateTimePart) => `${nameId}-${which}-picker`;
const partName = (which: DateTimePart) =>
  vuetifyBindings.value.name ? `${vuetifyBindings.value.name}-${which}` : undefined;
const partErrorCodes = { date: invalidDateError.code, time: invalidTimeError.code };

// a part is invalid while an error is shown that is not the other part's own
function partAttrs(which: DateTimePart, controlProps: InputBaseControlProps) {
  const otherCode = partErrorCodes[which === 'date' ? 'time' : 'date'];
  const invalid = shownErrors.value.some((error) => (error as ValidationError).code !== otherCode);
  const aria = controlAria(controlProps);
  return {
    ...aria,
    'aria-labelledby': `${aria['aria-labelledby']} ${partNameId(which)}`,
    'aria-label': [aria['aria-label'], partLabel(which)].filter(Boolean).join(' '),
    'aria-invalid': invalid ? 'true' : undefined,
    ...dialogPopupAria(hasPopup.value, menusShown[which].value, popupId(which)),
  };
}

const dropdown = ref('');
const clientRendered = useClientRendered();
// a part is the combobox that opens its picker
const hasPopup = computed(() => clientRendered.value && !vuetifyBindings.value.readonly);
const menuShown = (which: DateTimePart) =>
  computed({
    get() {
      return !vuetifyBindings.value.readonly && unref(dropdown) === which;
    },
    set(newValue: boolean) {
      dropdown.value = newValue ? which : '';
    },
  });
const menusShown = { date: menuShown('date'), time: menuShown('time') };

// a value picked in the menu or cleared concludes the edit: the field may hold no focus to lose
function concludeEdit() {
  dropdown.value = '';
  touched.value = true;
}

// `v-confirm-edit` gives the choice in its picker, `save` and `cancel` only to its slot; the picker's ref hands them to
// the keyboard handler
interface PickerEdit {
  model: Ref<any>;
  save: () => void;
  cancel: () => void;
}
const edits: Partial<Record<DateTimePart, PickerEdit>> = {};
function bindEdit(which: DateTimePart, el: unknown, edit: PickerEdit) {
  if (el) edits[which] = edit;
  else delete edits[which];
}

// Typing into a field or leaving it discards the choice in its picker and closes it: the arrow keys then move the caret
// instead of the picker.
function closeMenu(which: DateTimePart) {
  if (dropdown.value !== which) return;
  edits[which]?.cancel();
  dropdown.value = '';
}

const { viewChanged, saveOnDoubleClick } = usePickerDoubleClick();

function clear() {
  value.value = null;
  showValue();
  touched.value = true;
}

const pad2 = (n: number) => n.toString().padStart(2, '0');
const formatNaive = (val: Date) => `${format(val, 'yyyy-MM-dd')}T${format(val, 'HH:mm')}:00`;
// the current wall-clock date and time in the value's zone
const nowNaive = () =>
  ianaZone.value ? `${wallClockIn(Date.now(), ianaZone.value).slice(0, 16)}:00` : formatNaive(new Date());

const valueISOFull = ref<string | null>(null);
// the date part and the time part without fractional seconds of an ISO string
function isoParts(value: string): [string, string] {
  const [date, time = ''] = value.split(/[T Z]/g);
  return [date, time.split('.')[0]];
}

// the date and time parts of `base` with one of them replaced by the same part of `newISOValue`
function mergeParts(base: string, newISOValue: string, dateOrTimeIdx: number) {
  const vif = isoParts(base);
  vif[dateOrTimeIdx] = isoParts(newISOValue)[dateOrTimeIdx];
  return vif;
}

// `HH:mm:ss` of the hours, minutes and optional seconds a time starts with; an offset after them is dropped
function wallTimeOf(time: string) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(time || '00:00');
  return match && `${match[1]}:${match[2]}:${match[3] ?? '00'}`;
}

// The naive value of a date part and a time part, null where they are not in ISO form. 'wall' takes them as written,
// an IANA zone and the browser's zone move a time they skip forward by the gap.
function naiveFromParts(vif: string[]) {
  if (zone.value == null) return formatNaive(new Date(`${vif[0]}T${vif[1]}`));
  const time = wallTimeOf(vif[1]);
  const naive = /^\d{4}-\d{2}-\d{2}$/.test(vif[0]) && time ? `${vif[0]}T${time}` : null;
  return naive && ianaZone.value ? fromWallClock(naive, ianaZone.value).naive : naive;
}

const hasOffset = (value: string) => /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value.slice(10));

// the naive value of a bound value: its wall-clock time in the value's zone
function naiveOfValue(value: string) {
  if (unref(inputType) === 'time') return naiveFromParts(mergeParts(nowNaive(), `T${value}`, 1));
  if (zone.value == null) return formatNaive(parseISO(value));
  if (!ianaZone.value || !hasOffset(value)) return naiveFromParts(isoParts(value));
  const instant = parseISO(value).getTime();
  return Number.isNaN(instant) ? null : wallClockIn(instant, ianaZone.value);
}

// the value written for a naive value
function valueOfNaive(naive: string) {
  if (unref(inputType) === 'date') return isoParts(naive)[0];
  if (unref(inputType) === 'time') return naive.split('T')[1];
  if (zone.value === 'wall') return naive;
  if (ianaZone.value) return naive + fromWallClock(naive, ianaZone.value).offset;
  // the offset is the one in force on the date written, not today's: across a DST change the two differ by an hour
  return naive + format(new Date(naive), 'XXX');
}

// Reading the field's value (dateOrTimeIdx -1) only sets what the control shows: the field keeps the string it holds
// until the user edits the date or the time. parseISO reads a date without a time as local midnight, where the Date
// constructor reads it as UTC midnight and shows the previous day west of Greenwich.
function setValueISOFull(newISOValue: string | null, dateOrTimeIdx: number) {
  if (newISOValue == null) {
    valueISOFull.value = null;
  } else if (dateOrTimeIdx === -1) {
    valueISOFull.value = naiveOfValue(newISOValue);
  } else {
    const naive = naiveFromParts(mergeParts(valueISOFull.value ?? nowNaive(), newISOValue, dateOrTimeIdx));
    valueISOFull.value = naive;
    if (naive != null) value.value = valueOfNaive(naive);
  }
}

watch([value, zone], ([newValue]) => setValueISOFull(newValue, -1), { immediate: true });

// A Date whose local date and time are those of a wall-clock value. Where the browser's zone skips that time, it is
// the same time on a following day.
function wallClockDate(naive: string) {
  const [year, month, day, hours, minutes, seconds] = naive.split(/[-T:]/).map(Number);
  for (let shift = 0; shift < 7; shift++) {
    const res = new Date(year, month - 1, day + shift, hours, minutes, seconds);
    if (res.getHours() === hours && res.getMinutes() === minutes) return res;
  }
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

// the start of a wall-clock value's day in the browser's zone, on that day also where the zone skips midnight
function wallClockDay(naive: string) {
  const [year, month, day] = isoParts(naive)[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

const valueAsDate = computed({
  get() {
    const uValue = unref(valueISOFull);
    if (uValue == null) return null;
    const res = wallClockDay(uValue);
    return !Number.isNaN(res.getTime()) ? res : null;
  },
  set(newValue: Date) {
    setValueISOFull(formatNaive(newValue), 0);
  },
});

const valueAsTimeString = computed({
  get() {
    const val = unref(valueISOFull);
    return val == null ? '' : isoParts(val)[1];
  },
  set(newValue: string) {
    setValueISOFull(`T${newValue}`, 1);
  },
});

const timeViewMode = ref<'hour' | 'minute' | 'second'>('hour');
watch(dropdown, () => {
  timeViewMode.value = 'hour';
});

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
function stepTime(time: string, minutes: number) {
  const [hours, mins] = (time || isoParts(nowNaive())[1]).split(':').map(Number);
  const total = (((hours * 60 + mins + minutes) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

// Runs in the capture phase, before the menu's own handler, which moves the focus into the menu on an up or down arrow
// and so out of the field, which closes the menu.
function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  const which: DateTimePart | null = target.closest('.df-datetime-date')
    ? 'date'
    : target.closest('.df-datetime-time')
      ? 'time'
      : null;
  if (which == null || vuetifyBindings.value.readonly) return;
  const shown = dropdown.value === which;
  const edit = edits[which];
  const handled = () => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (event.key === 'Enter') {
    if (shown) edit?.save();
    else commitPart(which);
  } else if (event.key === ' ') {
    // the text as shown opens the picker; text being typed takes the space
    if (partText[which].value !== partDisplay[which].value) return;
    handled();
    dropdown.value = which;
  } else if (event.key === 'Escape' && shown) {
    handled();
    closeMenu(which);
  } else if (shown && edit && event.key in dateSteps) {
    handled();
    if (which === 'date') {
      edit.model.value = stepDate(edit.model.value ?? wallClockDay(nowNaive()), event.key);
    } else {
      edit.model.value = stepTime(edit.model.value, timeSteps[event.key]);
      timeViewMode.value = event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? 'hour' : 'minute';
    }
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

// the value a wall-clock time is formatted from, with its time also where the browser's zone skips it
const valueAsTimeDate = computed(() => {
  const uValue = unref(valueISOFull);
  if (uValue == null) return null;
  const res = wallClockDate(uValue);
  return !Number.isNaN(res.getTime()) ? res : null;
});

const display = (displayFormat: Ref<string>, source: Ref<Date | null>) =>
  computed(() => {
    const vad = unref(source);
    return vad == null ? '' : format(vad, unref(displayFormat), { locale: currentLocale.value });
  });
const dateDisplay = display(displayFormatDate, valueAsDate);
const timeDisplay = display(displayFormatTime, valueAsTimeDate);
const partDisplay = { date: dateDisplay, time: timeDisplay };

// The fields hold the text as typed; it is read into the value when the field loses focus or on Enter, and replaced
// by the formatted value once it is read or the value changes.
const dateText = ref('');
const timeText = ref('');
const partText = { date: dateText, time: timeText };

// the parts the input type shows, in their order
const parts = computed(() =>
  [
    { which: 'date' as const, flexGrow: 4, text: dateText, menuShown: menusShown.date, model: valueAsDate },
    { which: 'time' as const, flexGrow: 3, text: timeText, menuShown: menusShown.time, model: valueAsTimeString },
  ].filter((part) => [part.which, 'datetime'].includes(unref(inputType))),
);

function showValue() {
  dateText.value = dateDisplay.value;
  timeText.value = timeDisplay.value;
  dateInvalid.value = false;
  timeInvalid.value = false;
}
watch([dateDisplay, timeDisplay], showValue, { immediate: true });

watch([dateInvalid, timeInvalid], ([date, time]) => {
  if (!props.control) return;
  setInputError(props.control, invalidDateError.code, date ? invalidDateError : null);
  setInputError(props.control, invalidTimeError.code, time ? invalidTimeError : null);
});

function clearFromText() {
  value.value = null;
  showValue();
}

// the typed text of a part as the ISO value it writes, null where it cannot be read
const partParsers: Record<DateTimePart, (text: string) => string | null> = {
  date: (text) => {
    const date = parseDateInput(text, unref(displayFormatDate), currentLocale.value, new Date());
    return date && formatNaive(date);
  },
  time: (text) => {
    const time = parseTimeInput(text, unref(displayFormatTime), currentLocale.value);
    return time && `T${pad2(time.hours)}:${pad2(time.minutes)}:00`;
  },
};
const partInvalid = { date: dateInvalid, time: timeInvalid };

function commitPart(which: DateTimePart) {
  const text = partText[which];
  if (vuetifyBindings.value.readonly || text.value === partDisplay[which].value) return;
  if (!text.value.trim()) {
    clearFromText();
    return;
  }
  const iso = partParsers[which](text.value);
  partInvalid[which].value = iso == null;
  if (iso == null) return;
  setValueISOFull(iso, which === 'date' ? 0 : 1);
  text.value = partDisplay[which].value;
}
</script>
