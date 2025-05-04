import { Action as FormAction, ExecuteAction } from '@dynamicforms/vue-forms';
import { isString } from 'lodash-es';

import { ActionDisplayStyle } from './action-display-style';
import { ResponsiveLabelRenderOptions, BreakpointsJSON, LabelRenderOptions } from './responsive-render-options';

export interface ActionJSON {
  // [key: `action${string}`]: ActionHandler;
  name?: string;
  label?: string;
  icon?: string;
  displayStyle?: BreakpointsJSON<LabelRenderOptions>;
  field_name?: string;
}

export interface ActionsJSON {
  [key: string]: ActionJSON;
}

class Action {
  public readonly name: string;

  public displayStyle: ResponsiveLabelRenderOptions;

  public formAction: FormAction;

  constructor(data: ActionJSON, formAction: FormAction) {
    if (data.name == null) throw new Error(`Action name must not be empty ${data}`);
    // any non-string or empty string must resolve as null for label
    const label = !isString(data.label) || data.label.length === 0 ? undefined : data.label;
    // any non-string or empty string must resolve as null for icon
    const icon = !isString(data.icon) || data.icon.length === 0 ? undefined : data.icon;

    this.name = data.name;
    this.displayStyle = new ResponsiveLabelRenderOptions({ label, ...data.displayStyle });
    this.formAction = formAction;

    this.formAction.icon = icon;
    this.formAction.label = label;
  }

  get label() {
    return this.formAction?.label;
  }

  get labelAvailable() {
    return this.formAction.label !== undefined;
  }

  get icon() {
    return this.formAction?.icon;
  }

  get iconAvailable() {
    return this.formAction.icon !== undefined;
  }

  static actionFormName(actionName: string): string {
    return `$action${actionName.charAt(0).toUpperCase()}${actionName.slice(1)}`;
  }

  private static makeFormAction(actionOrExecuteHandler?: FormAction | ExecuteAction): FormAction {
    let fa: FormAction;
    if (actionOrExecuteHandler instanceof ExecuteAction) {
      fa = FormAction.create().registerAction(actionOrExecuteHandler);
    } else if (actionOrExecuteHandler === undefined) {
      fa = FormAction.create();
    } else if (actionOrExecuteHandler instanceof FormAction) {
      fa = actionOrExecuteHandler;
    } else {
      throw new Error('actionOrExecuteHandler is not of any of supported types');
    }
    return fa;
  }

  static closeAction(data: ActionJSON, actionOrExecuteHandler?: FormAction | ExecuteAction) {
    return new Action(
      {
        name: 'close',
        label: 'Close', // TODO: needs translation
        icon: 'close-outline',
        displayStyle: { renderAs: ActionDisplayStyle.BUTTON, showLabel: true, showIcon: true },
        ...data, // any properties in data should overwrite properties in the constant
      },
      this.makeFormAction(actionOrExecuteHandler),
    );
  }

  static yesAction(data: ActionJSON, actionOrExecuteHandler?: FormAction | ExecuteAction) {
    return new Action(
      {
        name: 'yes',
        label: 'Yes', // TODO: needs translation
        icon: 'thumbs-up-outline',
        displayStyle: { renderAs: ActionDisplayStyle.BUTTON, showLabel: true, showIcon: true },
        ...data, // any properties in data should overwrite properties in the constant
      },
      this.makeFormAction(actionOrExecuteHandler),
    );
  }

  static noAction(data: ActionJSON, actionOrExecuteHandler?: FormAction | ExecuteAction) {
    return new Action(
      {
        name: 'no',
        label: 'No', // TODO: needs translation
        icon: 'thumbs-down-outline',
        displayStyle: { renderAs: ActionDisplayStyle.BUTTON, showLabel: true, showIcon: true },
        ...data, // any properties in data should overwrite properties in the constant
      },
      this.makeFormAction(actionOrExecuteHandler),
    );
  }
}

export { Action };
