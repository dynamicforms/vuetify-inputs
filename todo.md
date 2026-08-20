# Todo

## Features

- support serialization format for datetime component
- df-list (basically a table-editing field) - requires the new table component.
  vue-forms 0.16 supplies the row bookkeeping this was blocked on: `List.items` is a frozen array of the live `Group`
  rows rebuilt once per change of the set, so a keyed `v-for` over it replaces walking `list.value`; `List.length` is
  the count; `remove()` and `pop()` hand back the row instance itself, released of the list, which is an undo
  affordance; `row.rebind(record)` puts the same instance over the next record, which is what recycles a row in a
  virtualised table; and a `CompareTo` or a conditional action registered on the item template now answers per row.
- df-select should be able to render as checkbox group or radio group based on a threshold value provided.
  this should provide an alternate representation of (multi) selections. The threshold would be null (disabled) by
  default. when provided, number of choices ABOVE the provided parameter would result in df-select rendering as select,
  otherwise the component would render as the new radio / check group.

  Likely an additional parameter would be needed specifying the layout (wrapping horizontal, vertical)
- time component manual entry the smart way: 153 meand 1:53, 123 means 12:30(and waiting for possible minute entry)
- date component manual entry the smart way: 0105 meand 1.5.(current year), etc
- df-actions
  - vertical layout
  - icon position
  - icon size

## Adopt what vue-forms 0.16 newly offers

- `<df-actions>` does not read `Action.busy`, so a button stays clickable through an in-flight run and a second
  click starts a second one. `:disabled="!action.action.enabled || action.action.busy"`, and `:loading` for the
  visual.
- No input shows anything while an asynchronous validator is in flight. `control.validating` answers for the whole
  subtree since 0.13 and `control.busy` for executions at or below the element; a `loading` binding in
  `vuetifyBindings` would cover every component at once.
- Extended properties (`element.extra`, `setExtendedValues()`) are what vue-forms intends a UI layer to read its
  presentation hints from — label, hint, css class. The components demand all of these as template attributes, so
  a form declared entirely in code still has to restate them at every call site.
- `InAllowedValues` reads its list at each validation and accepts a `Ref` or a getter, so a validator can measure
  against the choices df-select loaded over ajax. The loaded list is component-private; exposing it would connect
  the two.
- Mirror `getConfig()` / `setConfig()` for `VuetifyInputsSettings`, so the density and variant defaults can be read
  and written where there is no app to install a plugin on.
- `ValidationError.code` is a stable identifier per failure. Rendering it as a `data-error-code` in `df-input-hint`
  would give per-code styling and test hooks.

## Reactive layer

- `vuetifyBindings` is one computed folding fourteen bindings together, so a touch or an error change rebuilds and
  re-diffs all of them. The volatile keys belong on their own bindings.
- `controlTouch` is built on every setup even when there is no control, and would throw if read; fold both branches
  into one writable computed.
- The `value` setter writes `internalValue` even while a control is bound, where the getter never reads it. Mirror
  the getter's precedence.
- `Action.getBreakpointValue()` allocates a fresh `computed()` per call, and `<df-actions>` calls it inside another
  computed's map and immediately unrefs it, so the memoisation is never used. Cache it on the instance, and hoist
  `new ResponsiveActionRenderOptions(this.value)` out of the per-call path.

## Components

- `getSelectedChoices` is O(choices × selected) and runs several times per interaction; a `Set` of the normalised
  selected values settles it. `updateSelectedFromValue` re-normalises a value its callers already normalised.
- Both df-select watchers are `deep: true`, while every write allocates a new array identity anyway — the traversal
  buys nothing.
- `ck-editor-custom.vue` re-allocates the toolbar config, the 40-entry plugin array, the headings and the ~50-key
  editor config per instance; none of it depends on props.
- `df-file.fileInputKey` is created and re-randomised twice and read nowhere — the `:key` it was meant to bust does
  not exist. `ck-editor-custom.onEditorReady` has an empty body and is published through `defineExpose`.
- `df-checkbox` runs lodash `clone` over a `boolean | null`.
- `density="compact"` on df-checkbox and on df-input's number branch is overridden by the `v-bind` that follows it.
- `df-select` binds `aria-describedby` to `${name}-help`, and nothing renders an element with that id, so `helpText`
  announces nowhere. Either render it with that id in `df-input-hint`, or drop the binding and the `helpText`
  entry in `vuetifyBindings`.
- `updateSelectedFromValue`'s `taggable` parameter is passed `false` at three of four call sites, and the two sites
  that could see a tag return early on `taggable` before reaching it. Decide whether tags survive interaction, then
  either pass the flag or drop the branches.

## Duplication and dead code

- The `#label` / `#message` slot pair is copy-pasted verbatim across five components (seven places), varying only
  in df-checkbox's `allow-wrap`.
- `Action.closeAction` / `yesAction` / `noAction` are the same 15 lines three times, differing in three literals.
- `ActionDisplayStyle.isDefined` and `getBreakpointName` are exported and called nowhere.
- `ActionDisplayStyle.fromString` / `fromAny` fall back to `defaultDisplayStyle` for input they cannot resolve —
  the contract `DisplayMode` had until 0.15 and dropped, so a misspelled style silently renders as a button.
  Aligning them means throwing, with `isDefined` as the question that does not.

## Packaging

- `vitepress-plugin-crosslinks` sits in `peerDependencies`, so every consuming application is asked to install a
  VitePress plugin. It belongs to the docs workspace, as do `markdown-it-attrs` and `@types/markdown-it-attrs`.
- `ck-editor-custom.vue` imports `ckeditor5/ckeditor5.css` and two Google Fonts URLs into its `<style>` block, and
  Vite inlines all three into the single library stylesheet — 261 KB, with two runtime requests to
  fonts.googleapis.com, paid by every consumer whether or not it renders an RTF editor. A separate style export
  would confine it to the ones that do.
- A UMD build is still published while the peer library is ESM-only. A consumer that loads the UMD artifact and the
  ESM peer holds two copies of the class hierarchy, and `control instanceof FieldBase` answers `false`.

## Tests

- `DynamicFormsInputs.install` has no spec: neither registration flag, the settings provide, nor the CKEditor
  plugin install. `coverage.exclude: ['**/index.ts']` also swallows `src/index.ts`, which is not a barrel — narrow
  the glob to the barrels.
- `df-select` (305 lines) is covered only by the generic visibility matrix: 5/17 functions. Untested — single vs
  multiple value shape, `allowTags` swapping the underlying component, out-of-order `fetchChoices` responses being
  discarded, the `update:modelValueDisplay` payload, `allowNull: false` selecting the first option, chip close.
- `df-select.helper.ts`'s four pure functions carry the whole value-normalisation contract and have no spec. They
  are the cheapest tests in the package and settle the `taggable` question above.
- `df-datetime` (7/27 functions): `setValueISOFull`'s three-way dispatch, the per-`inputType` serialisations, the
  am/pm parse, the locale-driven display formats. `df-file`: the touch interval and its teardown on every path.
- `df-checkbox`'s tri-state cycle, df-input's number branch, df-color's rules, df-label's icon and markdown
  branches — all public, documented, unasserted.
- The density and variant resolution is tested at the composable with a mocked `inject`, never through a mounted
  component: that a real `provide('field-density', …)` in a parent reaches a child, and that `inline` produces the
  wrapper class `global.css` keys its compensation on.
- `translateStrings`, `setCkEditorLanguage` and `setDateTimeLocale` are documented public API with 0 % coverage.
