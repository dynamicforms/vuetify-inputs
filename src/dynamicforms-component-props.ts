import { Action } from '@dynamicforms/vue-forms';
import { type Locale } from 'date-fns';
import { MaybeRef } from 'vue';

import {
  BaseProps,
  type ClassTypes,
  type ErrorInput,
  FileComms,
  Label,
  type RenderableValue,
  type RenderContent,
  type RenderContentRef,
  SelectChoice,
  SelectFetchChoices,
  VuetifyButtonSize,
  VuetifyDensity,
} from './helpers';

type ShowAsGroup = 'no' | 'grouped' | 'grouped-no-borders';

export interface DfActionsProps {
  /** The actions to draw, this library's `Action` or a bare `@dynamicforms/vue-forms` one: what each button
   * renders as is read off the action's value, and a value stating nothing renders as the defaults. */
  actions: MaybeRef<Action[]>;
  buttonSize?: VuetifyButtonSize; // see https://vuetifyjs.com/en/api/v-btn/#props-size
  /** Forwarded to each button's `density` prop. See https://vuetifyjs.com/en/api/v-btn/#props-density */
  buttonDensity?: VuetifyDensity;
  showAsGroup?: ShowAsGroup;
  /** Renders each action as a native `<button>` without background or border, showing its icon and label in the
   *  surrounding text colour and font, instead of a `v-btn`. `renderAs`, the confirm / reject colours, `buttonSize` and
   *  `buttonDensity` do not apply. Default `false`. */
  simple?: boolean;
}

export interface DfCheckboxProps extends BaseProps {
  allowNull?: boolean;
}

export interface DfColorProps extends BaseProps {
  allowNull?: boolean;
  /** Whether the colour has an alpha channel. `false` runs the picker in `hex` mode without the alpha slider and
   *  accepts only `#rgb` and `#rrggbb`. Default `true`. */
  alpha?: boolean;
  /** Maps a valid colour to the value the component writes and shows in its swatch and `preview` events. The picker
   *  itself works on the unmapped colour. */
  normalize?: (value: string) => string;
  /** The picker in the menu: `'generic'`, Vuetify's colour picker, `'hexagon'`, a palette of hexagon cells, or
   *  `'none'`, only the `picker-prepend` slot. Default `'generic'`. */
  picker?: 'generic' | 'hexagon' | 'none';
  /** The number of rings of the hexagon palette, the centre cell counted as the first: `1 + 3·n·(n − 1)` cells.
   *  Default 5 (61 cells). */
  hexagonRings?: number;
  /** The OKLCH lightness (0..1) of the hexagon palette's cells. `undefined` (default): any lightness from 0 to 1,
   *  chosen with a slider. An integer `n` ≥ 2: `n` levels evenly spaced from 0 to 1, both included; `1`: the single
   *  level 0.5. An array: those levels. A number that is not an integer of at least 1, and an empty array, give the
   *  full range. */
  lightnessLevels?: number | number[];
}

export interface DfDateTimeProps extends BaseProps {
  inputType?: 'datetime' | 'date' | 'time';
  displayFormatDate?: string;
  displayFormatTime?: string;
  locale?: Locale;
}

interface FileUploadProps extends BaseProps {
  comms: FileComms;
  /** Milliseconds between keep-alive touches. Overrides `defaultTouchInterval` from the plugin's
   *  `VuetifyInputsSettings`, which in turn overrides the baked-in default of 60000. */
  touchInterval?: number;
}

export interface DfFileProps extends FileUploadProps {}

/**
 * `comms.upload` must resolve to a value directly usable as an `<img>` src (typically the URL your backend
 * serves the image from): the component has no separate lookup for turning an identifier into a display URL,
 * so it renders `modelValue` itself as the preview once a file has been uploaded.
 */
export interface DfImageProps extends FileUploadProps {}

export interface DfInputProps extends BaseProps {
  inputType?: 'text' | 'password' | 'email' | 'url' | 'number';
  precision?: number | null;
  step?: number;
  min?: number;
  max?: number;
  /**
   * For `inputType: 'number'`: both `.` and `,` act as the decimal separator. A typed one inserts the decimal
   * separator of the number input's locale. In pasted text, a separator repeated with no other one is a thousands
   * separator; otherwise the last `.` or `,` is the decimal separator and the others are thousands separators.
   * Defaults to the `anyDecimalSeparator` setting, else `false`.
   */
  anyDecimalSeparator?: boolean;
}

