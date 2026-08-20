import { describe, expect, it } from 'vitest';
import { type Component, createApp, resolveComponent } from 'vue';

import * as Inputs from './dynamicforms-components';

/**
 * Every export of this module is a registration name: the plugin installs each one with
 * app.component(name, component). A name Vue cannot reach from its kebab-case tag leaves the
 * component unusable under registerComponents: true, so the two must be checked together.
 */
describe('dynamicforms-components', () => {
  const registrationNames = Object.keys(Inputs);

  const stub: Component = { render: () => null };

  const resolveFromTag = (tag: string, names: string[]) => {
    let resolved: string | Component = '';
    const app = createApp({
      setup: () => {
        resolved = resolveComponent(tag);
        return () => null;
      },
    });
    names.forEach((name) => app.component(name, stub));
    app.mount(document.createElement('div'));
    app.unmount();
    return resolved;
  };

  const kebab = (name: string) => name.replace(/(?<!^)([A-Z])/g, '-$1').toLowerCase();

  it('exports every component under a DfXxx name', () => {
    expect(registrationNames).not.toHaveLength(0);
    registrationNames.forEach((name) => expect(name).toMatch(/^Df[A-Z][A-Za-z]*$/));
  });

  it.each(registrationNames)('resolves %s from its kebab-case tag', (name) => {
    const tag = kebab(name);

    // resolveComponent returns the tag string back when nothing is registered under a reachable name
    expect(resolveFromTag(tag, registrationNames), `<${tag}> does not resolve`).not.toBe(tag);
  });

  // the [Vue warn] this emits is the assertion: the registration name is deliberately mis-cased, so the tag
  // resolves to nothing
  it('reports a tag as unresolved when no registration name reaches it', () => {
    expect(resolveFromTag('df-input-hint', ['DFInputHint'])).toBe('df-input-hint');
  });
});
