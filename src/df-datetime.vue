<template>
  <input-base v-bind="props" :clearable="clearable" @click:clear="value = null" @blur="touched = true">
    <template #default="slotProps">
      <div class="d-flex w-100 pt-5 pl-2 pb-1">
        <v-text-field
          v-if="['date', 'datetime'].includes(inputType)"
          v-model="dateFormatted"
          style="flex-grow: 4"
          density="compact"
          variant="plain"
          :clearable="false"
          :hide-details="true"
          :readonly="vuetifyBindings.readonly"
          :disabled="vuetifyBindings.disabled"
          :name="`${vuetifyBindings.name}-date`"
          @click="dropdown = 'date'"
          @keydown.space="dropdown = 'date'"
          @focus="slotProps.focus()"
          @blur="slotProps.blur()"
        >
          <template #default>
            <v-menu
              v-model="dateMenuShown"
              :close-on-content-click="false"
              activator="parent"
            >
              <v-confirm-edit
                v-model="valueAsDate"
                @cancel="dropdown = ''"
                @save="dropdown = ''"
              >
                <template #default="{ model: proxyModel, actions }">
                  <v-date-picker
                    v-model="proxyModel.value"
                    :hide-header="true"
                    :first-day-of-week="1"
                    :show-adjacent-months="true"
                    :show-week="true"
                  >
                    <template #actions><component :is="actions"/></template>
                  </v-date-picker>
                </template>
              </v-confirm-edit>
            </v-menu>
          </template>
        </v-text-field>

        <v-text-field
          v-if="['time', 'datetime'].includes(inputType)"
          v-model="timeFormatted"
          style="flex-grow: 3"
          density="compact"
          variant="plain"
          :clearable="false"
          :hide-details="true"
          :readonly="vuetifyBindings.readonly"
          :disabled="vuetifyBindings.disabled"
          :name="`${vuetifyBindings.name}-time`"
          @click="dropdown = 'time'"
          @keydown.space="dropdown = 'time'"
          @focus="slotProps.focus()"
          @blur="slotProps.blur()"
        >
          <template #default>
            <v-menu
              v-model="timeMenuShown"
              :close-on-content-click="false"
              activator="parent"
            >
              <v-confirm-edit
                v-model="valueAsTimeString"
                @cancel="dropdown = ''"
                @save="dropdown = ''"
              >
                <template #default="{ model: proxyModel, actions }">
                  <v-time-picker
                    v-model="proxyModel.value"
                    :hide-header="true"
                    format="24hr"
                  >
                    <template #actions><component :is="actions"/></template>
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
import { format, parse } from 'date-fns';
import { toNumber, isNaN } from 'lodash-es';
import { ref, computed, watch, toRefs, unref } from 'vue';

import { DfDateTimeProps } from './dynamicforms-component-props';
import { BaseEmits, defaultBaseProps, InputBase, useInputBase } from './helpers';

const props = withDefaults(defineProps<DfDateTimeProps>(), {
  ...defaultBaseProps,
  inputType: 'datetime',
  displayFormatDate: 'P',
  displayFormatTime: 'p',
});

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { touched, value, vuetifyBindings } = useInputBase<string | null>(props, emits);
const { inputType, displayFormatDate, displayFormatTime } = toRefs(props);

const dropdown = ref('');
const dateMenuShown = computed({
  get() { return unref(dropdown) === 'date'; },
  set(newValue: boolean) { dropdown.value = newValue ? 'date' : ''; },
});
const timeMenuShown = computed({
  get() { return unref(dropdown) === 'time'; },
  set(newValue: boolean) { dropdown.value = newValue ? 'time' : ''; },
});

const formatNaive = (val: Date) => `${format(val, 'yyyy-MM-dd')}T${format(val, 'HH:mm')}:00`;

const valueISOFull = ref<string | null>(null);
function setValueISOFull(newISOValue: string | null, dateOrTimeIdx: number) {
  if (newISOValue == null) {
    valueISOFull.value = null;
  } else if (dateOrTimeIdx === -1) {
    // setting valueISOFull from value
    if (unref(inputType) === 'time') {
      valueISOFull.value = formatNaive(new Date());
      setValueISOFull(`T${newISOValue}`, 1);
    } else {
      const val = formatNaive(new Date(newISOValue));
      setValueISOFull(val, 0);
      setValueISOFull(val, 1);
    }
  } else {
    if (valueISOFull.value == null) valueISOFull.value = formatNaive(new Date());
    const vif = valueISOFull.value.split(/[TZ]/g);
    const nv = newISOValue!.split(/[TZ]/g);
    vif[dateOrTimeIdx] = nv[dateOrTimeIdx];
    valueISOFull.value = formatNaive(new Date(`${vif[0]}T${vif[1].split('.')[0]}`));

    if (unref(inputType) === 'date') value.value = vif[0];
    else if (unref(inputType) === 'time') value.value = vif[1];
    else value.value = unref(valueISOFull) + format(new Date(), 'XXX');
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
  set(newValue: Date) { setValueISOFull(formatNaive(newValue), 0); },
});

const valueAsTimeString = computed({
  get() {
    const val = unref(valueISOFull);
    if (val == null) return '';
    const vif = val.split(/[TZ]/g);
    return vif[1].split('.')[0];
  },
  set(newValue: string) { setValueISOFull(`T${newValue}`, 1); },
});

const dateFormatted = computed({
  get() {
    const vad = unref(valueAsDate);
    if (vad == null) return '';
    return format(vad, unref(displayFormatDate));
  },
  set(newValue: string) {
    try {
      const d = parse(newValue, unref(displayFormatDate), new Date());
      setValueISOFull(formatNaive(d), 0);
    } catch (err) {
      console.error(err);
    }
  },
});

const timeFormatted = computed({
  get() {
    const vad = unref(valueAsDate);
    if (vad == null) return '';
    return format(vad, unref(displayFormatTime));
  },
  set(newValue: string) {
    const d = newValue.match(/(\d+):(\d+)\s?([a-zA-Z]+)?/);
    if (d == null) return;
    let hour = toNumber(d[1]);
    const minute = toNumber(d[2]);
    if (isNaN(hour) || isNaN(minute)) return;
    if (d[3] && d[3].toLowerCase() === 'pm' && hour < 13) hour += 12;
    setValueISOFull(`T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`, 1);
  },
});
</script>
