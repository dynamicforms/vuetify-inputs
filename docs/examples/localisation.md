# Localisation

The library renders a small number of English strings of its own: the labels of the three predefined actions,
every tooltip, dropdown entry and dialog label the RTF editor's toolbar draws — the toolbar is built from this
library's own Vuetify components, so its entire text lives in the same table as everything else — the upload
and download prompts on `<df-image>` and `<df-file>`, and the messages of vue-forms' built-in validators. All of it
is translatable. Dates and times are a separate
concern, driven by a date-fns locale rather than by a string table.

The two mechanisms are independent. An application that needs both calls both, and the
[worked example](#wiring-it-to-vue-i18n) below does exactly that.

## The strings the library owns

`translatableStrings` is the table. It is a reactive object exported from the package, and it holds the strings that
are in force right now — not the English originals, which are its initial contents and nothing more. Reading a key
inside a template, a `computed` or a `watchEffect` subscribes to it, so a component already on screen picks up a
later `translateStrings` call on its own.

| Key | English default | Where it surfaces |
|-----|-----------------|-------------------|
| `Yes` | `Yes` | Label of the action returned by `Action.yesAction()` |
| `No` | `No` | Label of the action returned by `Action.noAction()` |
| `Close` | `Close` | Label of the action returned by `Action.closeAction()` |
| `Paragraph` | `Paragraph` | `<df-rtf-editor>` heading dropdown, "no heading" entry |
| `Heading1`–`Heading6` | `Heading 1`–`Heading 6` | `<df-rtf-editor>` heading dropdown entries |
| `Undo` / `Redo` | `Undo` / `Redo` | `<df-rtf-editor>` toolbar button tooltips |
| `SelectAll` | `Select all` | `<df-rtf-editor>` toolbar button tooltip |
| `Bold` / `Italic` | `Bold` / `Italic` | `<df-rtf-editor>` toolbar button tooltips |
| `HorizontalLine` | `Horizontal line` | `<df-rtf-editor>` toolbar button tooltip |
| `Blockquote` | `Block quote` | `<df-rtf-editor>` toolbar button tooltip |
| `BulletedList` / `NumberedList` | `Bulleted list` / `Numbered list` | `<df-rtf-editor>` toolbar button tooltips |
| `Outdent` / `Indent` | `Decrease indent` / `Increase indent` | `<df-rtf-editor>` toolbar button tooltips |
| `AlignLeft`, `AlignCenter`, `AlignRight`, `AlignJustify` | `Align left`, `Align center`, `Align right`, `Justify` | `<df-rtf-editor>` toolbar button tooltips |
| `Link` | `Link` | `<df-rtf-editor>` toolbar button tooltip |
| `LinkUrl` | `URL` | `<df-rtf-editor>` link menu's URL field label, and the bubble menu's `window.prompt()` for a link over selected text |
| `LinkApply` | `Apply` | `<df-rtf-editor>` link menu, the apply button |
| `LinkRemove` | `Remove link` | `<df-rtf-editor>` link menu, the remove button |
| `Downloadable` | `Downloadable` | `<df-rtf-editor>` link menu, the checkbox that adds `download="file"` |
| `Image` | `Image` | `<df-rtf-editor>` toolbar button tooltip |
| `ImageUrl` | `Image URL` | `<df-rtf-editor>` image menu, the URL field's label |
| `ImageUpload` | `Upload image` | `<df-rtf-editor>` image menu, the upload button |
| `ImageInsert` | `Insert` | `<df-rtf-editor>` image menu, the insert-from-URL button |
| `ImageDropHint` | `Drop image here or click to browse` | `<df-image>`'s empty-state drop zone |
| `ImageReplace` | `Replace image` | `<df-image>`'s replace-image button tooltip |
| `ImageDownload` | `Download image` | `<df-image>`'s download button tooltip and aria-label |
| `FileDownload` | `Download file` | `<df-file>`'s download button tooltip and aria-label |
| `Table` | `Table` | `<df-rtf-editor>` toolbar button tooltip |
| `TableInsert` | `Insert table` | `<df-rtf-editor>` table menu |
| `TableAddRowAbove`, `TableAddRowBelow`, `TableDeleteRow` | `Add row above`, `Add row below`, `Delete row` | `<df-rtf-editor>` table menu |
| `TableAddColumnBefore`, `TableAddColumnAfter`, `TableDeleteColumn` | `Add column before`, `Add column after`, `Delete column` | `<df-rtf-editor>` table menu |
| `TableToggleHeaderRow` | `Toggle header row` | `<df-rtf-editor>` table menu |
| `TableDeleteTable` | `Delete table` | `<df-rtf-editor>` table menu |
| `Style` | `Style` | `<df-rtf-editor>` toolbar button, the Style dropdown's own label |
| `ArticleCategory`, `Title`, `Subtitle`, `InfoBox`, `SideQuote`, `Marker`, `Spoiler`, `CodeDark`, `CodeBright` | see [df-rtf-editor](/examples/df-rtf-editor#custom-styles) | Style dropdown entries, one per `class` preset (`h3.category`, `p.info-box`...) the editor's stylesheet renders |
| `MediaEmbed` | `Insert media` | `<df-rtf-editor>` toolbar button tooltip |
| `MediaEmbedUrl` | `Video URL` | `<df-rtf-editor>` media-embed menu, the URL field's label |
| `MediaEmbedInsert` | `Insert` | `<df-rtf-editor>` media-embed menu, the insert button |
| `InvalidHexColor` | `Not a valid hex string.` | `<df-color>`'s built-in validation rule, shown when the typed value isn't a hex color and no `control` validator is set |
| `required` | `Please enter a value` | An error of code `required`, raised by `Validators.Required` |
| `pattern` | `Value must match pattern "{pattern}"` | An error of code `pattern`, raised by `Validators.Pattern` |
| `min_value` | `Value must be larger or equal to {minValue}` | An error of code `min_value`, raised by `Validators.MinValue` |
| `max_value` | `Value must be less than or equal to {maxValue}` | An error of code `max_value`, raised by `Validators.MaxValue` |
| `value_in_range` | `Value must be between {minValue} and {maxValue}` | An error of code `value_in_range`, raised by `Validators.ValueInRange` |
| `min_length` | `Length must be larger or equal to {minLength}` | An error of code `min_length`, raised by `Validators.MinLength` |
| `max_length` | `Length must be less than or equal to {maxLength}` | An error of code `max_length`, raised by `Validators.MaxLength` |
| `length_in_range` | `Length must be between {minLength} and {maxLength}` | An error of code `length_in_range`, raised by `Validators.LengthInRange` |
| `in_allowed_values` | `Must be one of [{allowedAsText}]` | An error of code `in_allowed_values`, raised by `Validators.InAllowedValues` |
| `compare_to` | `Value does not match the comparison with {otherValue}` | An error of code `compare_to`, raised by `Validators.CompareTo` |
| `validation_failed` | `Validation could not be completed` | An error of code `validation_failed`, which vue-forms raises for a rejected validation promise |

The style-preset entries name CSS classes that are fixed and not affected by a translation, so the saved HTML is the
same whatever language the toolbar speaks.

## Validation messages

An error is rendered by its `code`. `defaultErrorText(error)` answers the `translatableStrings` entry named by
`error.code`, with each `{name}` placeholder replaced by `error.params[name]` (an array param as its items joined with
`, `), and `error.detail` where the table has no entry of that name. The lower-case entries of the table above are the
codes of vue-forms' built-in validators, so `translateStrings` translates their messages together with the rest of the
library's strings, and a translated entry keeps the placeholders it uses:

```typescript
translateStrings((key, defaultValue) =>
  ({ required: 'Vnesite vrednost', min_length: 'Dolžina mora biti vsaj {minLength}' })[key] ?? defaultValue,
);
```

An error with a code of the application's own - a validator given `{ code, detail }`, an error a custom validator
returns, an error from the server - renders as its `detail` until the table, or the `errorText` setting, has
something for that code. A string in a component's `errors` prop becomes an error with an empty code, so it renders as
written.

The `errorText` setting replaces this per error. It is given at install, or provided under `vuetifyInputsSettingsKey`
for a subtree, and answers the content an error renders as - a string, an `MdString` for markdown, or a
`SimpleComponentDef` - or `undefined` for `defaultErrorText`'s answer. It runs while the errors are rendered, so a
locale it reads is tracked:

```typescript
import { defaultErrorText, DynamicFormsInputs, MdString } from '@dynamicforms/vuetify-inputs';

app.use(DynamicFormsInputs, {
  errorText: (error) => {
    if (error.code === 'over_budget') return new MdString(`Over the budget by **${error.params.over} €**`);
    const key = `errors.${error.code}`;
    return i18n.global.te(key) ? i18n.global.t(key, error.params) : undefined;
  },
});
```

`defaultErrorText` is exported, so an `errorText` that changes only a few codes can call it for the rest instead of
answering `undefined`.

## translateStrings

```typescript
translateStrings(translationCallback: (key: string, defaultValue: string) => string | null | undefined): void
```

`translateStrings` walks every key of `translatableStrings` in declaration order and calls the callback once per key,
with the **key** — `'Heading1'`, `'CodeDark'` — and its English default. Whatever it returns that is not `null` or
`undefined` is written into the table in place of the current value; a `null` or `undefined` return resets that entry
to its English default. The function itself returns nothing.

```typescript
import { translateStrings } from '@dynamicforms/vuetify-inputs';

translateStrings((key, defaultValue) => myCatalogue[key] ?? defaultValue);
```

### When it takes effect

- **Actions.** `Action.closeAction()`, `Action.yesAction()` and `Action.noAction()` copy the string into the action's
  `label` when the factory runs. An action that already exists keeps the label it was built with — assign
  `action.label` to change it, or build the action again.
- **The RTF editor.** `<df-rtf-editor>`'s toolbar reads `translatableStrings` reactively, including the heading
  dropdown, so a call to `translateStrings` reaches a toolbar that is already mounted - no remount needed.

Call `translateStrings` before the application mounts, and again on every locale change if the locale can change at
runtime - a key the callback declines on a later call reverts to its English default rather than keeping what an
earlier call set it to, so each call is a complete statement of the current locale, not a patch on top of the last
one.

## Dates and times

`<df-date-time>` formats, parses and lays out its picker with a [date-fns](https://date-fns.org/) `Locale` object. The
global setting lives in `DateTimeLocaleConfig`:

```typescript
export const DateTimeLocaleConfig = {
  dateTimeLocale: ref(sl),
  setDateTimeLocale(locale: Locale | Ref<Locale>): void,
};
```

The default is Slovenian (`sl`). `setDateTimeLocale` accepts either a locale or a ref to one. Given a plain locale it
writes into the existing ref, so components that already read it update; given a ref it adopts that ref as the source,
and every later change to the ref you passed reaches the components as well.

```typescript
import { DateTimeLocaleConfig } from '@dynamicforms/vuetify-inputs';
import { enUS } from 'date-fns/locale';

DateTimeLocaleConfig.setDateTimeLocale(enUS);
```

The locale governs three things in `<df-date-time>`:

- **Formatting.** The text fields are rendered with date-fns `format()` using `displayFormatDate` (default `'P'`) and
  `displayFormatTime` (default `'p'`), both of which resolve against the locale.
- **Parsing.** Typed text is read back with date-fns `parse()` against the same patterns and the same locale.
- **First day of week.** The date picker takes `locale.options.weekStartsOn`, falling back to `1` (Monday) for a
  locale that does not state one.

Two things it does not govern: the time picker is always in 24-hour mode, and the month and weekday names inside the
picker come from Vuetify, which carries its own locale configuration.

### Per-component override

Every `<df-date-time>` accepts a `locale` prop of the same date-fns `Locale` type. When it is set the component uses
it and ignores `DateTimeLocaleConfig` entirely; when it is not, the global setting applies. This is what makes a
single form able to show one field in the application's locale and another in a fixed one.

<datetime-multilingual/>

```vue
<template>
  <df-date-time v-model="date" :locale="locales[selected]" label="Date and time" />
</template>

<script setup>
import { ref } from 'vue';
import { de, enUS, sl } from 'date-fns/locale';
import { DfDateTime } from '@dynamicforms/vuetify-inputs';

const locales = [sl, enUS, de];
const selected = ref(0);
const date = ref(new Date().toISOString());
</script>
```

See [df-date-time](/examples/df-datetime) for the display format patterns and the value formats.

## Wiring it to vue-i18n

A single composable can carry both mechanisms and keep them on the application's current locale. Call it once, high in
the component tree.

```typescript
// use-df-locale.ts
import type { Locale } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { DateTimeLocaleConfig, translateStrings } from '@dynamicforms/vuetify-inputs';
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';

const dateFnsLocales: Record<string, Locale> = { en: enUS, de };

export function useDfLocale() {
  const { locale, t, te } = useI18n();

  const apply = (code: string) => {
    translateStrings((key, defaultValue) => (te(`df_inputs.${key}`) ? t(`df_inputs.${key}`) : defaultValue));
    DateTimeLocaleConfig.setDateTimeLocale(dateFnsLocales[code] ?? enUS);
  };

  apply(locale.value);
  watch(locale, apply);
}
```

A locale the switcher offers only needs the keys it actually translates: the callback answers the English default
for a message the locale doesn't carry. The full key list is the table above; a few entries are enough to show the
shape.

The validator entries hold `{name}` placeholders that this library substitutes when it renders the error. vue-i18n's
`t` interpolates `{name}` itself and replaces a placeholder it has no value for with nothing, so a catalogue entry
writes the placeholder in vue-i18n's literal interpolation, `{'{'}minLength{'}'}`, and `t` answers it as
`{minLength}`:

```typescript
const messages = {
  en: {
    df_inputs: {
      Yes: 'Yes', No: 'No', Close: 'Close',
      Paragraph: 'Paragraph',
      Heading1: 'Heading 1', Heading2: 'Heading 2', /* ...Heading3-6 */
      Bold: 'Bold', Italic: 'Italic',
      Link: 'Link', LinkUrl: 'URL', LinkApply: 'Apply', LinkRemove: 'Remove link',
      Downloadable: 'Downloadable',
      // ...the rest of the table above
    },
  },
  de: {
    df_inputs: {
      Yes: 'Ja', No: 'Nein', Close: 'Schließen',
      Paragraph: 'Absatz',
      Heading1: 'Überschrift 1', Heading2: 'Überschrift 2', /* ...Heading3-6 */
      Bold: 'Fett', Italic: 'Kursiv',
      Link: 'Link', LinkUrl: 'URL', LinkApply: 'Übernehmen', LinkRemove: 'Link entfernen',
      Downloadable: 'Herunterladbar',
      required: 'Bitte geben Sie einen Wert ein',
      min_length: "Die Länge muss mindestens {'{'}minLength{'}'} betragen",
      // ...the rest of the table above
    },
  },
};
```

The RTF editor's toolbar re-reads `translatableStrings` on its own, but an action does not re-read the table once
built, so it still needs rebuilding on a locale change. Building the actions inside a `computed` on the locale is
enough:

```vue
<template>
  <df-rtf-editor :control="form.fields.body" label="Body" />
  <df-actions :actions="dialogActions" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Action, DfActions, DfRtfEditor } from '@dynamicforms/vuetify-inputs';

const { locale } = useI18n();

const dialogActions = computed(() => {
  void locale.value; // rebuild the actions after the strings change
  return [
    Action.noAction({ value: { defaultReject: true } }),
    Action.yesAction({ value: { defaultConfirm: true } }),
  ];
});
</script>
```

## What this library does not translate

- **Labels, hints and placeholders.** Every one of them is a prop you pass, so their language is the application's
  concern. `label` accepts a `Label` object and `hint` a string; feed either from your own catalogue.
- **Messages of the application's own error codes.** An error whose code has no entry in `translatableStrings`
  renders its `detail`, which is English as the validator or the server wrote it; translate it with the `errorText`
  setting - see [Validation messages](#validation-messages).
- **Vuetify's own strings**, including the month and weekday names in the date picker. Configure them through
  Vuetify's `locale` option when you create the Vuetify instance.
- **The RTF editor's resize-handle hint** ("Hold Shift to keep the aspect ratio"), which is plain CSS `content`, not
  a string the table can reach.

---

> See also: [df-date-time](/examples/df-datetime), [df-rtf-editor](/examples/df-rtf-editor),
> [df-actions](/examples/df-actions)

<script setup>
import DatetimeMultilingual from '../components/datetime-multilingual.vue';
</script>
