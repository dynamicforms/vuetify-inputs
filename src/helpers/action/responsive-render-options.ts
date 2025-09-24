import { computed } from 'vue';
import { useDisplay } from 'vuetify';

export const responsiveBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type BreakpointNames = (typeof responsiveBreakpoints)[number];
export type BreakpointsJSON<T extends Record<string, any>> = T & Partial<Record<BreakpointNames, T>>;

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
    const result = this.cleanBreakpoint(this._value as T) as BreakpointsJSON<T>;
    const fields = Object.keys(result);
    for (const bp of responsiveBreakpoints) {
      const bpData = this._value[bp];
      for (const field of fields) {
        if (bpData?.[field] != null) (<any>result)[field] = bpData[field];
      }
      if (bp === breakpoint) break;
    }
    return result;
  }

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
