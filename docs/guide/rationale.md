# Rationale

## Why the library exists

A form built from stock Vuetify components drifts. A text field, a select, a checkbox and a date picker each carry
their own idea of height, of label placement and of the margin below the control, and the row they share ends up
ragged. Fixing that per component means a wrapper here, a class there, and a design that has to be maintained in as
many places as there are field types.

This library's premise is that **every field looks and behaves the same regardless of which component it is and
where it appears**. `df-input`, `df-select`, `df-checkbox`, `df-date-time` and the rest sit on one shared base, so
mixing them on a single form row produces an aligned result with no per-component tweaking. The price is that the
library is opinionated: it decides how a field is put together, and a component that wants to look different says so
through the two axes below rather than through markup of its own.

The logic need not be here. [@dynamicforms/vue-forms](:vue-forms:) holds the value, the validation, the enabled and
visibility state and the event pipeline, and a component handed one of its elements draws what that element holds —
which is what this library was built for.

It is not a condition of using it. A component handed a plain `v-model` keeps the value in the parent, and one
handed nothing at all keeps it internally; the errors, the enabled state and the visibility are then props like any
other. Everything on this page other than that binding applies unchanged, so a project that wants aligned fields, a
density that fits a table cell, or one call that restyles the application has a reason to be here whether or not it
ever builds a form model. The package is a peer dependency either way — the components render their messages and
their display modes through it — but nothing asks you to construct a `Field`.

## The two axes

Both are resolved by the same code for every component, so a change to either moves every field at once.

- **Density** — the vertical compactness of a field: `default`, `comfortable`, `compact` or `inline`. The first
  three are Vuetify's. `inline` is this library's own: it strips the outline, the floating label and the padding
  until a field fits inside a table cell.
- **Variant** — the visual style: `outlined`, `plain`, `underlined`, `filled`, `solo`, `solo-inverted` or
  `solo-filled`.

Each is stated in one of four places, and the most specific wins: the prop on the tag, then the field itself, then a
`provide` from any ancestor, then the plugin's defaults. Switching a whole application from `underlined` to
`outlined` is one argument in one call; switching one dialog is one `provide`. See
[configuration](/examples/configuration) for the chain and [density](/examples/density) for what each combination
looks like.

## Everything the library does

### The fields

| Component | What it is |
|---|---|
| [df-input](/examples/df-input) | Single-line input: text, password, email, url, and a number variant with precision, step, min and max |
| [df-text-area](/examples/df-text-area) | Multi-line input with a fixed row count or auto-grow capped at `maxRows` |
| [df-select](/examples/df-select) | Selection from a static `choices` array or an async `fetchChoices` callback; single or multiple, chips with icons, and free values with `allowTags` |
| [df-checkbox](/examples/df-checkbox) | Checkbox, with an optional third indeterminate state under `allowNull` |
| [df-color](/examples/df-color) | Hex colour field with a swatch and a picker |
| [df-date-time](/examples/df-datetime) | Date, time or both, with a configurable display format and a date-fns locale |
| [df-file](/examples/df-file) | File upload driven by a `FileComms` object — upload with progress, delete, and a periodic touch |
| [df-rtf-editor](/examples/df-rtf-editor) | Rich text on a configured CKEditor 5, inside the same field frame as every other input |
| [df-actions](/examples/df-actions) | A row of `Action` objects as buttons or text links |
| [df-input-hint](/examples/df-input-hint) | The message row every field renders: errors when there are any, the hint otherwise |

### What every field shares

- **A control, a v-model, or neither.** Bind a vue-forms element and it owns the value, the validity, the touched
  flag, the enabled state and the visibility; bind `v-model` and the component reports changes to the parent; bind
  neither and it keeps the value itself. [Common props](/examples/input-base)
- **Presentation carried by the field.** `label`, `placeholder`, `helpText`, `hint`, `cssClass`, `density` and
  `variant` are declared on vue-forms' `Extras` augmentation point, so a form declared in code states them where the
  field is declared and the tag that draws it carries no presentation attributes.
  [Presentation on the element](/examples/input-base#presentation-carried-by-the-element)
- **Errors, hints and help text** in one row, rendered through vue-forms' `MessagesWidget`, so an error may be plain
  text, markdown, or a component of its own. [df-input-hint](/examples/df-input-hint)
- **Labels with icons and markdown.** A label is a string, a `Label` carrying an icon, or an `MdString`.
  [Label](/examples/input-base#label)
- **Visibility through `DisplayMode`** — `FULL`, `HIDDEN`, `INVISIBLE` or `SUPPRESS`, taken from the bound element
  or from the `visibility` prop. [Display modes](/examples/input-base#display-modes)
- **Enablement that follows the section.** A field reads `effectiveEnabled`, so the fields of a disabled group are
  drawn disabled without being disabled one by one.
- **`passthroughAttrs`** — a record merged last over the computed Vuetify bindings, so any prop of the underlying
  Vuetify component is reachable without this library declaring it.
  [The escape hatch](/examples/input-base#passthroughattrs)
- **`useInputBase()` and `InputBase`** — the composable and the component the fields are built from, exported so a
  third party can build a field of its own on the same base. [InputBase](/examples/input-base)

### Actions

- **The `Action` class** extends vue-forms' with render options: a name, a display style, whether the label and the
  icon are shown, and `passthroughAttrs`. [df-actions](/examples/df-actions)
- **`defaultConfirm` / `defaultReject`** mark the Enter and Escape actions of a set, and colour their buttons.
- **`closeAction()`, `yesAction()`, `noAction()`** are the three usual ones, ready made and translatable.
- **Per-breakpoint render options.** Any render-options object states overrides from `xs` to `xl`; a breakpoint
  states only what it changes and inherits the rest from the smaller ones, so a label drops to an icon on a phone.
  [Responsive options](/examples/responsive-render-options)

### Configuration and localisation

- **One plugin call.** `app.use(DynamicFormsInputs, options)` provides the settings, optionally registers every
  component globally, optionally registers the Vuetify components the templates use, and installs the CKEditor Vue
  plugin. [Configuration](/examples/configuration)
- **`translateStrings()`** replaces the strings the library produces itself, **`setCkEditorLanguage()`** sets the
  editor's interface language, and **`DateTimeLocaleConfig`** sets the date-fns locale dates are formatted and
  parsed with. [Localisation](/examples/localisation)
- **TypeScript throughout.** Every component's props are an exported interface, values and choices are generic, and
  the type definitions ship with the build.

---

> See also: [Getting Started](/guide/getting-started), [Configuration](/examples/configuration),
> [Density and variant](/examples/density)
