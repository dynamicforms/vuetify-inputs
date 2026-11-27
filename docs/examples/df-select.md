# df-select Component

`df-select` selects one or several values from static or loaded choices, and optionally accepts new values ("tags").

## Basic Usage

Basic demo with a fixed options list:

<select-basic/>

## Advanced Features

Choices loaded by `fetchChoices` with two-line text and icons, a debounced search, a "no data" text and an optional
minimum query length:

<select-ajax/>

## Integration with DynamicForms

`df-select` bound to `@dynamicforms/vue-forms` fields:

<select-form/>

## Features

- Single and multiple selection
- Choices loaded through `fetchChoices`
- Entry of new values (tagging)
- Icons in choices
- Chips for selected values. With `multiple` and `allowNull`, chips that wrap onto more rows put the clear button
  above the menu arrow; the layout follows the field's width.
- A chip's close button is labelled `Remove <text>` and removes the chip on a click, Enter or Space; focus then moves
  to the close button of the next chip, or to the input when no closable chip remains
- A `null` selection under `allowNull`, and an empty array for a multiple select
- Search with filtering
- A text in the menu when there are no choices to show, and a minimum length of the search text before choices are
  fetched for it
- Choice text as plain text, markdown, HTML or a component

## Props

In addition to [common props from InputBase](./input-base), this component supports:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| choices | `SelectChoice[]` | `undefined` | Static list of choice options |
| fetchChoices | `(query?: any, idValue?: any) => Promise<SelectChoice[]>` | `undefined` | Function to load choices dynamically |
| multiple | `boolean` | `false` | Whether multiple selection is allowed |
| allowTags | `boolean` | `false` | Whether custom values can be entered |
| allowNull | `boolean` | `true` | Whether the user can empty the selection. With `false`, the select offers no clear button and no close on the last chip of a multiple select; it selects no default, and an empty value stays empty until the user selects a choice |
| noDataText | `RenderContent` | translatable `NoChoices` ("No choices") | Shown in the menu when there are no choices to show. While choices are being fetched, or a debounced fetch is waiting, the menu shows the translatable `Loading` instead. A select with `allowTags` opens no menu without choices |
| minQueryLength | `number` | `0` | With `fetchChoices`: the length the search text must reach before `fetchChoices` is called for it. See [Dynamic Option Loading](#dynamic-option-loading) |
| minQueryText | `RenderContent` | translatable `MinQuery` ("Type at least {count} characters", `count` = `minQueryLength`) | Shown in the menu in place of `noDataText` while the search text is shorter than `minQueryLength` |
| fetchDebounce | `number` | `0` | With `fetchChoices`: milliseconds the search text must stay unchanged before `fetchChoices` is called for it. Only the last search text is fetched. `0` calls it at once |

## SelectChoice Interface

Each choice implements this interface:

```typescript
interface SelectChoice {
  id: any;        // Unique identifier/value for the option
  text: any;      // RenderContent, or a function answering it; any other value is shown as String(value)
  icon?: string;  // Optional vue-cached-icon name (ion-…, mdi-…, fa-…), URL or SVG
}
```

`text` is [`RenderContent`](./df-input-hint): a string, an `MdString`, an `HtmlString`, a `SimpleComponentDef`, or a
function answering one of them, so that it can follow the locale. A function is read on every render. `null` and
`undefined` show as an empty text, and any other value, such as a number, as `String(value)`.

The menu's option and the chip render the content. Where only text is taken, the select uses its text
(`renderContentText`, of an `MdString` once rendered as markdown, so `**Java**` reads as "Java"): the title the
select's search filters by, the read-only text field the select renders on the server and until it renders in the
browser, and the label of a chip's close button. An option whose text is not a string is named by the text of its
rendered content, a line break and a block read as a space: `Java<br>Statically typed` is named "Java Statically
typed". `update:modelValueDisplay` carries the choices as they were given.

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

An id of the value that no choice covers is shown with a choice whose text is the id, and stays in the value. An id
that is empty or blank, such as `''`, gets no such choice: the select shows no selection for it, and in a multiple
select the user's edits keep it in the value until the clear button empties the value. Once choices that cover an id
are loaded or given, the select shows that choice instead. With `allowTags`, such an id is shown as it is.

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

With `minQueryLength`, a search text shorter than it is not passed to the function: the loaded choices are reduced to
those of the value and the selection, results of an earlier longer search text are dropped, and the menu shows
`minQueryText` in place of `noDataText` when it has no choices to show. The setup call is not made for an empty value
then; a taggable select's setup call that passes its value as idValue is made, and only the returned choices of the
value are kept. Clearing the search text after a selection follows the same rule. Loading the choices for the value's
ids is not affected.

With `fetchDebounce`, a search text is passed to the function once it has not changed for that many milliseconds, and
only the last one is. An empty search text, the calls that load the choices for the value's ids and the setup call
are made at once. A waiting call is dropped when the component unmounts or becomes read-only. The results of a search
text are dropped once a later search text is fetched or cut short by `minQueryLength`.

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

In addition to the [common events of InputBase](./input-base#events):

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
  { id: 1, text: 'Electronics', icon: 'ion-flash-outline' },
  { id: 2, text: 'Books', icon: 'ion-book-outline' },
  { id: 3, text: 'Clothing', icon: 'ion-shirt-outline' }
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
