# Todo

## Features

- support serialization format for datetime component
- df-list (basically a table-editing field) - requires the new table component.
  The `@dynamicforms/vue-forms` peer dependency is at `^1.0.0` (bumped in 0.11.0) and already supplies the row
  bookkeeping this was blocked on: `List.items` is a frozen array of the live `Group` rows rebuilt once per change
  of the set, so a keyed `v-for` over it replaces walking `list.value`; `List.length` is the count; `remove()` and
  `pop()` hand back the row instance itself, released of the list, which is an undo affordance; `row.rebind(record)`
  puts the same instance over the next record, which is what recycles a row in a virtualised table; and a
  `CompareTo` or a conditional action registered on the item template now answers per row.
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

## Adopt what vue-forms newly offers

- No input shows anything while an asynchronous validator is in flight. `control.validating` answers for the whole
  subtree since 0.13 and `control.busy` for executions at or below the element; a `loading` binding in
  `vuetifyBindings` would cover every component at once.
- `InAllowedValues` reads its list at each validation and accepts a `Ref` or a getter, so a validator can measure
  against the choices df-select loaded over ajax. The loaded list is component-private; exposing it would connect
  the two.
- Mirror `getConfig()` / `setConfig()` for `VuetifyInputsSettings`, so the density and variant defaults can be read
  and written where there is no app to install a plugin on.
  **Open question:** vue-forms' own `getConfig()`/`setConfig()` back a single module-global record — its own docs
  say plainly that in a process running several Vue apps, the configuration applied last is the one all of them
  read. Should a mirrored pair for `VuetifyInputsSettings` copy that same module-global, last-write-wins shape, or
  be scoped some other way to avoid the same cross-app leakage?
- `ValidationError.code` is a stable identifier per failure. Rendering it as a `data-error-code` in `df-input-hint`
  would give per-code styling and test hooks.

## Reactive layer

- `vuetifyBindings` is one computed folding fourteen bindings together, so a touch or an error change rebuilds and
  re-diffs all of them. The volatile keys belong on their own bindings.
- `controlTouch` is built on every setup even when there is no control, and would throw if read; fold both branches
  into one writable computed.
- The `value` setter writes `internalValue` even while a control is bound, where the getter never reads it. Mirror
  the getter's precedence.
- `getRenderOptionsForBreakpoint()` builds a `ResponsiveActionRenderOptions` per call, and `<df-actions>` calls it
  once per action inside a computed, so every breakpoint change and every value change rebuilds the whole cascade
  for every button. Cache the object per action value.
- `Action.getBreakpointValue()` allocates a fresh `computed()` per call, so a caller that does not hold on to the
  answer never reaches the memoisation.

## Components

- `InputBase`'s own `defineProps<BaseProps & { loading?: boolean }>()` skips `withDefaults(..., defaultBaseProps)`,
  unlike every leaf component (df-input, df-checkbox, df-color, df-text-area, df-select, df-datetime, df-file,
  df-rtf-editor all spread `defaultBaseProps` into their own `withDefaults`) — so `clearable` defaults to
  `undefined` rather than the documented `true` for a caller that mounts `InputBase` directly with no `clearable`
  stated, and `isClearable` never draws a clear button in that case.
- `density="compact"` on df-checkbox and on df-input's number branch is overridden by the `v-bind` that follows it.
- `df-checkbox` runs lodash `clone` over a `boolean | null`.
- `df-label`'s custom-component icon branch (`<component :is="label.iconComponent" ...>`) carries no size, unlike
  the `v-icon` branch (`size="1.25em"`) and the `v-img` branch (sized by `.df-label .icon` in its own `<style>`) —
  a custom icon renders at its own default size instead of the library's 1.25em convention.
