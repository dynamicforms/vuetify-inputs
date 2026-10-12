# df-actions Component

`df-actions` renders a row of actions as buttons or text links, with render options per screen-size breakpoint.

## Basic Example

A row of actions:

<ActionsDemo />

## Features

- Renders actions as buttons or text links
- Supports responsive display based on screen size
- Icon and label shown per `showIcon` / `showLabel`
- Grouped button layouts
- Renders `@dynamicforms/vue-forms` actions
- `defaultConfirm` / `defaultReject` actions are colored `primary` / `secondary`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `Action[]` or `Ref<Action[]>` | required | Array of Action objects to render - this library's `Action`, or a bare `@dynamicforms/vue-forms` one |
| `buttonSize` | `string` or `number` | `'default'` | Size of buttons (see Vuetify's v-btn size prop) |
| `showAsGroup` | `'no'` \| `'grouped'` \| `'grouped-no-borders'` | `'no'` | Controls how buttons are grouped |

## Action Object

The component expects an array of `Action` objects created with `new Action()` with the following structure:

```typescript
interface ActionBreakpointOptions {
  name?: string;                    // Unique identifier for the action
  label?: string;                   // Display text
  icon?: string;                    // Icon name, resolved by vue-cached-icon (e.g. ion-save-outline, mdi-content-save)
  renderAs?: ActionDisplayStyle;    // 'button' or 'text'
  showIcon?: boolean;               // Whether to show the icon
  showLabel?: boolean;              // Whether to show the label
  defaultConfirm?: boolean;         // Marks the action as the "confirm" one - colored primary by default
  defaultReject?: boolean;          // Marks the action as the "reject/dismiss" one - colored secondary by default
  passthroughAttrs?: Record<string, any>; // Extra props forwarded straight to the rendered <v-btn>
  // Responsive breakpoints
  xs?: ActionBreakpointRenderOptions;
  sm?: ActionBreakpointRenderOptions;
  md?: ActionBreakpointRenderOptions;
  lg?: ActionBreakpointRenderOptions;
  xl?: ActionBreakpointRenderOptions;
}
```

A breakpoint sets how the action is rendered at that width: `renderAs`, `label`, `icon`, `showLabel`, `showIcon` and
`passthroughAttrs`. `name`, `defaultConfirm` and `defaultReject` do not depend on the screen width and are set only in
the base options; `ActionBreakpointRenderOptions` is `ActionRenderOptions` without them.

`passthroughAttrs` merges key by key: a breakpoint that sets `color` keeps the `density` of the smaller breakpoint.

This library's `Action` extends the `Action` class of `@dynamicforms/vue-forms` with the render options above.

### Actions declared in `@dynamicforms/vue-forms`

The component reads its render options from the action's value, not through this subclass's accessors. An `Action` of
`@dynamicforms/vue-forms`, whose value holds only a `label` and an `icon`, therefore renders as a button showing the
ones it has. Options the value does not hold take their defaults. A `label` or `icon` that is not a string is not
rendered.

```typescript
import { Action } from '@dynamicforms/vue-forms';

const cancel = new Action({ value: { label: 'Cancel' }, actions: [cancelHandler] });
```

The subclass is needed for breakpoint options, the text-link style and the confirm / reject colors; they are members
of `ActionRenderOptions`, which only it declares.

`getRenderOptionsForBreakpoint(value, breakpoint)` returns the `ActionRenderOptions` a value renders as at one
breakpoint, defaults filled in and `label` / `icon` filtered by their flags.
`Action.getBreakpointValue(breakpointRef)` is a `computed()` over the same call.

### Creating Actions

Actions are created with the `Action` constructor:

```typescript
import { Action } from '@dynamicforms/vuetify-inputs';
import { ExecuteAction } from '@dynamicforms/vue-forms';

const saveAction = new Action({
  value: {
    name: 'save',
    label: 'Save',
    icon: 'save-outline',
    renderAs: 'button',
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
| `renderAs` | `ActionDisplayStyle` | How to render: `'button'` or `'text'` |
| `showIcon` | `boolean` | Whether to display the icon |
| `showLabel` | `boolean` | Whether to display the label |
| `defaultConfirm` | `boolean` | Marks this as the "confirm" action of the set; colors the button `primary` in `<df-actions>` (unless overridden via `passthroughAttrs.color`) |
| `defaultReject` | `boolean` | Marks this as the "reject/dismiss" action of the set; colors the button `secondary` in `<df-actions>` (unless overridden via `passthroughAttrs.color`) |
| `passthroughAttrs` | `Record<string, any>` | Extra props/attrs (e.g. `color`, `density`, `rounded`, `block`, `prependIcon`) forwarded to the rendered `<v-btn>`, overriding `<df-actions>`'s own computed props |

Every one of these but `name`, `defaultConfirm` and `defaultReject` can also be stated per breakpoint.

`label` and `icon` are accessors of `@dynamicforms/vue-forms`: each reads the member of the same name from the value,
and a write to it is a value change. `defaultConfirm` and `defaultReject` are read-only accessors of vue-forms: each
reads the member of the same name from the value and returns `false` where it is unset. `renderedLabel` and
`renderedIcon` are this subclass's: the text where `showLabel` is true, the icon name where `showIcon` is true, and
`undefined` otherwise. `showLabel` and `showIcon` return `false` where the label or icon is missing or empty,
regardless of the value. The breakpoint-resolved options `<df-actions>` renders from are filtered the same way; the
component reads none of these accessors.

`access`, `busy` and `visibility` aren't part of `ActionRenderOptions` - they're standard `Action`/`Field` members
of `@dynamicforms/vue-forms` (`access` and `visibility` are set at the top level of the `new Action()` parameters or
through `action.access` / `action.visibility`; `busy` is read-only). `<df-actions>` applies them:

- an `access` other than `'editable'`, on the action or a container above it, disables the button
  (`<v-btn disabled>`); the button binds `effectiveEnabled`.
- `busy` disables the button and renders it `loading` until every run of the action has settled.
- `visibility: 'invisible'` keeps the button in the layout with an `invisible` class (`visibility: hidden`).
- `visibility: 'hidden'` keeps the button in the DOM with a `d-none` class.
- `visibility: 'suppress'` removes the button from the rendered list entirely.

### ActionDisplayStyle

`ActionDisplayStyle` is `'button' | 'text'`:

- **`'button'`**: a Vuetify button with a background (the default, `defaultDisplayStyle`)
- **`'text'`**: a text link without a background

Any other `renderAs` throws an `Error` naming the value when the action is rendered. `isActionDisplayStyle(value)`
returns whether a value is one of the two, and `actionDisplayStyles` lists them.

### Responsive Breakpoints

Actions support responsive behavior through breakpoint-specific configurations:

```typescript
const responsiveAction = new Action({
  value: {
    name: 'save',
    label: 'Save Document',
    icon: 'save-outline',
    renderAs: 'button',
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
      renderAs: 'text' 
    }
  }
});
```

**Breakpoint inheritance**: values are inherited from smaller to larger breakpoints. If `lg` does not set `showIcon`,
it takes the value of `md`, or of the closest smaller breakpoint that sets it. The base values (outside any
breakpoint) apply to the smallest breakpoint.

Every option except `passthroughAttrs` is a single value, which a breakpoint replaces. `passthroughAttrs` is an object
and merges key by key, so a breakpoint sets the attrs it changes and inherits the rest. The class behind the
inheritance, `ResponsiveRenderOptions`, also supports list options for subclasses; see
[responsive options](/examples/responsive-render-options).

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

`action.execute(params?)` runs the `ExecuteAction` chain and returns a promise of the chain's result. The chain is
entered synchronously: a handler has run by the time `execute()` returns. A handler that throws rejects the promise;
`execute()` itself does not throw:

```typescript
try {
  await saveAction.execute();
  showSuccessMessage('Document saved successfully');
} catch (error) {
  showErrorMessage('Failed to save document');
}
```

A call that neither awaits the promise nor attaches a `.catch()` leaves the rejection unhandled; the action records
nothing of it. `<df-actions>` calls `execute(event)` from a template event handler, and Vue catches the promise such a
handler returns, so the rejection goes to Vue's error handling. To show the user what failed, catch it in the
`ExecuteAction` handler.

See [handling a failed run](:vue-forms:/api/action.html#handling-a-failed-run) for the whole contract.

#### Reporting a run in flight

`action.busy` is `true` from the call to `execute()` until the run settles, whether it resolves or rejects;
overlapping runs are counted, so it stays `true` until the last of them settles. `<df-actions>` binds it: the button is
disabled and rendered `loading` while it is `true`, so a click cannot start a second run.

`execute()` reads neither `enabled` nor `busy`, so only the click is prevented: a programmatic `execute()` runs
regardless, and an action that refuses an overlapping run does so in its own handler.

### Predefined Actions

Predefined actions:

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
    renderAs: 'text'
  }
});
```

