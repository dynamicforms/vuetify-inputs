import { Action } from '@dynamicforms/vue-forms';
import { type Locale } from 'date-fns';
import { MaybeRef } from 'vue';

import { BaseProps, FileComms, SelectChoice, SelectFetchChoices } from './helpers';

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
