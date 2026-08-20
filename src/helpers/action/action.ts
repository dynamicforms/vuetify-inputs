import { Action as FormAction, IFieldConstructorParams } from '@dynamicforms/vue-forms';
import { isEmpty, isString } from 'lodash-es';
import { computed, Ref } from 'vue';

import { translatableStrings } from '../translations';

import { ActionDisplayStyle } from './action-display-style';
import { ActionBreakpointOptions, getRenderOptionsForBreakpoint } from './action-render-options';
import { BreakpointNames } from './responsive-render-options';

class Action extends FormAction<ActionBreakpointOptions> {
  /** @see getRenderOptionsForBreakpoint, which answers the same for the value of any `Action` */
  getBreakpointValue(breakpoint: Ref<BreakpointNames>) {
    return computed(() => getRenderOptionsForBreakpoint(this.value, breakpoint.value));
  }

  /** @see ActionRenderOptions.name */
  get name() {
    return this.value.name;
  }

  /**
   * The label as this action renders it: the text where {@link ActionRenderOptions.showLabel} states it is shown,
   * and `undefined` where it is not. `label` is the base class's, and answers the text whatever the flag says.
   */
  get renderedLabel() {
    return this.value.showLabel ? this.value.label : undefined;
  }

  /** @see ActionRenderOptions.showLabel */
  get showLabel() {
    return isString(this.value.label) && !isEmpty(this.value.label) ? this.value.showLabel : false;
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

  /** @see ActionRenderOptions.defaultConfirm */
  get defaultConfirm() {
    return this.value.defaultConfirm;
  }

  /** @see ActionRenderOptions.defaultReject */
  get defaultReject() {
    return this.value.defaultReject;
  }

  /** @see ActionRenderOptions.passthroughAttrs */
  get passthroughAttrs() {
    return this.value.passthroughAttrs;
  }

  static closeAction(data?: Partial<IFieldConstructorParams<ActionBreakpointOptions>>) {
    const init: Partial<IFieldConstructorParams<ActionBreakpointOptions>> = {
      ...(data ?? {}), // any properties in data should overwrite properties in the constant
      value: {
        name: 'close',
        label: translatableStrings.Close,
        icon: 'ion-close-outline',
        renderAs: ActionDisplayStyle.BUTTON,
        showLabel: true,
        showIcon: true,
      },
    };
    init.value = { ...init.value, ...(data?.value ?? {}) }; // data may only contain partial info of the value
    return new Action(init);
  }

  static yesAction(data?: Partial<IFieldConstructorParams<ActionBreakpointOptions>>) {
    const init: Partial<IFieldConstructorParams<ActionBreakpointOptions>> = {
      ...(data ?? {}), // any properties in data should overwrite properties in the constant
      value: {
        name: 'yes',
        label: translatableStrings.Yes,
        icon: 'ion-thumbs-up-outline',
        renderAs: ActionDisplayStyle.BUTTON,
        showLabel: true,
        showIcon: true,
      },
    };
    init.value = { ...init.value, ...(data?.value ?? {}) }; // data may only contain partial info of the value
    return new Action(init);
  }

  static noAction(data?: Partial<IFieldConstructorParams<ActionBreakpointOptions>>) {
    const init: Partial<IFieldConstructorParams<ActionBreakpointOptions>> = {
      ...(data ?? {}), // any properties in data should overwrite properties in the constant
      value: {
        name: 'no',
        label: translatableStrings.No,
        icon: 'ion-thumbs-down-outline',
        renderAs: ActionDisplayStyle.BUTTON,
        showLabel: true,
        showIcon: true,
      },
    };
    init.value = { ...init.value, ...(data?.value ?? {}) }; // data may only contain partial info of the value
    return new Action(init);
  }
}

export { Action };
