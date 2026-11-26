import { Field, Validators } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import DfInput from '@/df-input.vue';
import {
  type ErrorInput,
  HtmlString,
  MdString,
  type RenderContentNonCallable,
  vuetifyInputsSettingsKey,
} from '@/helpers';

const vuetify = createVuetify({ components, directives });

describe('DfInput', () => {
  describe('as a number input', () => {
    const mountNumber = (control: Field<number | null>, props: Record<string, any>) =>
      mount(DfInput, { props: { control, inputType: 'number', ...props }, global: { plugins: [vuetify] } });

    it.each([
      { name: 'above max', value: 150, props: { max: 100 }, corrected: 100 },
      { name: 'below min', value: -5, props: { min: 0 }, corrected: 0 },
      { name: 'with more decimals than precision', value: 3.456, props: { precision: 2 }, corrected: 3.46 },
    ])('keeps a value $name until the user enters the field', async ({ value, props, corrected }) => {
      const control = new Field<number | null>({ value });
      const wrapper = mountNumber(control, props);
      await flushPromises();

      expect(control.value).toBe(value);
      expect(control.isChanged).toBe(false);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();

      await wrapper.find('input').trigger('focusin');
      await flushPromises();
      expect(control.value).toBe(corrected);
    });

    it('writes nothing on entering a field whose value needs no correction', async () => {
      const control = new Field<number | null>({ value: 5 });
      const wrapper = mountNumber(control, { min: 0, max: 10 });
      await flushPromises();

      await wrapper.find('input').trigger('focusin');
      await flushPromises();
      expect(control.value).toBe(5);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('drops the held correction when the value is set from outside', async () => {
      const control = new Field<number | null>({ value: 150 });
      const wrapper = mountNumber(control, { max: 100 });
      await flushPromises();

      control.value = 50;
      await flushPromises();
      await wrapper.find('input').trigger('focusin');
      await flushPromises();
      expect(control.value).toBe(50);
    });

    describe('on focus with the whole text selected', () => {
      const focusSelected = async (value: number, props: Record<string, any>) => {
        const wrapper = mount(DfInput, {
          props: { control: new Field<number | null>({ value }), inputType: 'number', ...props },
          global: { plugins: [vuetify] },
          attachTo: document.body,
        });
        await flushPromises();
        const input = wrapper.find('input').element as HTMLInputElement;
        const before = input.value;
        input.setSelectionRange(0, before.length);
        input.focus();
        await flushPromises();
        return { input, before };
      };

      it('selects the whole text again when the trailing zeros are trimmed', async () => {
        const { input, before } = await focusSelected(1, { precision: 2 });

        expect(before).toBe('1.00');
        expect(input.value).toBe('1');
        expect([input.selectionStart, input.selectionEnd]).toEqual([0, 1]);
      });

      it('selects the whole text again when a render is pending at focus', async () => {
        const wrapper = mount(DfInput, {
          props: { control: new Field<number | null>({ value: 0 }), inputType: 'number', precision: 2 },
          global: { plugins: [vuetify] },
          attachTo: document.body,
        });
        await flushPromises();
        const input = wrapper.find('input').element as HTMLInputElement;
        expect(input.value).toBe('0.00');
        // the browser shows a selection made before focus() only after the focus handlers of the field
        input.setSelectionRange(0, 0);
        input.addEventListener('focus', () => input.setSelectionRange(0, input.value.length), { once: true });
        wrapper.setProps({ label: 'Quantity' });

        input.focus();
        await flushPromises();

        expect(input.value).toBe('0');
        expect([input.selectionStart, input.selectionEnd]).toEqual([0, 1]);
      });

      it('leaves the selection of a text that is not trimmed', async () => {
        const { input } = await focusSelected(12.34, { precision: 2 });

        expect(input.value).toBe('12.34');
        expect([input.selectionStart, input.selectionEnd]).toEqual([0, 5]);
      });
    });

    describe('with anyDecimalSeparator', () => {
      const vuetifyFor = (locale: string) => createVuetify({ components, directives, locale: { locale } });

      const mountFocused = async (
        locale: string,
        props: Record<string, any>,
        settings: Record<string, any> = {},
        value: number | null = null,
      ) => {
        const control = new Field<number | null>({ value });
        const wrapper = mount(DfInput, {
          props: { control, inputType: 'number', ...props },
          global: { plugins: [vuetifyFor(locale)], provide: { [vuetifyInputsSettingsKey]: settings } },
          attachTo: document.body,
        });
        await flushPromises();
        const input = wrapper.find('input').element as HTMLInputElement;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        await flushPromises();
        return { control, input };
      };

      // what the browser does: beforeinput, and the insertion with an input event unless it is cancelled
      const insert = (input: HTMLInputElement, data: string, inputType: string) => {
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        if (input.dispatchEvent(new InputEvent('beforeinput', { data, inputType, bubbles: true, cancelable: true }))) {
          input.setRangeText(data, start, end, 'end');
          input.dispatchEvent(new InputEvent('input', { data, inputType, bubbles: true }));
        }
      };

      const type = async (input: HTMLInputElement, text: string) => {
        for (const char of text) {
          insert(input, char, 'insertText');
          await flushPromises();
        }
      };

      const paste = async (input: HTMLInputElement, text: string) => {
        const event = new Event('paste', { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
        if (input.dispatchEvent(event)) insert(input, text, 'insertFromPaste');
        await flushPromises();
      };

      it.each([
        { locale: 'en', typed: '1,5', text: '1.5' },
        { locale: 'en', typed: '1.5', text: '1.5' },
        { locale: 'sl', typed: '1.5', text: '1,5' },
        { locale: 'sl', typed: '1,5', text: '1,5' },
      ])('types "$typed" as $text in locale $locale', async ({ locale, typed, text }) => {
        const { control, input } = await mountFocused(locale, { anyDecimalSeparator: true });

        await type(input, typed);

        expect(input.value).toBe(text);
        expect(control.value).toBe(1.5);
      });

      it.each(['en', 'sl'])('ignores a second separator in locale %s', async (locale) => {
        const { control, input } = await mountFocused(locale, { anyDecimalSeparator: true });

        await type(input, '1.5,.2');

        expect(input.value).toBe(locale === 'sl' ? '1,52' : '1.52');
        expect(control.value).toBe(1.52);
      });

      it('replaces a selected separator with a typed one', async () => {
        const { control, input } = await mountFocused('sl', { anyDecimalSeparator: true }, {}, 1.5);
        input.setSelectionRange(1, 2);

        await type(input, '.');

        expect(input.value).toBe('1,5');
        expect(control.value).toBe(1.5);
      });

      it.each([
        { pasted: '1.234,56', value: 1234.56 },
        { pasted: '1,234.56', value: 1234.56 },
        { pasted: '1.234.567', value: 1234.567 },
        { pasted: '1,5', value: 1.5 },
        { pasted: ' 42 ', value: 42 },
      ])('pastes "$pasted" as $value', async ({ pasted, value }) => {
        for (const locale of ['en', 'sl']) {
          const { control, input } = await mountFocused(locale, { anyDecimalSeparator: true });

          await paste(input, pasted);

          expect(control.value).toBe(value);
          expect(input.value).toBe(String(value).replace('.', locale === 'sl' ? ',' : '.'));
        }
      });

      it('keeps the precision limit of v-number-input', async () => {
        const { control, input } = await mountFocused('sl', { anyDecimalSeparator: true, precision: 0 });

        await type(input, '1.5');

        expect(input.value).toBe('15');
        expect(control.value).toBe(15);
      });

      it('applies the anyDecimalSeparator setting of the plugin', async () => {
        const { control, input } = await mountFocused('sl', {}, { anyDecimalSeparator: true });

        await type(input, '1.5');

        expect(control.value).toBe(1.5);
      });

      it('lets the prop turn the setting off', async () => {
        const { control, input } = await mountFocused(
          'sl',
          { anyDecimalSeparator: false },
          { anyDecimalSeparator: true },
        );

        await type(input, '1.5');

        expect(input.value).toBe('15');
        expect(control.value).toBe(15);
      });

      it('leaves typing and pasting to v-number-input when off', async () => {
        const { control, input } = await mountFocused('en', {});

        await type(input, '1,5');
        expect(input.value).toBe('15');
        expect(control.value).toBe(15);

        input.setSelectionRange(0, input.value.length);
        await paste(input, '1.234,56');
        expect(input.value).toBe('1.23456');
        expect(control.value).toBe(1.23456);
      });
    });
  });

  it.each(['text', 'number'] as const)('marks its control touched on blur, as a %s input', async (inputType) => {
    const control = new Field({ value: inputType === 'number' ? 5 : 'x', validators: [new Validators.MinValue(10)] });
    const wrapper = mount(DfInput, { props: { control, inputType }, global: { plugins: [vuetify] } });
    expect(control.touched).toBe(false);

    await wrapper.find('input').trigger('blur');

    expect(control.touched).toBe(true);
  });

  describe('label', () => {
    const mountWithLabel = (label: RenderContentNonCallable) =>
      mount(DfInput, { props: { label, modelValue: '' }, global: { plugins: [vuetify] } });

    it('renders an MdString label as markdown', () => {
      expect(mountWithLabel(new MdString('**Name**')).find('.df-label strong').text()).toBe('Name');
    });

    it('renders an HtmlString label as HTML', () => {
      expect(mountWithLabel(new HtmlString('<em>Name</em>')).find('.df-label em').text()).toBe('Name');
    });

    it('renders a component label', () => {
      const label = { componentName: 'span', componentProps: { class: 'custom-label', title: 'Name' } };

      expect(mountWithLabel(label).find('.df-label .custom-label').attributes('title')).toBe('Name');
    });
  });

  describe('errors prop', () => {
    const mountWithErrors = async (errors: ErrorInput[]) => {
      const wrapper = mount(DfInput, { props: { errors, modelValue: '' }, global: { plugins: [vuetify] } });
      await wrapper.find('input').trigger('blur');
      return wrapper;
    };

    it('renders each error in its own form once touched', async () => {
      const wrapper = await mountWithErrors([
        'Plain',
        new MdString('**Markdown**'),
        new HtmlString('<em>HTML</em>'),
        { componentName: 'span', componentProps: { class: 'custom-error' } },
        { detail: 'A detail' },
      ]);

      expect(wrapper.text()).toContain('Plain');
      expect(wrapper.find('strong').text()).toBe('Markdown');
      expect(wrapper.find('em').text()).toBe('HTML');
      expect(wrapper.find('.custom-error').exists()).toBe(true);
      expect(wrapper.text()).toContain('A detail');
    });
  });
});
