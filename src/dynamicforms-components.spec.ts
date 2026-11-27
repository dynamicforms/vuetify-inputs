import { describe, expect, it } from 'vitest';
import { type Component, createApp, resolveComponent } from 'vue';

import * as Inputs from './dynamicforms-components';
import { type DfInputComponentTag, dfInputComponentsByTag } from './dynamicforms-components-by-tag';

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

  // a mis-cased registration name: the tag does not resolve (Vue warns)
  it('reports a tag as unresolved when no registration name reaches it', () => {
    expect(resolveFromTag('df-input-hint', ['DFInputHint'])).toBe('df-input-hint');
  });

  // dfInputComponentsByTag holds the same tags as the kebab-case registration names
  describe('dfInputComponentsByTag', () => {
    it('holds every exported component, under its kebab-case tag', () => {
      expect(Object.keys(dfInputComponentsByTag).sort()).toEqual(registrationNames.map(kebab).sort());
    });

    it.each(registrationNames)('answers %s for the tag that names it', (name) => {
      expect(dfInputComponentsByTag[kebab(name) as DfInputComponentTag]).toBe(Inputs[name as keyof typeof Inputs]);
    });
  });
});
