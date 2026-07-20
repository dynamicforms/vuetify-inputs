import { ActionValue } from '@dynamicforms/vue-forms';
import { isBoolean, isObjectLike, isString } from 'lodash-es';

import { ActionDisplayStyle } from './action-display-style';
import { BreakpointsJSON, ResponsiveRenderOptions } from './responsive-render-options';

export interface ActionRenderOptions extends ActionValue {
  /** Unique identifier for the action. Purely informational to `<df-actions>` itself - it is not used for
   * rendering - but by convention should match the key under which the action is registered in a
   * `FormActions` (`Record<string, Action>`) map passed to `@dynamicforms/vuetify-modal-form-kit`'s
   * `modal.message()`/`modal.yesNo()`/etc. That map key (or the action's `fieldName`, when it's part of a
   * `Form.Group`) - not this `name` field - is what the modal's promise actually resolves with; keeping them
   * in sync is what lets callers do e.g. `if (await modal.yesNo(...) === 'yes')`. */
  name?: string;
  /** How the action is rendered: {@link ActionDisplayStyle.BUTTON} for a tonal `<v-btn>`, or
   * {@link ActionDisplayStyle.TEXT} for a text-variant `<v-btn>`. */
  renderAs?: ActionDisplayStyle;
  /** Whether the label is shown. If `label` is empty, the label is never shown regardless of this flag. */
  showLabel?: boolean;
  /** Whether the icon is shown. If `icon` is empty, the icon is never shown regardless of this flag. */
  showIcon?: boolean;
  /** Marks this as the action to trigger on Enter when rendered inside `<df-modal>` (see that component's
   * `onKeydown` in `@dynamicforms/vuetify-modal-form-kit`) - e.g. a "Save" or "Yes" action. In `<df-actions>` it
   * also colors the button `primary`, unless overridden via `passthroughAttrs.color`. At most one action in a
   * given set should set this. */
  defaultConfirm?: boolean;
  /** Marks this as the action to trigger on Escape when rendered inside `<df-modal>` (see that component's
   * `onKeydown` in `@dynamicforms/vuetify-modal-form-kit`) - e.g. a "Cancel" or "No" action. In `<df-actions>` it
   * also colors the button `secondary`, unless overridden via `passthroughAttrs.color`. At most one action in a
   * given set should set this (an action such as `Action.closeAction()` may set both `defaultConfirm` and
   * `defaultReject` so it fires on either key). */
  defaultReject?: boolean;
  /** Additional props/attrs forwarded verbatim to the rendered `<v-btn>` (e.g. `color`, `loading`, `density`,
   * `rounded`, `block`, `prependIcon`, ...), taking precedence over `<df-actions>`'s own computed bindings
   * (`variant`, `color`, `disabled`). Mirrors the `passthroughAttrs` convention used by `df-input`/`df-file`/etc
   * (see `helpers/input-base.ts`); it has to live on the action's value here because `<df-actions>` renders a
   * whole array of buttons, not just one. */
  passthroughAttrs?: Record<string, any>;
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
