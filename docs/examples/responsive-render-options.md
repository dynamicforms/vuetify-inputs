# Responsive options

`ResponsiveRenderOptions` is the class behind an `Action`'s breakpoints: it holds one set of options per
breakpoint and resolves them into the set that applies at a given screen width. `Action` uses it for its render
options. It is exported for subclasses; [`@dynamicforms/vuetify-modal-form-kit`](:vuetify-modal-form-kit:) builds its
form, row and column layouts on it.

Setting `sm` / `md` / `lg` on an action is documented in [df-actions](/examples/df-actions#responsive-breakpoints).
This page documents writing a subclass.

## How a breakpoint is resolved

Options are inherited from smaller breakpoints by larger ones. The options without a breakpoint apply to the smallest
size, and each breakpoint sets only what differs from the one below it. Resolving `md` applies `xs`, `sm` and `md` in
that order.

How a breakpoint's value applies depends on its kind:

| Value | At a breakpoint |
|---|---|
| `undefined` or `null` | not set; the field keeps the inherited value |
| a single value (string, number, boolean, enum) | replaces what it inherited |
| a plain object | is merged into what it inherited, key by key |
| anything else (an array, a `Date`, a `Map`, a class instance) | replaces what it inherited |

```typescript
// base: { cols: 8, offset: 2 }, sm: { cols: 12 }
options.getOptionsForBreakpoint('sm'); // { cols: 12, offset: 2 } - offset carried over
```

The object merge is **shallow**: a nested object is replaced as a whole.

```typescript
// base: { style: { color: 'red', margin: 10 } }, sm: { style: { color: 'blue' } }
options.getOptionsForBreakpoint('sm'); // { style: { color: 'blue' } } - margin is gone
```

Only plain objects merge. A `Date`, a `Map`, a `Set` or a class instance is replaced; merging it would produce a plain
copy of its own properties without its prototype.

## Writing a subclass

A subclass declares the shape of its options and implements `cleanBreakpoint()`, which normalizes the options of one
breakpoint: it validates them and drops unsupported ones.

```typescript
import { ResponsiveRenderOptions } from '@dynamicforms/vuetify-inputs';

interface PanelOptions {
  title?: string;
  props?: Record<string, any>;
  items?: string[];
}

class ResponsivePanelOptions extends ResponsiveRenderOptions<PanelOptions> {
  protected cleanBreakpoint(bp?: PanelOptions, defaultIfEmpty: boolean = false): PanelOptions | null {
    if (!bp && !defaultIfEmpty) return null;
    return {
      title: isString(bp?.title) ? bp.title : undefined,
      // a field the breakpoint does not state comes back undefined, never as an empty value
      props: bp?.props ? { ...bp.props } : undefined,
      items: bp?.items ? [...bp.items] : undefined,
    };
  }
}
```

**`cleanBreakpoint()` returns `undefined` for a field the breakpoint does not set.** An empty array or an empty
string is a value and replaces the inherited one. A breakpoint clears a list with an empty array:

```typescript
// base: { items: ['a', 'b'] }, md: { items: [] }
options.getOptionsForBreakpoint('sm'); // items: ['a', 'b']
options.getOptionsForBreakpoint('md'); // items: []
```

A class field initialized to a collection, e.g. `items: string[] = []`, sets an empty list on every breakpoint object,
so every breakpoint clears the list instead of inheriting it. Such a field is declared optional and assigned when an
item is added.

A field set only at `md` resolves from `md` upwards and is `undefined` below it.

```typescript
// base: {}, md: { title: 'only at md' }
options.getOptionsForBreakpoint('sm'); // { }
options.getOptionsForBreakpoint('md'); // { title: 'only at md' }
```

## Options a breakpoint may not state

Some options apply to the object as a whole, not to one screen width, e.g. an identifier or a flag another component
reads. `BreakpointsJSON` takes a second type argument for the options a breakpoint may set, so such an option at a
breakpoint is a type error:

```typescript
interface PanelOptions {
  name?: string;
  title?: string;
}

type PanelBreakpointOptions = BreakpointsJSON<PanelOptions, Omit<PanelOptions, 'name'>>;

const panel: PanelBreakpointOptions = { name: 'main', md: { name: 'wide' } };  // error: `name` is not per-breakpoint
```

This is how an action's options are declared: `ActionBreakpointOptions` is `ActionRenderOptions` with `name`,
`defaultConfirm` and `defaultReject` left out of every breakpoint.

---

> See also: [df-actions](/examples/df-actions), [input base](/examples/input-base)
