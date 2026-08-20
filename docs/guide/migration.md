# Migration guide

Every breaking release has its own section below, newest first. If you are crossing several releases at once,
work from the bottom of the page upwards.

This is the only page that names superseded APIs; everywhere else in this documentation only the current one
exists.

<!-- New releases go directly below this comment, above the previous one, as `## Upgrading to vX.Y.Z (from vA.B.x)`. -->

## Upgrading to v0.9.0 (from v0.8.x)

This release follows `@dynamicforms/vue-forms` 0.16.0. Nothing this library exports is renamed or removed, so most
projects compile untouched; the work is in your own use of the peer library, plus five points on this library's own
surface. There is a [checklist](#checklist-for-0-9-0) at the end of this section.

### The peer ranges and the node floor

- `@dynamicforms/vue-forms` is `^0.16.0`. Install it with this release; 0.6.x through 0.15.x are not compatible.
- `vue` is `^3.5.2`, raised from `^3.4`.
- `engines.node` is `>=22`.

The last two are the peer library's own floors, which this package now states as well: vue-forms declares
`vue: ^3.5.2` and `engines.node: >=22` from its 0.12.0 release.

```json
{
  "dependencies": {
    "@dynamicforms/vue-forms": "^0.16.0",
    "@dynamicforms/vuetify-inputs": "^0.9.0",
    "vue": "^3.5.2"
  }
}
```

### Your own use of vue-forms migrates at the same time

Ten releases of the peer library sit between 0.6.0 and 0.16.0, and this library re-exports none of the API they
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

### `Action` takes writes to `label` and `icon` again

This library's `Action` overrides both accessors to filter the read by `showLabel` / `showIcon`. A getter declared
alone hides the base class's setter, so `action.label = 'Saving'` reached nothing. Both setters are declared again
and delegate to the peer library's, which from its 0.9.0 assigns a new value object through the value setter:

```typescript
const save = new Action({ value: { label: 'Save', icon: 'save-icon', renderAs: ActionDisplayStyle.BUTTON } });

save.label = 'Saving…';   // fires ValueChangedAction, moves isChanged, refused by a disabled action
save.value.label;         // 'Saving…'
```

The write is a value change, so an action whose label your code drives now reports `isChanged`, and a
`ValueChangedAction` registered on it receives an event. The reads stay filtered: an action rendering icon-only
answers `undefined` from `label` however it was written, and `value.label` is where the written text is.

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
<v-btn :disabled="!save.enabled || save.busy" @click="save.execute()">{{ save.label }}</v-btn>
```

### Checklist for 0.9.0

1. Update `@dynamicforms/vue-forms` to `^0.16.0` and `vue` to `^3.5.2`, and run on node 22 or newer.
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
9. Where your code writes `action.label` or `action.icon`, expect the write to land now — and to fire
   `ValueChangedAction` and move `isChanged`.

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
