<template>
  <div class="group-demo">
    <v-card class="mb-4">
      <v-card-title>Trip Budget</v-card-title>
      <v-card-text>
        <v-form @submit.prevent>
          <v-row>
            <v-col cols="12" md="4">
              <df-input
                :control="form.fields.flights"
                input-type="number"
                label="Flights"
                :min="0"
                :step="50"
              />
            </v-col>

            <v-col cols="12" md="4">
              <df-input
                :control="form.fields.hotel"
                input-type="number"
                label="Hotel"
                :min="0"
                :step="50"
              />
            </v-col>

            <v-col cols="12" md="4">
              <df-input
                :control="form.fields.extras"
                input-type="number"
                label="Extras"
                :min="0"
                :step="50"
              />
            </v-col>
          </v-row>

          <df-checkbox
            :control="form.fields.addTraveller"
            label="Book a second traveller"
            hint="Reveals the section below"
          />

          <!-- The whole section follows the visibility of the traveller group -->
          <v-card
            v-if="traveller.visibility !== DisplayMode.SUPPRESS"
            variant="outlined"
            class="pa-4 mt-2"
          >
            <div class="text-subtitle-1 mb-2">Second traveller</div>
            <v-row>
              <v-col cols="12" md="6">
                <df-input
                  :control="traveller.fields.name"
                  label="Full name"
                />
              </v-col>

              <v-col cols="12" md="6">
                <df-input
                  :control="traveller.fields.ticket"
                  input-type="number"
                  label="Ticket"
                  :min="0"
                  :step="50"
                />
              </v-col>
            </v-row>
          </v-card>

          <div class="mt-4">
            <strong>Total:</strong> {{ total }} € of {{ budgetLimit }} €
            <v-chip
              :color="form.valid ? 'success' : 'error'"
              size="small"
              class="ml-2"
            >
              {{ form.valid ? 'Within budget' : 'Over budget' }}
            </v-chip>
          </div>

          <!-- The group-level validator writes here, so the message belongs to the form, not to any single field -->
          <div class="mt-1">
            <df-input-hint :errors="form.errors" />
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>Form Value</v-card-title>
      <v-card-text>
        <pre class="output">{{ JSON.stringify(form.value, null, 2) }}</pre>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  ConditionalVisibilityAction,
  DisplayMode,
  Field,
  Group,
  MdString,
  Operator,
  Statement,
  ValidationErrorRenderContent,
  Validator,
} from '@dynamicforms/vue-forms';
import { DfCheckbox, DfInput, DfInputHint } from '../../src'

const budgetLimit = 2000;

// The checkbox that decides whether the second traveller section is on the form
const addTraveller = new Field({ value: false });

// A nested group: its fields are addressed as traveller.fields.name, and its value is a member of form.value
const traveller = new Group({
  name: new Field({ value: '' }),
  ticket: new Field({ value: 400 }),
});

// One action on the group: the template renders the whole section under the group's visibility
traveller.registerAction(new ConditionalVisibilityAction(new Statement(addTraveller, Operator.EQUALS, true)));

const form = new Group({
  flights: new Field({ value: 900 }),
  hotel: new Field({ value: 700 }),
  extras: new Field({ value: 150 }),
  addTraveller,
  traveller,
});

function amount(field) {
  return Number(field.value) || 0;
}

function tripTotal() {
  const total = amount(form.fields.flights) + amount(form.fields.hotel) + amount(form.fields.extras);
  return form.fields.addTraveller.value ? total + amount(traveller.fields.ticket) : total;
}

// A validator on the group itself: the rule spans several fields, so the error belongs to the group
form.registerAction(new Validator(() => {
  const total = tripTotal();
  if (total <= budgetLimit) return null;
  return [
    new ValidationErrorRenderContent(
      new MdString(`The trip totals **${total} €**, which is ${total - budgetLimit} € over the budget.`),
    ),
  ];
}));

// group.value is reactive, so both the total and the JSON dump follow every keystroke
const total = computed(() => tripTotal());
</script>

<style scoped>
.group-demo {
  margin: 2rem 0;
}

.output {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
}

:deep(hr) {
  margin: 0 !important;
}
</style>
