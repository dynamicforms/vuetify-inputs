# Localisation

The library renders three kinds of text that depend on the language:

- **Its own strings**: the buttons of the pickers, every tooltip, dropdown entry and dialog label of the RTF editor's
  toolbar, and the upload and download prompts on `<df-image>` and `<df-file>`. They are
  translated through [`translateStrings`](#translatestrings).
- **Errors**: every error carries a `code`, `params` and an English `detail`, and the application converts it into
  what the user sees through the `errorText` setting. See [Translating errors](#translating-errors).
- **Dates and times**: set by a date-fns locale, not by a string table. See
  [Dates and times](#dates-and-times).

The three mechanisms are independent. The [worked example](#wiring-it-to-vue-i18n) below connects all of them to
vue-i18n.

## The strings the library owns

Each string has a key and an English default. The library reads a string with `translate(key)` where it renders it,
so a template, a `computed` or a `watchEffect` that reads it follows the reactive state the application's
translation function reads, such as the locale.

| Key | English default | Where it is rendered |
|-----|-----------------|-------------------|
| `Cancel` | `Cancel` | The Cancel button of `<df-date-time>`'s and `<df-color>`'s pickers |
| `Ok` | `OK` | The OK button of `<df-date-time>`'s and `<df-color>`'s pickers |
| `ColorPalette` | `Color palette` | `<df-color picker="hexagon">`, the accessible label of the palette |
| `Lightness` | `Lightness {level}` | `<df-color picker="hexagon">`, the accessible label of a lightness level button; `level` counts from 1 |
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

The style-preset entries name CSS classes that are fixed and not affected by a translation, so the saved HTML is the
same in every language of the toolbar.

## translateStrings

```typescript
translateStrings(t: TranslateFunction, namespace?: string): void
// TranslateFunction = (key: string, named: Record<string, unknown>) => string
```

`translateStrings` sets the application's translation function, shaped like vue-i18n's and i18next's `t`, as the
source of the library's strings. Each key is looked up as `${namespace}.${key}`, or as `key` without a namespace. A
key `t` returns unchanged has no translation and renders as its English default.

```typescript
import { translateStrings } from '@dynamicforms/vuetify-inputs';

translateStrings(i18n.global.t, 'df_inputs');
```

The library calls `t` every time it reads a string, so with vue-i18n the strings follow a locale switch without
another call. A translation function over non-reactive translations is set again with `translateStrings` after the
translations change. The resolution order and the formatting of values are described in the
[`@dynamicforms/translatable` readme](https://github.com/dynamicforms/translatable#readme).

`translateStrings` sets the function for the whole process. The `translate` and `translateNamespace` settings set it
for one app, and take precedence where they are given: a string read while a component sets up or renders is
translated with the settings that component reads. Under server-side rendering, where an app is created per
request, the settings give each request its own translation; see [Server-side rendering](/guide/ssr). The function
a setting gives is fixed for the app; it follows a locale switch through the reactive state it reads, as vue-i18n's
`t` does.

```typescript
app.use(DynamicFormsInputs, { translate: i18n.global.t, translateNamespace: 'df_inputs' });
```

`translate(key, params?)` reads the settings of the component that is setting up or rendering. An event handler or
a timer runs outside both and reads `useTranslate()`, called in the component's setup, which returns `translate`
bound to that component's settings.

### When it takes effect

- **Actions.** The library labels no action. An action whose `label` is a function, `label: () => t('Save')`, reads
  it while it renders, so an action that already exists follows a locale switch.
- **The RTF editor.** `<df-rtf-editor>`'s toolbar, the heading dropdown included, reads its strings while it renders,
  so a toolbar that is already mounted follows a locale switch.
- **`<df-image>` and `<df-file>`.** Their prompts are read while they render, like the toolbar's.

## Translating errors

The [validation and i18n demo](/examples/validators#demo) renders the errors of a form in eight languages, as plain
text or as markdown, through the `errorText` setting shown there.

An error is data: a `code`, `params` and an English `detail`. The application converts it into what the user sees,
as described in vue-forms' [Error messages and translation](:vue-forms:/api/validators.html#error-messages-and-translation),
which also lists every code vue-forms raises with its params.

The inputs of `@dynamicforms/vuetify-inputs` render an error with a code as the content the `errorText` setting
returns for it, and as its `detail` where the setting is not given or returns `undefined`. An error without a code,
and a string, render as written: they are text in the user's language, and `errorText` is not called for them.
`errorText` is given once, when the plugin is installed, and converts every error the application shows: those of
vue-forms' validators, of the application's own validators, of its server and of vuetify-inputs itself ([error
codes](#error-codes)).

`errorText` returns plain text, an `MdString`, which renders as markdown, an `HtmlString`, which renders as HTML, or a
`SimpleComponentDef`. An error's code is `<namespace>.<code>` ([error codes](#error-codes)). The application maps
each namespace to a translation key prefix of its own, taking a library's namespace from its `ERROR_NAMESPACE`
constant: here `vue-forms.required` renders through the key `libs.vue-forms.required`,
`vuetify-inputs.invalid_hex_color` through `libs.vuetify-inputs.invalid_hex_color` and the application's
`app.over_budget` through `errors.over_budget`. A catalogue that holds a markdown variant of a message under the
key with `Md` appended lets the application render its errors as markdown without changing a validator:

```typescript
import { formatParams } from '@dynamicforms/translatable';
import { ERROR_NAMESPACE as VUE_FORMS_ERRORS } from '@dynamicforms/vue-forms';
import {
  DynamicFormsInputs,
  ERROR_NAMESPACE as VUETIFY_INPUTS_ERRORS,
  type ErrorText,
  MdString,
} from '@dynamicforms/vuetify-inputs';

const { t, n, d, te } = i18n.global;
// formats numbers and dates for the locale before t substitutes them
const tf = formatParams(t, (value) =>
  typeof value === 'number' ? n(value) : value instanceof Date ? d(value) : value);
const markdown = true;

// the translation key prefix of each error namespace
const keyPrefixes: Record<string, string> = {
  [VUE_FORMS_ERRORS]: 'libs.vue-forms',
  [VUETIFY_INPUTS_ERRORS]: 'libs.vuetify-inputs',
  app: 'errors',
};

const errorText: ErrorText = (error) => {
  const dot = error.code.lastIndexOf('.');
  const prefix = keyPrefixes[error.code.slice(0, dot)];
  if (prefix === undefined) return undefined;
  const key = `${prefix}.${error.code.slice(dot + 1)}`;
  if (markdown && te(`${key}Md`)) return new MdString(tf(`${key}Md`, error.params));
  return te(key) ? tf(key, error.params) : undefined;
};

app.use(DynamicFormsInputs, { errorText });
```

```json
{
  "libs": {
    "vue-forms": {
      "required": "Prosimo, vnesite vrednost",
      "min_value": "Vrednost mora biti vsaj {minValue}",
      "min_valueMd": "Vrednost mora biti vsaj **{minValue}**"
    },
    "vuetify-inputs": { "invalid_hex_color": "Ni veljaven šestnajstiški niz." }
  },
  "errors": { "over_budget": "Izlet stane {total} €, kar je {over} € nad proračunom." }
}
```

- `errorText` runs while the errors are rendered, so the errors on screen follow a locale switch without
  revalidating.
- A code without a message renders as its `detail`; a code without an `Md` variant renders as plain text.
- A message uses the placeholder names of its code's params.

## Error codes

An error code is a full code, `<namespace>.<code>`:

- `code` is snake_case and contains no `.`: `[a-z0-9]+(_[a-z0-9]+)*`;
- `namespace` is one or more segments joined by `.`, each `[a-z0-9]+(-[a-z0-9]+)*`;
- a full code splits at its last `.`: everything before it is the namespace, everything after it the code.

The codes this library raises are in the namespace `vuetify-inputs`, exported as `ERROR_NAMESPACE`. vue-forms'
codes are in the namespace `vue-forms`, exported by vue-forms as its own `ERROR_NAMESPACE`. A code the application
gives an error is used as given: the library does not prefix, check or rewrite it. The application prefixes its own
codes with a namespace of its own, such as `app.over_budget`. The library ships no translation keys for error
codes; the application chooses them, as in [Translating errors](#translating-errors).

```typescript
import { ERROR_NAMESPACE } from '@dynamicforms/vuetify-inputs';

const unreadDate = control.errors.some((error) => error.code === `${ERROR_NAMESPACE}.invalid_date`);
```

The errors this library raises itself:

| Code | Params | English `detail` | Raised by |
|------|--------|------------------|-----------|
| `vuetify-inputs.invalid_hex_color` | none | `Not a valid hex string.` | `<df-color>` without a `control` and with `alpha` (the default), for a value that is not 3, 4, 6 or 8 hex digits with an optional leading `#`, or an empty value without `allowNull` |
| `vuetify-inputs.invalid_opaque_hex_color` | none | `Not a valid hex string without alpha.` | `<df-color>` without a `control` and with `alpha: false`, for a value that is not 3 or 6 hex digits with an optional leading `#`, or an empty value without `allowNull` |
| `vuetify-inputs.invalid_date` | none | `Not a valid date.` | `<df-date-time>`, for typed text it cannot read as a date; its origin is `'application'` |
| `vuetify-inputs.invalid_time` | none | `Not a valid time.` | `<df-date-time>`, for typed text it cannot read as a time; its origin is `'application'` |
| `vuetify-inputs.file_gone` | none | the server's `errorText` | `<df-file>` and `<df-image>`, when the server reports the uploaded file as gone; its origin is `'server'` |

A string in a component's `errors` prop becomes an error with an empty code and renders as written.

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
writes into the existing ref, so components that already read it update; given a ref it uses that ref as the source,
and the components follow every later change to it.

```typescript
import { DateTimeLocaleConfig } from '@dynamicforms/vuetify-inputs';
import { enUS } from 'date-fns/locale';

DateTimeLocaleConfig.setDateTimeLocale(enUS);
```

The locale sets three things in `<df-date-time>`:

- **Formatting.** The text fields are rendered with date-fns `format()` using `displayFormatDate` (default `'P'`) and
  `displayFormatTime` (default `'p'`), both of which resolve against the locale.
- **Parsing.** Typed text in the display format is read back with date-fns `parse()` against the same patterns and the
  same locale; a [short form](/examples/df-datetime#typing-a-value) of a date is read in the order of day, month and
  year the locale writes.
- **First day of week.** The date picker takes `locale.options.weekStartsOn`, falling back to `1` (Monday) for a
  locale that does not state one.

It does not set the following: the time picker is always in 24-hour mode, and the month and weekday names inside the
picker come from Vuetify's own locale configuration.

### Per-component override

Every `<df-date-time>` accepts a `locale` prop of the same date-fns `Locale` type. When it is set the component uses
it; when it is not, the `dateTimeLocale` setting of the app applies, and without that `DateTimeLocaleConfig`. One form
can thereby show one field in the application's locale and another in a fixed one.

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

The library's strings and the errors follow vue-i18n's locale without further code, because the library calls `t` on
every read. The date-fns locale is set on every locale change, by a composable called once near the root of the
component tree:

```typescript
// use-df-locale.ts
import type { Locale } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { DateTimeLocaleConfig } from '@dynamicforms/vuetify-inputs';
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';

const dateFnsLocales: Record<string, Locale> = { en: enUS, de };

export function useDfLocale() {
  const { locale } = useI18n();
  watch(locale, (code) => DateTimeLocaleConfig.setDateTimeLocale(dateFnsLocales[code] ?? enUS), { immediate: true });
}
```

The `dateTimeLocale` setting gives the date-fns locale per app, in place of `DateTimeLocaleConfig`, which is one for
the process: `app.use(DynamicFormsInputs, { dateTimeLocale })`, with `dateTimeLocale` a computed over the locale.
Under server-side rendering, where an app is created per request, it is the setting that gives each request its own
locale.

The strings and the errors are connected once, when the application is set up:

```typescript
import { formatParams } from '@dynamicforms/translatable';
import { DynamicFormsInputs, translateStrings } from '@dynamicforms/vuetify-inputs';

const { t, n, d } = i18n.global;
const tf = formatParams(t, (value) =>
  typeof value === 'number' ? n(value) : value instanceof Date ? d(value) : value);

translateStrings(tf, 'df_inputs');
app.use(DynamicFormsInputs, { errorText }); // errorText as in Translating errors above
```

A locale only needs the keys it translates; any other key renders as its English default. The full key list is the
table above:

```typescript
const messages = {
  de: {
    df_inputs: {
      Cancel: 'Abbrechen', Ok: 'OK',
      Paragraph: 'Absatz',
      Heading1: 'Überschrift 1', Heading2: 'Überschrift 2', /* ...Heading3-6 */
      Bold: 'Fett', Italic: 'Kursiv',
      Link: 'Link', LinkUrl: 'URL', LinkApply: 'Übernehmen', LinkRemove: 'Link entfernen',
      Downloadable: 'Herunterladbar',
      // ...the rest of the table above
    },
    libs: {
      'vue-forms': {
        required: 'Bitte geben Sie einen Wert ein',
        min_length: 'Die Länge muss mindestens {minLength} betragen',
        min_lengthMd: 'Die Länge muss mindestens **{minLength}** betragen',
      },
      'vuetify-inputs': { invalid_hex_color: 'Keine gültige Hex-Farbe.' },
    },
  },
};
```

The actions follow the locale without being rebuilt:

```vue
<template>
  <df-rtf-editor :control="form.fields.body" label="Body" />
  <df-actions :actions="dialogActions" />
</template>

<script setup lang="ts">
import { Action, DfActions, DfRtfEditor } from '@dynamicforms/vuetify-inputs';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const dialogActions = [
  new Action({ value: { name: 'no', label: () => t('common.no'), defaultReject: true } }),
  new Action({ value: { name: 'yes', label: () => t('common.yes'), defaultConfirm: true } }),
];
</script>
```

## What this library does not translate

- **Labels, hints and placeholders.** They are props or extended properties the application sets, translated by the
  application. `label` accepts a `Label` object and `hint` a string.
- **Vuetify's own strings**, including the month and weekday names in the date picker. They are configured through
  Vuetify's `locale` option when the Vuetify instance is created.
- **The RTF editor's resize-handle hint** ("Hold Shift to keep the aspect ratio"), which is plain CSS `content`, not
  a string `translateStrings` can reach.

---

> See also: [df-date-time](/examples/df-datetime), [df-rtf-editor](/examples/df-rtf-editor),
> [df-actions](/examples/df-actions)

<script setup>
import DatetimeMultilingual from '../components/datetime-multilingual.vue';
</script>
