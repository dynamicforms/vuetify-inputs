<template>
  <div class="input-group-demo">
    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <df-select v-model="variant" :choices="variants" :allow-null="false" label="Variant" />
          </v-col>
          <v-col cols="12" md="4">
            <df-select v-model="density" :choices="densities" :allow-null="false" label="Density" />
          </v-col>
          <v-col cols="12" md="4">
            <df-select v-model="direction" :choices="directions" :allow-null="false" label="Direction" />
          </v-col>
        </v-row>

        <v-row class="demo-row">
          <v-col cols="12" md="3">
            <df-input :control="form.fields.name" label="Course" :variant="variant" :density="density" />
          </v-col>
          <v-col cols="12" md="6">
            <df-input-group
              :control="form.fields.days"
              label="Days"
              hint="At least one day"
              :direction="direction"
              :variant="variant"
              :density="density"
            >
              <df-checkbox
                v-for="(field, day) in form.fields.days.fields"
                :key="day"
                :control="field"
                :label="String(day)"
              />
            </df-input-group>
          </v-col>
          <v-col cols="12" md="3">
            <df-input :control="form.fields.hours" label="Hours" :variant="variant" :density="density" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { Field, Group, ValidationError, Validators } from '@dynamicforms/vue-forms';
import { ref } from 'vue';

import {
  DfCheckbox,
  DfInput,
  DfInputGroup,
  DfSelect,
  type DfInputComponentProps,
  type FieldDensity,
  type FieldVariant,
} from '../../src';

const variant = ref<FieldVariant>('outlined');
const density = ref<FieldDensity>('default');
const direction = ref<DfInputComponentProps.DfInputGroupDirection>('wrap');

const variants = ['outlined', 'filled', 'underlined', 'plain', 'solo', 'solo-inverted', 'solo-filled', 'inverted'].map(
  (id) => ({ id, text: id }),
);
const densities = ['default', 'comfortable', 'compact'].map((id) => ({ id, text: id }));
const directions = ['row', 'wrap', 'column'].map((id) => ({ id, text: id }));

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const days = new Group(Object.fromEntries(dayNames.map((day) => [day, new Field({ value: false })])));
days.registerAction(
  new Validators.Validator(() =>
    Object.values(days.value).some(Boolean) ? null : [new ValidationError('app.no_day', {}, 'Choose at least one day')],
  ),
);

const form = new Group({
  name: new Field({ value: 'Swimming' }),
  days,
  hours: new Field({ value: '17:00' }),
});
</script>

<style scoped>
.input-group-demo {
  margin: 2rem 0;
}
</style>
