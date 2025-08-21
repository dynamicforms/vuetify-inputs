<template>
  <div>
    <div class="mb-4">
      <v-btn-toggle v-model="selectedLocaleIndex" mandatory color="primary">
        <v-btn value="0" size="small">🇸🇮 Slovenščina</v-btn>
        <v-btn value="1" size="small">🇺🇸 U.S. English</v-btn>
        <v-btn value="2" size="small">🇩🇪 Deutsch</v-btn>
        <v-btn value="3" size="small">🇫🇷 Français</v-btn>
        <v-btn value="4" size="small">🇯🇵 日本語</v-btn>
        <v-btn value="5" size="small">🇨🇳 中文</v-btn>
      </v-btn-toggle>
    </div>

    <df-date-time
      :control="dateTimeField"
      :locale="locales[selectedLocaleIndex]"
      :label="new Label(labels[selectedLocaleIndex], 'mdi-calendar-clock')"
      :hint="hints[selectedLocaleIndex]"
    />

    <div class="mt-4">
      <strong>{{ infoLabels[selectedLocaleIndex] }}:</strong>
      <pre>{{ dateTimeField.value == null ? 'null' : dateTimeField.value }}</pre>
    </div>

    <div class="mt-2">
      <small class="text-medium-emphasis">
        {{ localeInfos[selectedLocaleIndex] }}
      </small>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { sl, enUS, de, fr, ja, zhCN } from 'date-fns/locale';
import { Field, Validators } from '@dynamicforms/vue-forms';
import { DfDateTime, Label } from '../../src';

const selectedLocaleIndex = ref(0);

const locales = [sl, enUS, de, fr, ja, zhCN];

const labels = [
  'Izberite datum in čas',
  'Select date and time',
  'Datum und Zeit auswählen',
  'Sélectionner date et heure',
  '日時を選択',
  '选择日期和时间'
];

const hints = [
  'Datum se prikaže v izbrani lokali',
  'Date displays in selected locale',
  'Datum wird in gewählter Sprache angezeigt',
  'La date s\'affiche dans la langue sélectionnée',
  '選択したロケールで日付が表示されます',
  '日期以所选区域设置显示'
];

const infoLabels = [
  'Vrednost polja',
  'Field value',
  'Feldwert',
  'Valeur du champ',
  'フィールド値',
  '字段值'
];

const localeInfos = [
  'Slovenska lokala: teden se začne v ponedeljek, format dd. mm. llll',
  'US English locale: week starts on Sunday, format MM/dd/yyyy',
  'Deutsche Lokale: Woche beginnt am Montag, Format dd.MM.yyyy',
  'Locale française: semaine commence lundi, format dd/MM/yyyy',
  '日本語ロケール: 週は日曜日から始まり、yyyy年M月d日形式',
  '中文区域设置: 周从周一开始，yyyy年M月d日格式'
];

const dateTimeField = Field.create({
  value: new Date().toISOString(),
  validators: [new Validators.Required()],
});
</script>

<style scoped>
.v-btn-toggle .v-btn {
  min-width: auto;
}
</style>