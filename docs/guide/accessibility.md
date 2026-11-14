# Accessibility

What the components give assistive technology, and what the application sets up itself.

## Names and descriptions

- Every input's field label names the control the user operates, and the message row (hint and shown errors)
  describes it through `aria-describedby`.
- `df-date-time`: the date and the time input are named by the field label followed by `Date` or `Time`.
- `df-file`: the name of the stored file is part of the file input's description.
- `df-rtf-editor`: the editable element carries the field label, the message row and `aria-multiline`; a click on the
  field label focuses it.
- `df-actions`: a button that does not show its label (`showLabel: false`, also per breakpoint) has the label's plain
  text as its `aria-label` and `title`. Give every icon-only action a `label` with `showLabel: false` instead of
  leaving the label out. [df-actions](/examples/df-actions)
- `df-select`: the choice text names the option and the chip; choice icons are hidden from assistive technology.
- Progress bars are named `Loading` (`df-select`) and `Uploading` (`df-file`, `df-image`).

The strings the components add (`Date`, `Time`, `RemoveChoice`, `Loading`, `Uploading`) are translation keys; see
[Localisation](/examples/localisation).

## States

- An input carries `aria-invalid="true"` while errors are shown.
- While errors are shown, the hint stays in the message row, visually hidden, so it is read with the errors.
- `df-rtf-editor` carries `aria-readonly="true"` while the field accepts no input.
- A required field has no marker and no `aria-required`: a vue-forms field does not state that it is required. State
  it in the field's `hint`, together with the other constraints on its value (minimum, pattern …); no ARIA attribute
  announces those.
- The browser's own `required` validation is not used; validation is vue-forms'.

## Keyboard and focus

- `df-select`: a chip's close button is a native button named `Remove <choice>`. A click, Enter or Space removes the
  chip (a held Space removes one), Enter does not open the menu, and focus moves to the next chip's close button, or to
  the input when no closable chip remains.
- `df-actions` with `simple`: each action is a native `<button type="button">`, so Tab reaches it, Enter and Space
  activate it, and it has the native button role. Its name is its label, or the label's plain text in `aria-label`
  where the label is not shown. It has a visible `:focus-visible` outline, is disabled while the action is not
  executable and carries `aria-busy="true"` while a run is in flight. [df-actions](/examples/df-actions#simple-mode)

## Contrast

The contrast of labels, hints and messages comes from the Vuetify theme. `VLabel`, `VField` and `VMessages` set
`opacity: var(--v-medium-emphasis-opacity)`, which Vuetify 3.13 sets to 0.60 in the light theme and 0.70 in the dark
theme. At 0.60, label and hint text on white has a contrast of 4.29:1, below the 4.5:1 of WCAG 1.4.3; 0.62 reaches
4.5:1. The variable applies to every Vuetify component of the application, so the library leaves it alone; the
application sets it in its theme:

```ts
createVuetify({
  theme: { themes: { light: { variables: { 'medium-emphasis-opacity': 0.62 } } } },
});
```

## Own components

A component built on `InputBase` binds the default slot's `props` (`InputBaseControlProps`) on the element the user
operates, which gives it the label, the description and the state. [InputBase: Accessibility](/examples/input-base#accessibility)

## Automated check

The e2e suite runs axe on every docs example page, also with menus open and errors shown. Violations that are known
and not yet fixed are listed in `e2e/a11y-baseline.json`; a violation not in the list, or a listed one that no longer
occurs, fails the suite.
