import Form, { ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { isEmpty, isString } from 'lodash-es';
import { computed } from 'vue';

export class Label {
  constructor(public text: string, public icon?: string, public iconComponent: string = 'v-icon') {}
}

export interface BaseProps<T = any> {
  control?: Form.IField<T>,
  modelValue?: T;
  label?: string | Label;
  errors?: string[];
  placeholder?: string;
  helpText?: string;
  hint?: string,
  enabled?: boolean,
  visibility?: Form.DisplayMode,
  cssClass?: string;
  clearable?: boolean;
}

export const defaultBaseProps = { enabled: undefined };

export interface BaseEmits<T = any> {
  (e: 'update:modelValue', value: T): void;

  (e: 'click:clear'): void;
}

export function useInputBase<T = any>(props: BaseProps<T>, emit: BaseEmits<T>) {
  const value = computed({
    get(): T {
      if (props.control) {
        return props.control.value as T;
      }
      return props.modelValue as T;
    },
    set(newValue: T) {
      if (props.control) props.control.value = newValue;
      emit('update:modelValue', newValue);
    },
  });

  if (props.control && !(props.control instanceof Form.FieldBase)) {
    throw new Error('control prop is not a vue-form control instance');
  }

  const valid = computed(() => (props.control ? props.control.valid : true));
  const errors = computed(
    () => (props.control ?
      props.control.errors :
      (props.errors || []).map((error) => new ValidationErrorRenderContent(error))),
  );
  const anyErrors = computed(() => (errors.value.length > 0 ? ' ' : undefined));
  const enabled = computed(() => (props.control ? props.control.enabled : (props.enabled !== false)));
  const visibility = computed(
    () => (props.control ? props.control.visibility : (props.visibility || Form.DisplayMode.FULL)),
  );
  const label = computed(
    (): Label => (isString(props.label || '') ? new Label((<string>props.label) || '') : <Label> props.label),
  );
  const placeholder = computed(() => (props.placeholder || ''));
  const helpText = computed(() => props.helpText || '');
  const hint = computed(() => props.hint || '');
  const cssClass = computed(() => props.cssClass || '');

  return {
    value,
    valid,
    enabled,
    errors,
    visibility,
    label,

    vuetifyBindings: computed(() => ({
      name: props.control?.fieldName,
      class: cssClass.value,

      density: 'default' as 'default',
      variant: 'underlined' as 'underlined',

      label: label.value.text,
      messages: anyErrors.value,
      // 'error-count': errors?.value.length || 0,
      readonly: !enabled.value,
      disabled: !enabled.value,

      placeholder: placeholder.value,
      'persistent-placeholder': !isEmpty(placeholder.value),

      hint: hint.value,
      persistentHint: true, // we want persistent hint always
      hideDetails: <boolean | 'auto' | undefined>'auto', // we want to hide the hint element when hint isn't there
      helpText: helpText.value,
    })),
  };
}
