import { Action as FormAction, IField, IFieldConstructorParams } from '@dynamicforms/vue-forms';
import { isEmpty, isString } from 'lodash-es';
import { computed, Ref } from 'vue';

import { translatableStrings } from '../translations';

import { ActionDisplayStyle } from './action-display-style';
import { ActionBreakpointOptions, ActionRenderOptions, ResponsiveActionRenderOptions } from './action-render-options';
import { BreakpointNames } from './responsive-render-options';

// @ts-expect-error: prevent TS from complaining how create method is not ok because its declaration differs from Fld's
class Action extends FormAction<ActionBreakpointOptions> {
  static create<T extends ActionBreakpointOptions = ActionBreakpointOptions>(
    params?: Partial<IFieldConstructorParams<T>>,
  ): Action {
    return super.create<T>(params) as any as Action;
  }

  getBreakpointValue(breakpoint: Ref<BreakpointNames>) {
    return computed(() => {
      const responsiveValue = new ResponsiveActionRenderOptions(this.value);
      const partial = responsiveValue.getOptionsForBreakpoint(breakpoint.value);
      return {
        name: partial.name,
        label: partial.showLabel ? partial.label : undefined,
        icon: partial.showIcon ? partial.icon : undefined,
        renderAs: partial.renderAs,
        showLabel: isString(partial.label) && !isEmpty(partial.label) ? partial.showLabel : false,
        showIcon: isString(partial.icon) && !isEmpty(partial.icon) ? partial.showIcon : false,
      } as ActionRenderOptions;
    });
  }

  /** @see ActionRenderOptions.name */
  get name() {
    return this.value.name;
  }

  /** @see ActionRenderOptions.label */
  get label() {
    return this.value.showLabel ? this.value.label : undefined;
  }

  /** @see ActionRenderOptions.showLabel */
  get showLabel() {
    return isString(this.value.label) && !isEmpty(this.value.label) ? this.value.showLabel : false;
  }

  /** @see ActionRenderOptions.icon */
  get icon() {
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

  static closeAction(data?: Partial<IField<ActionBreakpointOptions>>) {
    const init: Partial<IField<ActionBreakpointOptions>> = {
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
    return Action.create(init);
  }

  static yesAction(data?: Partial<IField<ActionBreakpointOptions>>) {
    const init: Partial<IField<ActionBreakpointOptions>> = {
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
    return Action.create(init);
  }

  static noAction(data?: Partial<IField<ActionBreakpointOptions>>) {
    const init: Partial<IField<ActionBreakpointOptions>> = {
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
    return Action.create(init);
  }
}

export { Action };
