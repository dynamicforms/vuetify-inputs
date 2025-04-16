/**
 * DisplayMode enum provides an enumeration for supported ways of rendering a particular object in the DOM
 */
enum ActionDisplayStyle {
  // This enum is actually declared in dynamicforms.action.py
  BUTTON = 0, // action should render as a button
  TEXT = 1, // action should render as a link text
}

export const defaultDisplayStyle = ActionDisplayStyle.BUTTON;

namespace ActionDisplayStyle {
  export function fromString(mode: string): ActionDisplayStyle {
    if (mode.toUpperCase() === 'BUTTON') return ActionDisplayStyle.BUTTON;
    if (mode.toUpperCase() === 'TEXT') return ActionDisplayStyle.TEXT;
    return defaultDisplayStyle;
  }

  export function fromAny(mode: any): ActionDisplayStyle {
    const input = (typeof mode === 'number') ? mode : ActionDisplayStyle.fromString(mode as string);
    if (Object.values(ActionDisplayStyle).includes(input)) return input;
    return defaultDisplayStyle;
  }

  export function isDefined(mode: number | string): boolean {
    const check = (typeof mode === 'number') ? mode : ActionDisplayStyle.fromString(mode as string);
    return Object.values(ActionDisplayStyle).includes(check);
  }
}

Object.freeze(ActionDisplayStyle);

export { ActionDisplayStyle };
