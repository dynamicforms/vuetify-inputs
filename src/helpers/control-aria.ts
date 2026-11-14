import type { InputBaseControlProps } from './input-base';

/** The ARIA attributes of `InputBase`'s control props, for the element the user operates. */
export function controlAria(controlProps: InputBaseControlProps) {
  return {
    'aria-labelledby': controlProps['aria-labelledby'],
    'aria-label': controlProps['aria-label'],
    'aria-describedby': controlProps['aria-describedby'],
    'aria-invalid': controlProps['aria-invalid'],
  };
}
