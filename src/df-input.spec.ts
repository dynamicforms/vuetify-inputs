import { Field, Validators } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import DfInput from '@/df-input.vue';
import { type ErrorInput, HtmlString, MdString, type RenderContentNonCallable } from '@/helpers';

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
