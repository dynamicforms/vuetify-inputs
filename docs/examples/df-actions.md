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

The component expects an array of `Action` objects created using `Action.create()` with the following structure:

```typescript
interface ActionBreakpointOptions {
  name?: string;                    // Unique identifier for the action
  label?: string;                   // Display text
  icon?: string;                    // Icon name (Ionicons format)
  renderAs?: ActionDisplayStyle;    // BUTTON or TEXT
  showIcon?: boolean;               // Whether to show the icon
  showLabel?: boolean;              // Whether to show the label
  // Responsive breakpoints
  xs?: Partial<ActionRenderOptions>;
  sm?: Partial<ActionRenderOptions>;
  md?: Partial<ActionRenderOptions>;
  lg?: Partial<ActionRenderOptions>;
  xl?: Partial<ActionRenderOptions>;
}
```

## Responsive Behavior

The component automatically adapts to different screen sizes based on the breakpoint configuration:

```javascript
const saveAction = Action.create({
  value: {
    name: 'save',
    label: 'Save',
    icon: 'save-outline',
    renderAs: ActionDisplayStyle.BUTTON,
    showIcon: true,
    showLabel: false,
    md: { showLabel: true, showIcon: false }, // Medium screens and up
    lg: { showIcon: true }                    // Large screens and up
  },
  actions: [formSaveAction]
});
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
  import { ExecuteAction } from '@dynamicforms/vue-forms';
  import { Action, ActionDisplayStyle } from '@dynamicforms/vuetify-inputs';

  // Create form action
  const saveFormAction = new ExecuteAction((action, supr, params) => {
    // Your save logic here
    console.log('Save action executed');
    return supr(action, params);
  });

  // Create actions for the component
  const actions = ref([
    Action.create({
      value: {
        name: 'save',
        label: 'Save',
        icon: 'save-outline',
        renderAs: ActionDisplayStyle.BUTTON,
        showIcon: true,
        showLabel: true
      },
      actions: [saveFormAction]
    }),

    Action.create({
      value: {
        name: 'cancel',
        label: 'Cancel',
        icon: 'close-outline',
        renderAs: ActionDisplayStyle.BUTTON,
        showIcon: true,
        showLabel: true
      }
    })
  ]);
</script>
```

<script setup>
import ActionsDemo from '../components/actions-demo.vue'
</script>
