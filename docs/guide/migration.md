# Migration guide

Every breaking release has its own section below, newest first. If you are crossing several releases at once,
work from the bottom of the page upwards.

This is the only page that names superseded APIs; everywhere else in this documentation only the current one
exists.

<!-- New releases go directly below this comment, above the previous one, as `## Upgrading to vX.Y.Z (from vA.B.x)`. -->

## Upgrading to v0.12.0 (from v0.11.x)

0.12.0 requires `@dynamicforms/vue-forms` 2.0. Upgrade the two together, and read the
[vue-forms migration guide](https://docs.velis.si/dynamicforms/vue-forms/guide/migration) first: most of what changes
in a form's behaviour comes from vue-forms, and this section covers only what changes in the components on top of
it. Four of the changes below are silent - code that relied on them keeps compiling and behaves differently - and
they come first. There is a [checklist](#checklist-for-0-12-0) at the end of this section.

```bash
npm install @dynamicforms/vue-forms@^2.0.0 @dynamicforms/vuetify-inputs@^0.12.0
```

### What vue-forms 2.0 changes under the components

Three vue-forms changes reach every form these components render:

- **A hidden input is out of the form's data.** An input whose field is `HIDDEN` is sent as `null`, and one that is
  `SUPPRESS`ed is left out of the container's `value` and `fullValue`. Neither counts in the container's `valid`, so
  an invalid field the user cannot see no longer blocks a submit button bound to `form.valid`. A form that hid an
  input and also disabled it to keep it out of the payload can drop the `enabled` write.
- **Enabling or disabling a field is a change of the form.** A `ValueChangedAction` on a `Group` also runs when a
  member is enabled or disabled and the group's value changes because of it. A handler that saves or recomputes on
  every change of the form runs for these switches as well.
- **A disabled field takes a write.** `enabled` decides whether the input accepts what the user types and whether the
  field is serialized, not whether a write reaches the field. Code that disabled a field to protect it from an
  assignment needs the assignment itself to be conditional. The components adjust to this below.

### `<df-datetime>` writes only what the user edits

A value the field is bound with is shown in the user's local time and stays in the field exactly as it was given.
Before, the component rewrote it on mount into the local offset, which changed the string and marked the field - and
every group above it - as changed before the user touched anything:

```typescript
const when = new Field({ value: '2026-01-15T09:00:00Z' });
// rendered with <df-datetime :control="when" /> in Europe/Ljubljana
when.value;      // before: '2026-01-15T10:00:00+01:00'   after: '2026-01-15T09:00:00Z'
when.isChanged;  // before: true                           after: false
```

The field now holds the backend's own string until the user edits the date or the time; from then on it holds the
edited value in the user's local offset, as before. A form that tested `isChanged` to decide whether to save, or to
warn about unsaved changes, no longer sees a change on every record with a date-time field in it. Code that read the
field's value expecting the local offset - comparing it as a string, or cutting the offset off - receives whatever
the backend sent until the user edits it, and should parse the value instead of relying on its form. A disabled
date-time field is never written by the component at all.

### `<df-datetime>` writes the offset of the date, not today's

The offset the component appends to an edited value is the one in force on that date. Before, it was today's, which
in a time zone with daylight saving time is an hour off for every date on the other side of the change:

```typescript
// in Europe/Ljubljana, on a day in July, the user sets 11:30 on 15 January
when.value;      // before: '2026-01-15T11:30:00+02:00' (10:30 local)   after: '2026-01-15T11:30:00+01:00'
```

The same mismatch made the component rewrite its own value without end: a field bound to a date on the other side
of the change from today stopped with "Maximum recursive updates exceeded" on mount. Records saved from such a form
by an earlier version, in a time zone with daylight saving time, may hold a time shifted by an hour or more; nothing
in the upgrade corrects them.

In `date` mode a date without a time is read as that day in local time. Before, it was read as UTC midnight, so west
of Greenwich `'2026-01-15'` was shown as 14 January and the component stopped with the same error.

### `<df-select>` states no default while disabled

With `allowNull: false`, an enabled select whose value is empty selects the first choice, as before. A select drawn
disabled leaves the value empty, and selects the first choice when it is enabled. Two cases behave differently:

```typescript
const country = new Field<string | null>({ value: null });
const form = new Group({ country }, { enabled: false });
// rendered with <df-select :control="country" :choices="countries" :allow-null="false" />
country.value;           // before: the first choice   after: null
form.isChanged;          // before: true               after: false

form.enabled = true;
country.value;           // the first choice either way

const region = new Field<string | null>({ value: null, enabled: false });
// rendered the same way
region.enabled = true;
region.value;            // before: null               after: the first choice
```

- A select inside a disabled `Group` is drawn disabled, but the field itself is enabled, so the first choice used to
  be written into it on mount. It no longer is: the form's data carries no choice the user did not make, and the form
  does not start out changed.
- A select whose own field was disabled at mount stayed empty after it was enabled. It now selects the first choice
  at that moment, like a select that was enabled from the start.

Where a disabled select has to carry a value, give the field that value when it is created.

### An upload that finishes on a disabled field keeps its file

`<df-file>` and `<df-image>` write the identifier `comms.upload` resolves to into the field even where the field was
disabled while the upload ran, and touch it from then on. Before, vue-forms refused that write: the component showed
the uploaded file while the field stayed empty, the form was submitted without it, and the file on the backend was
never touched again. No code change is needed; a backend that cleaned up such orphaned uploads sees fewer of them.

### `DisplayMode.INVISIBLE` is gone

vue-forms 2.0 removes `DisplayMode.INVISIBLE`, and the components remove what drew it:

- `visibility="invisible"` and `:visibility="8"` throw while the component renders, like any other mode that does
  not exist. Use `HIDDEN` or `SUPPRESS`.
- `useInputBase().visibilityClass` is `{ 'd-none': boolean }`; the `invisible` key is gone. A custom component that
  bound the object keeps working.
- `global.css` no longer defines `.invisible`. Markup of your own that used the class needs the rule
  `.invisible { visibility: hidden; }` in your own styles.

### Checklist for 0.12.0

1. Upgrade `@dynamicforms/vue-forms` to `^2.0.0` alongside this release, and work through its migration guide.
2. Search for `INVISIBLE` and `'invisible'` and replace them with `HIDDEN` or `SUPPRESS`; add a `.invisible` rule of
   your own if your markup uses the class.
3. Search for code that disabled a field to keep it out of the payload and for handlers on a form's
   `ValueChangedAction`: the first can use `SUPPRESS`, the second now also runs on enabling and disabling.
4. Search for code that reads a `<df-datetime>` field's value as a string in the local offset, and parse it instead.
5. Where a `<df-select>` with `allowNull: false` inside a disabled section was expected to hold the first choice, give
   the field that value when it is created.
6. If users in a time zone with daylight saving time edited date-times with an earlier version, check stored values
   for dates on the other side of the change from the day they were saved.

## Upgrading to v0.11.0 (from v0.10.5)

`translatableStrings` is now backed by [`@dynamicforms/translatable`](https://github.com/dynamicforms/translatable)
and is reactive; `translateStrings`'s callback signature and its behaviour on a declined key both change with it.
There is a [checklist](#checklist-for-0-11-0) at the end of this section.

### `translateStrings`'s callback takes a second argument, and a declined key resets to English

```typescript
// before
translateStrings((key: string): string => {
  const translated = myCatalogue[key];
  return translated ?? (null as unknown as string);
});

// after
translateStrings((key, defaultValue) => myCatalogue[key] ?? defaultValue);
```

The callback now receives the English default as a second argument, so there is no longer a need to fall back to
it by hand or to widen a declined return past `string` with a cast. The behaviour on a declined key changes along
with the signature: previously, a key the callback declined kept *whatever a previous `translateStrings` call had
set it to* - so a locale switcher had to supply a complete catalogue, English included, or an entry could be left
showing a stale translation from a locale the application had moved away from. Now, a declined key resets to its
English default on that call, so every call to `translateStrings` is a complete statement of the current locale
rather than a patch on top of the last one - a locale that only overrides a handful of keys behaves the same as
one that overrides all of them.

If your own callback relied on the old accumulating behaviour - for instance, calling `translateStrings` once with
a partial catalogue early and topping it up later without repeating the earlier keys - it now needs to supply
every key it wants translated on every call.

### `<df-rtf-editor>`'s toolbar no longer needs remounting

`translatableStrings` reads used to be frozen at the moment a component last rendered, so an application working
around that would remount `<df-rtf-editor>` on a locale change, typically by binding `:key` to the locale code. The
toolbar (heading dropdown included) now reads the table reactively and updates on its own; a `:key` binding kept
for this reason is no longer necessary, though it is harmless to leave in place. `Action.closeAction()`,
`.yesAction()` and `.noAction()` are unaffected by this - they still copy the label into the action when the
factory runs, so an application already rebuilding its actions on a locale change (as
[Localisation](/examples/localisation) recommends) needs no change there.

### Checklist for 0.11.0

1. Search your project for `translateStrings` and add the `defaultValue` parameter to every callback; drop any
   `null as unknown as string` cast, since the return type now properly includes `null`/`undefined`.
2. If any callback relied on a declined key keeping a previous translation rather than the English default, make
   it supply every key it wants translated on every call instead.
3. Drop a `:key="locale"`-style remount workaround on `<df-rtf-editor>` if you added one for this - it is no
   longer needed, though leaving it in place is harmless.

## Upgrading to v0.10.0 (from v0.9.2)

`<df-rtf-editor>` is built on [TipTap](https://tiptap.dev/) instead of CKEditor 5. CKEditor 5's core is
dual-licensed GPL/commercial, which put every application built on this library under the same terms unless it
paid for a commercial CKEditor licence; TipTap's core and the extensions this component uses are MIT. Three
things follow from that swap: a peer dependency change, a removed API, and a change to the HTML the editor
produces that reaches further than this library - the third is the one worth reading carefully even if you never
touch this component's config. There is a [checklist](#checklist-for-0-10-0) at the end of this section.

### The peer dependencies change

`@ckeditor/ckeditor5-vue` and `ckeditor5` are gone from `peerDependencies`, replaced by TipTap's packages:

```json
{
  "dependencies": {
    "@tiptap/core": "^3.30.2",
    "@tiptap/vue-3": "^3.30.2",
    "@tiptap/pm": "^3.30.2",
    "@tiptap/starter-kit": "^3.30.2",
    "@tiptap/extension-image": "^3.30.2",
    "@tiptap/extension-link": "^3.30.2",
    "@tiptap/extension-placeholder": "^3.30.2",
    "@tiptap/extension-table": "^3.30.2",
    "@tiptap/extension-table-cell": "^3.30.2",
    "@tiptap/extension-table-header": "^3.30.2",
    "@tiptap/extension-table-row": "^3.30.2",
    "@tiptap/extension-text-align": "^3.30.2"
  }
}
```

Drop the two CKEditor packages from your own `package.json` and install this set instead. Nothing else in your
project's use of `@dynamicforms/vuetify-inputs` needs to change on account of this swap by itself.

### `setCkEditorLanguage()` and `ckEditorLanguage` are removed

CKEditor 5 shipped its own translated UI (button tooltips, dialog captions), which these two configured via a
separate per-language bundle:

```typescript
// before
import { setCkEditorLanguage } from '@dynamicforms/vuetify-inputs';
import deTranslations from 'ckeditor5/translations/de.js';

setCkEditorLanguage('de', deTranslations);
```

TipTap is headless: `<df-rtf-editor>`'s entire toolbar is built from this library's own Vuetify components, so
every one of its labels is already a `translatableStrings` key, translated the same way as the rest of this
library's text, through `translateStrings()` - see [Localisation](/examples/localisation). Drop the
`setCkEditorLanguage` call and the translation-bundle import; nothing replaces them, because there is no longer a
separate vendor UI language to configure.

### List items and table cells wrap their text in a `<p>` now

This is the one that reaches outside this library. CKEditor 5 saved a bulleted item as `<li>Text</li>` and a table
cell as `<td>Text</td>`. TipTap's list and table schemas wrap block content in a paragraph even inside a list item
or a cell, so the same content now saves as `<li><p>Text</p></li>` and `<td><p>Text</p></td>`.

Inside `<df-rtf-editor>` itself this is invisible - its own stylesheet zeroes the paragraph margin in that
context, so a list reads as tightly spaced lines, not double-spaced ones. But `<df-rtf-editor>` only styles its
own editing surface. **Anywhere else this saved HTML is rendered** - a public page built from the stored value, a
PDF export, a templated email - inherits the browser's or renderer's default `<p>` margin on every list item and
table cell, unless that renderer's own stylesheet accounts for it. A `<li>` that used to be one line becomes a
`<li>` with a paragraph's worth of empty space above and below it; a table built for compact rows gets visibly taller
ones. Add the same rule this library's own editor uses wherever else this HTML is displayed:

```css
li p, td p, th p {
  margin: 0;
}
```

This is safe to apply everywhere you render content saved by this library, past or future: it only matches a
`<p>` actually nested inside a list item or cell, so content saved before this upgrade - which has no such nested
`<p>` - is simply not touched by it.

### Checklist for 0.10.0

1. Swap `@ckeditor/ckeditor5-vue` and `ckeditor5` for the `@tiptap/*` set above in your own `package.json`.
2. Search your project for `setCkEditorLanguage` and drop the call and its translation-bundle import; if you
   supplied per-locale editor language before, that concern no longer exists to configure.
3. Find every place outside `<df-rtf-editor>` that renders HTML this component saved - marketing pages, PDF
   generation, **templated emails** - and add `li p, td p, th p { margin: 0; }` (or that renderer's equivalent) to
   its stylesheet. Check a rendered list and a rendered table specifically; this is easy to miss until content
   with a list or a table happens to go out through that particular renderer.
4. If your own styling targeted CKEditor-specific classes or DOM structure (rather than the semantic HTML this
   library always documented as its saved format), re-check it against the new output.


## Upgrading to v0.9.1 (from v0.9.0)

Nothing this library exports is renamed or removed. What changes is that your compiler finally sees the package's
declarations, and that `<df-actions>` draws two states it did not draw before. There is a
[checklist](#checklist-for-0-9-1) at the end of this section.

### The declarations reach your compiler

`exports["."]` states a `types` condition. TypeScript resolves a package carrying an `exports` map through that map
alone - the top-level `types` field is not consulted - so on `moduleResolution: "bundler"` or `"node16"` every import
from this package was `any`.

Expect the first build after the upgrade to report errors your project always had: a misspelled member of an
`Action` value, a prop passed to a component that does not declare it, a `label` read as something other than a
string. They are the checks that were never run, not new rules.

### An action inside a disabled container is drawn disabled

A button `<df-actions>` draws binds `effectiveEnabled`, which is `false` where the action or any `Group` or `List`
holding it is disabled. It bound the action's own `enabled`, so the buttons of a disabled section stayed clickable,
while `<df-modal>`'s Enter and Escape shortcuts - which read `effectiveEnabled` - refused the same actions.

`enabled` on the action is unchanged and still answers what was written to it. Drop the per-action `enabled = false`
writes that were there to follow a disabled container.

### A run in flight disables its own button

`<df-actions>` binds `Action.busy`: while a run of the action has yet to settle the button is disabled and drawn
`loading`, so a second click cannot start a second run of a handler that is still working.

An action that reached this by writing its own `enabled` no longer needs to:

```typescript
// before
watchEffect(() => { saveAction.enabled = !saveAction.busy; });

// after: <df-actions> binds busy itself
```

The write is not refused - it is `enabled` like any other - but it states the same thing the component already
draws, and anything else that reads the action's `enabled` reads a run in flight rather than what the form declared.

### Checklist for 0.9.1

1. Build once and work through the type errors that surface: they are your project's, and this release is the first
   in which they are reported.
2. Load the forms that disable a whole section: the action buttons inside one now render disabled. Drop the
   per-action `enabled = false` writes that were there to achieve it.
3. Drop the `watchEffect` (or equivalent) that mirrored `busy` into `enabled` on an action.
4. Check the tests that click a button of an action whose handler is asynchronous: a click that lands while the
   previous run is in flight no longer reaches the handler.


## Upgrading to v0.9.0 (from v0.8.x)

This release follows `@dynamicforms/vue-forms` 0.17.0. Nothing this library exports is renamed or removed, so most
projects compile untouched; the work is in your own use of the peer library, plus five points on this library's own
surface. There is a [checklist](#checklist-for-0-9-0) at the end of this section.

### The peer ranges and the node floor

- `@dynamicforms/vue-forms` is `^0.17.0`. Install it with this release; 0.16.x and below are not compatible.
- `vue` is `^3.5.2`, raised from `^3.4`.
- `engines.node` is `>=22`.

The last two are the peer library's own floors, which this package now states as well: vue-forms declares
`vue: ^3.5.2` and `engines.node: >=22` from its 0.12.0 release.

```json
{
  "dependencies": {
    "@dynamicforms/vue-forms": "^0.17.0",
    "@dynamicforms/vuetify-inputs": "^0.9.0",
    "vue": "^3.5.2"
  }
}
```

### Your own use of vue-forms migrates at the same time

Eleven releases of the peer library sit between 0.6.0 and 0.17.0, and this library re-exports none of the API they
changed — every `Field`, `Group`, `List`, `Action` and validator your application builds is that library's, and it
crosses all ten in one step here. Work through
[the vue-forms migration guide](:vue-forms:/guide/migration.html), which is written for exactly this jump; the
sections below cover only what that guide cannot know about, which is this package's own surface.

Four breaks are worth searching for before you upgrade rather than after. The first three announce nothing at all —
no log, no throw — so the code keeps compiling and stops working:

- **`watch(element, cb)` no longer fires.** An element is no longer a Vue proxy of itself, so the deep traversal a
  reactive watch source starts stops immediately. Watch a getter over what you read: `watch(() => field.value, cb)`.
- **`readonly(element)` protects nothing.** It hands the element straight back, and a write through the result
  reaches the element. Hand out `element.value`, or a `computed` over it.
- **`isEqual` over two elements no longer compares their data.** It answered `true` for any two elements of the same
  class, and answers `false` now unless they are the same instance. Compare `a.value` with `b.value`.
- **`clone()` is `bind(data, overrides)`.** The data comes first: `f.clone({ value: x, label: 'Name' })` is
  `f.bind(x, { label: 'Name' })`. The type checker finds every call site.

### The `visibility` prop is resolved through `DisplayMode.fromAny`

The prop is typed `Form.DisplayMode | string` and is resolved the way a control resolves its own mode, which means a
name is read case-insensitively and a value naming no `DisplayMode` constant is refused.

```vue
<!-- resolves to DisplayMode.HIDDEN, as it reads -->
<df-input visibility="hidden" />

<!-- throws: 'hiden' is not a DisplayMode constant -->
<df-input visibility="hiden" />
```

Both lines used to render the field fully: the prop was passed through untouched, and only an exact
`DisplayMode` constant matched the comparisons the render decision and the `d-none` / `invisible` classes are made
of. A misspelled name, and a mode a backend knows that this version does not, therefore did nothing and said
nothing; they now throw where the field renders.

A prop that names nothing still resolves to `DisplayMode.FULL`, and a `control` prop still decides on its own
`visibility`, which the peer library resolves the same way. Where a mode arrives from a payload and an unknown one
has to be survivable, resolve it yourself before it reaches the prop:

```typescript
const mode = Form.DisplayMode.isDefined(payload.visibility)
  ? Form.DisplayMode.fromAny(payload.visibility)
  : Form.DisplayMode.FULL;
```

### `useInputBase()` answers `density` as a `ComputedRef`

`density` was a plain string, resolved once while the component set up. It is the `computed` itself now, so a
consumer reading it needs `.value`, and the value follows a change of the `density` prop. An injected
`field-density` and the plugin's `defaultDensity` are read once, while the component sets up, so a later change of
either does not reach a field that already exists.

```typescript
// before
const { density } = useInputBase(props, emits);
const isInline = density === 'inline';

// after
const { density } = useInputBase(props, emits);
const isInline = computed(() => density.value === 'inline');
```

In a template inside `<script setup>` the read is unchanged — `density` unwraps on its own — and `densityClass` is
what it always was, a `ComputedRef<string>` holding `df-density-${density}`. Everything else `useInputBase()`
returns keeps its type.

### `update:modelValue` carries what the control took

An input bound to a `control` emits the value the control ended up holding, where it emitted the value that was
written to it. The two differ whenever the field does not take a write verbatim: a `ValueChangedAction` that
normalises the value, a disabled field that drops it, a handler that throws and so unwinds the whole operation.

```typescript
const control = new Form.Field<string>({ value: '' });
control.registerAction(
  new Form.ValueChangedAction<string>((field, supr, newValue, oldValue) => {
    if (newValue !== newValue?.toUpperCase()) field.value = newValue!.toUpperCase();
    return supr(field, newValue, oldValue);
  }),
);
// typing "abc" emits 'ABC'; it emitted 'abc'
```

The rendered control follows the same rule. Where the write does not stand, the input reads back the written value
for one tick and the field's own value after it, so the repaint that restores what the field holds happens; the
Vuetify component no longer shows a value the model refused. An input with no `control` — plain `v-model`, or no
binding at all — emits what was written, as before.

If a handler of yours re-read the control after the event to find out what was actually stored, that read now
answers what the event already carried.

### A field inside a disabled section is drawn disabled

An input bound to a `control` reads `effectiveEnabled`, which is `false` where the element or any container above
it is disabled. It read the element's own `enabled`, so `section.enabled = false` left every input inside the
section editable and an application had to disable each field of a section itself.

```typescript
const section = new Group({ amount: new Field({ value: 0 }) });
section.enabled = false;

section.fields.amount.enabled;            // true - what was written to the field, unchanged
section.fields.amount.effectiveEnabled;   // false - and what <df-input> draws from
```

Nothing about `enabled` moves: it still answers what was written to each element, a write to a member of a disabled
container is still accepted, and what a container serializes is still decided by its members' own `enabled`. What
changes is that the fields of a section your code disables now render disabled and read-only. Where an application
disabled those fields one by one to get that, the per-field writes can go.

### An element carries its own presentation

`label`, `placeholder`, `helpText`, `hint`, `cssClass`, `density` and `variant` are declared on vue-forms' `Extras`
augmentation point, so every element in an application that installs this library carries them, typed, and the
components read them where the corresponding prop states nothing.

```vue
<script setup>
const form = new Group({
  name: new Field({ value: '', label: 'Full name', hint: 'As it appears on the document' }),
});
</script>

<template>
  <df-input :control="form.fields.name" />
</template>
```

Nothing is required of an existing form: a prop wins over what the element carries, so every attribute you have
written goes on saying what it said. What an element carries wins over an injected `field-density` /
`field-variant` and over the plugin defaults, which puts it second in the cascade, behind the prop alone.

One thing to check: an application that already attached extended properties of these names to its elements — a
`label` written with `setExtendedValues()` and rendered by the application's own template — now feeds the
components as well, and the component draws it where its tag states no `label`.

### `ActionRenderOptions` states `label` and `icon` as strings

vue-forms 0.17.0 types both `unknown` on `ActionValue`, so a rendering library says what a label is; this one says
`string`. An action of this library's own class is unaffected. Where your code declares a value type of its own
over `ActionRenderOptions` it inherits the two as strings, and where it extends vue-forms' `ActionValue` directly it
states them itself.

### `label` and `icon` are the base class's; the filtered reads are `renderedLabel` and `renderedIcon`

This library's `Action` declared `label` and `icon` as getters that filter the read by `showLabel` / `showIcon`.
Both are gone: `label` and `icon` are `@dynamicforms/vue-forms`' own, so they answer the text and the icon name
whatever the two flags say, and they take writes.

```typescript
const save = new Action({ value: { label: 'Save', icon: 'save-icon', renderAs: ActionDisplayStyle.BUTTON } });

save.label;               // 'Save'
save.label = 'Saving…';   // fires ValueChangedAction, moves isChanged, refused by a disabled action
```

The filtered read has its own name:

```typescript
const iconOnly = new Action({ value: { label: 'Save', icon: 'save-icon', showLabel: false, showIcon: true } });

iconOnly.label;           // 'Save' — what the action carries
iconOnly.renderedLabel;   // undefined — what it draws
```

Rename every read that wanted the filtered value: `action.label` → `action.renderedLabel`, `action.icon` →
`action.renderedIcon`. A read that wanted the text needs no change and is now correct for an action that states
neither flag, which answered `undefined` before. `<df-actions>` is unaffected — it renders from the
breakpoint-resolved options, which filter on their own.

### `Action.execute()` is a promise

`execute(params?)` comes from the peer library and is `async` there. It answers what the `ExecuteAction` chain
returned, and `params` is optional.

```typescript
// before: the throw arrived here
try { save.execute(); } catch (e) { report(e); }

// after: await it, or attach a catch
try { await save.execute(); } catch (e) { report(e); }
save.execute().catch(report);
```

The chain is entered synchronously, so a handler has already run by the time the call returns and code that ignores
the answer keeps working. What moves is where a failure surfaces: a handler that throws rejects the promise, and a
call that neither awaits nor catches leaves an unhandled rejection. A `@click="save.execute()"` in a template needs
no change — Vue attaches its own catch and routes the error to `app.config.errorHandler`.

`Action.busy` comes with it: `true` from the call to `execute()` until the run settles, however it settles. It is
what a button asks while its own handler runs.

```vue
<v-btn :disabled="!save.enabled || save.busy" @click="save.execute()">{{ save.renderedLabel }}</v-btn>
```

### Checklist for 0.9.0

1. Update `@dynamicforms/vue-forms` to `^0.17.0` and `vue` to `^3.5.2`, and run on node 22 or newer.
2. Search for `watch(` with an element as the source, for `readonly(` over an element, and for `isEqual` over two
   elements; rewrite each to read the element's value.
3. Rename `clone(` to `bind(`, moving the data out of the overrides object and into the first argument.
4. Work through the [vue-forms migration guide](:vue-forms:/guide/migration.html) for the rest of your own use of
   that library.
5. Add `.value` to every read of `density` from `useInputBase()` outside a template.
6. Check each `visibility` prop that is given a string or a value from a payload: a name that matches no
   `DisplayMode` constant now throws where the field renders.
7. Re-read handlers of `update:modelValue` on inputs bound to a `control`: the payload is what the control holds,
   and a re-read of the control after the event is redundant.
8. `await` or `.catch()` every `Action.execute()` outside a template, and drop the `try`/`catch` that wrapped the
   synchronous call.
9. Rename every read of `action.label` / `action.icon` that wanted the value filtered by `showLabel` / `showIcon`
   to `action.renderedLabel` / `action.renderedIcon`. A read that wanted the text stays as it is, takes writes,
   and now answers for an action that states neither flag.
10. Load the forms that disable a whole section: the fields inside one now render disabled. Drop the per-field
    `enabled = false` writes that were there to achieve it.
11. Search for `setExtendedValues` and for extended properties named `label`, `placeholder`, `helpText`, `hint`,
    `cssClass`, `density` or `variant`: the components read those now, where the tag states no prop of that name.

## Upgrading to v0.8.0 (from v0.7.x)

This release follows `@dynamicforms/vue-forms` 0.6.0. Two mechanical edits cover most projects — `Action.create(` →
`new Action(` and `IField` → `FieldBase` in type positions — plus whatever your own code does with the peer library.
There is a [checklist](#checklist-for-0-8-0) at the end of this section.

### Actions are constructed with `new`

`Action.create()` is gone. The class is constructed the same way as every other form element.

```typescript
// before
const save = Action.create({ value: { label: 'Save' } });

// after
const save = new Action({ value: { label: 'Save' } });
```

For most projects the whole change is a search and replace of `Action.create(` → `new Action(`.

The factory took a type argument constrained to `ActionBreakpointOptions`; the class takes none, because it extends
vue-forms' `Action` with that type already applied. Drop the argument — `new Action({ ... })` checks its parameter
against `Partial<IFieldConstructorParams<ActionBreakpointOptions>>`, which is what the constrained factory checked
against as well.

`Action.closeAction()`, `Action.yesAction()` and `Action.noAction()` remain, with the same names and the same
behaviour. Their optional parameter is typed `Partial<IFieldConstructorParams<ActionBreakpointOptions>>` instead of
`Partial<IField<ActionBreakpointOptions>>`; call sites that pass an object literal need no edit, and only a variable
you declared with the old type has to be retyped.

### The `control` prop is typed `FieldBase`

Every input component's `control` prop was typed with vue-forms' `IField<T>`, which that library removed. The prop is
now typed `FieldBase<T>`.

```typescript
// before
import { IField } from '@dynamicforms/vue-forms';

const props = defineProps<{ control: IField<string> }>();

// after
import { FieldBase } from '@dynamicforms/vue-forms';

const props = defineProps<{ control: FieldBase<string> }>();
```

If you only pass a `Field`, a `Group` or an `Action` into `control`, nothing changes. The edit is needed where you
wrote the type out yourself — a wrapper component that declares its own `control` prop, a helper that takes a field
as a parameter, or a variable annotated before it is handed to a component.

What the components accept at runtime is exactly what they always accepted: they guard with `instanceof FieldBase`,
so the value passed in has to derive from that class, as it always did.

### `DFInputHint` is spelled `DfInputHint`

The component was exported under two names. Only `DfInputHint` remains, which is also the name it
registers under when the plugin is installed with `registerComponents: true`, so the tag
`<df-input-hint>` resolves. Rename the import if you used the other spelling.

```typescript
// before
import { DFInputHint } from '@dynamicforms/vuetify-inputs';

// after
import { DfInputHint } from '@dynamicforms/vuetify-inputs';
```

### @dynamicforms/vue-forms 0.6.0 is required

The peer dependency range is now `^0.6.0`. Install it together with this release; 0.5.x is not compatible.

Your own use of the peer library migrates at the same time — `Field.create()`, `reactiveValue` and `IField` are all
removed there. That migration is described in
[the vue-forms migration guide](:vue-forms:/guide/migration.html); follow it for
everything that is not on this page.

### What newly works

vue-forms 0.6.0 makes `Group` and `List` Vue-reactive from construction, the same as fields. Three things therefore
repaint in an application built on this library that never repainted before:

- **Group-level validation errors.** A validator registered on a `Group` writes to `group.errors`; a template that
  renders `group.errors` or `group.valid` updates when it fires. `DfInputHint` takes `group.errors` directly.
- **Conditional visibility and enablement on a `Group`.** A `ConditionalVisibilityAction` or
  `ConditionalEnabledAction` registered on a group sets `group.visibility` or `group.enabled`, which your template
  reads to show and hide the whole section.
- **Structural changes to a `List`.** `push()`, `insert()`, `remove()`, `pop()` and `clear()` are tracked, so a
  `v-for` over `list.value` re-renders on its own.

See [Groups](/examples/groups) for worked examples of the first two.

One limit is worth stating precisely: `enabled` and `visibility` do **not** cascade from a group to the fields
inside it. Each field carries its own, and hiding or disabling a group does not disable the fields it holds — it
only affects what you render off the group itself. This library adds no cascade of its own.

### Checklist for 0.8.0

1. Update the `@dynamicforms/vue-forms` dependency to `^0.6.0`.
2. Replace `Action.create(` with `new Action(`, dropping the type argument where you passed one.
3. Rename `IField` → `FieldBase` in every type position where you typed a `control` prop, a parameter or a variable,
   and drop `IField` from your imports.
4. Retype any variable declared as `Partial<IField<ActionBreakpointOptions>>` before it is passed to
   `Action.closeAction()`, `Action.yesAction()` or `Action.noAction()`.
5. Rename `DFInputHint` → `DfInputHint` in imports.
6. Work through the
   [vue-forms migration guide](:vue-forms:/guide/migration.html) for your own use of
   that library — `Field.create()` and `reactiveValue` in particular.
7. Remove reactivity workarounds around groups and lists: a manual `ref` bumped after every mutation, a forced
   `key`, an explicit `triggerRef`, a `computed` re-reading `JSON.stringify(group.value)`.

---

> See also: [Getting Started](/guide/getting-started), [input base](/examples/input-base),
> [Groups](/examples/groups)
