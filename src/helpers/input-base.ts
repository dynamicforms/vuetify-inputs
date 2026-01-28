import Form, { MdString, ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { isEmpty, isString } from 'lodash-es';
import { computed, inject, ref } from 'vue';

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
  control?: Form.IField<T>;
  modelValue?: T;
  label?: string | Label | MdString;
  errors?: string[];
  placeholder?: string;
  helpText?: string;
  hint?: string;
  enabled?: boolean;
  visibility?: Form.DisplayMode;
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
  const internalValue = ref<T | null>(null);

  const value = computed({
    get(): T {
      if (props.control) return props.control.value as T;
      if (props.modelValue === undefined) return internalValue.value as T;
      return props.modelValue as T;
    },
    set(newValue: T) {
      if (props.control) props.control.value = newValue;
      if (props.modelValue === undefined) internalValue.value = newValue;
      emit('update:modelValue', newValue);
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
  const visibility = computed(() =>
    props.control ? props.control.visibility : props.visibility || Form.DisplayMode.FULL,
  );
  const label = computed(
    (): Label => (isString(props.label || '') ? new Label(<string>props.label || '') : <Label>props.label),
  );
  const placeholder = computed(() => props.placeholder || '');
  const helpText = computed(() => props.helpText || '');
  const hint = computed(() => props.hint || '');
  const cssClass = computed(() => props.cssClass || '');

  const density = computed(
    (): FieldDensity => props.density ?? inject('field-density', null) ?? settings.defaultDensity ?? 'default',
  );
  const boundDensity = computed((): VuetifyDensity => (density.value === 'inline' ? 'default' : density.value));
  const variant = computed(
    (): FieldVariant => props.variant ?? inject('field-variant', null) ?? settings.defaultVariant ?? 'underlined',
  );

  return {
    value,
    valid,
    enabled,
    errors,
    showErrors,
    visibility,
    label,
    touched,
    density: density.value,
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
