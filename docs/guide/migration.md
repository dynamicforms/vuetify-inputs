# Migration guide

Every breaking release has its own section below, newest first. If you are crossing several releases at once,
work from the bottom of the page upwards.

This is the only page that names superseded APIs; everywhere else in this documentation only the current one
exists.

<!-- New releases go directly below this comment, above the previous one, as `## Upgrading to vX.Y.Z (from vA.B.x)`. -->

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
[the vue-forms migration guide](https://docs.velis.si/dynamicforms/vue-forms/guide/migration.html); follow it for
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
   [vue-forms migration guide](https://docs.velis.si/dynamicforms/vue-forms/guide/migration.html) for your own use of
   that library — `Field.create()` and `reactiveValue` in particular.
7. Remove reactivity workarounds around groups and lists: a manual `ref` bumped after every mutation, a forced
   `key`, an explicit `triggerRef`, a `computed` re-reading `JSON.stringify(group.value)`.

---

> See also: [Getting Started](/guide/getting-started), [input base](/examples/input-base),
> [Groups](/examples/groups)
