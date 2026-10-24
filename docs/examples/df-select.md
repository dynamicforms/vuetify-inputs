# df-select Component

`df-select` selects one or several values from static or loaded choices, and optionally accepts new values ("tags").

## Basic Usage

Basic demo with a fixed options list:

<select-basic/>

## Advanced Features

Choices loaded by `fetchChoices`, and icons:

<select-ajax/>

## Integration with DynamicForms

`df-select` bound to `@dynamicforms/vue-forms` fields:

<select-form/>

## Features

- Binds a `@dynamicforms/vue-forms` element, a `v-model`, or neither
- Single and multiple selection
- Choices loaded through `fetchChoices`
- Entry of new values (tagging)
- Icons in choices
- Chips for selected values. With `multiple` and `allowNull`, chips that wrap onto more rows put the clear button
  above the menu arrow; the layout follows the field's width.
- A `null` selection under `allowNull`, and an empty array for a multiple select
- Search with filtering

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| choices | `SelectChoice[]` | `undefined` | Static list of choice options |
| fetchChoices | `(query?: any, idValue?: any) => Promise<SelectChoice[]>` | `undefined` | Function to load choices dynamically |
| multiple | `boolean` | `false` | Whether multiple selection is allowed |
| allowTags | `boolean` | `false` | Whether custom values can be entered |
| allowNull | `boolean` | `true` | Whether the user can empty the selection. With `false`, the select offers no clear button and no close on the last chip of a multiple select; it selects no default, and an empty value stays empty until the user selects a choice |

### Inherited Props

This component inherits all common props from [InputBase](./input-base), including:

- `control` - DynamicForms field object
- `modelValue` - The selected value(s)
- `label` - Input label
- `hint` - Hint text
- And more...

## SelectChoice Interface

Each choice implements this interface:

```typescript
interface SelectChoice {
  id: any;        // Unique identifier/value for the option
  text: any;      // Display text
  icon?: string;  // Optional icon name (Ionicons format)
}
```

## Value Format

The value depends on `multiple`:

- When `multiple: false` (default):
  - Returns a single value (the `id` of the selected option)
  - Returns `null` when nothing is selected
  
- When `multiple: true`:
  - Returns an array of values (the `id`s of selected options)
  - Closing the last chip leaves an empty array; the clear button (under `allowNull`) sets `null`

The select writes into the value only when the user edits the selection. Setting it up, mounting it, enabling it,
loading choices and a value set from outside leave the value as it is: `null` stays `null`, an empty array stays an
empty array, and a value the select would show differently - a single id for a multiple select, an array for a single
one - is shown as the select needs it and written in that form only with the user's next edit.

An id of the value that no choice covers is shown with a choice whose text is the id, and stays in the value. Once
choices that cover it are loaded or given, the select shows that choice instead. With `allowTags`, such an id is shown
as it is.

## Dynamic Option Loading

When using the `fetchChoices` prop instead of static `choices`, the component:

1. Calls the function while the component is being set up, before it is mounted, in the browser only (see
   [Server-side rendering](/guide/ssr))
2. Calls the function when the user types in the search field
3. Uses the search text as the query parameter
4. Uses the ids of the value that no loaded choice covers as the idValue parameter - an array when `multiple` is set,
   a single id otherwise. This happens while the component is being set up and whenever the value changes from
   outside the component, also when the field is read-only. With an empty value, the setup call passes the value
   itself (`null`) as idValue and expects the unfiltered choices back.

Until that call resolves, no chip shows the ids. Once it has resolved, an id the call returned no choice for is shown
with a choice whose text is the id, as with static `choices`. The value is unchanged either way. A call that rejects is
logged with `console.error` and leaves the loaded choices as they are.

```typescript
const fetchChoices = async (query?: string, idValue?: any): Promise<SelectChoice[]> => {
  // Simulate API call
  const response = await apiCall('/api/options', { search: query, ids: idValue });
  return response.data.map(item => ({
    id: item.id,
    text: item.name,
    icon: item.icon
  }));
};
```

## Events

In addition to the [common events from InputBase](./input-base):

- `update:modelValue` - When the selected value(s) change
- `update:modelValueDisplay` - Carries a `SelectChoice[]` holding the choices shown for the current value, including
  those whose text is the id. It is emitted while the component is being set up and whenever those choices change; not
  while the choices for the value's ids are being fetched, nor on the server for a select with `fetchChoices`

## Slots

Two slots are forwarded to the underlying `v-autocomplete` / `v-combobox`, with the slot props Vuetify passes:

- `append-inner`
- `prepend-inner`

## Examples

### Basic Single Selection

```vue
<template>
  <df-select
    v-model="selectedFruit"
    :choices="fruits"
    label="Choose a fruit"
  />
</template>

<script setup>
import { ref } from 'vue';
import { DfSelect } from '@dynamicforms/vuetify-inputs';

const selectedFruit = ref('apple');
const fruits = [
  { id: 'apple', text: 'Apple' },
  { id: 'banana', text: 'Banana' },
  { id: 'cherry', text: 'Cherry' }
];
</script>
```

### Multiple Selection with DynamicForms

```vue
<template>
  <df-select
    :control="form.fields.categories"
    :choices="categories"
    :multiple="true"
    label="Select categories"
  />
</template>

<script setup>
import { Group, Field, ValidationError, Validators } from '@dynamicforms/vue-forms';
import { DfSelect } from '@dynamicforms/vuetify-inputs';

const categories = [
  { id: 1, text: 'Electronics', icon: 'flash-outline' },
  { id: 2, text: 'Books', icon: 'book-outline' },
  { id: 3, text: 'Clothing', icon: 'shirt-outline' }
];

const form = new Group({
  categories: new Field({
    value: [1],
    validators: [
      new Validators.Validator((value) => {
        if (!value || value.length === 0) return [new ValidationError('app.no_category', {}, 'Select at least one category')];
        return null;
      })
    ]
  })
});
</script>
```

<script setup>
import SelectBasic from '../components/select-basic.vue';
import SelectAjax from '../components/select-ajax.vue';
import SelectForm from '../components/select-form.vue';
</script>
