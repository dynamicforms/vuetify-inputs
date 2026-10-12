# Rationale

## Why the library exists

Stock Vuetify components differ in height, label placement and the margin below the control. A row that mixes a text
field, a select, a checkbox and a date picker is not aligned without per-component wrappers and classes.

In this library **every field has the same layout regardless of its component and where it appears**. `df-input`,
`df-select`, `df-checkbox`, `df-date-time` and the rest share one base, so fields mixed on one row are aligned without
per-component adjustments. A component's appearance is set through the two axes below, not through its own markup.

[@dynamicforms/vue-forms](:vue-forms:) holds the value, the validation, the enabled and visibility state and the event
pipeline. A component bound to one of its elements renders what that element holds.

Binding an element is optional. A component with a `v-model` keeps the value in the parent, and one with neither keeps
it internally; the errors, the enabled state and the visibility are then props. Everything else on this page applies
in all three cases: aligned fields, a density for table cells and application-wide styling do not require a form
model. `@dynamicforms/vue-forms` is a peer dependency in every case, because the components import from it, but no
`Field` has to be constructed.

## The two axes

Both are resolved by the same code for every component; a change to either applies to every field.

- **Density**: the vertical compactness of a field: `default`, `comfortable`, `compact` or `inline`. The first
  three are Vuetify's. `inline` is this library's own: it removes the outline, the floating label and the padding,
  so that a field fits inside a table cell.
- **Variant**: the visual style: `outlined`, `plain`, `underlined`, `filled`, `solo`, `solo-inverted` or
  `solo-filled`.

Each is set in one of four places; the most specific applies: the prop on the tag, then the field itself, then a
`provide` from any ancestor, then the plugin's defaults. The whole application is switched from `underlined` to
`outlined` by one plugin option; one dialog by one `provide`. See
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
| [df-rtf-editor](/examples/df-rtf-editor) | Rich text on TipTap, with a Vuetify toolbar, inside the same field frame as every other input |
| [df-actions](/examples/df-actions) | A row of `Action` objects as buttons or text links |
| [df-input-hint](/examples/df-input-hint) | The message row every field renders: errors when there are any, the hint otherwise |

### What every field shares

- **A control, a v-model, or neither.** Bind a vue-forms element and it owns the value, the validity, the touched
  flag, the enabled state and the visibility; with `v-model` the component emits changes to the parent; with neither
  it keeps the value itself. [Common props](/examples/input-base)
- **Presentation carried by the field.** `label`, `placeholder`, `helpText`, `hint`, `cssClass`, `density` and
  `variant` are declared on vue-forms' `Extras` augmentation point, so a form declared in code states them where the
  field is declared, and the tag that renders it needs no presentation attributes.
  [Presentation on the element](/examples/input-base#presentation-carried-by-the-element)
- **Errors, hints and help text** in one row, rendered through this library's `MessagesWidget`. An error renders as
  the plain text, markdown or component the application's `errorText` setting returns for its `code` and `params`,
  and as its `detail` otherwise. [df-input-hint](/examples/df-input-hint)
- **Labels with icons and markdown.** A label is a string, a `Label` carrying an icon, or an `MdString`.
  [Label](/examples/input-base#label)
- **Visibility**: `'full'`, `'invisible'`, `'hidden'` or `'suppress'`, taken from the bound element
  or from the `visibility` prop. [Display modes](/examples/input-base#display-modes)
- **Enablement from the container.** A field reads `effectiveEnabled`, so the fields of a disabled group render
  disabled. An action button reads `effectiveEnabled` and `busy`.
- **`passthroughAttrs`**: a record merged last over the computed Vuetify bindings, so any prop of the underlying
  Vuetify component is reachable without this library declaring it.
  [The escape hatch](/examples/input-base#passthroughattrs)
- **`useInputBase()` and `InputBase`**: the composable and the component the fields are built from, exported so a
  third party can build a field of its own on the same base. [InputBase](/examples/input-base)

### Actions

- **The `Action` class** extends vue-forms' with render options: a name, a display style, whether the label and the
  icon are shown, and `passthroughAttrs`. [df-actions](/examples/df-actions)
- **A plain vue-forms `Action` is rendered too.** `<df-actions>` reads what it renders from the action's value. The
  subclass is needed for responsive render options, the text-link style and the confirm / reject colours.
- **`defaultConfirm` / `defaultReject`** mark the Enter and Escape actions of a set, and colour their buttons.
- **`closeAction()`, `yesAction()`, `noAction()`** are the three usual ones, ready made and translatable.
- **Per-breakpoint render options.** Any render-options object states overrides from `xs` to `xl`; a breakpoint
  states only what it changes and inherits the rest from the smaller ones, e.g. an icon without a label on `xs`.
  [Responsive options](/examples/responsive-render-options)

### Configuration and localisation

- **One plugin call.** `app.use(DynamicFormsInputs, options)` provides the settings, optionally registers every
  component globally, and optionally registers the Vuetify components the templates use.
  [Configuration](/examples/configuration)
- **`translateStrings()`** connects the strings the library produces itself to the application's translation
  function, the **`errorText`** setting converts errors into what the user sees, and **`DateTimeLocaleConfig`** sets
  the date-fns locale dates are formatted and parsed with. [Localisation](/examples/localisation)
- **TypeScript throughout.** Every component's props are an exported interface, values and choices are generic, and
  the type definitions ship with the build.

---

> See also: [Getting Started](/guide/getting-started), [Configuration](/examples/configuration),
> [Density and variant](/examples/density)