### Default Confirm / Reject Actions

`defaultConfirm` and `defaultReject` mark the "confirm" action of a set (e.g. Save, Yes, OK) and the "reject/dismiss"
one (e.g. Cancel, No). `<df-actions>` colors them `primary` and `secondary` by default:

```typescript
const yes = Action.yesAction({ value: { defaultConfirm: true } });   // colored primary
const no = Action.noAction({ value: { defaultReject: true } });      // colored secondary

// A single close action can be both
const close = Action.closeAction({ value: { defaultConfirm: true, defaultReject: true } });
```

At most one action in a given set should set `defaultConfirm`, and at most one should set `defaultReject`.

> [`<df-modal>`](:vuetify-modal-form-kit:/api/df-modal.html#keyboard-shortcuts) of
> [`@dynamicforms/vuetify-modal-form-kit`](:vuetify-modal-form-kit:) reads the same flags from the actions in its
> `actions` prop to select the actions of Enter and Escape. Its `actions` slot renders through `<df-actions>`, so the
> keyboard shortcut and the button color are set by the same flag.

### Passthrough Attributes

`passthroughAttrs` passes props to the rendered `<v-btn>` and takes precedence over `<df-actions>`'s computed props
(`variant`, `color`, `disabled`, `loading`). It covers any `<v-btn>` prop that `ActionRenderOptions` does not:

```typescript
const deleteAction = new Action({
  value: {
    name: 'delete',
    label: 'Delete',
    icon: 'trash-outline',
    renderAs: 'button',
    showIcon: true,
    showLabel: true,
    passthroughAttrs: { color: 'error', variant: 'flat' },
  },
  actions: [deleteFormAction],
});
```

### Complete Example

```typescript
import { Action } from '@dynamicforms/vuetify-inputs';
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
    renderAs: 'button',
    showIcon: false,
    showLabel: true,
    
    // Mobile: icon only
    xs: { showIcon: true, showLabel: false },
    
    // Tablet and up: both icon and label
    md: { showIcon: true, showLabel: true },
    
    // Desktop: text link style
    xl: { renderAs: 'text' }
  },
  actions: [submitFormAction]
});
```

`form` here is a `Group`: `value` is what it sends, and `fullValue` what it holds, disabled members included. Each
member's `access` sets what `value` contains for it; `visibility` affects neither.

The presentation (the `Action` and its render options) is separate from the logic (the `ExecuteAction` handlers).

## Responsive Behavior

The component applies the options of the current breakpoint:

```javascript
const saveAction = new Action({
  value: {
    name: 'save',
    label: 'Save',
    icon: 'save-outline',
    renderAs: 'button',
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

`showAsGroup` sets the grouping of buttons:

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
  import { Action } from '@dynamicforms/vuetify-inputs';

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
        renderAs: 'button',
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
        renderAs: 'button',
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
