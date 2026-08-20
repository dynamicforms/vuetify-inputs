# Localisation

The library renders a small number of English strings of its own: the labels of the three predefined actions, the
entries of the two dropdowns the RTF editor adds to CKEditor's toolbar, and the label of the link decorator that
marks a link as downloadable. All of them are translatable. Dates and times are a separate concern, driven by a
date-fns locale rather than by a string table, and CKEditor's own interface is a third, translated by CKEditor's
translation bundles.

The three mechanisms are independent. An application that needs all of it calls all three, and the
[worked example](#wiring-it-to-vue-i18n) below does exactly that.

## The strings the library owns

`translatableStrings` is the table. It is a plain object exported from the package, and it holds the strings that are
in force right now — not the English originals, which are its initial contents and nothing more.

| Key | English default | Where it surfaces |
|-----|-----------------|-------------------|
| `Yes` | `Yes` | Label of the action returned by `Action.yesAction()` |
| `No` | `No` | Label of the action returned by `Action.noAction()` |
| `Close` | `Close` | Label of the action returned by `Action.closeAction()` |
| `Paragraph` | `Paragraph` | `<df-rtf-editor>` heading dropdown, `paragraph` entry |
| `Heading1` | `Heading 1` | `<df-rtf-editor>` heading dropdown, `heading1` entry |
| `Heading2` | `Heading 2` | `<df-rtf-editor>` heading dropdown, `heading2` entry |
| `Heading3` | `Heading 3` | `<df-rtf-editor>` heading dropdown, `heading3` entry |
| `Heading4` | `Heading 4` | `<df-rtf-editor>` heading dropdown, `heading4` entry |
| `Heading5` | `Heading 5` | `<df-rtf-editor>` heading dropdown, `heading5` entry |
| `Heading6` | `Heading 6` | `<df-rtf-editor>` heading dropdown, `heading6` entry |
| `Downloadable` | `Downloadable` | `<df-rtf-editor>` link balloon, the manual decorator that adds `download="file"` |
| `ArticleCategory` | `Article category` | `<df-rtf-editor>` style dropdown, `h3.category` |
| `Title` | `Title` | `<df-rtf-editor>` style dropdown, `h2.document-title` |
| `Subtitle` | `Subtitle` | `<df-rtf-editor>` style dropdown, `h3.document-subtitle` |
| `InfoBox` | `Info box` | `<df-rtf-editor>` style dropdown, `p.info-box` |
| `SideQuote` | `Side quote` | `<df-rtf-editor>` style dropdown, `blockquote.side-quote` |
| `Marker` | `Marker` | `<df-rtf-editor>` style dropdown, `span.marker` |
| `Spoiler` | `Spoiler` | `<df-rtf-editor>` style dropdown, `span.spoiler` |
| `CodeDark` | `Code (dark)` | `<df-rtf-editor>` style dropdown, `pre.fancy-code.fancy-code-dark` |
| `CodeBright` | `Code (bright)` | `<df-rtf-editor>` style dropdown, `pre.fancy-code.fancy-code-bright` |

The style entries name what the dropdown shows; the CSS classes each one applies are fixed and are not affected by a
translation, so the HTML the editor produces is the same whatever language the toolbar speaks.

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
- **The RTF editor.** `<df-rtf-editor>` assembles its CKEditor configuration when the editor component is set up. An
  editor that is already mounted keeps its dropdown entries and its link decorator label; remount it to pick up new
  ones, for instance by binding `:key` to the current locale code.

Call `translateStrings` before the application mounts, and again on every locale change if the locale can change at
runtime.

::: warning Translations accumulate
The table is overwritten in place, so the English defaults are gone after the first call that replaces them. On a
second call, a key the callback declines keeps the *previous translation* — it does not fall back to English. A locale
switcher therefore needs a complete catalogue for every locale it offers, English included; declining a key is a
safety net against a missing message, not a way to select English.
:::

## CKEditor's interface language

The strings above are the ones this library adds to the editor. Everything else in CKEditor's user interface — button
tooltips, dialog captions, the accessibility help — is translated by CKEditor's own bundles.

```typescript
setCkEditorLanguage(language: string, translations: any): void
```

It writes both members of the exported `ckEditorLanguage` object, which starts out as `{ language: 'en', translations:
undefined }`. `<df-rtf-editor>` passes `language` to the editor's `config.language` and `translations` to
`config.translations`.

Translation bundles are shipped by the `ckeditor5` package, one module per language, each with the bundle as its
default export:

```typescript
import { setCkEditorLanguage } from '@dynamicforms/vuetify-inputs';
import deTranslations from 'ckeditor5/translations/de.js';

setCkEditorLanguage('de', deTranslations);
```

English needs no bundle: pass `undefined` as the second argument and CKEditor uses its built-in English.

The same timing rule applies as for `translateStrings` — the configuration is read when an editor is set up, so call
`setCkEditorLanguage` before the first `<df-rtf-editor>` mounts, and remount the editor if the language changes while
it is on screen.

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

A single composable can carry all three mechanisms and keep them on the application's current locale. Call it once,
high in the component tree.

```typescript
// use-df-locale.ts
import type { Locale } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import {
  DateTimeLocaleConfig,
  setCkEditorLanguage,
  translateStrings,
} from '@dynamicforms/vuetify-inputs';
import deTranslations from 'ckeditor5/translations/de.js';
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';

const dateFnsLocales: Record<string, Locale> = { en: enUS, de };
const ckEditorTranslations: Record<string, any> = { en: undefined, de: deTranslations };

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
    setCkEditorLanguage(code, ckEditorTranslations[code]);
  };

  apply(locale.value);
  watch(locale, apply);
}
```

The message catalogue carries every key of `translatableStrings` under `df_inputs`, in every locale the switcher
offers — the English catalogue included, because a declined key keeps the previous translation rather than the English
default:

```typescript
const messages = {
  en: {
    df_inputs: {
      Yes: 'Yes', No: 'No', Close: 'Close',
      Paragraph: 'Paragraph',
      Heading1: 'Heading 1', Heading2: 'Heading 2', Heading3: 'Heading 3',
      Heading4: 'Heading 4', Heading5: 'Heading 5', Heading6: 'Heading 6',
      Downloadable: 'Downloadable',
      ArticleCategory: 'Article category', Title: 'Title', Subtitle: 'Subtitle',
      InfoBox: 'Info box', SideQuote: 'Side quote',
      Marker: 'Marker', Spoiler: 'Spoiler',
      CodeDark: 'Code (dark)', CodeBright: 'Code (bright)',
    },
  },
  de: {
    df_inputs: {
      Yes: 'Ja', No: 'Nein', Close: 'Schließen',
      Paragraph: 'Absatz',
      Heading1: 'Überschrift 1', Heading2: 'Überschrift 2', Heading3: 'Überschrift 3',
      Heading4: 'Überschrift 4', Heading5: 'Überschrift 5', Heading6: 'Überschrift 6',
      Downloadable: 'Herunterladbar',
      ArticleCategory: 'Artikelkategorie', Title: 'Titel', Subtitle: 'Untertitel',
      InfoBox: 'Infobox', SideQuote: 'Randzitat',
      Marker: 'Markierung', Spoiler: 'Spoiler',
      CodeDark: 'Code (dunkel)', CodeBright: 'Code (hell)',
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
