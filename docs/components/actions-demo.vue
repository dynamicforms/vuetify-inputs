<template>
  <div class="actions-demo pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="mb-0"><strong>Current breakpoint:</strong> {{ currentBreakpoint }}</div>
      <div class="d-flex align-center">
        <span class="me-2">Button size:</span>
        <v-select
          v-model="selectedSize"
          :items="sizeOptions"
          density="compact"
          variant="outlined"
          hide-details
          class="size-select"
          style="width: 16em"
        ></v-select>
      </div>
    </div>

    <div
      class="actions-container mt-4"
      :class="{ 'd-inline-block': showAsGroup !== 'no' }"
    >
      <df-actions
        :actions="actions"
        :button-size="buttonSize"
        :show-as-group="showAsGroup"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref } from 'vue';
import { useDisplay } from 'vuetify';
import { Action, ActionDisplayStyle, DfActions } from '../../src';

// Size options
const sizeOptions = [
  'group x-small',
  'group small',
  'bordered group x-small',
  'bordered group small',
  'x-small',
  'small',
  'default',
  'large',
  'x-large'
];
const selectedSize = ref('default');
const buttonSize = computed(() => {
  const words = selectedSize.value.trim().split(/\s+/);
  return words[words.length - 1];
});
// Check if current selection is a group size
const showAsGroup = computed(() => {
  if (selectedSize.value.startsWith('group')) return 'grouped-no-borders';
  else if (selectedSize.value.startsWith('bordered')) return 'grouped';
  return 'no';
});

// Mock FormAction class for documentation
class MockFormAction {
  public icon?: string;
  public label?: string;

  execute(event: MouseEvent) {
    console.log('Action executed', this.label, event);
    alert(`Action "${this.label}" clicked`);
  }
}

// Create actions
const saveAction = new Action(
  {
    name: 'save',
    label: 'Save',
    icon: 'save-outline',
    displayStyle: {
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: false,
      md: { showLabel: true, showIcon: false }, // Medium screen and bigger, show label, but not icon
      lg: { showIcon: true } // Large screen and bigger, show label (carried over from md), and icon
    }
  },
  new MockFormAction() as any
);

const deleteAction = new Action(
  {
    name: 'delete',
    label: 'Delete',
    icon: 'trash-outline',
    displayStyle: {
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: false,
      md: { showLabel: true, showIcon: false }, // Medium screen and bigger, show label, but not icon
      lg: { showIcon: true, renderAs: ActionDisplayStyle.TEXT } // On large screens, show as text
    }
  },
  new MockFormAction() as any
);

const cancelAction = new Action(
  {
    name: 'cancel',
    label: 'Cancel',
    icon: 'close-outline',
    displayStyle: {
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: false,
      md: { showLabel: true, showIcon: false }, // On small screens, only show icon
      lg: { showIcon: true } // Large screen and bigger, show label (carried over from md), and icon
    }
  },
  new MockFormAction() as any
);

const actions: Ref<Action[]> = ref([saveAction, deleteAction, cancelAction]);

// Get current breakpoint
const display = useDisplay();
const currentBreakpoint = computed(() => {
  if (display.xlAndUp.value) return 'xl (Extra Large)';
  if (display.lgAndUp.value) return 'lg (Large)';
  if (display.mdAndUp.value) return 'md (Medium)';
  if (display.smAndUp.value) return 'sm (Small)';
  return 'xs (Extra Small)';
});
</script>

<style scoped>
.actions-demo {
  border: .2em solid #ccc;
  border-radius: 1em;
}

.actions-container {
  border: .1em dashed #ccc;
  padding: 1em;
  border-radius: .5em;
}

.size-select :deep(.v-field__input) {
  padding-top: 5px;
  padding-bottom: 5px;
}
</style>
