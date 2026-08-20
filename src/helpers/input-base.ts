import Form, { MdString, ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { isEmpty, isString } from 'lodash-es';
import { computed, inject, nextTick, ref, shallowRef } from 'vue';

import { VuetifyInputsSettings, vuetifyInputsSettingsKey } from './settings';

export class Label {
  constructor(
    public text: string,
    public icon?: string,
    public iconComponent: string = 'v-icon',
  ) {}
}

export type FieldVariant = 'outlined' | 'plain' | 'underlined' | 'filled' | 'solo' | 'solo-inverted' | 'solo-filled';
export type VuetifyDensity = 'default' | 'comfortable' | 'compact';
export type FieldDensity = 'default' | 'comfortable' | 'compact' | 'inline';

export interface BaseProps<T = any> {
  control?: Form.FieldBase<T>;
  modelValue?: T;
  label?: string | Label | MdString;
  errors?: string[];
  placeholder?: string;
  helpText?: string;
  hint?: string;
  enabled?: boolean;
  visibility?: Form.DisplayMode | string;
  cssClass?: string;
  clearable?: boolean;
  passthroughAttrs?: Record<string, any>;
  density?: FieldDensity;
  variant?: FieldVariant;
}

export const defaultBaseProps = { enabled: undefined, clearable: true };

export interface BaseEmits<T = any> {
  (e: 'update:modelValue', value: T): void;
  (e: 'click:clear'): void;
}

export function useInputBase<T = any>(props: BaseProps<T>, emit: BaseEmits<T>) {
  const settings = inject<VuetifyInputsSettings>(vuetifyInputsSettingsKey, {});
  const injectedDensity = inject<FieldDensity | null>('field-density', null);
  const injectedVariant = inject<FieldVariant | null>('field-variant', null);
  const internalValue = ref<T | null>(null);

  // A write is not a statement about what the control ends up holding. A ValueChangedAction may write a different
  // value back, a disabled field drops the write, and a handler that throws unwinds it. The rendered control has
  // the written value in its DOM by then, so it is the read here that has to correct it - and where the value the
  // control ends up holding is the one it started with, as under a rule that puts back the five characters a
  // six-character write exceeded, the read does not move and Vue schedules no render at all. Holding the written
  // value for one tick makes the read change twice, so the repaint that restores what the control holds happens.
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
        if (props.control && props.control.value !== newValue) {
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
  const errors = computed(() =>
    props.control ? props.control.errors : (props.errors || []).map((error) => new ValidationErrorRenderContent(error)),
  );
  const anyErrors = computed(() => (touched.value && errors.value.length > 0 ? ' ' : undefined));
  const showErrors = computed(() => (touched.value ? errors.value : undefined));
  const enabled = computed(() => (props.control ? props.control.enabled : props.enabled !== false));
  // A control resolves its own mode - vue-forms refuses anything that is not a DisplayMode constant and reads a
  // name case-insensitively. The prop is resolved the same way, so `visibility="hidden"` states what it looks
  // like it states and an unrecognised mode is refused here as loudly as it is there.
  const visibility = computed(() => {
    if (props.control) return props.control.visibility;
    if (props.visibility == null) return Form.DisplayMode.FULL;
    return Form.DisplayMode.fromAny(props.visibility);
  });
  const isRendered = computed(() => visibility.value !== Form.DisplayMode.SUPPRESS);
  const visibilityClass = computed(() => ({
    'd-none': visibility.value === Form.DisplayMode.HIDDEN,
    invisible: visibility.value === Form.DisplayMode.INVISIBLE,
  }));
  const label = computed((): Label =>
    isString(props.label || '') ? new Label(<string>props.label || '') : <Label>props.label,
  );
  const placeholder = computed(() => props.placeholder || '');
  const helpText = computed(() => props.helpText || '');
  const hint = computed(() => props.hint || '');
  const cssClass = computed(() => props.cssClass || '');

  const density = computed(
    (): FieldDensity => props.density ?? injectedDensity ?? settings.defaultDensity ?? 'default',
  );
  const boundDensity = computed((): VuetifyDensity => (density.value === 'inline' ? 'default' : density.value));
  const variant = computed(
    (): FieldVariant => props.variant ?? injectedVariant ?? settings.defaultVariant ?? 'underlined',
  );

  return {
    value,
    valid,
    enabled,
    errors,
    showErrors,
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

      label: label.value.text,
      errorMessages: anyErrors.value,
      // 'error-count': errors?.value.length || 0,
      readonly: !enabled.value,
      disabled: !enabled.value,

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
