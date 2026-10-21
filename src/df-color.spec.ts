import { Field } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { hexagonCells } from './helpers/hexagon-palette';
import HexagonPalette from './helpers/hexagon-palette.vue';
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
      { errorText: (error) => (error.code === 'vuetify-inputs.invalid_hex_color' ? 'Neveljavna barva' : undefined) },
    );
    await touch(wrapper);

    expect(wrapper.text()).toContain('Neveljavna barva');
  });

  describe('without alpha', () => {
    it.each(['#f00', 'f00', '#ff0000', 'ff0000'])('accepts %s', async (modelValue) => {
      const wrapper = mountColor({ modelValue, alpha: false });
      await touch(wrapper);

      expect(wrapper.text()).not.toContain('Not a valid hex string');
    });

    it.each(['#f00f', '#ff0000ff', 'red'])('reports an invalid_opaque_hex_color error for %s', async (modelValue) => {
      const wrapper = mountColor(
        { modelValue, alpha: false },
        {
          errorText: (error) =>
            error.code === 'vuetify-inputs.invalid_opaque_hex_color' ? 'Brez prosojnosti' : undefined,
        },
      );
      await touch(wrapper);

      expect(wrapper.text()).toContain('Brez prosojnosti');
    });
  });

  describe('normalize', () => {
    const upper = (value: string) => value.toUpperCase();

    it('shows the normalized color in the swatch', () => {
      const wrapper = mountColor({ modelValue: '#abcdef', normalize: upper });

      expect(wrapper.find('.v-field__prepend-inner div').attributes('style')).toContain('rgb(171, 205, 239)');
      expect(wrapper.find('input').element.value).toBe('#abcdef');
    });

    it('writes a typed valid color normalized when the field loses focus', async () => {
      const control = new Field<string>({ value: '#000' });
      const wrapper = mountColor({ control, normalize: upper });

      await wrapper.find('input').setValue('#abcdef');
      expect(control.value).toBe('#abcdef');

      await touch(wrapper);
      expect(control.value).toBe('#ABCDEF');
    });

    it('leaves a typed invalid value as typed', async () => {
      const normalize = vi.fn(upper);
      const control = new Field<string>({ value: '#000' });
      const wrapper = mountColor({ control, normalize });

      await wrapper.find('input').setValue('red');
      await touch(wrapper);

      expect(control.value).toBe('red');
      expect(normalize).not.toHaveBeenCalledWith('red');
    });
  });

  it('leaves the check to the validators of a bound control', async () => {
    const wrapper = mountColor({ control: new Field({ value: 'red' }) });
    await touch(wrapper);

    expect(wrapper.text()).not.toContain('Not a valid hex string.');
  });

  describe('the picker', () => {
    // jsdom has no canvas: the stub stands in for the picker, with an element of the canvas's class
    const ColorPickerStub = {
      props: ['modelValue', 'mode', 'modes', 'elevation'],
      emits: ['update:modelValue'],
      template: '<div class="color-picker-stub"><div class="v-color-picker-canvas" /></div>',
    };

    async function openPicker(control: Field<string>, props: Record<string, any> = {}) {
      const wrapper = mount(DfColor, {
        props: { control, ...props },
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
    it('sizes the menu to the picker, not to the field', async () => {
      const wrapper = await openPicker(new Field<string>({ value: '#f00' }));

      expect(Number(wrapper.findComponent({ name: 'VMenu' }).props('minWidth'))).toBe(0);
      expect(Number(wrapper.findComponent(ColorPickerStub).props('elevation'))).toBe(0);
      wrapper.unmount();
    });

    it('runs the picker in hexa mode with all its modes by default', async () => {
      const wrapper = await openPicker(new Field<string>({ value: '#f00' }));
      const picker = wrapper.findComponent(ColorPickerStub);

      expect(picker.props('mode')).toBe('hexa');
      expect(picker.props('modes')).toBeUndefined();
      wrapper.unmount();
    });

    it('runs the picker in hex mode without alpha modes under alpha: false', async () => {
      const wrapper = await openPicker(new Field<string>({ value: '#f00' }), { alpha: false });
      const picker = wrapper.findComponent(ColorPickerStub);

      expect(picker.props('mode')).toBe('hex');
      expect(picker.props('modes')).toEqual(['hex', 'rgb', 'hsl']);
      wrapper.unmount();
    });

    it('keeps the raw color in the picker and writes it normalized on OK', async () => {
      const control = new Field<string>({ value: '#ff0000' });
      const wrapper = await openPicker(control, { normalize: (value: string) => value.toUpperCase() });
      const picker = wrapper.findComponent(ColorPickerStub);

      picker.vm.$emit('update:modelValue', '#00ffaa');
      await flushPromises();
      expect(picker.props('modelValue')).toBe('#00ffaa');

      const ok = wrapper.findAllComponents({ name: 'VBtn' }).find((button) => button.text() === 'OK');
      await ok!.trigger('click');

      expect(control.value).toBe('#00FFAA');
      wrapper.unmount();
    });

    it('emits the pending color as preview on opening and on every change, and null on closing', async () => {
      const control = new Field<string>({ value: '#ff0000' });
      const wrapper = await openPicker(control, { normalize: (value: string) => value.toUpperCase() });
      expect(wrapper.emitted('preview')).toEqual([['#FF0000']]);

      wrapper.findComponent(ColorPickerStub).vm.$emit('update:modelValue', '#00ffaa');
      await flushPromises();
      expect(wrapper.emitted('preview')!.at(-1)).toEqual(['#00FFAA']);

      const cancel = wrapper.findAllComponents({ name: 'VBtn' }).find((button) => button.text() === 'Cancel');
      await cancel!.trigger('click');
      await flushPromises();

      expect(wrapper.emitted('preview')!.at(-1)).toEqual([null]);
      expect(control.value).toBe('#ff0000');
      wrapper.unmount();
    });

    it('emits a null preview when OK closes the picker', async () => {
      const wrapper = await openPicker(new Field<string>({ value: '#ff0000' }));

      wrapper.findComponent(ColorPickerStub).vm.$emit('update:modelValue', '#00ffaa');
      await flushPromises();
      expect(wrapper.emitted('preview')!.at(-1)).toEqual(['#00ffaa']);
      const ok = wrapper.findAllComponents({ name: 'VBtn' }).find((button) => button.text() === 'OK');
      await ok!.trigger('click');
      await flushPromises();

      expect(wrapper.emitted('preview')!.at(-1)).toEqual([null]);
      wrapper.unmount();
    });

    it('emits a null preview when the menu closes by a click outside', async () => {
      const wrapper = await openPicker(new Field<string>({ value: '#ff0000' }));

      await wrapper.findComponent({ name: 'VMenu' }).vm.$emit('update:modelValue', false);
      await flushPromises();

      expect(wrapper.emitted('preview')).toEqual([['#ff0000'], [null]]);
      wrapper.unmount();
    });
    describe('hexagon', () => {
      const hexagon = { picker: 'hexagon' };
      const palette = (wrapper: Awaited<ReturnType<typeof openPicker>>) => wrapper.findComponent(HexagonPalette);
      const cellsOf = (wrapper: Awaited<ReturnType<typeof openPicker>>) => palette(wrapper).findAll('.df-hexagon-cell');
      const okButton = (wrapper: Awaited<ReturnType<typeof openPicker>>) =>
        wrapper.findAllComponents({ name: 'VBtn' }).find((button) => button.text() === 'OK')!;

      it('replaces the generic picker with the hexagon palette', async () => {
        const wrapper = await openPicker(new Field<string>({ value: '#f00' }), hexagon);

        expect(wrapper.findComponent(ColorPickerStub).exists()).toBe(false);
        expect(cellsOf(wrapper)).toHaveLength(61);
        wrapper.unmount();
      });

      it('lays out hexagonRings rings', async () => {
        const wrapper = await openPicker(new Field<string>({ value: '#f00' }), { ...hexagon, hexagonRings: 3 });

        expect(cellsOf(wrapper)).toHaveLength(19);
        wrapper.unmount();
      });

      it('shows the level selector only for more than one level', async () => {
        const three = await openPicker(new Field<string>({ value: '#f00' }), hexagon);
        const one = await openPicker(new Field<string>({ value: '#f00' }), { ...hexagon, lightnessLevels: [0.6] });

        expect(three.findComponent({ name: 'VBtnToggle' }).exists()).toBe(true);
        expect(palette(three).findAll('.df-hexagon-palette__levels .v-btn')).toHaveLength(3);
        expect(palette(three).find('.df-hexagon-palette__levels .v-btn').attributes('aria-label')).toBe('Lightness 1');
        expect(one.findComponent({ name: 'VBtnToggle' }).exists()).toBe(false);
        three.unmount();
        one.unmount();
      });

      it('selects the level and the cell nearest to the value on opening', async () => {
        const L = 0.75;
        const cells = hexagonCells(5, L);
        const wrapper = await openPicker(new Field<string>({ value: cells[30].color }), hexagon);

        expect(wrapper.findComponent({ name: 'VBtnToggle' }).props('modelValue')).toBe(2);
        const checked = cellsOf(wrapper).filter((cell) => cell.attributes('aria-checked') === 'true');
        expect(checked.map((cell) => cell.attributes('aria-label'))).toEqual([cells[30].color]);
        expect(checked[0].attributes('tabindex')).toBe('0');
        wrapper.unmount();
      });

      it('writes a clicked cell when OK confirms it', async () => {
        const control = new Field<string>({ value: '#808080' });
        const wrapper = await openPicker(control, hexagon);
        const cell = cellsOf(wrapper)[12];

        await cell.trigger('click');
        await flushPromises();
        expect(control.value).toBe('#808080');
        expect(cell.attributes('aria-checked')).toBe('true');

        await okButton(wrapper).trigger('click');
        expect(control.value).toBe(cell.attributes('aria-label'));
        expect(control.touched).toBe(true);
        wrapper.unmount();
      });

      it('writes a cell on a double-click', async () => {
        const control = new Field<string>({ value: '#808080' });
        const wrapper = await openPicker(control, hexagon);
        const cell = cellsOf(wrapper)[40];

        await cell.trigger('click');
        await cell.trigger('dblclick');

        expect(control.value).toBe(cell.attributes('aria-label'));
        wrapper.unmount();
      });

      it('writes the cell at the same place of another level when the level changes', async () => {
        const control = new Field<string>({ value: hexagonCells(5, 0.6)[20].color });
        const wrapper = await openPicker(control, hexagon);

        await palette(wrapper).findAll('.df-hexagon-palette__levels .v-btn')[0].trigger('click');
        await flushPromises();
        await okButton(wrapper).trigger('click');

        expect(control.value).toBe(hexagonCells(5, 0.45)[20].color);
        wrapper.unmount();
      });

      it('applies normalize to the preview and the written value, not to the pending one', async () => {
        const control = new Field<string>({ value: '#808080' });
        const wrapper = await openPicker(control, { ...hexagon, normalize: (value: string) => value.toUpperCase() });
        const cell = cellsOf(wrapper)[25];
        const raw = cell.attributes('aria-label')!;

        await cell.trigger('click');
        await flushPromises();
        expect(wrapper.emitted('preview')).toEqual([['#808080'], [raw.toUpperCase()]]);
        expect(cell.attributes('aria-checked')).toBe('true');

        await okButton(wrapper).trigger('click');
        await flushPromises();
        expect(control.value).toBe(raw.toUpperCase());
        expect(wrapper.emitted('preview')!.at(-1)).toEqual([null]);
        wrapper.unmount();
      });

      it('moves the focus with the arrow keys and picks with Enter', async () => {
        const control = new Field<string>({ value: hexagonCells(5, 0.6)[0].color });
        const wrapper = await openPicker(control, hexagon);
        const centre = cellsOf(wrapper)[0];

        await centre.trigger('keydown', { key: 'ArrowRight' });
        const focused = cellsOf(wrapper).find((cell) => cell.attributes('tabindex') === '0')!;
        expect(focused.element).toBe(document.activeElement);
        expect(focused.element).not.toBe(centre.element);

        await focused.trigger('keydown', { key: 'Enter' });
        await okButton(wrapper).trigger('click');
        expect(control.value).toBe(focused.attributes('aria-label'));
        wrapper.unmount();
      });
    });
  });
});
