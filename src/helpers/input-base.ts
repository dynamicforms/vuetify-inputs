import Form, { ValidationError } from '@dynamicforms/vue-forms';
import { isEmpty } from 'lodash-es';
import { computed, type ComputedRef, inject, nextTick, type Ref, ref, shallowRef, toRaw } from 'vue';

import { type ErrorInput, toErrorDescription } from './error-text';
import { type RenderContentNonCallable, renderContentText } from './render-content';
import { VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';
import { selectShownErrors } from './shown-errors';

/** A field's label: its content, and an icon shown before it. */
export class Label {
  constructor(
    public text: RenderContentNonCallable,
    public icon?: string,
    public iconComponent: string = 'v-icon',
  ) {}
}

export type FieldVariant = 'outlined' | 'plain' | 'underlined' | 'filled' | 'solo' | 'solo-inverted' | 'solo-filled';
export type VuetifyDensity = 'default' | 'comfortable' | 'compact';
export type FieldDensity = 'default' | 'comfortable' | 'compact' | 'inline';
/** Vuetify's own `size` prop (`v-btn`, `v-icon`, ...) also accepts an arbitrary CSS length or number, so this
 *  keeps that but still offers the named sizes for autocomplete: `(string & {})` is a plain `string` to the type
 *  checker (any string is still assignable) but not to a union with string literals, which is what makes an IDE
 *  suggest the literals instead of collapsing them into `string`. */
export type VuetifyButtonSize = 'x-small' | 'small' | 'default' | 'large' | 'x-large' | (string & {}) | number;

/**
 * The presentation an element carries for the components in this library.
 *
 * Every one of these is also a prop, and the prop wins where both state something: a call site is more specific
 * than the element it renders. What the element carries is what a form declared in code says about itself, so a
 * field that names its own label needs no attribute at the tag that draws it.
 *
 * `Extras` is @dynamicforms/vue-forms' augmentation point for exactly this, so these properties are typed on every
 * element in an application that installs this library, the fields written inline in a `Group` declaration
 * included.
 */
declare module '@dynamicforms/vue-forms' {
  interface Extras {
    label?: RenderContentNonCallable | Label;
    placeholder?: string;
    helpText?: string;
    hint?: string;
    cssClass?: string;
    density?: FieldDensity;
    variant?: FieldVariant;
  }
}

export interface BaseProps<T = any> {
  control?: Form.FieldBase<T>;
  modelValue?: T;
  label?: RenderContentNonCallable | Label;
  errors?: ErrorInput[];
  placeholder?: string;
  helpText?: string;
  hint?: string;
  enabled?: boolean;
  visibility?: Form.Visibility;
  cssClass?: string;
  clearable?: boolean;
  passthroughAttrs?: Record<string, any>;
  density?: FieldDensity;
  variant?: FieldVariant;
}

export const defaultBaseProps = { enabled: undefined, clearable: true };

/** What `InputBase`'s `default` slot receives: Vuetify's `v-field` slot props. `prepend-inner` receives them without
 * `props`. */
export interface InputBaseSlotProps {
  /** Attributes for the control: its `id`, `class` and ARIA attributes. */
  props: Record<string, unknown>;
  isActive: Ref<boolean>;
  isFocused: Ref<boolean>;
  iconColor: ComputedRef<string | undefined>;
  controlRef: Ref<HTMLElement | undefined>;
  /** Sets the field's focused state. */
  focus: () => void;
  /** Clears the field's focused state. */
  blur: () => void;
}

export interface BaseEmits<T = any> {
  (e: 'update:modelValue', value: T): void;
  (e: 'click:clear'): void;
}

/**
 * The state and Vuetify bindings an input shares with every other input. `componentErrors` are the errors the
 * component finds in the value itself, reported where no `control` is bound; a bound control reports through its
 * own validators.
 */
export function useInputBase<T = any>(
  props: BaseProps<T>,
  emit: BaseEmits<T>,
  componentErrors?: () => ValidationError[],
) {
  const settings = inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});
  const injectedDensity = inject<FieldDensity | null>('field-density', null);
  const injectedVariant = inject<FieldVariant | null>('field-variant', null);
  const internalValue = ref<T | null>(null);

  // A write is not a statement about what the control ends up holding. A ValueChangedAction may write a different value
  // back, and a handler that throws unwinds it. The rendered control has the written value in its DOM by then, so it is
  // the read here that has to correct it - and where the value the control ends up holding is the one it started with,
  // as under a rule that puts back the five characters a six-character write exceeded, the read does not move and Vue
  // schedules no render at all. Holding the written value for one tick makes the read change twice, so the repaint that
  // restores what the control holds happens.
  const pendingWrite = shallowRef<{ value: T } | null>(null);

  const value = computed({
    get(): T {
      if (pendingWrite.value) return pendingWrite.value.value;
      if (props.control) return props.control.value as T;
      if (props.modelValue === undefined) return internalValue.value as T;
      return props.modelValue as T;
    },
    set(newValue: T) {
      try {
        if (props.control) props.control.value = newValue;
      } finally {
        // compared as the write was made: an element holds its state behind reactive(), so an array or an object
        // reads back as a proxy of what was written and an identity comparison would answer that every such write
        // was refused. Object.is over the raw objects answers for NaN as well
        if (props.control && !Object.is(toRaw(props.control.value as any), toRaw(newValue as any))) {
          pendingWrite.value = { value: newValue };
          nextTick(() => {
            pendingWrite.value = null;
          });
        }
      }
      if (props.modelValue === undefined) internalValue.value = newValue;
      emit('update:modelValue', props.control ? (props.control.value as T) : newValue);
    },
  });

  if (props.control && !(props.control instanceof Form.FieldBase)) {
    throw new Error('control prop is not a vue-form control instance');
  }

  const controlTouch = computed({
    get() {
      return props.control!.touched;
    },
    set(val: boolean) {
      props.control!.touched = val;
    },
  });
  const touched = props.control ? controlTouch : ref(false);
  const valid = computed(() => (props.control ? props.control.valid : true));
  // an error of the errors prop is selected as a ValidationError and rendered as it was given
  const givenErrors = computed(() => {
    const given = new Map<ValidationError, ErrorInput>();
    (props.errors ?? []).forEach((input) => {
      const { code, params, detail, origin } = toErrorDescription(input);
      given.set(new ValidationError(code, params, detail, origin), input);
    });
    return given;
  });
  const errors = computed(() =>
    props.control ? props.control.errors : [...givenErrors.value.keys(), ...(componentErrors?.() ?? [])],
  );
  // what the user is shown, by the rule selectShownErrors states and the application's shownErrors setting
  const shownErrors = computed((): ErrorInput[] =>
    selectShownErrors(errors.value, props.control, touched.value, settings).map(
      (error) => givenErrors.value.get(error) ?? error,
    ),
  );
  const anyErrors = computed(() => (shownErrors.value.length > 0 ? ' ' : undefined));
  // effectiveEnabled is false where the element or any container above it accepts no input, so the inputs of a
  // 'readonly' or disabled section accept none either
  const enabled = computed(() => (props.control ? props.control.effectiveEnabled : props.enabled !== false));
  // an input is drawn disabled where its element sends no value, as an HTML control: 'readonly' is submitted and
  // drawn read-only, 'disabled' and 'disabled-null' are drawn disabled
  const disabled = computed(() => {
    if (!props.control) return !enabled.value;
    const access = props.control.effectiveAccess;
    return access === 'disabled' || access === 'disabled-null';
  });
  // A control states its own visibility - vue-forms refuses anything that is not one of the four. The prop is held to
  // the same, so an unrecognised visibility is refused here as loudly as it is there.
  const visibility = computed((): Form.Visibility => {
    if (props.control) return props.control.visibility;
    if (props.visibility == null) return Form.defaultVisibility;
    if (!Form.isVisibility(props.visibility)) {
      throw new Error(`'${props.visibility}' is not a visibility: ${Form.visibilityValues.join(', ')}`);
    }
    return props.visibility;
  });
  const isRendered = computed(() => visibility.value !== 'suppress');
  const visibilityClass = computed(() => ({
    'd-none': visibility.value === 'hidden',
    invisible: visibility.value === 'invisible',
  }));
  // the presentation the bound element carries: what a prop does not state is taken from here before any default
  const extra = computed(() => props.control?.extra ?? {});

  const label = computed((): Label => {
    const stated = props.label ?? extra.value.label;
    return stated instanceof Label ? stated : new Label(stated ?? '');
  });
  const placeholder = computed(() => props.placeholder ?? extra.value.placeholder ?? '');
  const helpText = computed(() => props.helpText ?? extra.value.helpText ?? '');
  const hint = computed(() => props.hint ?? extra.value.hint ?? '');
  const cssClass = computed(() => props.cssClass ?? extra.value.cssClass ?? '');

  const density = computed(
    (): FieldDensity => props.density ?? extra.value.density ?? injectedDensity ?? settings.defaultDensity ?? 'default',
  );
  const boundDensity = computed((): VuetifyDensity => (density.value === 'inline' ? 'default' : density.value));
  const variant = computed(
    (): FieldVariant =>
      props.variant ?? extra.value.variant ?? injectedVariant ?? settings.defaultVariant ?? 'underlined',
  );

  return {
    value,
    valid,
    enabled,
    errors,
    shownErrors,
    visibility,
    isRendered,
    visibilityClass,
    label,
    touched,
    density,
    densityClass: computed(() => `df-density-${density.value}`),

    vuetifyBindings: computed(() => ({
      name: props.control?.fieldName,
      class: cssClass.value,

      density: boundDensity.value,
      variant: variant.value,

      label: renderContentText(label.value.text),
      errorMessages: anyErrors.value,
      // 'error-count': errors?.value.length || 0,
      readonly: !enabled.value,
      disabled: disabled.value,

      placeholder: placeholder.value,
      'persistent-placeholder': !isEmpty(placeholder.value),

      hint: hint.value,
      persistentHint: true, // we want persistent hint always
      hideDetails: <boolean | 'auto' | undefined>'auto', // we want to hide the hint element when hint isn't there
      helpText: helpText.value,

      ...(props.passthroughAttrs || {}),
    })),
  };
}
