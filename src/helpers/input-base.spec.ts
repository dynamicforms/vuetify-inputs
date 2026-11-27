import Form, { ValidationError } from '@dynamicforms/vue-forms';
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

    const base = <T = any>(props: BaseProps<T> = {}) => {
      const emit = vi.fn();
      return { emit, ...useInputBase(props, emit) };
    };

    describe('value computed property', () => {
      it('reads and writes from control.value when control is provided', async () => {
        const control = new Form.Field<string>({ value: 'initial' });
        const { value, emit } = base<string>({ control });

        expect(value.value).toBe('initial');

        value.value = 'updated';
        await nextTick();

        expect(control.value).toBe('updated');
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'updated');
      });

      it('reads and writes from modelValue when provided', async () => {
        const { value, emit } = base<string>({ modelValue: 'initial' });

        expect(value.value).toBe('initial');

        value.value = 'updated';
        await nextTick();

        expect(emit).toHaveBeenCalledWith('update:modelValue', 'updated');
      });

      it('uses internal state when neither control nor modelValue is provided', async () => {
        const { value, emit } = base<string>();

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
            const normalized = (newValue ?? '').toUpperCase();
            if (normalized !== newValue) field.value = normalized;
            return supr(field, newValue, oldValue);
          }),
        );
        const { value, emit } = base<string>({ control });

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
        const { value } = base<string>({ control });

        expect(() => {
          value.value = 'refused';
        }).toThrow('refused');
        expect(value.value).toBe('refused');

        await nextTick();

        expect(control.value).toBe('initial');
        expect(value.value).toBe('initial');
      });

      it('takes an array write the control accepted as accepted', async () => {
        const control = new Form.Field<number[]>({ value: [] });
        const { value, emit } = base<number[]>({ control });

        const written = [1, 2, 3];
        value.value = written;

        // the element holds its state behind reactive(), so an array reads back as a proxy of what was written.
        // The write stands, so the read answers with what the control holds from the moment it returns - a read
        // answering with the array that was written is the composable treating an accepted write as refused
        expect(control.value).toEqual(written);
        expect(value.value).toBe(control.value);
        expect(value.value).not.toBe(written);
        expect(emit).toHaveBeenCalledWith('update:modelValue', control.value);

        await nextTick();

        expect(value.value).toBe(control.value);
      });

      it('emits update:modelValue on value change', async () => {
        const { value, emit } = base<number>({ modelValue: 42 });

        value.value = 100;
        await nextTick();

        expect(emit).toHaveBeenCalledWith('update:modelValue', 100);
      });
    });

    describe('control validation', () => {
      it('throws error if control is not a FieldBase instance', () => {
        const invalidControl = { value: 'test' } as any;
        expect(() => base({ control: invalidControl })).toThrow('control prop is not a vue-form control instance');
      });

      it('does not throw error if control is a FieldBase instance', () => {
        const validControl = new Form.Field({ value: 'test' });
        expect(() => base({ control: validControl })).not.toThrow();
      });
    });

    describe('touched', () => {
      it('binds to control.touched when control is provided', async () => {
        const control = new Form.Field({ value: 'test' });
        const { touched } = base({ control });

        expect(touched.value).toBe(false);

        control.touched = true;
        await nextTick();

        expect(touched.value).toBe(true);

        touched.value = false;
        await nextTick();

        expect(control.touched).toBe(false);
      });

      it('uses standalone ref when control is not provided', async () => {
        const { touched } = base();

        expect(touched.value).toBe(false);

        touched.value = true;
        await nextTick();

        expect(touched.value).toBe(true);
      });
    });

    describe('valid', () => {
      it('returns control.valid when control is provided', () => {
        const control = new Form.Field({ value: 'test' });
        const { valid } = base({ control });

        expect(valid.value).toBe(control.valid);
      });

      it('returns true when control is not provided', () => {
        const { valid } = base();

        expect(valid.value).toBe(true);
      });
    });

    describe('errors', () => {
      it('returns control.errors when control is provided', () => {
        const control = new Form.Field({ value: '' });
        control.errors = [new ValidationError('vue-forms.required', {}, 'Required field')];
        const { errors } = base({ control });

        expect(errors.value).toEqual(control.errors);
        expect(errors.value).toHaveLength(1);
      });

      it('converts props.errors to application errors whose detail is the text when control is not provided', () => {
        const { errors } = base({ errors: ['Error 1', 'Error 2'] });

        expect(errors.value).toHaveLength(2);
        expect(errors.value[0]).toBeInstanceOf(ValidationError);
        expect(errors.value.map((e) => [e.detail, e.origin])).toEqual([
          ['Error 1', 'application'],
          ['Error 2', 'application'],
        ]);
      });

      it('returns empty array when no errors and no control', () => {
        const { errors } = base();

        expect(errors.value).toEqual([]);
      });

      it('shownErrors holds an error back until the control is touched', async () => {
        const control = new Form.Field({ value: '' });
        control.errors = [new ValidationError('vue-forms.required', {}, 'Required field')];
        const { shownErrors, touched } = base({ control });

        expect(shownErrors.value).toEqual([]);

        touched.value = true;
        await nextTick();

        expect(shownErrors.value).toEqual(control.errors);
      });

      it('shownErrors shows an error the server returned at once', () => {
        const control = new Form.Field({ value: '' });
        control.errors = [new ValidationError('taken', {}, 'Taken', 'server')];

        const { shownErrors, touched } = base({ control });

        expect(touched.value).toBe(false);
        expect(shownErrors.value).toHaveLength(1);
      });

      it('shownErrors shows nothing for a control that is sent nowhere', () => {
        const control = new Form.Field({ value: '' });
        const section = new Form.Group({ control }, { access: 'disabled-null' });
        control.errors = [new ValidationError('taken', {}, 'Taken', 'server')];
        control.touched = true;

        const { shownErrors } = base({ control });

        expect(section.fields.control.effectiveAccess).toBe('disabled');
        expect(shownErrors.value).toEqual([]);
      });

      it('anyErrors returns space when touched and has errors', async () => {
        const control = new Form.Field({ value: '' });
        control.errors = [new ValidationError('vue-forms.required', {}, 'Required field')];
        const result = base({ control });

        expect(result.vuetifyBindings.value.errorMessages).toBeUndefined();

        result.touched.value = true;
        await nextTick();

        expect(result.vuetifyBindings.value.errorMessages).toBe(' ');
      });
    });

    describe('enabled', () => {
      it('returns control.enabled when control is provided', () => {
        const control = new Form.Field({ value: 'test', access: 'disabled' });
        const { enabled } = base({ control });

        expect(enabled.value).toBe(false);
      });

      it('returns props.enabled !== false when control is not provided', () => {
        expect(base({ enabled: true }).enabled.value).toBe(true);
        expect(base({ enabled: false }).enabled.value).toBe(false);
        expect(base().enabled.value).toBe(true);
      });

      it('is false while a container above the element is disabled', () => {
        const section = new Form.Group({ amount: new Form.Field({ value: 1 }) });
        const { enabled, vuetifyBindings } = base({ control: section.fields.amount });

        expect(enabled.value).toBe(true);

        section.access = 'disabled';

        expect(section.fields.amount.enabled).toBe(true);
        expect(enabled.value).toBe(false);
        expect(vuetifyBindings.value.disabled).toBe(true);
        expect(vuetifyBindings.value.readonly).toBe(true);
      });

      it('draws an element of a read-only container read-only, not disabled', () => {
        const section = new Form.Group({ amount: new Form.Field({ value: 1 }) }, { access: 'readonly' });
        const { enabled, vuetifyBindings } = base({ control: section.fields.amount });

        expect(enabled.value).toBe(false);
        expect(vuetifyBindings.value.readonly).toBe(true);
        expect(vuetifyBindings.value.disabled).toBe(false);
      });

      it("draws a 'disabled-null' element disabled", () => {
        const control = new Form.Field({ value: 1, access: 'disabled-null' });
        const { vuetifyBindings } = base({ control });

        expect(vuetifyBindings.value.readonly).toBe(true);
        expect(vuetifyBindings.value.disabled).toBe(true);
      });

      it('draws an input disabled by the enabled prop disabled', () => {
        const { vuetifyBindings } = base({ enabled: false });

        expect(vuetifyBindings.value.readonly).toBe(true);
        expect(vuetifyBindings.value.disabled).toBe(true);
      });
    });

    describe('visibility', () => {
      const fromProp = (visibility: Form.Visibility): BaseProps => ({ visibility });
      const fromControl = (visibility: Form.Visibility): BaseProps => ({
        control: new Form.Field({ value: 'test', visibility }),
      });

      it('returns control.visibility when control is provided', () => {
        const control = new Form.Field({ value: 'test', visibility: 'hidden' });
        const { visibility } = base({ control });

        expect(visibility.value).toBe('hidden');
      });

      it('takes the visibility it names', () => {
        const { visibility, isRendered } = base({ visibility: 'hidden' });

        expect(visibility.value).toBe('hidden');
        expect(isRendered.value).toBe(true);
      });

      it('refuses a string that is none of the four visibilities', () => {
        const { visibility } = base({ visibility: 'hiden' as Form.Visibility });

        expect(() => visibility.value).toThrow("'hiden' is not a visibility");
      });

      it("is 'full' when the prop names nothing", () => {
        const { visibility } = base();

        expect(visibility.value).toBe('full');
      });

      it('control.visibility takes precedence over the visibility prop', () => {
        const control = new Form.Field({ value: 'test', visibility: 'suppress' });
        const result = base({ control, visibility: 'full' });

        expect(result.visibility.value).toBe('suppress');
        expect(result.isRendered.value).toBe(false);
      });

      it('isRendered is false only for SUPPRESS when driven by control', () => {
        expect(base(fromControl('full')).isRendered.value).toBe(true);
        expect(base(fromControl('hidden')).isRendered.value).toBe(true);
        expect(base(fromControl('suppress')).isRendered.value).toBe(false);
      });

      it('isRendered is false only for SUPPRESS when driven by the visibility prop', () => {
        expect(base(fromProp('full')).isRendered.value).toBe(true);
        expect(base(fromProp('hidden')).isRendered.value).toBe(true);
        expect(base(fromProp('suppress')).isRendered.value).toBe(false);
      });

      it('isRendered is true when no control and no visibility prop', () => {
        const { isRendered } = base();

        expect(isRendered.value).toBe(true);
      });

      it.each([
        ['full', { 'd-none': false, invisible: false }],
        ['invisible', { 'd-none': false, invisible: true }],
        ['hidden', { 'd-none': true, invisible: false }],
        ['suppress', { 'd-none': false, invisible: false }],
      ] as const)('visibilityClass for %s, driven by the control and by the prop alike', (visibility, classes) => {
        expect(base(fromControl(visibility)).visibilityClass.value).toEqual(classes);
        expect(base(fromProp(visibility)).visibilityClass.value).toEqual(classes);
      });

      it('visibilityClass follows the control rather than the visibility prop', () => {
        const control = new Form.Field({ value: 'test', visibility: 'hidden' });
        const { visibilityClass } = base({ control, visibility: 'full' });

        expect(visibilityClass.value).toEqual({ 'd-none': true, invisible: false });
      });

      it('visibilityClass sets no class when no control and no visibility prop', () => {
        const { visibilityClass } = base();

        expect(visibilityClass.value).toEqual({ 'd-none': false, invisible: false });
      });

      it('isRendered and visibilityClass follow control.visibility changes', async () => {
        const control = new Form.Field({ value: 'test' });
        const { isRendered, visibilityClass } = base({ control });

        expect(isRendered.value).toBe(true);
        expect(visibilityClass.value).toEqual({ 'd-none': false, invisible: false });

        control.visibility = 'invisible';
        await nextTick();

        expect(visibilityClass.value).toEqual({ 'd-none': false, invisible: true });

        control.visibility = 'suppress';
        await nextTick();

        expect(isRendered.value).toBe(false);
      });
    });

    describe('label', () => {
      it('converts string label to Label object', () => {
        const { label } = base({ label: 'Test Label' });

        expect(label.value).toBeInstanceOf(Label);
        expect(label.value.text).toBe('Test Label');
      });

      it('keeps Label object as is', () => {
        const labelObj = new Label('Test', 'icon');
        const { label } = base({ label: labelObj });

        expect(label.value).toBe(labelObj);
        expect(label.value.text).toBe('Test');
        expect(label.value.icon).toBe('icon');
      });

      it('returns Label with empty string when no label provided', () => {
        const { label } = base();

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
          cssClass: 'from-field',
        });
        const { label, vuetifyBindings } = base({ control });

        expect(label.value.text).toBe('From the field');
        expect(vuetifyBindings.value.hint).toBe('A hint');
        expect(vuetifyBindings.value.placeholder).toBe('Type here');
        expect(vuetifyBindings.value.class).toBe('from-field');
      });

      it('lets the prop win over what the element carries', () => {
        const control = new Form.Field({ value: '' });
        control.setExtendedValues({ label: 'From the field', density: 'compact' });
        const { label, density } = base({ control, label: 'From the tag', density: 'comfortable' });

        expect(label.value.text).toBe('From the tag');
        expect(density.value).toBe('comfortable');
      });

      it('takes the density and variant the element carries over the injected ones', () => {
        mockInjectValues.set('field-density', 'default');
        mockInjectValues.set('field-variant', 'underlined');
        const control = new Form.Field({ value: '' });
        control.setExtendedValues({ density: 'inline', variant: 'outlined' });
        const { density, vuetifyBindings } = base({ control });

        expect(density.value).toBe('inline');
        expect(vuetifyBindings.value.variant).toBe('outlined');
      });

      it('follows a later write of the presentation', async () => {
        const control = new Form.Field({ value: '' });
        const { label } = base({ control });

        expect(label.value.text).toBe('');

        control.setExtendedValues({ label: 'Named later' });
        await nextTick();

        expect(label.value.text).toBe('Named later');
      });
    });

    describe('placeholder, hint, cssClass', () => {
      it('returns provided values', () => {
        const result = base({
          placeholder: 'Enter value',
          hint: 'This is hint',
          cssClass: 'custom-class',
        });

        expect(result.vuetifyBindings.value.placeholder).toBe('Enter value');
        expect(result.vuetifyBindings.value.hint).toBe('This is hint');
        expect(result.vuetifyBindings.value.class).toBe('custom-class');
      });

      it('returns empty strings as defaults', () => {
        const result = base();

        expect(result.vuetifyBindings.value.placeholder).toBe('');
        expect(result.vuetifyBindings.value.hint).toBe('');
        expect(result.vuetifyBindings.value.class).toBe('');
      });
    });

    describe('density', () => {
      it('uses props.density when provided', () => {
        const { density } = base({ density: 'compact' });

        expect(density.value).toBe('compact');
      });

      it('uses injected field-density when props.density is not provided', () => {
        mockInjectValues.set('field-density', 'comfortable');
        const { density } = base();

        expect(density.value).toBe('comfortable');
      });

      it('uses settings.defaultDensity when no props or inject', () => {
        const settings: VuetifyInputsSettings = { defaultDensity: 'compact' };
        mockInjectValues.set(vuetifyInputsSettingsKey, settings);
        const { density } = base();

        expect(density.value).toBe('compact');
      });

      it('defaults to "default" when nothing is provided', () => {
        const { density } = base();

        expect(density.value).toBe('default');
      });

      it('defaults to "default" with an empty settings object', () => {
        mockInjectValues.set(vuetifyInputsSettingsKey, {});

        const { density } = base();

        expect(density.value).toBe('default');
      });

      it('follows a change of the density prop', async () => {
        const props: BaseProps = reactive({ density: 'compact' });

        const { density, densityClass } = base(props);

        expect(density.value).toBe('compact');

        props.density = 'comfortable';
        await nextTick();

        expect(density.value).toBe('comfortable');
        expect(densityClass.value).toBe('df-density-comfortable');
      });

      it('boundDensity converts inline to default', () => {
        const result = base({ density: 'inline' });

        expect(result.vuetifyBindings.value.density).toBe('default');
      });

      it('boundDensity keeps other values as is', () => {
        const result = base({ density: 'compact' });

        expect(result.vuetifyBindings.value.density).toBe('compact');
      });

      it('densityClass returns correct class name', () => {
        const { densityClass } = base({ density: 'compact' });

        expect(densityClass.value).toBe('df-density-compact');
      });
    });

    describe('variant', () => {
      it('uses props.variant when provided', () => {
        const result = base({ variant: 'outlined' });

        expect(result.vuetifyBindings.value.variant).toBe('outlined');
      });

      it('uses injected field-variant when props.variant is not provided', () => {
        mockInjectValues.set('field-variant', 'filled');
        const result = base();

        expect(result.vuetifyBindings.value.variant).toBe('filled');
      });

      it('uses settings.defaultVariant when no props or inject', () => {
        const settings: VuetifyInputsSettings = { defaultVariant: 'solo' };
        mockInjectValues.set(vuetifyInputsSettingsKey, settings);
        const result = base();

        expect(result.vuetifyBindings.value.variant).toBe('solo');
      });

      it('defaults to "underlined" when nothing is provided', () => {
        const result = base();

        expect(result.vuetifyBindings.value.variant).toBe('underlined');
      });

      it('binds "inverted" as solo on the surface-variant background', () => {
        const result = base({ variant: 'inverted' });

        expect(result.vuetifyBindings.value.variant).toBe('solo');
        expect(result.vuetifyBindings.value.bgColor).toBe('surface-variant');
      });

      it('binds no background for a Vuetify variant', () => {
        const result = base({ variant: 'solo-inverted' });

        expect(result.vuetifyBindings.value.variant).toBe('solo-inverted');
        expect(result.vuetifyBindings.value.bgColor).toBeUndefined();
      });
    });

    describe('vuetifyBindings', () => {
      it('maps all properties correctly', () => {
        // fieldName is a read-only accessor the containing Group writes, so the field is declared inside one
        const control = new Form.Group({ testField: new Form.Field({ value: 'test' }) }).fields.testField;
        const { vuetifyBindings } = base({
          control,
          label: 'Test Label',
          placeholder: 'Enter text',
          hint: 'Test hint',
          cssClass: 'custom-class',
          density: 'compact',
          variant: 'outlined',
          passthroughAttrs: { 'data-test': 'value' },
        });

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
        expect(bindings['aria-invalid']).toBeUndefined();
        // @ts-expect-error vuetifyBindings doesn't have a declaration for passthroughAttrs
        expect(bindings['data-test']).toBe('value');
      });

      it('sets persistent-placeholder to false when placeholder is empty', () => {
        const { vuetifyBindings } = base({ placeholder: '' });

        expect(vuetifyBindings.value['persistent-placeholder']).toBe(false);
      });

      it('merges passthroughAttrs into bindings', () => {
        const { vuetifyBindings } = base({
          passthroughAttrs: {
            'custom-attr': 'custom-value',
            'another-attr': 123,
          },
        });

        // @ts-expect-error vuetifyBindings doesn't have a declaration for passthroughAttrs
        expect(vuetifyBindings.value['custom-attr']).toBe('custom-value');
        // @ts-expect-error vuetifyBindings doesn't have a declaration for passthroughAttrs
        expect(vuetifyBindings.value['another-attr']).toBe(123);
      });

      it('passthroughAttrs can override default bindings', () => {
        const { vuetifyBindings } = base({
          hint: 'original hint',
          passthroughAttrs: {
            hint: 'overridden hint',
          },
        });

        expect(vuetifyBindings.value.hint).toBe('overridden hint');
      });
    });
  });
});
