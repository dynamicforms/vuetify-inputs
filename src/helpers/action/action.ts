import { Action as FormAction } from '@dynamicforms/vue-forms';
import { isEmpty, isString } from 'lodash-es';
import { computed, Ref, toValue } from 'vue';

import { ActionBreakpointOptions, getRenderOptionsForBreakpoint } from './action-render-options';
import { BreakpointNames } from './responsive-render-options';

class Action extends FormAction<ActionBreakpointOptions> {
  /** @see getRenderOptionsForBreakpoint, which answers the same for the value of any `Action` */
  getBreakpointValue(breakpoint: Ref<BreakpointNames>) {
    return computed(() => getRenderOptionsForBreakpoint(this.value, breakpoint.value));
  }

  /** The label read: where the value holds a ref or a function, the string it gives now. */
  get label(): string | undefined {
    return toValue(this.value.label);
  }

  set label(newValue: ActionBreakpointOptions['label']) {
    super.label = newValue;
  }

  /** @see ActionRenderOptions.name */
  get name() {
    return this.value.name;
  }

  /**
   * The label as this action renders it: the text where {@link ActionRenderOptions.showLabel} states it is shown,
   * and `undefined` where it is not. `label` is the base class's, and answers the text whatever the flag says.
   */
  get renderedLabel(): string | undefined {
    return this.value.showLabel ? toValue(this.value.label) : undefined;
  }

  /** @see ActionRenderOptions.showLabel */
  get showLabel() {
    const label = toValue(this.value.label);
    return isString(label) && !isEmpty(label) ? this.value.showLabel : false;
  }

  /**
   * The icon as this action renders it: the name where {@link ActionRenderOptions.showIcon} states it is shown,
   * and `undefined` where it is not. `icon` is the base class's, and answers the name whatever the flag says.
   */
  get renderedIcon() {
    return this.value.showIcon ? this.value.icon : undefined;
  }

  /** @see ActionRenderOptions.showIcon */
  get showIcon() {
    return isString(this.value.icon) && !isEmpty(this.value.icon) ? this.value.showIcon : false;
  }

  /** @see ActionRenderOptions.renderAs */
  get renderAs() {
    return this.value.renderAs;
  }

  /** @see ActionRenderOptions.passthroughAttrs */
  get passthroughAttrs() {
    return this.value.passthroughAttrs;
  }
}

export { Action };
