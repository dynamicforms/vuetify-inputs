# df-actions Component

The `df-actions` component provides a clean and responsive way to display action buttons or links, with support for 
responsive behavior across different screen sizes.

## Basic Example

Here's a simple example of the `df-actions` component in action:

<ActionsDemo />

## Features

- Renders actions as buttons or text links
- Supports responsive display based on screen size
- Automatic icon and label handling
- Grouping options for button layouts
- Integration with DynamicForms action system

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `Action[]` or `Ref<Action[]>` | `[]` | Array of Action objects to render |
| `buttonSize` | `string` or `number` | `'default'` | Size of buttons (see Vuetify's v-btn size prop) |
| `showAsGroup` | `'no'` \| `'grouped'` \| `'grouped-no-borders'` | `'no'` | Controls how buttons are grouped |

## Action Object

The component expects an array of `Action` objects with the following structure:

```typescript
interface Action {
  renderAs: ActionDisplayStyle;  // BUTTON or TEXT
  name: string;                  // Unique identifier for the action
  label?: string;                // Display text (optional)
  icon?: string;                 // Icon name (optional)
  displayStyle: {                // Display options
    renderAs: ActionDisplayStyle;  // BUTTON or TEXT
    showIcon?: boolean;            // Whether to show the icon
    showLabel?: boolean;           // Whether to show the label
    // Responsive breakpoints
    sm?: {...};                    // Small screen options
    md?: {...};                    // Medium screen options
    lg?: {...};                    // Large screen options
    xl?: {...};                    // Extra large screen options
  };
  formAction: FormAction;        // DynamicForms action handler
}
```

## Responsive Behavior

The component automatically adapts to different screen sizes based on the `displayStyle` configuration:

```javascript
const saveAction = new Action({
  name: 'save',
  label: 'Save',
  icon: 'save-outline',
  displayStyle: {
    renderAs: ActionDisplayStyle.BUTTON,
    showIcon: true,
    showLabel: false,
    md: { showLabel: true, showIcon: false }, // Medium screens and up
    lg: { showIcon: true }                    // Large screens and up
  }
}, formSaveAction);
```

With this configuration:
- On small screens: Only the icon is shown
- On medium screens: Only the label is shown
- On large screens: Both icon and label are shown

## Button Grouping

The `showAsGroup` property allows you to control the visual grouping of buttons:

- `'no'`: Buttons are displayed as separate elements
- `'grouped'`: Buttons are grouped with borders
- `'grouped-no-borders'`: Buttons are grouped without borders

## Usage with DynamicForms

```vue
<template>
  <df-actions :actions="actions" button-size="small" />
</template>

<script setup>
import { ref } from 'vue';
import { Action, ActionDisplayStyle } from '@dynamicforms/vuetify-inputs';
import { Action as FormAction } from '@dynamicforms/vue-forms';

// Create form actions
const saveAction = new FormAction();
const cancelAction = new FormAction();

// Create actions for the component
const actions = ref([
  new Action({
    name: 'save',
    label: 'Save',
    icon: 'save-outline',
    displayStyle: {
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: true
    }
  }, saveAction),
  
  new Action({
    name: 'cancel',
    label: 'Cancel',
    icon: 'close-outline',
    displayStyle: {
      renderAs: ActionDisplayStyle.BUTTON,
      showIcon: true,
      showLabel: true
    }
  }, cancelAction)
]);
</script>
```

<script setup>
import ActionsDemo from '../components/actions-demo.vue'
</script>
