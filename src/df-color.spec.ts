import { Field } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { vuetifyInputsSettingsKey, type VuetifyInputsSettings } from './helpers/settings';
import { translateStrings } from './helpers/translations';

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

  describe('the picker', () => {
    // jsdom has no canvas: the stub stands in for the picker, with an element of the canvas's class
    const ColorPickerStub = {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<div class="color-picker-stub"><div class="v-color-picker-canvas" /></div>',
    };

    async function openPicker(control: Field<string>) {
      const wrapper = mount(DfColor, {
        props: { control },
        global: { plugins: [vuetify], stubs: { VColorPicker: ColorPickerStub } },
        attachTo: document.body,
      });
      await wrapper.findComponent({ name: 'VMenu' }).vm.$emit('update:modelValue', true);
      await flushPromises();
      return wrapper;
    }

    it('writes a picked color when OK confirms it, and marks the field touched', async () => {
      const control = new Field<string>({ value: '#f00' });
      const wrapper = await openPicker(control);

      wrapper.findComponent(ColorPickerStub).vm.$emit('update:modelValue', '#00ff00');
      await flushPromises();
      expect(control.value).toBe('#f00');

      const ok = wrapper.findAllComponents({ name: 'VBtn' }).find((button) => button.text() === 'OK');
      await ok!.trigger('click');

      expect(control.value).toBe('#00ff00');
      expect(control.touched).toBe(true);
      wrapper.unmount();
    });

    it('enables Cancel before a change and OK after one', async () => {
      const control = new Field<string>({ value: '#f00' });
      const wrapper = await openPicker(control);
      const button = (text: string) => wrapper.findAllComponents({ name: 'VBtn' }).filter((b) => b.text() === text);

      expect(button('Cancel')).toHaveLength(1);
      expect(button('OK')).toHaveLength(1);
      expect(button('Cancel')[0].props('disabled')).toBe(false);
      expect(button('OK')[0].props('disabled')).toBe(true);

      wrapper.findComponent(ColorPickerStub).vm.$emit('update:modelValue', '#00ff00');
      await flushPromises();
      expect(button('OK')[0].props('disabled')).toBe(false);
      wrapper.unmount();
    });

    it("labels the buttons with the library's strings", async () => {
      translateStrings((key) => ({ Cancel: 'Prekliči', Ok: 'Potrdi' })[key] ?? key);
      const wrapper = await openPicker(new Field<string>({ value: '#f00' }));

      const labels = wrapper.findAllComponents({ name: 'VBtn' }).map((b) => b.text());
      expect(labels).toEqual(expect.arrayContaining(['Prekliči', 'Potrdi']));
      translateStrings((key) => key);
      wrapper.unmount();
    });

    it('writes a picked color on a double-click on the canvas', async () => {
      const control = new Field<string>({ value: '#f00' });
      const wrapper = await openPicker(control);

      wrapper.findComponent(ColorPickerStub).vm.$emit('update:modelValue', '#00ff00');
      await flushPromises();
      await wrapper.findComponent(ColorPickerStub).find('.v-color-picker-canvas').trigger('dblclick');

      expect(control.value).toBe('#00ff00');
      expect(control.touched).toBe(true);
      wrapper.unmount();
    });
  });
});
