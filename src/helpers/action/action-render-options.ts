import { ActionValue } from '@dynamicforms/vue-forms';
import { isBoolean, isObjectLike, isString } from 'lodash-es';

import { ActionDisplayStyle } from './action-display-style';
import { BreakpointsJSON, ResponsiveRenderOptions } from './responsive-render-options';

export interface ActionRenderOptions extends ActionValue {
  name?: string;
  renderAs?: ActionDisplayStyle;
  showLabel?: boolean;
  showIcon?: boolean;
}
export type ActionBreakpointOptions = BreakpointsJSON<ActionRenderOptions>;

export class ResponsiveActionRenderOptions extends ResponsiveRenderOptions<ActionRenderOptions> {
  protected cleanBreakpoint(bp?: ActionRenderOptions, defaultIfEmpty: boolean = false): ActionRenderOptions | null {
    if ((!bp || !isObjectLike(bp)) && !defaultIfEmpty) return null;

    const result: ActionRenderOptions = {};
    if (defaultIfEmpty) {
      result.renderAs = ActionDisplayStyle.BUTTON;
      result.showLabel = true;
      result.showIcon = true;
    }

    if (bp) {
      if (bp.renderAs != null) result.renderAs = ActionDisplayStyle.fromAny(bp.renderAs);
      if (isString(bp.label)) result.label = bp.label;
      if (isString(bp.icon)) result.icon = bp.icon;
      if (isBoolean(bp.showLabel)) result.showLabel = bp.showLabel;
      if (isBoolean(bp.showIcon)) result.showIcon = bp.showIcon;
    }

    return Object.keys(result).length ? result : null;
  }
}
