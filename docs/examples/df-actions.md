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

The `Action` object is the core component that defines how actions behave in the `df-actions` component. It extends the `FormAction` from `@dynamicforms/vue-forms` to provide responsive behavior and visual configuration.

### Creating Actions

Actions are created using the `Action.create()` method:

```typescript
import { Action, ActionDisplayStyle } from '@dynamicforms/vuetify-inputs';
import { ExecuteAction } from '@dynamicforms/vue-forms';

const saveAction = Action.create({
  value: {
    name: 'save',
    label: 'Save',
    icon: 'save-outline',
    renderAs: ActionDisplayStyle.BUTTON,
    showIcon: true,
    showLabel: true
  },
  actions: [saveFormAction] // FormAction objects that handle execution
});
```

### Action Value Configuration

The `value` object defines the visual appearance and behavior:

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Unique identifier for the action |
| `label` | `string` | Display text |
| `icon` | `string` | Icon name (Ionicons format) |
| `renderAs` | `ActionDisplayStyle` | How to render: `BUTTON` or `TEXT` |
| `showIcon` | `boolean` | Whether to display the icon |
| `showLabel` | `boolean` | Whether to display the label |

### ActionDisplayStyle

- **`ActionDisplayStyle.BUTTON`**: Renders as a Material Design button with background
- **`ActionDisplayStyle.TEXT`**: Renders as a text link without background

### Responsive Breakpoints

Actions support responsive behavior through breakpoint-specific configurations:

```typescript
const responsiveAction = Action.create({
  value: {
    name: 'save',
    label: 'Save Document',
    icon: 'save-outline',
    renderAs: ActionDisplayStyle.BUTTON,
    showIcon: false,      // Default: no icon
    showLabel: true,      // Default: show label
    
    // Small screens: only show icon
    sm: { 
      showIcon: true, 
      showLabel: false 
    },
    
    // Medium screens: show both
    md: { 
      showIcon: true, 
      showLabel: true 
    },
    
    // Large screens: render as text link
    lg: { 
      renderAs: ActionDisplayStyle.TEXT 
    }
  }
});
```

**Breakpoint inheritance**: Values cascade from smaller to larger breakpoints. If `lg` doesn't specify `showIcon`, it 
inherits the value from `md` (or the closest smaller breakpoint that defines it). Note that the "original values" 
(without breakpoint) represent the smallest breakpoint size.

### Action Execution

Actions are executed through the `actions` array, which contains `FormAction` objects from `@dynamicforms/vue-forms`:

```typescript
import { ExecuteAction } from '@dynamicforms/vue-forms';

// Create the execution logic
const saveFormAction = new ExecuteAction(async (action, supr, params) => {
  try {
    await saveDocument();
    showSuccessMessage('Document saved successfully');
  } catch (error) {
    showErrorMessage('Failed to save document');
  }
  return supr(action, params); // Call the super method
});

// Attach to Action
const saveAction = Action.create({
  value: { /* visual config */ },
  actions: [saveFormAction]
});
```

### Predefined Actions

The library provides common action templates:

```typescript
// Close action with default "Close" label and close icon
const closeAction = Action.closeAction();

// Yes/No actions for confirmation dialogs
const yesAction = Action.yesAction();
const noAction = Action.noAction();

// Override default properties
const customCloseAction = Action.closeAction({
  value: {
    label: 'Cancel',
    renderAs: ActionDisplayStyle.TEXT
  }
});
```

### Complete Example

```typescript
import { Action, ActionDisplayStyle } from '@dynamicforms/vuetify-inputs';
import { ExecuteAction } from '@dynamicforms/vue-forms';

// Business logic
const submitFormAction = new ExecuteAction(async (action, supr, params) => {
  const formData = await form.getValues();
  await api.submitForm(formData);
  router.push('/success');
  return supr(action, params);
});

// Responsive action configuration
const submitAction = Action.create({
  value: {
    name: 'submit',
    label: 'Submit Form',
    icon: 'checkmark-outline',
    renderAs: ActionDisplayStyle.BUTTON,
    showIcon: false,
    showLabel: true,
    
    // Mobile: icon only
    xs: { showIcon: true, showLabel: false },
    
    // Tablet and up: both icon and label
    md: { showIcon: true, showLabel: true },
    
    // Desktop: text link style
    xl: { renderAs: ActionDisplayStyle.TEXT }
  },
  actions: [submitFormAction]
});
```

This approach separates visual presentation (Action) from business logic (FormAction), while providing powerful 
responsive capabilities for different screen sizes.

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