/** How `DfInputGroup` lays out its children: on one row, on rows that wrap, or in a column. */
export type DfInputGroupDirection = 'row' | 'wrap' | 'column';

export interface DfInputGroupProps extends Pick<
  BaseProps,
  'control' | 'label' | 'errors' | 'hint' | 'enabled' | 'visibility' | 'cssClass' | 'density' | 'variant'
> {
  direction?: DfInputGroupDirection;
}

export interface MessagesWidgetProps {
  /** A plain text, or the items to render, each in its own element: a `RenderableValue` as its content, an error
   * as `errorText()` gives it. */
  message: string | readonly (RenderableValue | ErrorInput)[];
  /** Classes for every rendered item, beside the item's own `extraClasses`. */
  classes?: ClassTypes;
  /** Attributes for the element of every rendered item, or a function that gives them per item (`index` is the
   * item's position; a plain text message is item 0). They are merged with the item's own bindings as Vue merges
   * props: classes, styles and listeners add up, any other attribute replaces the item's own. */
  itemAttrs?: Record<string, unknown> | ((item: RenderableValue, index: number) => Record<string, unknown> | undefined);
}

export interface DfInputHintProps {
  /** The errors to render, in place of {@link message} whenever there is one. A string is text in the user's
   * language; an error description may lack any member. Defaults to the errors the enclosing input shows. */
  errors?: string | readonly (RenderableValue | ErrorInput)[];
  /** The message to render, shown while there is no error: content in any of its forms, or the items to render. */
  message?: RenderContentRef | readonly RenderableValue[];
  /** Classes for the rendered errors. Defaults to `text-error`. */
  errorClasses?: ClassTypes;
  /** Classes for the rendered message. Defaults to no class. */
  messageClasses?: ClassTypes;
  /** The field's hint. While errors are rendered, it is rendered visually hidden after them, for assistive
   * technology. Defaults to the enclosing input's hint. */
  hint?: RenderContentRef;
}

export interface DfLabelProps {
  /** The slot data Vuetify hands a `#label` slot. Its `label`, the label's text, is rendered where {@link label} has
   * no content. */
  data?: { label?: string; props?: Record<string, unknown> };
  /** The label to render: its content in any of the four forms, and the icon it carries. Defaults to the enclosing
   * input's label. */
  label?: Label;
  /** Whether the label wraps over several lines. It is rendered on one line by default. */
  allowWrap?: boolean;
}

export interface DfRtfEditorProps extends BaseProps {
  minHeight?: string;
  /** Size of the toolbar's buttons, forwarded to each one's `size` prop (`v-btn`'s, or `<df-actions>`'s
   * `buttonSize` for the grouped clusters). See https://vuetifyjs.com/en/api/v-btn/#props-size */
  toolbarButtonSize?: VuetifyButtonSize;
  /** `font-family` of the editing area and its named block styles (Title, Subtitle, Info box, Side quote, article
   * category). Defaults to `'inherit'`: the component loads no font of its own, so the editor renders in whatever
   * font the surrounding page already set. Pass any valid CSS `font-family` value to override it; loading the
   * font itself, if it isn't a system font, is the application's responsibility. */
  fontFamily?: string;
}

export interface DfSelectProps extends BaseProps {
  choices?: SelectChoice[];
  multiple?: boolean;
  allowTags?: boolean;
  allowNull?: boolean;
  fetchChoices?: SelectFetchChoices;
  /** Shown in the menu when there are no choices to show. Defaults to the translatable `NoChoices`. */
  noDataText?: RenderContent;
  /** With `fetchChoices`: the length the search text must reach before `fetchChoices` is called for it. */
  minQueryLength?: number;
  /** Shown in the menu in place of `noDataText` while the search text is shorter than `minQueryLength`. Defaults to
   * the translatable `MinQuery`, with `count` = `minQueryLength`. */
  minQueryText?: RenderContent;
  /** With `fetchChoices`: milliseconds the search text must stay unchanged before it is fetched; `0` fetches it at
   * once. */
  fetchDebounce?: number;
}

export interface DfTextAreaProps extends BaseProps {
  rows?: number;
  maxRows?: number;
}
