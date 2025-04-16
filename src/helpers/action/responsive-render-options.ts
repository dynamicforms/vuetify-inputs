import { isBoolean, isObjectLike, isString } from 'lodash-es';

import { ActionDisplayStyle } from './action-display-style';

export interface BreakpointJSON {
  renderAs?: ActionDisplayStyle;
  showLabel?: boolean;
  showIcon?: boolean;
  label?: string;
}

export type BreakpointNames = 'xl' | 'lg' | 'md' | 'sm' | 'xs';
export interface BreakpointsJSON extends BreakpointJSON, Partial<Record<BreakpointNames, BreakpointJSON>> { }

const breakpoints: BreakpointNames[] = ['xl', 'lg', 'md', 'sm', 'xs'];

export default class ResponsiveRenderOptions {
  private readonly _value: BreakpointsJSON;

  constructor(data: BreakpointsJSON | undefined, label?: string) {
    this._value = {};
    if (!data) return;
    let baseOptions = ResponsiveRenderOptions.cleanBreakpoint(data);
    if (!baseOptions?.label && label) {
      if (!baseOptions) baseOptions = { label };
      else if (!baseOptions.label) baseOptions.label = label;
    }
    if (baseOptions) this._value = baseOptions;

    breakpoints.forEach((bp) => {
      const options = ResponsiveRenderOptions.cleanBreakpoint(data[bp]);
      if (options) this._value[bp] = options;
    });
  }

  getOptionsForBreakpoint(breakpoint: BreakpointNames): BreakpointJSON {
    const result = {
      label: this._value.label,
      renderAs: this._value.renderAs ?? ActionDisplayStyle.BUTTON,
      showLabel: this._value.showLabel ?? true,
      showIcon: this._value.showIcon ?? true,
    } as BreakpointJSON;
    const bps = [...breakpoints].reverse();
    for (const bp of bps) {
      const bpData = this._value[bp];
      if (bpData) {
        if (bpData.label != null) result.label = bpData.label;
        if (bpData.renderAs != null) result.renderAs = bpData.renderAs;
        if (bpData.showIcon != null) result.showIcon = bpData.showIcon;
        if (bpData.showLabel != null) result.showLabel = bpData.showLabel;
      }
      if (bp === breakpoint) break;
    }
    return result;
  }

  private static cleanBreakpoint(bp?: BreakpointJSON): BreakpointJSON | null {
    if (!bp || !isObjectLike(bp)) return null;

    const result: BreakpointJSON = {};

    if (bp.renderAs !== undefined) result.renderAs = ActionDisplayStyle.fromAny(bp.renderAs);
    if (isString(bp.label)) result.label = bp.label;
    if (isBoolean(bp.showLabel)) result.showLabel = bp.showLabel;
    if (isBoolean(bp.showIcon)) result.showIcon = bp.showIcon;

    return Object.keys(result).length ? result : null;
  }
}
