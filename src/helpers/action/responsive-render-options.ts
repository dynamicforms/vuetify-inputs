import { isPlainObject } from 'lodash-es';
import { computed } from 'vue';
import { useDisplay } from 'vuetify';

export const responsiveBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type BreakpointNames = (typeof responsiveBreakpoints)[number];
/**
 * A set of options and the per-breakpoint sets that restate parts of it. `B` is what a breakpoint may state,
 * and defaults to the whole of `T`; a subclass narrows it where a member belongs to the object as a whole rather
 * than to one screen width.
 */
export type BreakpointsJSON<T extends Record<string, any>, B extends Record<string, any> = T> = T &
  Partial<Record<BreakpointNames, B>>;

export abstract class ResponsiveRenderOptions<T extends Record<string, any>> {
  protected readonly _value: BreakpointsJSON<T>;

  constructor(data?: BreakpointsJSON<T>) {
    this._value = this.cleanBreakpoint(data as T, true)!;
    if (data) {
      responsiveBreakpoints.forEach((bp) => {
        const options = this.cleanBreakpoint(data[bp]);
        if (options) this._value[bp] = options;
      });
    }
  }

  getOptionsForBreakpoint(breakpoint: BreakpointNames): T {
    // a base that states nothing cleans to null, and the breakpoints above it still have options to resolve
    const result = (this.cleanBreakpoint(this._value as T) ?? ({} as T)) as BreakpointsJSON<T>;
    for (const bp of responsiveBreakpoints) {
      // the fields that cascade are the ones each breakpoint states, so a field named at a breakpoint and
      // nowhere else still reaches the result
      const bpData = this._value[bp] ?? {};
      for (const field of Object.keys(bpData)) {
        const value = (<any>bpData)[field];
        // a breakpoint states what it changes; a field it says nothing about keeps cascading
        if (value == null) continue;
        if (isPlainObject(value)) {
          // shallow, so a breakpoint restates single keys of an options object rather than the whole of it. A
          // nested object is a value like any other and is replaced whole. Only plain objects merge: a Date, a
          // Map or a class instance would come out of a spread as its own properties without its prototype.
          (<any>result)[field] = { ...(<any>result)[field], ...value };
        } else {
          (<any>result)[field] = value;
        }
      }
      if (bp === breakpoint) break;
    }
    return result;
  }

  /**
   * Normalizes one breakpoint's options. The merge reads `null` and `undefined` as "this breakpoint says
   * nothing about that field", so a field the breakpoint does not state has to come back as `undefined` rather
   * than as an empty value - an empty array or string returned here reads as a breakpoint deliberately emptying
   * what it inherited.
   */
  protected abstract cleanBreakpoint(bp?: T, defaultIfEmpty?: boolean): T | null;
}

export function getBreakpointName(dp: ReturnType<typeof useDisplay>): BreakpointNames {
  if (dp.xlAndUp.value) return 'xl';
  if (dp.lgAndUp.value) return 'lg';
  if (dp.mdAndUp.value) return 'md';
  if (dp.smAndUp.value) return 'sm';
  return 'xs';
}

export function useBreakpoint() {
  const display = useDisplay();

  return computed<BreakpointNames>(() => getBreakpointName(display));
}
