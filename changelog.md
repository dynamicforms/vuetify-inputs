# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.1] - 2026-09-05

### Fixed

- `<df-rtf-editor>` emits `''` as `modelValue` when the document holds no actual content (no text, no image,
  no embed), instead of the empty paragraph's serialized HTML (`'<p></p>'`). A `required` rule checking for a
  falsy `modelValue` now correctly rejects an editor the user left empty.

## [0.11.0] - 2026-09-01

### Added

- `InvalidHexColor` to `translatableStrings`: the message `<df-color>` shows when a typed value isn't a hex color
  and no `control` validator is set. `translatableStrings.LinkUrl` now also names the `<df-rtf-editor>` bubble
  menu's `window.prompt()` for a link over selected text, alongside its existing use as the link menu's URL field
  label.

### Changed

- **Breaking:** `translatableStrings` is now backed by `@dynamicforms/translatable` and is reactive: a component
  already on screen, `<df-rtf-editor>`'s toolbar and heading dropdown included, picks up a later `translateStrings`
  call without remounting.
- **Breaking:** `translateStrings`'s callback now takes `(key, defaultValue)` instead of `(key)`, and a key it
  declines resets to its English default rather than keeping whatever a previous call set it to - each call is now
  a complete statement of the current locale, not a patch on top of the last one.
- Bumps the `@dynamicforms/vue-forms` peer range to `^1.0.0` and adds `@dynamicforms/translatable` (`^0.1.0`) as a
  peer dependency.
- `<df-rtf-editor>`'s toolbar buttons are rounded rectangles grouped with `v-btn-group`, rather than individual
  circular icon buttons - an active button's background reads as a segment of its group instead of a colored
  circle sitting on its own. The alignment buttons are a `v-btn-toggle`, since only one alignment is ever active.

## [0.10.5] - 2026-08-27

### Added

- `<df-image>`, an image upload field: a preview of the current image, a drag & drop zone, and a button opening
  the browser's file dialog. It shares the `FileComms` contract with `<df-file>`, with the difference that
  `upload` must resolve to a URL the component can render directly as the image's `src`.
- `dfInputComponentsByTag`, every component this library draws with, keyed by the tag that names it, and
  `DfInputComponentTag`, the union of those tags. A rendering layer that resolves a component out of a map rather
  than through Vue's resolver kept a list of its own, which had to be extended by hand whenever this package gained
  a component and drew nothing at all until it was.
- `DfInputHintProps` and `DfLabelProps` are declared alongside the other components' props and exported through
  `DfInputComponentProps`. The two components declared their props inline, so a caller building `<df-input-hint>` or
  `<df-label>` from a layout had nothing to type the props object against.
- `BreakpointsJSON` takes a second type argument for what a breakpoint may state, defaulting to the whole of the
  options type. `ActionBreakpointRenderOptions` is what it is given for an action: `ActionRenderOptions` without
  `name`, `defaultConfirm` and `defaultReject`, which belong to the action rather than to a screen width and are
  now a type error at a breakpoint.
- `<df-rtf-editor>`'s toolbar gained a "Style" dropdown applying named, class-based looks (article category, title,
  subtitle, info box, side quote, marker, spoiler, and dark/bright code) to the current block or selection, and a
  media-embed tool that turns a pasted YouTube or Vimeo URL into a responsive player (any other URL is inserted as
  a plain link instead).
- `<df-file>`/`<df-image>`'s keep-alive `touch` interval is configurable: a `touchInterval` prop per field, falling
  back to a new `defaultTouchInterval` plugin setting, falling back to the existing 60 second default. A
  `touch`/`delete` implementation can now throw `FileGoneError` to report that the backend has already discarded
  the file — the component clears the field and, where a `control` is bound, shows the error's `errorText` as a
  validation error. Any other thrown error is left to the consumer, as before.
- `<df-file>` shows a download button next to an existing value's name when `FileComms` implements the new,
  optional `getDownloadUrl`; a backend that offers no such lookup draws no button. `<df-image>` shows one next to
  its replace button whenever a value is set, since its existing value is already a URL the browser can fetch.
- `<df-file>` accepts a dropped file the same way `<df-image>` does: the field highlights while a file is dragged
  over it, and dropping uploads the file exactly as picking it from the browser's file dialog would.

### Changed

