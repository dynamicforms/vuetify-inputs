import { Field } from '@dynamicforms/vue-forms';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from './helpers/settings';

import DfColor from '@/df-color.vue';

const vuetify = createVuetify({ components, directives });

function mountColor(props: Record<string, any>, settings: VuetifyInputsSettings = {}) {
  return mount(DfColor, { props, global: { plugins: [vuetify], provide: { [vuetifyInputsSettingsKey]: settings } } });
}

async function touch(wrapper: ReturnType<typeof mountColor>) {
  await wrapper.find('input').trigger('blur');
}

describe('DfColor', () => {
  it('reports an invalid_hex_color error for a value that is not a hex color, once touched', async () => {
    const wrapper = mountColor({ modelValue: 'red' });
    expect(wrapper.text()).not.toContain('Not a valid hex string.');

    await touch(wrapper);

    expect(wrapper.text()).toContain('Not a valid hex string.');
  });

  it.each(['#f00', 'f00', '#ff0000', '#ff0000ff', 'ff0000ff'])('accepts %s', async (modelValue) => {
    const wrapper = mountColor({ modelValue });
    await touch(wrapper);

    expect(wrapper.text()).not.toContain('Not a valid hex string.');
  });

  it('accepts an empty value only with allowNull', async () => {
    const allowed = mountColor({ modelValue: '', allowNull: true });
    const refused = mountColor({ modelValue: '', allowNull: false });
    await touch(allowed);
    await touch(refused);

    expect(allowed.text()).not.toContain('Not a valid hex string.');
    expect(refused.text()).toContain('Not a valid hex string.');
  });

  it('renders the error through the errorText setting by its code', async () => {
    const wrapper = mountColor(
      { modelValue: 'red' },
      { errorText: (error) => (error.code === 'invalid_hex_color' ? 'Neveljavna barva' : undefined) },
    );
    await touch(wrapper);

    expect(wrapper.text()).toContain('Neveljavna barva');
  });

  it('leaves the check to the validators of a bound control', async () => {
    const wrapper = mountColor({ control: new Field({ value: 'red' }) });
    await touch(wrapper);

    expect(wrapper.text()).not.toContain('Not a valid hex string.');
  });

  it('marks a bound field touched when the picker closes', async () => {
    const control = new Field<string>({ value: '#f00' });
    // jsdom has no canvas for the picker the open menu renders
    const wrapper = mount(DfColor, {
      props: { control },
      global: { plugins: [vuetify], stubs: { VColorPicker: true } },
    });
    const menu = wrapper.findComponent({ name: 'VMenu' });

    await menu.vm.$emit('update:modelValue', true);
    expect(control.touched).toBe(false);
    await menu.vm.$emit('update:modelValue', false);

    expect(control.touched).toBe(true);
  });
});
