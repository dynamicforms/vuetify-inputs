/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ERROR_NAMESPACE } from './index';

const root = resolve(__dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** Every non-spec TypeScript and Vue file of the library, relative to the repository root. */
const sources = (dir = 'src'): string[] =>
  readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(ts|vue)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });

/** The construction that rebuilds an error of the `errors` prop from its description, with the code it was given. */
const REBUILD = 'new ValidationError(code, params, detail, origin)';
const CALL = /new ValidationError\(/g;
const DECLARED = /^new ValidationError\(namespaced\('([a-z0-9_]+)'\),/;
/** The grammar of a full error code: namespace segments and the code, joined by `.`. */
const FULL_CODE = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.[a-z0-9]+(_[a-z0-9]+)*$/;

/** The full code of every error the library constructs, read from its source. */
const raised = () => {
  const found = new Set<string>();
  const undeclared: string[] = [];
  sources().forEach((path) => {
    const text = read(path);
    for (const match of text.matchAll(CALL)) {
      const rest = text.slice(match.index);
      if (rest.startsWith(REBUILD)) continue;
      const declared = rest.match(DECLARED);
      if (declared) found.add(`${ERROR_NAMESPACE}.${declared[1]}`);
      else undeclared.push(`${path}:${text.slice(0, match.index).split('\n').length}`);
    }
  });
  return { found, undeclared };
};

/** The codes of the error code table in docs/examples/localisation.md. */
const documented = () =>
  new Set(
    [...read('docs/examples/localisation.md').matchAll(/^\| `([a-z0-9._-]+)` \| none \|/gm)].map(([, code]) => code),
  );

describe('the error codes the library raises', () => {
  it('are in the namespace the package root exports', () => {
    expect(ERROR_NAMESPACE).toBe('vuetify-inputs');
  });

  it('are built with namespaced() from a literal', () => {
    const { found, undeclared } = raised();
    expect(undeclared).toEqual([]);
    expect(found.size).toBeGreaterThan(0);
  });

  it('are full codes of the library namespace', () => {
    raised().found.forEach((code) => {
      expect(code).toMatch(FULL_CODE);
      expect(code.slice(0, code.lastIndexOf('.'))).toBe(ERROR_NAMESPACE);
    });
  });

  it('are the codes of the error code table of the localisation page', () => {
    expect(documented()).toEqual(raised().found);
  });
});
