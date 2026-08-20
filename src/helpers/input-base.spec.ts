import Form, { ValidationErrorRenderContent } from '@dynamicforms/vue-forms';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import { Label, useInputBase, type BaseProps } from './input-base';
import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from './settings';

// Mock inject globally
const mockInjectValues = new Map<any, any>();
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    inject: (key: any, defaultValue?: any) => {
      return mockInjectValues.get(key) ?? defaultValue;
    },
  };
});

describe('input-base', () => {
  describe('Label class', () => {
    it('creates a label with text only', () => {
      const label = new Label('Test Label');
      expect(label.text).toBe('Test Label');
      expect(label.icon).toBeUndefined();
      expect(label.iconComponent).toBe('v-icon');
    });

    it('creates a label with text and icon', () => {
      const label = new Label('Test Label', 'test-icon');
      expect(label.text).toBe('Test Label');
      expect(label.icon).toBe('test-icon');
      expect(label.iconComponent).toBe('v-icon');
    });

    it('creates a label with custom icon component', () => {
      const label = new Label('Test Label', 'test-icon', 'custom-icon');
      expect(label.text).toBe('Test Label');
      expect(label.icon).toBe('test-icon');
      expect(label.iconComponent).toBe('custom-icon');
    });
  });

  describe('useInputBase', () => {
    beforeEach(() => {
      mockInjectValues.clear();
    });

    describe('value computed property', () => {
      it('reads and writes from control.value when control is provided', async () => {
        const control = new Form.Field<string>({ value: 'initial' });
        const props: BaseProps<string> = { control };
        const emit = vi.fn();

        const { value } = useInputBase(props, emit);

        expect(value.value).toBe('initial');

        value.value = 'updated';
        await nextTick();

        expect(control.value).toBe('updated');
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'updated');
      });

      it('reads and writes from modelValue when provided', async () => {
        const props: BaseProps<string> = { modelValue: 'initial' };
        const emit = vi.fn();

        const { value } = useInputBase(props, emit);

        expect(value.value).toBe('initial');

        value.value = 'updated';
        await nextTick();

        expect(emit).toHaveBeenCalledWith('update:modelValue', 'updated');
      });

      it('uses internal state when neither control nor modelValue is provided', async () => {
        const props: BaseProps<string> = {};
        const emit = vi.fn();

        const { value } = useInputBase(props, emit);

        expect(value.value).toBeNull();

        value.value = 'internal';
        await nextTick();

        expect(value.value).toBe('internal');
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'internal');
      });

      it('emits what the control took, not what was written', async () => {
        const control = new Form.Field<string>({ value: 'initial' });
        control.registerAction(
          new Form.ValueChangedAction<string>((field, supr, newValue, oldValue) => {
            const normalised = (newValue ?? '').toUpperCase();
            if (normalised !== newValue) field.value = normalised;
            return supr(field, newValue, oldValue);
          }),
        );
        const emit = vi.fn();

        const { value } = useInputBase<string>({ control }, emit);

        value.value = 'typed';
        await nextTick();

        expect(control.value).toBe('TYPED');
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'TYPED');
      });

      it('reads back the written value for one tick when the control refuses the write', async () => {
        const control = new Form.Field<string>({ value: 'initial' });
        control.registerAction(
          new Form.ValueChangedAction<string>(() => {
            throw new Error('refused');
          }),
        );
        const emit = vi.fn();

        const { value } = useInputBase<string>({ control }, emit);

        expect(() => {
          value.value = 'refused';
        }).toThrow('refused');
        expect(value.value).toBe('refused');

        await nextTick();

        expect(control.value).toBe('initial');
        expect(value.value).toBe('initial');
      });

      it('emits update:modelValue on value change', async () => {
        const props: BaseProps<number> = { modelValue: 42 };
        const emit = vi.fn();

        const { value } = useInputBase(props, emit);

        value.value = 100;
        await nextTick();

        expect(emit).toHaveBeenCalledWith('update:modelValue', 100);
      });
    });

    describe('control validation', () => {
      it('throws error if control is not a FieldBase instance', () => {
        const invalidControl = { value: 'test' } as any;
        const props: BaseProps = { control: invalidControl };
        const emit = vi.fn();

        expect(() => useInputBase(props, emit)).toThrow('control prop is not a vue-form control instance');
      });

      it('does not throw error if control is a FieldBase instance', () => {
        const validControl = new Form.Field({ value: 'test' });
        const props: BaseProps = { control: validControl };
        const emit = vi.fn();

        expect(() => useInputBase(props, emit)).not.toThrow();
      });
    });

    describe('touched', () => {
      it('binds to control.touched when control is provided', async () => {
        const control = new Form.Field({ value: 'test' });
        const props: BaseProps = { control };
        const emit = vi.fn();

        const { touched } = useInputBase(props, emit);

        expect(touched.value).toBe(false);

        control.touched = true;
        await nextTick();

        expect(touched.value).toBe(true);

        touched.value = false;
        await nextTick();

        expect(control.touched).toBe(false);
      });

      it('uses standalone ref when control is not provided', async () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const { touched } = useInputBase(props, emit);

        expect(touched.value).toBe(false);

        touched.value = true;
        await nextTick();

        expect(touched.value).toBe(true);
      });
    });

    describe('valid', () => {
      it('returns control.valid when control is provided', () => {
        const control = new Form.Field({ value: 'test' });
        const props: BaseProps = { control };
        const emit = vi.fn();

        const { valid } = useInputBase(props, emit);

        expect(valid.value).toBe(control.valid);
      });

      it('returns true when control is not provided', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const { valid } = useInputBase(props, emit);

        expect(valid.value).toBe(true);
      });
    });

    describe('errors', () => {
      it('returns control.errors when control is provided', () => {
        const control = new Form.Field({ value: '' });
        control.errors = [new ValidationErrorRenderContent('Required field')];
        const props: BaseProps = { control };
        const emit = vi.fn();

        const { errors } = useInputBase(props, emit);

        expect(errors.value).toEqual(control.errors);
        expect(errors.value).toHaveLength(1);
      });

      it('converts props.errors array to ValidationErrorRenderContent when control is not provided', () => {
        const props: BaseProps = { errors: ['Error 1', 'Error 2'] };
        const emit = vi.fn();

        const { errors } = useInputBase(props, emit);

        expect(errors.value).toHaveLength(2);
        expect(errors.value[0]).toBeInstanceOf(ValidationErrorRenderContent);
        expect(errors.value[1]).toBeInstanceOf(ValidationErrorRenderContent);
      });

      it('returns empty array when no errors and no control', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const { errors } = useInputBase(props, emit);

        expect(errors.value).toEqual([]);
      });

      it('showErrors returns errors only when touched', async () => {
        const control = new Form.Field({ value: '' });
        control.errors = [new ValidationErrorRenderContent('Required field')];
        const props: BaseProps = { control };
        const emit = vi.fn();

        const { showErrors, touched } = useInputBase(props, emit);

        expect(showErrors.value).toBeUndefined();

        touched.value = true;
        await nextTick();

        expect(showErrors.value).toEqual(control.errors);
      });

      it('anyErrors returns space when touched and has errors', async () => {
        const control = new Form.Field({ value: '' });
        control.errors = [new ValidationErrorRenderContent('Required field')];
        const props: BaseProps = { control };
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.errorMessages).toBeUndefined();

        result.touched.value = true;
        await nextTick();

        expect(result.vuetifyBindings.value.errorMessages).toBe(' ');
      });
    });

    describe('enabled', () => {
      it('returns control.enabled when control is provided', () => {
        const control = new Form.Field({ value: 'test', enabled: false });
        const props: BaseProps = { control };
        const emit = vi.fn();

        const { enabled } = useInputBase(props, emit);

        expect(enabled.value).toBe(false);
      });

      it('returns props.enabled !== false when control is not provided', () => {
        const props1: BaseProps = { enabled: true };
        const props2: BaseProps = { enabled: false };
        const props3: BaseProps = {};
        const emit = vi.fn();

        expect(useInputBase(props1, emit).enabled.value).toBe(true);
        expect(useInputBase(props2, emit).enabled.value).toBe(false);
        expect(useInputBase(props3, emit).enabled.value).toBe(true);
      });
    });

    describe('visibility', () => {
      const fromProp = (visibility: Form.DisplayMode): BaseProps => ({ visibility });
      const fromControl = (visibility: Form.DisplayMode): BaseProps => ({
        control: new Form.Field({ value: 'test', visibility }),
      });

      it('returns control.visibility when control is provided', () => {
        const control = new Form.Field({ value: 'test', visibility: Form.DisplayMode.HIDDEN });
        const props: BaseProps = { control };
        const emit = vi.fn();

        const { visibility } = useInputBase(props, emit);

        expect(visibility.value).toBe(Form.DisplayMode.HIDDEN);
      });

      it('returns props.visibility when provided and no control', () => {
        const props: BaseProps = { visibility: Form.DisplayMode.INVISIBLE };
        const emit = vi.fn();

        const { visibility } = useInputBase(props, emit);

        expect(visibility.value).toBe(Form.DisplayMode.INVISIBLE);
      });

      it('returns DisplayMode.FULL as default when no control and no visibility prop', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const { visibility } = useInputBase(props, emit);

        expect(visibility.value).toBe(Form.DisplayMode.FULL);
      });

      it('control.visibility takes precedence over the visibility prop', () => {
        const control = new Form.Field({ value: 'test', visibility: Form.DisplayMode.SUPPRESS });
        const props: BaseProps = { control, visibility: Form.DisplayMode.FULL };
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.visibility.value).toBe(Form.DisplayMode.SUPPRESS);
        expect(result.isRendered.value).toBe(false);
      });

      it('isRendered is false only for SUPPRESS when driven by control', () => {
        const emit = vi.fn();

        expect(useInputBase(fromControl(Form.DisplayMode.FULL), emit).isRendered.value).toBe(true);
        expect(useInputBase(fromControl(Form.DisplayMode.HIDDEN), emit).isRendered.value).toBe(true);
        expect(useInputBase(fromControl(Form.DisplayMode.INVISIBLE), emit).isRendered.value).toBe(true);
        expect(useInputBase(fromControl(Form.DisplayMode.SUPPRESS), emit).isRendered.value).toBe(false);
      });

      it('isRendered is false only for SUPPRESS when driven by the visibility prop', () => {
        const emit = vi.fn();

        expect(useInputBase(fromProp(Form.DisplayMode.FULL), emit).isRendered.value).toBe(true);
        expect(useInputBase(fromProp(Form.DisplayMode.HIDDEN), emit).isRendered.value).toBe(true);
        expect(useInputBase(fromProp(Form.DisplayMode.INVISIBLE), emit).isRendered.value).toBe(true);
        expect(useInputBase(fromProp(Form.DisplayMode.SUPPRESS), emit).isRendered.value).toBe(false);
      });

      it('isRendered is true when no control and no visibility prop', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const { isRendered } = useInputBase(props, emit);

        expect(isRendered.value).toBe(true);
      });

      it('visibilityClass sets d-none for HIDDEN and invisible for INVISIBLE when driven by control', () => {
        const emit = vi.fn();

        expect(useInputBase(fromControl(Form.DisplayMode.FULL), emit).visibilityClass.value).toEqual({
          'd-none': false,
          invisible: false,
        });
        expect(useInputBase(fromControl(Form.DisplayMode.HIDDEN), emit).visibilityClass.value).toEqual({
          'd-none': true,
          invisible: false,
        });
        expect(useInputBase(fromControl(Form.DisplayMode.INVISIBLE), emit).visibilityClass.value).toEqual({
          'd-none': false,
          invisible: true,
        });
        expect(useInputBase(fromControl(Form.DisplayMode.SUPPRESS), emit).visibilityClass.value).toEqual({
          'd-none': false,
          invisible: false,
        });
      });

      it('visibilityClass sets d-none for HIDDEN and invisible for INVISIBLE from the prop', () => {
        const emit = vi.fn();

        expect(useInputBase(fromProp(Form.DisplayMode.FULL), emit).visibilityClass.value).toEqual({
          'd-none': false,
          invisible: false,
        });
        expect(useInputBase(fromProp(Form.DisplayMode.HIDDEN), emit).visibilityClass.value).toEqual({
          'd-none': true,
          invisible: false,
        });
        expect(useInputBase(fromProp(Form.DisplayMode.INVISIBLE), emit).visibilityClass.value).toEqual({
          'd-none': false,
          invisible: true,
        });
        expect(useInputBase(fromProp(Form.DisplayMode.SUPPRESS), emit).visibilityClass.value).toEqual({
          'd-none': false,
          invisible: false,
        });
      });

      it('visibilityClass follows the control rather than the visibility prop', () => {
        const control = new Form.Field({ value: 'test', visibility: Form.DisplayMode.HIDDEN });
        const props: BaseProps = { control, visibility: Form.DisplayMode.INVISIBLE };
        const emit = vi.fn();

        const { visibilityClass } = useInputBase(props, emit);

        expect(visibilityClass.value).toEqual({ 'd-none': true, invisible: false });
      });

      it('visibilityClass sets no class when no control and no visibility prop', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const { visibilityClass } = useInputBase(props, emit);

        expect(visibilityClass.value).toEqual({ 'd-none': false, invisible: false });
      });

      it('isRendered and visibilityClass follow control.visibility changes', async () => {
        const control = new Form.Field({ value: 'test' });
        const props: BaseProps = { control };
        const emit = vi.fn();

        const { isRendered, visibilityClass } = useInputBase(props, emit);

        expect(isRendered.value).toBe(true);
        expect(visibilityClass.value).toEqual({ 'd-none': false, invisible: false });

        control.visibility = Form.DisplayMode.INVISIBLE;
        await nextTick();

        expect(visibilityClass.value).toEqual({ 'd-none': false, invisible: true });

        control.visibility = Form.DisplayMode.SUPPRESS;
        await nextTick();

        expect(isRendered.value).toBe(false);
      });
    });

    describe('label', () => {
      it('converts string label to Label object', () => {
        const props: BaseProps = { label: 'Test Label' };
        const emit = vi.fn();

        const { label } = useInputBase(props, emit);

        expect(label.value).toBeInstanceOf(Label);
        expect(label.value.text).toBe('Test Label');
      });

      it('keeps Label object as is', () => {
        const labelObj = new Label('Test', 'icon');
        const props: BaseProps = { label: labelObj };
        const emit = vi.fn();

        const { label } = useInputBase(props, emit);

        expect(label.value).toBe(labelObj);
        expect(label.value.text).toBe('Test');
        expect(label.value.icon).toBe('icon');
      });

      it('returns Label with empty string when no label provided', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const { label } = useInputBase(props, emit);

        expect(label.value).toBeInstanceOf(Label);
        expect(label.value.text).toBe('');
      });
    });

    describe('presentation carried by the element', () => {
      it('takes the label, hint, placeholder and css class the element carries', () => {
        const control = new Form.Field({ value: '' });
        control.setExtendedValues({
          label: 'From the field',
          hint: 'A hint',
          placeholder: 'Type here',
          helpText: 'Help',
          cssClass: 'from-field',
        });
        const emit = vi.fn();

        const { label, vuetifyBindings } = useInputBase({ control }, emit);

        expect(label.value.text).toBe('From the field');
        expect(vuetifyBindings.value.hint).toBe('A hint');
        expect(vuetifyBindings.value.placeholder).toBe('Type here');
        expect(vuetifyBindings.value.helpText).toBe('Help');
        expect(vuetifyBindings.value.class).toBe('from-field');
      });

      it('lets the prop win over what the element carries', () => {
        const control = new Form.Field({ value: '' });
        control.setExtendedValues({ label: 'From the field', density: 'compact' });
        const emit = vi.fn();

        const { label, density } = useInputBase({ control, label: 'From the tag', density: 'comfortable' }, emit);

        expect(label.value.text).toBe('From the tag');
        expect(density.value).toBe('comfortable');
      });

      it('takes the density and variant the element carries over the injected ones', () => {
        mockInjectValues.set('field-density', 'default');
        mockInjectValues.set('field-variant', 'underlined');
        const control = new Form.Field({ value: '' });
        control.setExtendedValues({ density: 'inline', variant: 'outlined' });
        const emit = vi.fn();

        const { density, vuetifyBindings } = useInputBase({ control }, emit);

        expect(density.value).toBe('inline');
        expect(vuetifyBindings.value.variant).toBe('outlined');
      });

      it('follows a later write of the presentation', async () => {
        const control = new Form.Field({ value: '' });
        const emit = vi.fn();

        const { label } = useInputBase({ control }, emit);

        expect(label.value.text).toBe('');

        control.setExtendedValues({ label: 'Named later' });
        await nextTick();

        expect(label.value.text).toBe('Named later');
      });
    });

    describe('enabled', () => {
      it('is false while a container above the element is disabled', () => {
        const section = new Form.Group({ amount: new Form.Field({ value: 1 }) });
        const emit = vi.fn();

        const { enabled, vuetifyBindings } = useInputBase({ control: section.fields.amount }, emit);

        expect(enabled.value).toBe(true);

        section.enabled = false;

        expect(section.fields.amount.enabled).toBe(true);
        expect(enabled.value).toBe(false);
        expect(vuetifyBindings.value.disabled).toBe(true);
        expect(vuetifyBindings.value.readonly).toBe(true);
      });
    });

    describe('visibility prop', () => {
      it('resolves a mode named as a string', () => {
        const emit = vi.fn();

        const { visibility, isRendered } = useInputBase({ visibility: 'hidden' }, emit);

        expect(visibility.value).toBe(Form.DisplayMode.HIDDEN);
        expect(isRendered.value).toBe(true);
      });

      it('refuses a mode that names no DisplayMode constant', () => {
        const emit = vi.fn();

        const { visibility } = useInputBase({ visibility: 'hiden' }, emit);

        expect(() => visibility.value).toThrow();
      });

      it('is FULL when the prop names nothing', () => {
        const emit = vi.fn();

        const { visibility } = useInputBase({}, emit);

        expect(visibility.value).toBe(Form.DisplayMode.FULL);
      });
    });

    describe('placeholder, helpText, hint, cssClass', () => {
      it('returns provided values', () => {
        const props: BaseProps = {
          placeholder: 'Enter value',
          helpText: 'This is help',
          hint: 'This is hint',
          cssClass: 'custom-class',
        };
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.placeholder).toBe('Enter value');
        expect(result.vuetifyBindings.value.helpText).toBe('This is help');
        expect(result.vuetifyBindings.value.hint).toBe('This is hint');
        expect(result.vuetifyBindings.value.class).toBe('custom-class');
      });

      it('returns empty strings as defaults', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.placeholder).toBe('');
        expect(result.vuetifyBindings.value.helpText).toBe('');
        expect(result.vuetifyBindings.value.hint).toBe('');
        expect(result.vuetifyBindings.value.class).toBe('');
      });
    });

    describe('density', () => {
      it('uses props.density when provided', () => {
        const props: BaseProps = { density: 'compact' };
        const emit = vi.fn();

        const { density } = useInputBase(props, emit);

        expect(density.value).toBe('compact');
      });

      it('uses injected field-density when props.density is not provided', () => {
        mockInjectValues.set('field-density', 'comfortable');
        const props: BaseProps = {};
        const emit = vi.fn();

        const { density } = useInputBase(props, emit);

        expect(density.value).toBe('comfortable');
      });

      it('uses settings.defaultDensity when no props or inject', () => {
        const settings: VuetifyInputsSettings = { defaultDensity: 'compact' };
        mockInjectValues.set(vuetifyInputsSettingsKey, settings);
        const props: BaseProps = {};
        const emit = vi.fn();

        const { density } = useInputBase(props, emit);

        expect(density.value).toBe('compact');
      });

      it('defaults to "default" when nothing is provided', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const { density } = useInputBase(props, emit);

        expect(density.value).toBe('default');
      });

      it('follows a change of the density prop', async () => {
        const props: BaseProps = reactive({ density: 'compact' });
        const emit = vi.fn();

        const { density, densityClass } = useInputBase(props, emit);

        expect(density.value).toBe('compact');

        props.density = 'comfortable';
        await nextTick();

        expect(density.value).toBe('comfortable');
        expect(densityClass.value).toBe('df-density-comfortable');
      });

      it('boundDensity converts inline to default', () => {
        const props: BaseProps = { density: 'inline' };
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.density).toBe('default');
      });

      it('boundDensity keeps other values as is', () => {
        const props: BaseProps = { density: 'compact' };
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.density).toBe('compact');
      });

      it('densityClass returns correct class name', () => {
        const props: BaseProps = { density: 'compact' };
        const emit = vi.fn();

        const { densityClass } = useInputBase(props, emit);

        expect(densityClass.value).toBe('df-density-compact');
      });
    });

    describe('variant', () => {
      it('uses props.variant when provided', () => {
        const props: BaseProps = { variant: 'outlined' };
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.variant).toBe('outlined');
      });

      it('uses injected field-variant when props.variant is not provided', () => {
        mockInjectValues.set('field-variant', 'filled');
        const props: BaseProps = {};
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.variant).toBe('filled');
      });

      it('uses settings.defaultVariant when no props or inject', () => {
        const settings: VuetifyInputsSettings = { defaultVariant: 'solo' };
        mockInjectValues.set(vuetifyInputsSettingsKey, settings);
        const props: BaseProps = {};
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.variant).toBe('solo');
      });

      it('defaults to "underlined" when nothing is provided', () => {
        const props: BaseProps = {};
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.vuetifyBindings.value.variant).toBe('underlined');
      });
    });

    describe('vuetifyBindings', () => {
      it('maps all properties correctly', () => {
        // fieldName is a read-only accessor the containing Group writes, so the field is declared inside one
        const control = new Form.Group({ testField: new Form.Field({ value: 'test' }) }).fields.testField;
        const props: BaseProps = {
          control,
          label: 'Test Label',
          placeholder: 'Enter text',
          hint: 'Test hint',
          helpText: 'Test help',
          cssClass: 'custom-class',
          density: 'compact',
          variant: 'outlined',
          passthroughAttrs: { 'data-test': 'value' },
        };
        const emit = vi.fn();

        const { vuetifyBindings } = useInputBase(props, emit);

        const bindings = vuetifyBindings.value;

        expect(bindings.name).toBe('testField');
        expect(bindings.class).toBe('custom-class');
        expect(bindings.density).toBe('compact');
        expect(bindings.variant).toBe('outlined');
        expect(bindings.label).toBe('Test Label');
        expect(bindings.readonly).toBe(false);
        expect(bindings.disabled).toBe(false);
        expect(bindings.placeholder).toBe('Enter text');
        expect(bindings['persistent-placeholder']).toBe(true);
        expect(bindings.hint).toBe('Test hint');
        expect(bindings.persistentHint).toBe(true);
        expect(bindings.hideDetails).toBe('auto');
        expect(bindings.helpText).toBe('Test help');
        // @ts-expect-error vuetifyBindings doesn't have a declaration for passthroughAttrs
        expect(bindings['data-test']).toBe('value');
      });

      it('sets readonly and disabled to true when not enabled', () => {
        const props: BaseProps = { enabled: false };
        const emit = vi.fn();

        const { vuetifyBindings } = useInputBase(props, emit);

        expect(vuetifyBindings.value.readonly).toBe(true);
        expect(vuetifyBindings.value.disabled).toBe(true);
      });

      it('sets persistent-placeholder to false when placeholder is empty', () => {
        const props: BaseProps = { placeholder: '' };
        const emit = vi.fn();

        const { vuetifyBindings } = useInputBase(props, emit);

        expect(vuetifyBindings.value['persistent-placeholder']).toBe(false);
      });

      it('merges passthroughAttrs into bindings', () => {
        const props: BaseProps = {
          passthroughAttrs: {
            'custom-attr': 'custom-value',
            'another-attr': 123,
          },
        };
        const emit = vi.fn();

        const { vuetifyBindings } = useInputBase(props, emit);

        // @ts-expect-error vuetifyBindings doesn't have a declaration for passthroughAttrs
        expect(vuetifyBindings.value['custom-attr']).toBe('custom-value');
        // @ts-expect-error vuetifyBindings doesn't have a declaration for passthroughAttrs
        expect(vuetifyBindings.value['another-attr']).toBe(123);
      });

      it('passthroughAttrs can override default bindings', () => {
        const props: BaseProps = {
          hint: 'original hint',
          passthroughAttrs: {
            hint: 'overridden hint',
          },
        };
        const emit = vi.fn();

        const { vuetifyBindings } = useInputBase(props, emit);

        expect(vuetifyBindings.value.hint).toBe('overridden hint');
      });
    });

    describe('settings injection', () => {
      it('uses injected VuetifyInputsSettings', () => {
        const settings: VuetifyInputsSettings = {
          defaultDensity: 'comfortable',
          defaultVariant: 'solo-filled',
        };
        mockInjectValues.set(vuetifyInputsSettingsKey, settings);

        const props: BaseProps = {};
        const emit = vi.fn();

        const result = useInputBase(props, emit);

        expect(result.density.value).toBe('comfortable');
        expect(result.vuetifyBindings.value.variant).toBe('solo-filled');
      });

      it('works with empty settings object', () => {
        mockInjectValues.set(vuetifyInputsSettingsKey, {});

        const props: BaseProps = {};
        const emit = vi.fn();

        const { density } = useInputBase(props, emit);

        expect(density.value).toBe('default');
      });
    });
  });
});
