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
- `defaultConfirm` / `defaultReject` actions are automatically colored `primary` / `secondary`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `Action[]` or `Ref<Action[]>` | required | Array of Action objects to render |
| `buttonSize` | `string` or `number` | `'default'` | Size of buttons (see Vuetify's v-btn size prop) |
| `showAsGroup` | `'no'` \| `'grouped'` \| `'grouped-no-borders'` | `'no'` | Controls how buttons are grouped |

## Action Object

The component expects an array of `Action` objects created with `new Action()` with the following structure:

```typescript
interface ActionBreakpointOptions {
  name?: string;                    // Unique identifier for the action
  label?: string;                   // Display text
  icon?: string;                    // Icon name, resolved by vue-cached-icon (e.g. ion-save-outline, mdi-content-save)
  renderAs?: ActionDisplayStyle;    // BUTTON or TEXT
  showIcon?: boolean;               // Whether to show the icon
  showLabel?: boolean;              // Whether to show the label
  defaultConfirm?: boolean;         // Marks the action as the "confirm" one - colored primary by default
  defaultReject?: boolean;          // Marks the action as the "reject/dismiss" one - colored secondary by default
  passthroughAttrs?: Record<string, any>; // Extra props forwarded straight to the rendered <v-btn>
  // Responsive breakpoints
  xs?: Partial<ActionRenderOptions>;
  sm?: Partial<ActionRenderOptions>;
  md?: Partial<ActionRenderOptions>;
  lg?: Partial<ActionRenderOptions>;
  xl?: Partial<ActionRenderOptions>;
}
```

A breakpoint accepts the whole `ActionRenderOptions` type, but only five of its members take part in the cascade:
`ResponsiveActionRenderOptions.cleanBreakpoint()` copies `renderAs`, `label`, `icon`, `showLabel` and `showIcon` out of
a breakpoint and drops everything else. `name`, `defaultConfirm`, `defaultReject` and `passthroughAttrs` are read from
the base options whatever a breakpoint states about them.

The `Action` object is the core component that defines how actions behave in the `df-actions` component. It extends the
`Action` class of `@dynamicforms/vue-forms` to provide responsive behavior and visual configuration.

### Creating Actions

Actions are created with the `Action` constructor:

```typescript
import { Action, ActionDisplayStyle } from '@dynamicforms/vuetify-inputs';
import { ExecuteAction } from '@dynamicforms/vue-forms';

const saveAction = new Action({
  value: {
    name: 'save',
    label: 'Save',
    icon: 'save-outline',
    renderAs: ActionDisplayStyle.BUTTON,
    showIcon: true,
    showLabel: true
  },
  actions: [saveFormAction] // ExecuteAction handlers that run when the action is executed
});
```

### Action Value Configuration

The `value` object defines the visual appearance and behavior:

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Unique identifier for the action |
| `label` | `string` | Display text |
| `icon` | `string` | Icon name, resolved by `vue-cached-icon`; both `ion-` and `mdi-` prefixed names work |
| `renderAs` | `ActionDisplayStyle` | How to render: `BUTTON` or `TEXT` |
| `showIcon` | `boolean` | Whether to display the icon |
| `showLabel` | `boolean` | Whether to display the label |
| `defaultConfirm` | `boolean` | Marks this as the "confirm" action of the set; colors the button `primary` in `<df-actions>` (unless overridden via `passthroughAttrs.color`) |
| `defaultReject` | `boolean` | Marks this as the "reject/dismiss" action of the set; colors the button `secondary` in `<df-actions>` (unless overridden via `passthroughAttrs.color`) |
| `passthroughAttrs` | `Record<string, any>` | Extra props/attrs (e.g. `color`, `loading`, `density`, `rounded`, `block`, `prependIcon`) forwarded to the rendered `<v-btn>`, overriding `<df-actions>`'s own computed props |

The `label` and `icon` accessors of this subclass read through `showLabel` and `showIcon`: an icon-only action
answers `undefined` for `label` while its value still carries one, and a label-only action answers `undefined` for
`icon`. The writes are the base class's and reach `value.label` / `value.icon` whatever the two flags say, so a
write followed by a read of an icon-only action does not answer with what was written. `showLabel` and `showIcon`
answer `false` where the text they govern is missing or empty, whatever the value holds. The breakpoint-resolved
options `<df-actions>` renders from are filtered the same way.

`enabled` and `visibility` aren't part of `ActionRenderOptions` - they're standard `Action`/`Field` properties from
`@dynamicforms/vue-forms` (settable at the top level of the `new Action()` parameters, or via `action.enabled` /
`action.visibility` directly) - but `<df-actions>` reacts to them too:

- `enabled: false` disables the button (`<v-btn disabled>`).
- `visibility: DisplayMode.HIDDEN` keeps the button in the DOM with a `d-none` class.
- `visibility: DisplayMode.INVISIBLE` keeps the button in the layout with an `invisible` class (`visibility: hidden`).
- `visibility: DisplayMode.SUPPRESS` removes the button from the rendered list entirely.

### ActionDisplayStyle

- **`ActionDisplayStyle.BUTTON`**: Renders as a Material Design button with background
- **`ActionDisplayStyle.TEXT`**: Renders as a text link without background

### Responsive Breakpoints

Actions support responsive behavior through breakpoint-specific configurations:

```typescript
const responsiveAction = new Action({
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

An action's options are all single values, so the cascade above is the whole story here. The class behind it,
`ResponsiveRenderOptions`, also carries options that are objects or lists for the subclasses that need them -
see [responsive options](/examples/responsive-render-options) if you are writing one.

### Action Execution

Actions are executed through the `actions` array, which holds `FieldActionBase` handlers from
`@dynamicforms/vue-forms`; the one that runs on execution is `ExecuteAction`:

```typescript
import { ExecuteAction } from '@dynamicforms/vue-forms';

// Create the execution logic
const saveFormAction = new ExecuteAction(async (action, supr, params) => {
  await saveDocument();
  return supr(action, params); // Call the super method
});

// Attach to Action
const saveAction = new Action({
  value: { /* visual config */ },
  actions: [saveFormAction]
});
```

#### Awaiting a run

`action.execute(params?)` runs the `ExecuteAction` chain and answers a promise carrying what the chain returned. The
chain is entered synchronously - a handler has already run by the time `execute()` returns - but a handler that
throws rejects that promise rather than throwing out of the call, so the failure is reported to whoever awaits the
answer:

```typescript
try {
  await saveAction.execute();
  showSuccessMessage('Document saved successfully');
} catch (error) {
  showErrorMessage('Failed to save document');
}
```

A call that neither awaits the answer nor attaches a `.catch()` leaves the rejection unhandled: it surfaces through
the runtime rather than through the form, and the action carries no trace of it. A handler rendered through
`<df-actions>` needs no change on that count - the component calls `execute(event)` from a template event handler,
and Vue attaches its own catch to the promise such a handler answers with, so the rejection goes to Vue's error
handling instead of nowhere. Where the user has to be told what failed, catch it in the `ExecuteAction` handler.

See [handling a failed run](:vue-forms:/api/actions.html#handling-a-failed-run) for the whole contract.

#### Reporting a run in flight

`action.busy` is `true` from the call to `execute()` until the run it started settles, whether it resolves or
rejects; overlapping runs are counted, so it stands until the last of them is done. `<df-actions>` doesn't read it -
the button stays clickable through a run - so an action that must not be entered twice writes its own `enabled`,
which the component does bind:

```typescript
import { watchEffect } from 'vue';

watchEffect(() => { saveAction.enabled = !saveAction.busy; });
```

`execute()` itself doesn't consult `enabled`, so this stops the click rather than the call; a programmatic
`execute()` runs whatever `enabled` says.

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

### Default Confirm / Reject Actions

`defaultConfirm` and `defaultReject` mark which action in a set represents "confirm" (e.g. Save, Yes, OK) versus
"reject/dismiss" (e.g. Cancel, No). `<df-actions>` uses these flags to pick a sensible default button color -
`primary` for `defaultConfirm`, `secondary` for `defaultReject` - so the important action in a set stands out
without you having to set `color` by hand on every action:

```typescript
const yes = Action.yesAction({ value: { defaultConfirm: true } });   // colored primary
const no = Action.noAction({ value: { defaultReject: true } });      // colored secondary

// A single close action can be both, e.g. when there's only one way to close
const close = Action.closeAction({ value: { defaultConfirm: true, defaultReject: true } });
```

At most one action in a given set should set `defaultConfirm`, and at most one should set `defaultReject`.

> **Side note:** if you're using [`@dynamicforms/vuetify-modal-form-kit`](:vuetify-modal-form-kit:), its
> [`<df-modal>`](:vuetify-modal-form-kit:/api/df-modal.html#keyboard-shortcuts) component also reads these same flags
> off the actions passed to its `actions` prop, to decide which action Enter / Escape should trigger. Since
> `<df-modal>`'s `actions` slot is normally rendered via `<df-actions>` too, the two concerns - keyboard shortcut
> and default button color - line up for free.

### Passthrough Attributes

`passthroughAttrs` forwards arbitrary props straight to the rendered `<v-btn>`, taking precedence over
`<df-actions>`'s own computed props (`variant`, `color`, `disabled`). Use it for anything `<v-btn>` supports that
isn't already modeled by `ActionRenderOptions`:

```typescript
const deleteAction = new Action({
  value: {
    name: 'delete',
    label: 'Delete',
    icon: 'trash-outline',
    renderAs: ActionDisplayStyle.BUTTON,
    showIcon: true,
    showLabel: true,
    passthroughAttrs: { color: 'error', variant: 'flat' },
  },
  actions: [deleteFormAction],
});
```

### Complete Example

```typescript
import { Action, ActionDisplayStyle } from '@dynamicforms/vuetify-inputs';
import { ExecuteAction } from '@dynamicforms/vue-forms';

// Business logic
const submitFormAction = new ExecuteAction(async (action, supr, params) => {
  await api.submitForm(form.value);
  router.push('/success');
  return supr(action, params);
});

// Responsive action configuration
const submitAction = new Action({
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

`form` here is a `Group`: it hands out what it holds through the `value` property, or through `fullValue` where
disabled members have to be in the payload.

This approach separates visual presentation (the `Action` and its render options) from business logic (the
`ExecuteAction` handlers), and lets each screen size get the presentation that fits it.

## Responsive Behavior

The component automatically adapts to different screen sizes based on the breakpoint configuration:

```javascript
const saveAction = new Action({
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
    new Action({
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

    new Action({
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
