# TypeScript types

The package exports the props interface of every component in the `DfInputComponentProps` namespace, and its other
types alongside the components:

```ts
import type { DfInputComponentProps } from '@dynamicforms/vuetify-inputs';

type SelectProps = DfInputComponentProps.DfSelectProps;
```

The component pages describe the props; the exported types are not described one by one. IDE code insight shows their
members and docstrings.