- `df-datetime`'s date-only `inputType` feeds a bare `'YYYY-MM-DD'` value straight into `new Date(...)`, which
  parses it as UTC midnight, then reads it back with local getters — in a timezone behind UTC this displays and
  round-trips the date one day early (`'2023-04-17'` becomes `'2023-04-16'` in `America/New_York`, the exact value
  docs/examples/df-datetime.md's own date-only example uses).
- `df-datetime`'s `timeFormatted` setter mishandles the 12-hour boundary on manual entry: `12:00 PM` is treated as
  already past the PM cutoff and gets 12 added anyway, producing the invalid `24:00:00`; there is no `am` branch at
  all, so `12:00 AM` stores `12:00:00` (noon) instead of `00:00:00` (midnight).
- `getSelectedChoices` is O(choices × selected) and runs several times per interaction; a `Set` of the normalised
  selected values settles it. `updateSelectedFromValue` re-normalises a value its callers already normalised.
- Both df-select watchers are `deep: true`, while every write allocates a new array identity anyway — the traversal
  buys nothing.
- `df-select` binds `aria-describedby` to `${name}-help`, and nothing renders an element with that id, so `helpText`
  announces nowhere. Either render it with that id in `df-input-hint`, or drop the binding and the `helpText`
  entry in `vuetifyBindings`.
- `updateSelectedFromValue`'s `taggable` parameter is passed `false` at three of its five call sites in
  `df-select.vue` (the `resultingValue` watcher, `onSelect`, `chipClose`); the latter two already return early on
  `taggable` before reaching the call, so their `false` is moot, but the `resultingValue` watcher has no such
  guard — writing a value to the bound `control`/`v-model` that isn't among `choices` on a taggable select is
  silently reset to `null`.
  **Open question:** should a taggable df-select keep a value written externally through its bound control/`v-model`
  even when that value isn't among the current `choices` (fix: pass `taggable.value` into the `resultingValue`
  watcher's call too), or is resetting such a write to `null` intended, with tags only meant to survive direct user
  typing?
- `chipClose` guards `readonly || taggable` before deciding whether to propagate a chip removal, but the taggable
  branch inside that guard runs whenever `taggable` is true regardless of `readonly` — closing a chip on a
  readonly, `allow-tags` field removes it from the displayed `selected` array without touching `resultingValue`,
  desyncing the chips from the control's actual value.
- `checkMultiline()` only recomputes `isMultiline` when `allowNull` is true, so a multi-select with
  `allow-null="false"` never gets the `df-select-multirow` class even when its chips wrap — the wrapped-layout
  compensation in the scoped `<style>` never engages for it.
- `df-file.fileInputKey` is created and re-randomised twice and read nowhere — the `:key` it was meant to bust does
  not exist.
- `df-file`'s `handleFileChange` branches on `Array.isArray(file)` and logs a "multiple files not supported"
  message, but the underlying `v-file-input` is hardcoded `:multiple="false"`, and Vuetify unwraps its model to a
  single `File` before `update:model-value` fires in that mode — the array branch can never run and is dead code.
- `df-file.vue`'s `selectedFile` is reset only by `resetFileState` (remove, `FileGoneError`, or a failed upload) —
  a successful upload never clears it, so `fileLabel` and `canDownload` (both gated on `!selectedFile`) keep
  showing the previously picked file's name and no download control once a different `value` is later bound to the
  same component instance (e.g. through `row.rebind()`).
- `df-image.vue`'s `objectUrl` is likewise only cleared by the next upload, `removeFile`/`resetFileState`, or
  unmount — never by a successful upload — and `previewUrl` prefers `objectUrl` over `value` unconditionally, so a
  component instance rebound to a different image keeps showing the stale local blob instead of the new value's
  URL.
- `ResponsiveActionRenderOptions.cleanBreakpoint()` copies `name`, `defaultConfirm` and `defaultReject` off
  whatever object it is handed, with no runtime check distinguishing the base value from a single breakpoint's
  data; `ActionBreakpointRenderOptions` excludes those three only at the TypeScript level, so a value built through
  a variable, a spread, or a plain-JS caller (this ships as a published npm package, not TS-only) can still set
  them per breakpoint and have the cascade apply them, contradicting the documented contract that they belong to
  the action as a whole.
- An action rendered icon-only (`showIcon` true, `showLabel` false) has no accessible name: `<df-actions>`'s
  `<v-btn>` binds no `aria-label`, and `vue-cached-icon` strips the `<title>` out of the SVG it injects.
  **Open question:** where should the accessible name come from for an icon-only action — always fall back to the
  raw `label` as `aria-label`, require the caller to pass `passthroughAttrs['aria-label']` explicitly, or add a
  dedicated `ariaLabel` field to `ActionRenderOptions`?
- `rtf-toolbar.vue`'s `headingOptions` array and `editor-core.vue`'s `useEditor` extension list are re-built per
  instance; neither depends on props.
- `<df-rtf-editor>`'s toolbar has no accessibility-help button: a keyboard-shortcut reference for the editor's
  commands. A `v-dialog` listing the toolbar's own shortcuts would cover it.
- `<df-rtf-editor>` accepts a `placeholder` prop like every other input (via `BaseProps`), but it is never
  forwarded to `rtf-editor-core`, and `editor-core.vue` configures TipTap's `Placeholder` extension with a literal
  empty string — the prop only reaches `input-base.vue`'s `:dirty` check (forcing the label into floated position)
  and never renders as placeholder text inside the editing area.
- `stripWordArtifacts` strips namespaced *tags* (`o:p`, `w:sdt`...) and `Mso*` classes/`mso-*` style properties, but
  not namespaced *attributes* Word leaves on ordinary elements (`v:shapes="Picture_x0020_1"` on a pasted `<img>`,
  for one) — harmless (browsers ignore unknown attributes) but not removed either.

## Duplication and dead code

- The `#label` / `#message` slot pair is copy-pasted verbatim across five components (seven places), varying only
  in df-checkbox's `allow-wrap`.
- `Action.closeAction` / `yesAction` / `noAction` are the same 15 lines three times, differing in three literals.
- `ActionDisplayStyle.isDefined` is exported and called nowhere in the package. `ActionDisplayStyle.getBreakpointName`
  is exported too, but its only caller anywhere in the codebase is `useBreakpoint()`, declared one line below it in
  the same file — nothing outside that file reaches it either way.
- `ActionDisplayStyle.fromString` / `fromAny` fall back to `defaultDisplayStyle` for input they cannot resolve —
  the contract `Form.DisplayMode.fromAny` in the peer library has since moved to throwing instead, with
  `Form.DisplayMode.isDefined` as its non-throwing guard.
  **Open question:** should `fromString`/`fromAny` throw on an unresolvable `renderAs` value to match the peer
  library's contract, keep silently falling back to `defaultDisplayStyle` as today, or use the already-exported
  (but currently uncalled) `isDefined` as a non-throwing guard/warning instead?

## Packaging

- `vitepress-plugin-crosslinks` sits in `peerDependencies`, so every consuming application is asked to install a
  VitePress plugin it never touches — only `docs/.vitepress/config.ts` imports it, and it resolves for the docs
  workspace only because npm hoists the root's peer dependencies. `markdown-it-attrs` and `@types/markdown-it-attrs`
  sit in the root's `devDependencies` and are imported nowhere in `src/` or `docs/` — dead dependencies to drop,
  not to relocate.
- `editor-core.vue` imports two Google Fonts URLs into its `<style>` block, and Vite inlines both into the single
  library stylesheet — two runtime requests to fonts.googleapis.com, paid by every consumer whether or not it
  renders an RTF editor. A separate style export would confine it to the ones that do.
- Drop the UMD build. `main`/`exports.require` in package.json still point at
  `dist/dynamicforms-vuetify-inputs.umd.cjs` and `vite.config.ts` still builds the `umd` format, even though the
  `@dynamicforms/vue-forms` peer is ESM-only (`"type": "module"`, no `require` condition) — a consumer loading both
  the UMD artifact and the ESM peer holds two copies of the class hierarchy, and `control instanceof FieldBase`
  answers `false`.
- `tsconfig.json` declares a `~/*` → `./node_modules/*` path alias that nothing in `src/` imports through, and
  `vite.config.ts`'s matching alias is commented out — dead configuration.

## Documentation

- `docs/examples/df-select.md` documents `SelectChoice.icon` as an "Ionicons format" name and its own example sets
  bare names (`'flash-outline'`, `'book-outline'`, `'shirt-outline'`); `<cached-icon>` (`vue-cached-icon`) only
  resolves a name through a `ion-`/`mdi-`/`fa-` prefix, so an unprefixed name is fetched as a URL instead, fails,
  and renders nothing. The example needs prefixed names (`ion-flash-outline`, matching `select-ajax.vue`'s own
  `mdi-language-javascript` style).
- `docs/examples/df-file.md`'s Features list has no mention of drag & drop, even though the component has
  supported it since 0.10.5 the same way `df-image` does; `docs/examples/df-image.md` lists the equivalent feature
  explicitly.
- `readme.md`'s component summary and "Available Components" list, `docs/guide/getting-started.md`'s "Available
  Components" list, and `docs/guide/rationale.md`'s field table all omit `df-image`, even though it has shipped as
  an exported component with its own doc page and sidebar entry since 0.10.5.
- `docs/guide/migration.md`'s "Upgrading to v0.11.0" section covers only the `translateStrings` signature change;
  unlike its 0.8.0 and 0.9.0 sections, it never states that the release also bumps the `@dynamicforms/vue-forms`
  peer range to `^1.0.0` and adds `@dynamicforms/translatable` (`^0.1.0`) as a new required peer dependency.

## Tests

- `df-select` (323 lines) is covered only by the generic visibility matrix: 9/36 functions, 33% statements.
  Untested — single vs multiple value shape, `allowTags` swapping the underlying component, out-of-order
  `fetchChoices` responses being discarded, the `update:modelValueDisplay` payload, `allowNull: false` selecting
  the first option, chip close.
- `df-select.helper.ts`'s four pure functions carry the whole value-normalisation contract and have no spec. They
  are the cheapest tests in the package and settle the `taggable` question above.
- `df-datetime` (7/27 functions): `setValueISOFull`'s three-way dispatch, the per-`inputType` serialisations, the
  am/pm parse, the locale-driven display formats.
- `df-checkbox`'s tri-state cycle, df-input's number branch, df-color's rules, df-label's icon and markdown
  branches — all public, documented, unasserted.
- `setDateTimeLocale` is documented public API with 0% coverage.
- The density and variant resolution is tested at the composable with a mocked `inject`, never through a mounted
  component: that a real `provide('field-density', …)` in a parent reaches a child, and that `inline` produces the
  wrapper class `global.css` keys its compensation on.
- `rtf-toolbar.spec.ts`'s link, image, media-embed and table menu tests only assert that each menu opens without
  crashing: `applyLink`/`removeLink` and the `download` toggle, `insertImageFromUrl`/`onImageFileChosen`,
  `insertMediaEmbed`, and the table's row/column commands are never actually operated, `setHeading` is never
  clicked, and the Style dropdown isn't exercised at all. `editor-core.spec.ts` covers only the bubble menu's link
  toggle, not its bold/italic/list toggles or its `NodeSelection` exclusion.
- `DynamicFormsInputs.install` has no spec: neither the registration flag nor the settings provide.
  `coverage.exclude: ['**/index.ts']` also swallows `src/index.ts`, which is not a barrel, along with the real
  re-export barrels `src/helpers/index.ts` and `src/helpers/action/index.ts` — narrow the glob to the barrels.
- `useFileTouchKeepAlive`'s interval start/stop and setting resolution are covered by
  `use-file-touch-keepalive.spec.ts` and `df-file.spec.ts`, but the `onBeforeUnmount` teardown itself is not: every
  composable-level test calls it outside a mounted component, where `onBeforeUnmount` warns and is discarded rather
  than registered, and the component-level test never unmounts its wrapper either.
