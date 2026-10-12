# Server-side rendering

The components render on the server (Nuxt, Vite SSR, VitePress) and hydrate in the browser. The server renders each
field with its label and the value it holds; the parts that open a menu render in the browser.

## Setup

Vuetify is created with `ssr: true`, on the server and in the browser:

```typescript
const vuetify = createVuetify({ ssr: true, components, directives });
```

With `ssr: true`, a component's first render in the browser matches the server's, and the browser-only parts render
after the component is mounted. Without it, the browser renders them at once, and hydration reports mismatches.

The package is bundled for the server, not loaded by Node: Vuetify's components import CSS, which Node does not load.

```typescript
// vite.config.ts
export default defineConfig({
  ssr: { noExternal: ['vuetify', '@dynamicforms/vuetify-inputs'] },
});
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  build: { transpile: ['vuetify', '@dynamicforms/vuetify-inputs'] },
});
```

## What the server renders

| Component | On the server and until it is mounted | After it is mounted |
|---|---|---|
| `df-select` | A read-only text field with the label and the text of the chosen choices that are known without a fetch | The autocomplete |
| `df-date-time` | The text fields with the formatted value | The text fields and their pickers |
| `df-color` | The text field with the value and the swatch | The text field and its picker |
| `df-rtf-editor` | The value's text, without the toolbar | The toolbar and the editor |
| other components | The component | The component |

Vuetify's menus and autocompletes are not rendered on the server: each one rendered there stays in memory after the
request.

`df-select` calls `fetchChoices` only in the browser, so a value whose choices come from a fetch shows no text on the
server. A `fetchChoices` that rejects is logged with `console.error`.

`df-date-time` formats a value with an offset in the time zone of the process that renders it. Where the server's
time zone differs from the browser's, the server renders the date and time of its own zone, and hydration reports a
mismatch; the browser then renders its own.

Icons render in the browser: `vue-cached-icon` renders an empty element on the server.

## Settings per request

`app.use(DynamicFormsInputs, settings)` provides the settings to one app. Where an app is created per request, the
settings are per request:

```typescript
app.use(DynamicFormsInputs, {
  translate: i18n.global.t,
  translateNamespace: 'df_inputs',
  dateTimeLocale: computed(() => dateFnsLocales[i18n.global.locale.value]),
});
```

`translateStrings` and `DateTimeLocaleConfig` are one for the process. On a server rendering several requests, a
value set there for one request is read by the others; per-request values go in the settings.
