// eslint-disable-next-line max-classes-per-file
import { isBoolean, isObjectLike, isString } from 'lodash-es';
import { useDisplay } from 'vuetify';

import { ActionDisplayStyle } from './action-display-style';

export interface LabelRenderOptions {
  renderAs?: ActionDisplayStyle;
  showLabel?: boolean;
  showIcon?: boolean;
  label?: string;
}

export const responsiveBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type BreakpointNames = typeof responsiveBreakpoints[number];
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
        if (bpData?.[field] != null) (<any> result)[field] = bpData[field];
      }
      if (bp === breakpoint) break;
    }
    return result;
  }

  protected abstract cleanBreakpoint(bp?: T, defaultIfEmpty?: boolean): T | null;
}

export class ResponsiveLabelRenderOptions extends ResponsiveRenderOptions<LabelRenderOptions> {
  // eslint-disable-next-line class-methods-use-this
  protected cleanBreakpoint(bp?: LabelRenderOptions, defaultIfEmpty: boolean = false): LabelRenderOptions | null {
    if ((!bp || !isObjectLike(bp)) && !defaultIfEmpty) return null;

    const result: LabelRenderOptions = {};
    if (defaultIfEmpty) {
      result.renderAs = ActionDisplayStyle.BUTTON;
      result.showLabel = true;
      result.showIcon = true;
    }

    if (bp) {
      if (bp.renderAs != null) result.renderAs = ActionDisplayStyle.fromAny(bp.renderAs);
      if (isString(bp.label)) result.label = bp.label;
      if (isBoolean(bp.showLabel)) result.showLabel = bp.showLabel;
      if (isBoolean(bp.showIcon)) result.showIcon = bp.showIcon;
    }

    return Object.keys(result).length ? result : null;
  }
}

export function getBreakpointName(dp: ReturnType<typeof useDisplay>): BreakpointNames {
  if (dp.xlAndUp.value) return 'xl';
  if (dp.lgAndUp.value) return 'lg';
  if (dp.mdAndUp.value) return 'md';
  if (dp.smAndUp.value) return 'sm';
  return 'xs';
}
