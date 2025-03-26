<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Checkbox Examples</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-4">
              <div class="text-subtitle-1 mb-2">Binary Checkbox (allowNull: false)</div>
              <df-checkbox
                :control="form.fields.binaryField"
                label="Binary checkbox"
                hint="Can only be true or false"
              />

              <div class="mt-4">
                <v-btn
                  @click="toggleBinary"
                  color="primary"
                  size="small"
                  class="mr-2"
                >
                  Toggle Value
                </v-btn>
                <v-btn
                  @click="toggleEnabled(form.fields.binaryField)"
                  color="secondary"
                  size="small"
                >
                  {{ form.fields.binaryField.enabled ? 'Disable' : 'Enable' }} Field
                </v-btn>
              </div>

              <div class="mt-4">
                <strong>Value:</strong> {{ form.fields.binaryField.value }}
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-4">
              <div class="text-subtitle-1 mb-2">Ternary Checkbox (allowNull: true)</div>
              <df-checkbox
                :control="form.fields.ternaryField"
                :allow-null="true"
                label="Ternary checkbox"
                hint="Can be true, false, or null (indeterminate)"
              />

              <div class="mt-4">
                <v-btn
                  @click="form.fields.ternaryField.value = null"
                  color="primary"
                  size="small"
                  class="mr-2"
                >
                  Set to Null
                </v-btn>
                <v-btn
                  @click="toggleEnabled(form.fields.ternaryField)"
                  color="secondary"
                  size="small"
                >
                  {{ form.fields.ternaryField.enabled ? 'Disable' : 'Enable' }} Field
                </v-btn>
              </div>

              <div class="mt-4">
                <strong>Value:</strong> {{ form.fields.ternaryField.value === null ? 'null' : form.fields.ternaryField.value }}
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="outlined" class="pa-4">
              <div class="text-subtitle-1 mb-2">Auto-Toggling Checkbox</div>
              <df-checkbox
                :control="form.fields.autoToggleField"
                label="Auto-toggling every second"
                hint="Value changes automatically"
              />

              <div class="mt-4">
                <v-btn
                  @click="toggleAutoSwitch"
                  color="primary"
                  size="small"
                >
                  {{ autoSwitchActive ? 'Stop' : 'Start' }} Auto Toggle
                </v-btn>
              </div>

              <div class="mt-4">
                <strong>Value:</strong> {{ form.fields.autoToggleField.value }}
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Group, Field } from '@dynamicforms/vue-forms';
import { DfCheckbox } from '../../src';

const form = new Group({
  binaryField: Field.create({ value: false }),
  ternaryField: Field.create({ value: null }),
  autoToggleField: Field.create({ value: false }),
});

const autoSwitchActive = ref(false);
let intervalId = null;

// Toggle functions
function toggleBinary() {
  form.fields.binaryField.value = !form.fields.binaryField.value;
}

function toggleEnabled(field) {
  field.enabled = !field.enabled;
}

function toggleAutoSwitch() {
  autoSwitchActive.value = !autoSwitchActive.value;

  if (autoSwitchActive.value) {
    // Start auto-toggling every second
    intervalId = window.setInterval(
      () => { form.fields.autoToggleField.value = !form.fields.autoToggleField.value; }, 1000,
    );
  } else {
    // Stop auto-toggling
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }
}

// Start auto-toggle by default
onMounted(() => {
  toggleAutoSwitch();
});

// Clean up interval when component is destroyed
onBeforeUnmount(() => {
  if (intervalId) {
    window.clearInterval(intervalId);
  }
});
</script>

<style scoped>
.demo-container {
  margin-bottom: 20px;
}
</style>
