# DfActions Component

The `DfActions` component is a lightweight wrapper that renders a set of actions as Vuetify buttons with responsive behavior.

## Basic Example

Here's a simple example of the `DfActions` component in action:

<ActionsDemo />

## Usage

The component accepts an array of `Action` objects and renders them as buttons. Each action can have different display options based on the current screen size.

```vue
<template>
  <df-actions :actions="actions" button-size="default" />
</template>

<script setup>
import { ref } from 'vue';
import { Action, DisplayStyle } from '@dynamicforms/vuetify-actions';
import { DfActions } from '@dynamicforms/vuetify-actions';
import { Action as FormAction } from '@dynamicforms/vue-forms';

// Create actions
const actions = ref([
  new Action({
    name: 'save',
    label: 'Save',
    icon: 'save-outline',
    displayStyle: {
      renderAs: DisplayStyle.BUTTON,
      showIcon: true,
      showLabel: true,
      sm: { showLabel: false } // On small screens, only show icon
    }
  }, new FormAction()),
  
  new Action({
    name: 'cancel',
    label: 'Cancel',
    icon: 'close-outline',
    displayStyle: {
      renderAs: DisplayStyle.BUTTON,
      showIcon: true,
      showLabel: true,
      sm: { showLabel: false } // On small screens, only show icon
    }
  }, new FormAction())
]);
</script>
```

## Props

The component accepts the following props:

| Prop | Type                                             | Default     | Description |
|------|--------------------------------------------------|-------------|-------------|
| `actions` | `Action[]`                                  | `[]`        | Array of Action objects to render |
| `buttonSize` | `string` or `number`                     | `'default'` | Size of buttons (see Vuetify's v-btn size prop) |
| `groupMode` | 'no' \| 'grouped' \| 'grouped-no-borders' | `'no'`      | Controls how buttons are grouped |

## Responsive Behavior

The component uses Vuetify's `useDisplay` composable to detect the current screen size and renders each action according to its responsive configuration:

```js
// Inside the component
const display = useDisplay();
const displayStyle = computed(() => {
  const res = {};
  for (const action of props.actions) {
    res[action.name] = action.displayStyle.getOptionsForBreakpoint(getBreakpointName(display));
  }
  return res;
});
```

This allows each action to adapt its appearance based on the current breakpoint.

## Implementation Details

The component:

1. Renders a container div with right-aligned text
2. Maps each action to a Vuetify button
3. Controls the display of icons and labels based on the current breakpoint
4. Handles clicks by executing the action's formAction

The source code is quite straightforward:

```vue
<template>
  <div v-if="actions.length > 0" class="text-end">
    <v-btn
      v-for="(action, idx) in actions"
      :key="idx"
      variant="tonal"
      :elevation="0"
      :class="idx === 0 ? '' : 'ms-3'"
      :size="buttonSize"
      @click.stop="(event: MouseEvent) => action.formAction.execute(event)"
    >
      <IonIcon v-if="displayIcon(action)" class="action-icon" :name="action.formAction.icon"/>
      <span v-if="displayIcon(action) && displayLabel(action)" style="width: .5rem"/>
      <span v-if="displayLabel(action)">{{ labelText(action) }}</span>
    </v-btn>
  </div>
</template>
```

<script setup>
import ActionsDemo from '../components/actions-demo.vue'
</script>
