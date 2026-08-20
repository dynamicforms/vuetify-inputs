import { Action as FormAction, IFieldConstructorParams } from '@dynamicforms/vue-forms';
import { isEmpty, isString } from 'lodash-es';
import { computed, Ref } from 'vue';

import { translatableStrings } from '../translations';

import { ActionDisplayStyle } from './action-display-style';
import { ActionBreakpointOptions, ActionRenderOptions, ResponsiveActionRenderOptions } from './action-render-options';
import { BreakpointNames } from './responsive-render-options';

class Action extends FormAction<ActionBreakpointOptions> {
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

  /**
   * @see ActionRenderOptions.label
   *
   * The read is filtered by `showLabel`, so an action rendering icon-only answers `undefined` while carrying a
   * label. The write is the base class's and reaches `value.label` whatever `showLabel` says, so a write followed
   * by a read of an icon-only action does not answer with what was written.
   */
  get label() {
    return this.value.showLabel ? this.value.label : undefined;
  }

  set label(newValue: string | undefined) {
    super.label = newValue;
  }

  /** @see ActionRenderOptions.showLabel */
  get showLabel() {
    return isString(this.value.label) && !isEmpty(this.value.label) ? this.value.showLabel : false;
  }

  /**
   * @see ActionRenderOptions.icon
   *
   * Filtered by `showIcon` on the read, unfiltered on the write - as `label` is.
   */
  get icon() {
    return this.value.showIcon ? this.value.icon : undefined;
  }

  set icon(newValue: string | undefined) {
    super.icon = newValue;
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
