import { ActionValue } from '@dynamicforms/vue-forms';
import { isBoolean, isObjectLike, isPlainObject, isString } from 'lodash-es';
import { type MaybeRefOrGetter, toValue } from 'vue';

import { renderContentText } from '../render-content';

import {
  type ActionDisplayStyle,
  actionDisplayStyles,
  defaultDisplayStyle,
  isActionDisplayStyle,
} from './action-display-style';
import { BreakpointNames, BreakpointsJSON, ResponsiveRenderOptions } from './responsive-render-options';
import { shownFlag } from './shown-flag';

export interface ActionRenderOptions extends ActionValue {
  /** The text of the action, rendered when {@link showLabel} is set and the text is not empty. `ActionValue`
   * types this `unknown`, leaving what a label is to the rendering library; here it is a string, a ref to one or a
   * function returning one. A ref or a function is read while the action renders, so a label that follows the
   * locale is `() => t('Save')`. */
  label?: MaybeRefOrGetter<string>;
  /** The icon of the action, a name `vue-cached-icon` resolves, rendered when {@link showIcon} is set and the
   * name is not empty. Typed here for the same reason `label` is. */
  icon?: string;
  /** Identifier of the action; not used for rendering. */
  name?: string;
  /** How the action is rendered: `'button'` for a tonal `<v-btn>`, or `'text'` for a text-variant `<v-btn>`. */
  renderAs?: ActionDisplayStyle;
  /** Whether the label is shown. If `label` is empty, the label is never shown regardless of this flag. */
  showLabel?: boolean;
  /** Whether the icon is shown. If `icon` is empty, the icon is never shown regardless of this flag. */
  showIcon?: boolean;
  /** The action triggered on Enter in a modal, e.g. "Save" or "Yes". In the `<v-btn>` rendering of `<df-actions>`
   * it colours the button `primary` unless `passthroughAttrs.color` is set. At most one action in a set should set
   * this. */
  defaultConfirm?: boolean;
  /** The action triggered on Escape in a modal, e.g. "Cancel" or "No". In the `<v-btn>` rendering of
   * `<df-actions>` it colours the button `secondary` unless `passthroughAttrs.color` is set. At most one action in a
   * set should set this; a single Close action may set both `defaultConfirm` and `defaultReject` to fire on either
   * key. */
  defaultReject?: boolean;
  /** Props and attributes bound to the rendered `<v-btn>` (e.g. `color`, `loading`, `density`, `rounded`, `block`,
   * `prependIcon`), or to the native `<button>` in `simple` mode. They take precedence over `<df-actions>`'s own
   * bindings: `variant`, `color`, `disabled`, `loading`, `elevation`, `size`, `density`, `aria-busy`, and the
   * `aria-label` and `title` of a button that does not show its label. */
  passthroughAttrs?: Record<string, any>;
}
/**
 * What one breakpoint of an action's value may state: the members that describe how the action is drawn.
 * `name`, `defaultConfirm` and `defaultReject` are not among them - which key a modal resolves with, and which
 * key fires the action, are properties of the action itself and do not depend on the width of the screen.
 */
export type ActionBreakpointRenderOptions = Omit<ActionRenderOptions, 'name' | 'defaultConfirm' | 'defaultReject'>;
export type ActionBreakpointOptions = BreakpointsJSON<ActionRenderOptions, ActionBreakpointRenderOptions>;

export class ResponsiveActionRenderOptions extends ResponsiveRenderOptions<ActionRenderOptions> {
  protected cleanBreakpoint(bp?: ActionRenderOptions, defaultIfEmpty: boolean = false): ActionRenderOptions | null {
    if ((!bp || !isObjectLike(bp)) && !defaultIfEmpty) return null;

    const result: ActionRenderOptions = {};
    if (defaultIfEmpty) {
      result.renderAs = defaultDisplayStyle;
      result.showLabel = true;
      result.showIcon = true;
    }

    if (bp) {
      if (bp.renderAs != null) {
        // a style nobody defined is refused rather than drawn as the default
        if (!isActionDisplayStyle(bp.renderAs)) {
          throw new Error(`'${bp.renderAs}' is not an action display style: ${actionDisplayStyles.join(', ')}`);
        }
        result.renderAs = bp.renderAs;
      }
      const label = toValue(bp.label);
      if (isString(label)) result.label = label;
      if (isString(bp.icon)) result.icon = bp.icon;
      if (isBoolean(bp.showLabel)) result.showLabel = bp.showLabel;
      if (isBoolean(bp.showIcon)) result.showIcon = bp.showIcon;
      if (isString(bp.name)) result.name = bp.name;
      if (isBoolean(bp.defaultConfirm)) result.defaultConfirm = bp.defaultConfirm;
      if (isBoolean(bp.defaultReject)) result.defaultReject = bp.defaultReject;
      // copied rather than kept by identity, so the cascade's shallow merge of a later breakpoint's attrs does
      // not write into the object the action holds
      if (isPlainObject(bp.passthroughAttrs)) result.passthroughAttrs = { ...bp.passthroughAttrs };
    }

    return Object.keys(result).length ? result : null;
  }
}

/** `ActionRenderOptions` with the label read: a string. */
export type ResolvedActionRenderOptions = Omit<ActionRenderOptions, 'label'> & {
  label?: string;
  /** The text of the label whether it is shown or not, as an `aria-label` takes it; `undefined` where the label is
   * missing or empty. */
  accessibleLabel?: string;
};

/**
 * What one action renders as at `breakpoint`, read off the value of any `Action`. The members
 * `ActionRenderOptions` adds over `ActionValue` are taken where the value carries them and defaulted where it does
 * not, so an action holding nothing but a label - which is all a `@dynamicforms/vue-forms` `Action` declares -
 * renders as a button showing that label.
 *
 * `label` and `icon` come back only where the matching flag says they are shown, and the flags come back false
 * where there is no text or name to show, so a caller renders each member on its own flag and never on emptiness.
 * `accessibleLabel` is the plain text of the label regardless of `showLabel`, to name a button that does not show it.
 */
export function getRenderOptionsForBreakpoint(
  value: ActionValue,
  breakpoint: BreakpointNames,
): ResolvedActionRenderOptions {
  const options = new ResponsiveActionRenderOptions(value as ActionBreakpointOptions);
  const partial = options.getOptionsForBreakpoint(breakpoint);
  // cleanBreakpoint stored the label read
  const label = partial.label as string | undefined;
  const accessibleLabel = isString(label) ? renderContentText(label) : undefined;
  return {
    name: partial.name,
    label: partial.showLabel ? label : undefined,
    accessibleLabel: accessibleLabel || undefined,
    icon: partial.showIcon ? partial.icon : undefined,
    renderAs: partial.renderAs,
    showLabel: shownFlag(label, partial.showLabel),
    showIcon: shownFlag(partial.icon, partial.showIcon),
    defaultConfirm: partial.defaultConfirm,
    defaultReject: partial.defaultReject,
    passthroughAttrs: partial.passthroughAttrs,
  };
}
