import { Action, ClassTypes, MdString, ValidationError } from '@dynamicforms/vue-forms';
import { type Locale } from 'date-fns';
import { MaybeRef } from 'vue';
import { DefaultInputSlot } from 'vuetify/lib/components/VField/VField';

import { BaseProps, FileComms, Label, SelectChoice, SelectFetchChoices } from './helpers';

type ShowAsGroup = 'no' | 'grouped' | 'grouped-no-borders';

export interface DfActionsProps {
  /** The actions to draw, this library's `Action` or a bare `@dynamicforms/vue-forms` one: what each button
   * renders as is read off the action's value, and a value stating nothing renders as the defaults. */
  actions: MaybeRef<Action[]>;
  buttonSize?: string | number; // see https://vuetifyjs.com/en/api/v-btn/#props-size
  showAsGroup?: ShowAsGroup;
}

export interface DfCheckboxProps extends BaseProps {
  allowNull?: boolean;
}

export interface DfColorProps extends BaseProps {
  allowNull?: boolean;
}

export interface DfDateTimeProps extends BaseProps {
  inputType?: 'datetime' | 'date' | 'time';
  displayFormatDate?: string;
  displayFormatTime?: string;
  locale?: Locale;
}

export interface DfFileProps extends BaseProps {
  comms: FileComms;
}

export interface DfInputProps extends BaseProps {
  inputType?: 'text' | 'password' | 'email' | 'url' | 'number';
  precision?: number | null;
  step?: number;
  min?: number;
  max?: number;
}

export interface DfInputHintProps {
  /** The errors to render. Rendered in place of {@link message} whenever there is one. */
  errors?: string | ValidationError[];
  /** The message to render, shown while there is no error. */
  message?: string | ValidationError[];
  /** Classes for the rendered errors. Defaults to `text-error`. */
  errorClasses?: ClassTypes;
  /** Classes for the rendered message. Defaults to no class. */
  messageClasses?: ClassTypes;
}

export interface DfLabelProps {
  /** The slot data Vuetify hands a `#label` slot. Where it is given, its `label` is what is rendered. */
  data?: DefaultInputSlot & { label?: string | MdString };
  /** The label to render where no {@link data} is given: its text, and the icon it carries. */
  label: Label;
  /** Whether the label wraps over several lines. It is rendered on one line by default. */
  allowWrap?: boolean;
}

export interface DfRtfEditorProps extends BaseProps {
  minHeight?: string;
}

export interface DfSelectProps extends BaseProps {
  choices?: SelectChoice[];
  multiple?: boolean;
  allowTags?: boolean;
  allowNull?: boolean;
  fetchChoices?: SelectFetchChoices;
}

export interface DfTextAreaProps extends BaseProps {
  rows?: number;
  maxRows?: number;
}
