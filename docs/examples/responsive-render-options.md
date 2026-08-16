# Responsive options

`ResponsiveRenderOptions` is the class behind an `Action`'s breakpoints: it holds one set of options per
breakpoint and resolves them into the set that applies at a given screen width. `Action` uses it for its own
render options, and it is exported so you can build your own responsive object on top of it -
[`@dynamicforms/vuetify-modal-form-kit`](:vuetify-modal-form-kit:) builds its form, row and column layouts
that way.

If all you do is set `sm` / `md` / `lg` on an action, [df-actions](/examples/df-actions#responsive-breakpoints)
covers what you need. This page is about writing a subclass.

## How a breakpoint is resolved

Options cascade from smaller breakpoints to larger ones. The options written without a breakpoint are the
smallest size, and each breakpoint states only what changes from the one below it. Resolving `md` therefore
walks `xs`, `sm`, `md` in order and lets each one state its part.

What "state its part" means depends on the kind of value:

| Value | At a breakpoint |
|---|---|
| `undefined` or `null` | says nothing - the field keeps what it inherited |
| a single value (string, number, boolean, enum) | replaces what it inherited |
| a plain object | is merged into what it inherited, key by key |
| anything else - an array, a `Date`, a `Map`, a class instance | replaces what it inherited |

```typescript
// base: { cols: 8, offset: 2 }, sm: { cols: 12 }
options.getOptionsForBreakpoint('sm'); // { cols: 12, offset: 2 } - offset carried over
```

The object merge is **shallow**: a nested object is a value like any other, so restating it replaces it whole.

```typescript
// base: { style: { color: 'red', margin: 10 } }, sm: { style: { color: 'blue' } }
options.getOptionsForBreakpoint('sm'); // { style: { color: 'blue' } } - margin is gone
```

Only plain objects merge. A `Date`, a `Map`, a `Set` or an instance of your own class is replaced, because
merging one would strip it of its prototype and leave a bare copy of its own properties behind.

## Writing a subclass

A subclass declares the shape of its options and implements `cleanBreakpoint()`, which normalizes one
breakpoint's worth of them - it is where you validate input and drop what you do not accept.

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

Two rules make the cascade behave:

**Return `undefined` for a field the breakpoint does not state.** An empty array or an empty string is a value,
and the merge treats it as one - it will replace what the breakpoint inherited. That is what lets a breakpoint
clear a list on purpose:

```typescript
// base: { items: ['a', 'b'] }, md: { items: [] }
options.getOptionsForBreakpoint('sm'); // items: ['a', 'b']
options.getOptionsForBreakpoint('md'); // items: []       - emptied deliberately
```

Watch for a class field that initializes a collection: `items: string[] = []` makes every breakpoint object
state an empty list from the moment it is constructed, and every one of them will then clear the list instead
of inheriting it. Leave such a field optional and fill it in when something is actually added.

**Carry every merged field in the `defaultIfEmpty` result.** The fields that take part in the cascade are read
off the value returned for `defaultIfEmpty`, so a field missing there is never merged from any breakpoint.

---

> See also: [df-actions](/examples/df-actions), [input base](/examples/input-base)
