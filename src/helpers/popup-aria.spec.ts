import { Field } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type Component } from 'vue';

import DfColor from '@/df-color.vue';
import DfDateTime from '@/df-datetime.vue';

const popupAttributes = ['aria-haspopup', 'aria-expanded', 'aria-controls', 'aria-owns'];

interface Case {
  name: string;
  component: Component;
  value: string;
  /** the inputs that open a picker */
  inputs: string;
}

const cases: Case[] = [
  { name: 'df-datetime', component: DfDateTime, value: '2026-11-13T09:30:00', inputs: '.v-text-field input' },
  { name: 'df-color', component: DfColor, value: '#ff0000', inputs: 'input' },
];

// jsdom has no canvas, which v-color-picker draws on
const ColorPickerStub = { template: '<div />' };

describe.each(cases)('$name: the picker popup', ({ component, value, inputs }) => {
  const mountField = (access?: 'readonly') =>
    mount(component, {
      props: { label: 'Field', control: new Field<string>({ value, ...(access ? { access } : {}) }) },
      global: { stubs: { VColorPicker: ColorPickerStub } },
      attachTo: document.body,
    });

  it('is announced on each input that opens it, not on its div.v-field', async () => {
    const wrapper = mountField();
    await flushPromises();

    for (const field of wrapper.findAll('.v-field')) {
      for (const attribute of popupAttributes) expect(field.attributes(attribute)).toBeUndefined();
    }
    expect(wrapper.findAll(inputs).length).toBeGreaterThan(0);
    for (const input of wrapper.findAll(inputs)) {
      expect(input.attributes('role')).toBe('combobox');
      expect(input.attributes('aria-haspopup')).toBe('dialog');
      expect(input.attributes('aria-expanded')).toBe('false');
      expect(input.attributes('aria-controls')).toBeUndefined();
    }
  });

  it('is controlled by the input while it is shown', async () => {
    const wrapper = mountField();
    await flushPromises();

    const input = wrapper.find(inputs);
    await input.trigger('keydown', { key: 'ArrowDown' });
    await flushPromises();

    expect(input.attributes('aria-expanded')).toBe('true');
    const popup = document.getElementById(input.attributes('aria-controls')!);
    expect(popup?.getAttribute('role')).toBe('dialog');
    expect(popup?.getAttribute('aria-labelledby') ?? popup?.getAttribute('aria-label')).toBeTruthy();
    for (const field of wrapper.findAll('.v-field')) {
      for (const attribute of popupAttributes) expect(field.attributes(attribute)).toBeUndefined();
    }
  });

  it('is not announced on a read-only field', async () => {
    const wrapper = mountField('readonly');
    await flushPromises();

    for (const input of wrapper.findAll('input')) {
      expect(input.attributes('role')).toBeUndefined();
      for (const attribute of popupAttributes) expect(input.attributes(attribute)).toBeUndefined();
    }
  });
});
