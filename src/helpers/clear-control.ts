import { translate } from './translations';

/** The `props` of Vuetify's `clear` slot: the field's handlers for its clear control. */
export interface FieldClearProps {
  onClick?: (event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  tabindex?: number;
}

/** The attributes of a clear control that is a button in the tab order. */
export interface ClearControlProps {
  /** `Clear {label}` (translatable key `ClearField`) */
  'aria-label': string;
  onClick: (event: Event) => void;
  /** Enter and Space clear the field; the field does not see the key */
  onKeydown: (event: KeyboardEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

/**
 * The attributes of a field's clear button, named `Clear {label}`. Enter and Space clear the field and do not reach the
 * field, whose Enter opens a select's menu; a held Space clears once. Called while a component renders.
 */
export function clearControlProps(field: FieldClearProps, label: string): ClearControlProps {
  const onClick = (event: Event) => field.onClick?.(event);
  return {
    'aria-label': translate('ClearField', { label }).trim(),
    onClick,
    onKeydown: (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) onClick(event);
    },
    onFocus: field.onFocus,
    onBlur: field.onBlur,
  };
}
