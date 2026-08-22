# Localisation

The library renders a small number of English strings of its own: the labels of the three predefined actions, and
every tooltip, dropdown entry and dialog label the RTF editor's toolbar draws — the toolbar is built from this
library's own Vuetify components, so its entire text lives in the same table as everything else. All of it is
translatable. Dates and times are a separate concern, driven by a date-fns locale rather than by a string table.

The two mechanisms are independent. An application that needs both calls both, and the
[worked example](#wiring-it-to-vue-i18n) below does exactly that.

## The strings the library owns

`translatableStrings` is the table. It is a plain object exported from the package, and it holds the strings that are
in force right now — not the English originals, which are its initial contents and nothing more.

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
| `LinkUrl` | `URL` | `<df-rtf-editor>` link menu, the URL field's label |
| `LinkApply` | `Apply` | `<df-rtf-editor>` link menu, the apply button |
| `LinkRemove` | `Remove link` | `<df-rtf-editor>` link menu, the remove button |
| `Downloadable` | `Downloadable` | `<df-rtf-editor>` link menu, the checkbox that adds `download="file"` |
| `Image` | `Image` | `<df-rtf-editor>` toolbar button tooltip |
| `ImageUrl` | `Image URL` | `<df-rtf-editor>` image menu, the URL field's label |
| `ImageUpload` | `Upload image` | `<df-rtf-editor>` image menu, the upload button |
| `ImageInsert` | `Insert` | `<df-rtf-editor>` image menu, the insert-from-URL button |
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

The style-preset entries name CSS classes that are fixed and not affected by a translation, so the saved HTML is the
same whatever language the toolbar speaks.

## translateStrings

```typescript
translateStrings(translationCallback: (s: string) => string): void
```

`translateStrings` walks every key of `translatableStrings` in declaration order and calls the callback once per key.
The callback receives the **key** — `'Heading1'`, `'CodeDark'` — never the English default and never a namespaced
path. Whatever it returns that is not `null` or `undefined` is written into the table in place of the current value; a
`null` or `undefined` return leaves the current value standing. The function itself returns nothing.

The declared parameter type is `(s: string) => string`, so a TypeScript callback that declines a key has to widen its
return: `return null as unknown as string`.

```typescript
import { translateStrings } from '@dynamicforms/vuetify-inputs';

translateStrings((key: string): string => {
  const translated = myCatalogue[key];
  return translated ?? (null as unknown as string);
});
```

### When it takes effect

`translatableStrings` is read at the moment a string is needed, not at the moment it is rendered, so a call to
`translateStrings` reaches only what is built after it:

- **Actions.** `Action.closeAction()`, `Action.yesAction()` and `Action.noAction()` copy the string into the action's
  `label` when the factory runs. An action that already exists keeps the label it was built with — assign
  `action.label` to change it, or build the action again.
- **The RTF editor.** `<df-rtf-editor>`'s toolbar reads the strings straight off the (non-reactive) `translatableStrings`
  object, so a component that is already mounted shows the values it read at its last render, not necessarily the
  latest ones — remount it to guarantee the new strings appear, for instance by binding `:key` to the current locale
  code.

Call `translateStrings` before the application mounts, and again on every locale change if the locale can change at
runtime.

::: warning Translations accumulate
The table is overwritten in place, so the English defaults are gone after the first call that replaces them. On a
second call, a key the callback declines keeps the *previous translation* — it does not fall back to English. A locale
switcher therefore needs a complete catalogue for every locale it offers, English included; declining a key is a
safety net against a missing message, not a way to select English.
:::

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
  const { locale, t } = useI18n();

  const apply = (code: string) => {
    // t() answers the path itself when a message is missing; null then keeps what the table already holds
    translateStrings((key: string): string => {
      const path = `df_inputs.${key}`;
      const translated = t(path);
      return translated === path ? (null as unknown as string) : translated;
    });
    DateTimeLocaleConfig.setDateTimeLocale(dateFnsLocales[code] ?? enUS);
  };

  apply(locale.value);
  watch(locale, apply);
}
```

The message catalogue needs every key of `translatableStrings` under `df_inputs`, in every locale the switcher offers
— the English catalogue included, because a declined key keeps the previous translation rather than the English
default. The full key list is the table above; a few entries are enough to show the shape:

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
      // ...the rest of the table above
    },
  },
};
```

Because neither the actions nor a mounted editor re-read the table, the components that show these strings are rebuilt
on a locale change. Building the actions inside a `computed` on the locale, and keying the editor by it, is enough:

```vue
<template>
  <df-rtf-editor :key="locale" :control="form.fields.body" label="Body" />
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
- **Validation messages.** They come from the validators, which take the message as a constructor argument. Passing a
  `computed` keeps the message reactive, so a locale switch reaches the rendered error — see
  [validator messages](:vue-forms:/api/validators.html) in vue-forms.
- **Vuetify's own strings**, including the month and weekday names in the date picker. Configure them through
  Vuetify's `locale` option when you create the Vuetify instance.

---

> See also: [df-date-time](/examples/df-datetime), [df-rtf-editor](/examples/df-rtf-editor),
> [df-actions](/examples/df-actions)

<script setup>
import DatetimeMultilingual from '../components/datetime-multilingual.vue';
</script>