- **Breaking:** `<df-rtf-editor>` is built on [TipTap](https://tiptap.dev/) instead of CKEditor 5. CKEditor 5's core
  is dual-licensed GPL/commercial, which put every application built on this library under the same terms unless it
  paid for a commercial CKEditor licence; TipTap's core and the extensions this component uses are MIT. The toolbar
  is now assembled from this library's own Vuetify components and icons rather than a vendor UI, so its buttons
  follow the application's theme and every one of its labels is a `translatableStrings` key like the rest of the
  library's own text (see [Localisation](/examples/localisation)). Saved HTML content, and the content classes
  (`h3.category`, `p.info-box`, `span.marker`, and the rest) a document may already carry, are unaffected.
  `@ckeditor/ckeditor5-vue` and `ckeditor5` are dropped from `peerDependencies`, replaced by `@tiptap/core`,
  `@tiptap/vue-3`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`,
  `@tiptap/extension-placeholder`, `@tiptap/extension-table` and its `-row`/`-cell`/`-header` companions, and
  `@tiptap/extension-text-align`.
- Images: insertion by URL, upload, or clipboard paste all embed the picture as a base64 `data:` URI, matching the
  previous `Base64UploadAdapter` behaviour, and a placed image resizes by dragging its corner and edge handles.
- Pasting a Word or Google Docs selection strips the source application's clutter — `mso-*` inline styles, `Mso*`
  classes, `o:p` and other namespaced tags, conditional comments — while formatted text, embedded images and tables
  come through as structured content.

### Removed

- **Breaking:** `setCkEditorLanguage()` and the `ckEditorLanguage` object. CKEditor 5 shipped its own translated UI
  bundles, which these configured; TipTap is headless, so the RTF editor's entire toolbar is text this library
  itself owns, translated the same way as everything else, through `translateStrings()`.

### Fixed

- `<df-image>`'s drag-over highlight no longer gets stuck on after a drag ends. `dragover` fires
  continuously while a file hovers over the drop zone, and was incrementing the same counter as
  `dragenter`; a single `dragleave` couldn't bring it back down, so the dashed outline stayed until
  the page reloaded, surviving even the field's own clear button.
- `<df-file>` shows an existing value's name. Its label read the raw `modelValue` prop, which
  stays unset when the field is bound through `control` rather than `v-model` - every consumer
  using the `control` binding saw a blank input for a field that already held a file.
- A field that only a breakpoint states is resolved. The fields taking part in the cascade were read off the base
  options, so an option named at `md` and nowhere else was dropped: `{ label: 'Save', md: { icon: 'save-outline',
  showIcon: true } }` drew no icon at any width, and an action whose value stated nothing at the base drew nothing
  anywhere. The cascade covers the fields each breakpoint states.
- `getRenderOptionsForBreakpoint()` answers `name`, `defaultConfirm`, `defaultReject` and `passthroughAttrs`. It
  declared `name` and returned `undefined` for it whatever the value held, and did not carry the other three at all,
  so `<df-actions>` read the colour flags and the attrs straight off the raw value to draw a button. Resolved
  options carry every member `ActionRenderOptions` declares.
- `passthroughAttrs` resolves per breakpoint, merged key by key like any plain object, so a breakpoint restating
  `color` leaves the `density` below it standing.

## [0.9.1] - 2026-08-20

### Added

- `<df-actions>` draws an action declared as the `Action` of `@dynamicforms/vue-forms`. It read the breakpoint
  options through an accessor only this library's subclass declares and threw a `TypeError` over anything else; it
  reads them off the action's value instead, so an action stating a label alone is drawn as a button showing it. The
  subclass is what an action needs to render responsively, as a text link or in a confirm / reject colour - not what
  it needs to be drawn at all.
- `getRenderOptionsForBreakpoint(value, breakpoint)` is exported: the `ActionRenderOptions` an action's value renders
  as at one breakpoint, defaults filled in and `label` / `icon` filtered by their flags. `Action.getBreakpointValue()`
  is a `computed()` over it.

### Changed

- A button `<df-actions>` draws is disabled where any container above the action is disabled, and while a run of the
  action has yet to settle - the latter draws it `loading` besides. The button bound the action's own `enabled` and
  read no `busy`, so an action in a disabled `Group` was clickable where the keyboard would not reach it, and a
  second click started a second run of a handler still in flight. What disables the button is
  `!action.effectiveEnabled || action.busy`; `enabled` on the action is unchanged and still answers what was written
  to it.
- `passthroughAttrs` now takes precedence over `loading` as well, which is one more prop the component computes on
  its own.

### Fixed

- `exports["."]` states a `types` condition. TypeScript resolves a package carrying an `exports` map through that map
  alone and ignores the top-level `types` field, so a consumer on `moduleResolution: "bundler"` or `"node16"` found
  no declarations: every import from the package was `any`, and nothing this library exports - `Action`,
  `BreakpointNames`, the components, the props - was checked at all.

## [0.9.0] - 2026-08-20

### Changed

- The `@dynamicforms/vue-forms` peer dependency is `^0.17.0`, the `vue` peer is `^3.5.2` and `engines.node` is `>=22`.
  The last two are the peer library's own floors. Eleven of its releases sit between 0.6.0 and 0.17.0; an
  application's own use of it migrates in the same step, which [the migration guide](/guide/migration) points at.
- `useInputBase()` returns `density` as the `ComputedRef` it computes, where it returned that computed's value as a
  plain string read once during setup. A consumer outside a template needs `.value`, and the density now follows a
  later change of the `density` prop. An injected `field-density` and the plugin's `defaultDensity` are read once,
  as configuration. `densityClass` is unchanged.
- The `visibility` prop is resolved through `DisplayMode.fromAny()`, so it accepts a constant's name
  case-insensitively - `visibility="hidden"` states what it looks like it states - and a value naming no
  `DisplayMode` constant throws where the field renders. Both used to render the field fully and say nothing. The
  prop is typed `Form.DisplayMode | string` accordingly.
- An input bound to a `control` emits `update:modelValue` with the value the control ended up holding rather than
  the value that was written to it. The two differ where the field does not take a write verbatim: a
  `ValueChangedAction` that normalises it, a disabled field that drops it, a handler that throws and so unwinds the
  operation. An input with no `control` emits what was written, as before.

- An input bound to a control is drawn disabled while any container above that control is disabled. It read the
  element's own `enabled`, so the fields of a disabled section stayed editable. `enabled` on each element is
  unchanged and still answers what was written to it; what an input draws from is `effectiveEnabled`.
- `ActionRenderOptions` states `label` and `icon` as strings. `ActionValue` types both `unknown` from vue-forms
  0.17.0, leaving what a label is to the rendering library, and this is that library saying so.

### Fixed

- An input treats an accepted write of an array or an object as accepted. An element holds its state behind
  `reactive()`, so such a value reads back as a proxy of what was written; the composable compared identities and
  concluded that every one of those writes had been refused, holding the written value for a tick and scheduling a
  second render of the input per change. The comparison is made over the raw objects.

- `Action.label` and `Action.icon` are the peer library's accessors and answer what the action carries. This class
  declared both as getters that filter the read by `showLabel` and `showIcon`; a getter declared alone defines the
  whole property, so the assignment the peer documents threw a `TypeError`, and the filter tested the flags for
  truthiness rather than for `false`, so an action stating neither answered `undefined` from both while
  `<df-actions>` drew the text and the icon. The filtered reads are `renderedLabel` and `renderedIcon`, which is
  what the action draws; `label` and `icon` answer the text and the name, and take writes.
- `df-file` and `df-datetime` apply their density-dependent wrapper class whatever the density is resolved from. The
  template read the `density` prop, so the class was missing whenever the density came from an injected
  `field-density` or from the plugin settings; both components now read the resolved density from `useInputBase()`.
- `df-select` no longer shows a selection the control refused. A write the model unwinds - a validator that throws,
  a disabled field - never reached the watch that pushes the model's value back into the chips, so they went on
  displaying a choice the control never took. What the control holds is compared against what was written, deeply,
  since a multiple selection reads back as a different array holding the same items.
- `df-select` warns about `choices` and `fetchChoices` only when both are set. The check tested the computed list of
  items, which is an array and so always truthy, and the warning therefore fired for every select given nothing but
  `fetchChoices`.

### Added

- An element carries the presentation the components render it with. `label`, `placeholder`, `helpText`, `hint`,
  `cssClass`, `density` and `variant` are declared on vue-forms' `Extras` augmentation point, so they are typed on
  every element in an application that installs this library - the fields written inline in a `Group` declaration
  included - and are stated in the parameters an element is built with or written later with `setExtendedValues()`.
  A form declared in code therefore describes itself, and `<df-input :control="form.fields.name" />` needs no
  attribute of its own. A prop wins where both state something, and what an element carries wins over an injected
  `field-density` / `field-variant` and over the plugin defaults.
- Documentation of the configuration cascade at `/examples/configuration`: the plugin's options, what `provide` of
  `field-density` and `field-variant` reaches, and the order the two are resolved in.
- Documentation of `DfInputHint` at `/examples/df-input-hint`: the props of the message row every input renders, and
  what it takes when it is used on its own for a group's errors.
- Documentation of localisation at `/examples/localisation`: every translatable string with its default and where it
  surfaces, CKEditor's interface language, and the date-fns locale `<df-date-time>` formats and parses with.

## [0.8.1] - 2026-08-16

### Fixed

- `ResponsiveRenderOptions.getOptionsForBreakpoint()` merges an object-valued option key by key. It replaced the
  object wholesale, so a breakpoint restating one key dropped every other key it inherited. Single values are
  replaced as before, and so is anything that is not a plain object - a `Date`, a `Map` or a class instance would
  come out of a merge as a bare copy of its own properties. The options this package ships are single values
  throughout, so `Action` and `<df-actions>` resolve exactly as before.

### Added

- Documentation of the cascade for anyone subclassing `ResponsiveRenderOptions`, at `/examples/responsive-render-options`:
  what each kind of value does at a breakpoint, that the object merge is shallow, and the contract `cleanBreakpoint()`
  has to keep - a field the breakpoint does not state comes back `undefined`, since an empty value is a value and
  replaces what was inherited.

## [0.8.0] - 2026-08-15

### Removed

- `Action.create()`. Actions are constructed with `new Action(...)`, matching @dynamicforms/vue-forms 0.6.0, which
  removed `Field.create()` and `Action.create()`. `Action.closeAction()`, `Action.yesAction()` and `Action.noAction()`
  are unaffected.
- The `DFInputHint` export. The component was reachable under two names; `DfInputHint` remains, and is the name the
  plugin registers it under, so the `<df-input-hint>` tag resolves under `registerComponents: true`.

### Changed

- The `control` prop is typed `FieldBase<T>`. vue-forms removed the `IField` interface the prop was typed with; the
  runtime guard has always been `instanceof FieldBase`.
- The `@dynamicforms/vue-forms` peer dependency is `^0.6.0`.

### Added

- Documentation for group-level validation errors and conditional group visibility, which @dynamicforms/vue-forms 0.6.0
  made observable by constructing `Group` and `List` as Vue reactive objects.
- A migration guide at `/guide/migration`.

### Fixed

- Every input component honours the visibility of its `control`; `df-checkbox`, `df-color` and `df-input` ignored it
  altogether, while `df-select` and `df-text-area` read the `visibility` prop instead of the control.
- `DisplayMode` is resolved in one place, `useInputBase`, which the components consume for both the render decision
  (`SUPPRESS`) and the `d-none` / `invisible` classes (`HIDDEN` / `INVISIBLE`).
- `DisplayMode.INVISIBLE` hides the element. The `invisible` class the components apply for it is defined by the
  package stylesheet; Vuetify ships no such rule, so the mode had no effect.

## [0.7.0] - 2026-01-28

### Added

- df-input-hint wrapper around messages-widget. It can take both a fields description / hint or a list of errors and 
  displays errors as priority, otherwise hint / description
  messages-widget removed as it's provided in the vue-forms package
  The wrapper itself is now exported for use in further packages / apps

### Removed

- messages-widget (see df-input-hint above for details)

## [0.6.6] - 2025-11-10

### Added
- Translatable editor

## [0.6.3 - 0.6.5] - 2025-10-22

### Added
- Support additional attributes for rendering the MdString

## [0.6.2] - 2025-10-01

### Added
- Support MdString for label text

### Changed
- All label rendering goes through df-label

## [0.6.0] - 2025-09-28

### Added
- Initial effort for all the inputs to be correctly vertically aligned
- Initial effort for all inputs to render correctly in all Vuetify variants
- Density: inline for use in tables

## [0.5.13] - 2025-09-25

### Fixed
- Fix SSR

## [0.5.10 - 0.5.12] - 2025-09-24

### Fixed
- Version bumps
- Fixed CSS location in package.json

## [0.5.9] - 2025-09-19

### Added
- Add support for vue-forms' touched property

## [0.5.8] - 2025-09-18

### Changed
- Support vuetify 3.9+ instead of 3.8+

## [0.5.7] - 2025-09-05

### Added
- messages-widget now takes additional parameter "classes" to be used on its generated elements. default `'text-error'`

### Changed
- messages-widget modified to render functions to speed up rendering and remove redundancies in DOM elements

## [0.5.6] - 2025-08-25

### Added
- input base: all components now take `passthrough-attrs` prop that contains any props that should be passed to the 
  underlying vuetify component.

## [0.5.5] - 2025-08-21

### Added
- df-date-time now supports tracking current locale via 
  `DateTimeLocaleConfig.setDateTimeLocale(locale: Locale | Ref<Locale>)` configuration.

## [0.5.4] - 2025-07-29

### Fixed
- df-date-time did not implement the clearable prop

## [0.5.3] - 2025-07-17

### Added
- input retains its value when no v-model and no control is given to hold the value instead

## [0.5.2] - 2025-07-17

### Added
- export props interfaces for the inputs

## [0.5.1] - 2025-06-09

### Added
- Translation support for predefined actions

### Fixed
- Removed breakpoint parameter from predefined actions (it was useless)

## [0.5.0] - 2025-05-31

### Changed
- Refactored Action component to extend Form.Action instead of using it as a property, providing better 
  inheritance and type safety
- Action is now fully responsive with support for breakpoint-based declarations

## [0.4.2 - 0.4.5] - 2025-05-19

### Added
- Reactive choices and value support for df-select component
- New slots (append-inner, prepend-inner) for df-select component customization

## [0.4.0 - 0.4.1] - 2025-05-18

### Fixed
- Uniform input styling across all input-base components
- Error display now only shows after field has been touched, improving user experience
- Proper error rendering with enhanced validation message support

## [0.3.1 - 0.3.3] - 2025-05-17

### Added
- Settings support with configurable input variants (outlined, underlined, etc.)
- Image support in component labels alongside existing icon support

### Fixed
- DateTime component label display issues
- Select component bug where previously selected choices were lost during new searches
- Density and variant processing for df-datetime component

## [0.2.4] - 2025-05-13

### Changed
- Reorganized dropdown layouts for better user experience

## [0.2.3] - 2025-05-08

### Added
- Exported getBreakpointName function for external use

## [0.2.1 - 0.2.2] - 2025-05-04

### Fixed
- Type declarations and member visibility improvements
- Generic solution for ResponsiveRenderOptions with correct exports

## [0.1.11 - 0.1.15] - 2025-04-21

### Changed
- Simplified select component due to variant changes
- Unified input heights across all components
- Enhanced message widget to support hints and help text

### Fixed
- Number input demo styling issues
- Precision handling (null when undefined)
- Selection clearing functionality in df-select component

### Removed
- Redundant form data handling

### Added
- Proper styles declaration

## [0.1.7 - 0.1.10] - 2025-04-19

### Fixed
- Color picker closing behavior - no longer closes on every internal click
- Checkbox unnecessary value reassignments
- DateTime values now include timezone information

### Changed
- Updated repository URL
- Excluded Vuetify components from package bundle for smaller distribution size

## [0.1.0 - 0.1.6] - 2025-04-18

### Added
- Initial implementation with three example components
- Helper classes for component development
- Complete documentation with working examples
- Integration with @dynamicforms/vue-forms
- TypeScript support
- Vuetify-based styling
- df-date-time component with full Vuetify integration
- df-textarea component with configurable rows and auto-grow
- df-file component with upload progress indication
- df-select component with static/dynamic options and multiple selection
- InputBase foundation component for all inputs
- Visibility support for textarea and select components
- Clearable functionality for input-base
- df-input component for general text input
- Support for multiple input types (text, email, password, URL, number)
- df-color component for color selection
- df-checkbox component with binary and ternary state support
- df-rtf-editor component with CKEditor integration
- df-actions component moved from separate package for better integration
- MDI font requirement for icons
- Advanced validation rendering supporting string, Markdown, and custom components
- Vue-forms validation support
