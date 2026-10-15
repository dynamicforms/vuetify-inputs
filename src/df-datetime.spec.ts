import { Field, ValidationError } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { ja } from 'date-fns/locale';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import DfDateTime from '@/df-datetime.vue';
import { viewSettleMs } from '@/helpers/picker-double-click';

describe('DfDateTime', () => {
  let vuetify: any;

  beforeEach(() => {
    vuetify = createVuetify({ components });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  const mountDateTime = (props: Record<string, any>) =>
    mount(DfDateTime, { props: { label: 'When', ...props }, global: { plugins: [vuetify] } });

  const inputs = (wrapper: ReturnType<typeof mountDateTime>) =>
    wrapper.findAll('input').map((input) => (input.element as HTMLInputElement).value);

  describe('in a time zone with daylight saving time, in summer', () => {
    beforeAll(() => {
      vi.stubEnv('TZ', 'Europe/Ljubljana');
    });

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-07-01T12:00:00+02:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([['2026-01-15T10:00:00+01:00'], ['2026-01-15T09:00:00Z'], ['2026-07-15T10:00:00+02:00']])(
      'shows %s without writing into the field',
      async (value) => {
        const control = new Field<string | null>({ value });
        const wrapper = mountDateTime({ control });

        await flushPromises();
        expect(control.value).toBe(value);
        expect(control.isChanged).toBe(false);
        expect(inputs(wrapper)[1]).toBe('10:00');
      },
    );

    it('writes an edited winter time with the winter offset', async () => {
      const control = new Field<string | null>({ value: '2026-01-15T10:00:00+01:00' });
      const wrapper = mountDateTime({ control });

      await wrapper.findAll('input')[1].setValue('11:30');
      await wrapper.findAll('input')[1].trigger('blur');
      await flushPromises();
      expect(control.value).toBe('2026-01-15T11:30:00+01:00');
      expect(inputs(wrapper)[1]).toBe('11:30');
    });

    it('writes an edited summer time with the summer offset', async () => {
      const control = new Field<string | null>({ value: '2026-07-15T10:00:00+02:00' });
      const wrapper = mountDateTime({ control });

      await wrapper.findAll('input')[1].setValue('11:30');
      await wrapper.findAll('input')[1].trigger('blur');
      await flushPromises();
      expect(control.value).toBe('2026-07-15T11:30:00+02:00');
    });

    it('leaves a disabled field as it is', async () => {
      const control = new Field<string | null>({ value: '2026-01-15T09:00:00Z', access: 'disabled' });
      mountDateTime({ control });

      await flushPromises();
      expect(control.value).toBe('2026-01-15T09:00:00Z');
      expect(control.isChanged).toBe(false);
    });
  });

  describe('west of Greenwich', () => {
    beforeAll(() => {
      vi.stubEnv('TZ', 'America/New_York');
    });

    it('shows a date without a time as that date', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      const wrapper = mountDateTime({ control, inputType: 'date' });

      await flushPromises();
      expect(inputs(wrapper)[0]).toBe('15. 01. 26');
      expect(control.value).toBe('2026-01-15');
    });
  });

  describe('a typed time', () => {
    it.each([
      ['12:30 AM', '00:30:00'],
      ['12:30 PM', '12:30:00'],
      ['1:05 am', '01:05:00'],
      ['11:59 PM', '23:59:00'],
      ['18:43', '18:43:00'],
    ])('reads %s as %s', async (typed, expected) => {
      const control = new Field<string | null>({ value: '10:00:00' });
      const wrapper = mountDateTime({ control, inputType: 'time' });

      await wrapper.find('input').setValue(typed);
      await wrapper.find('input').trigger('blur');
      await flushPromises();
      expect(control.value).toBe(expected);
    });

    it.each([['13:00 PM'], ['0:30 AM'], ['24:00'], ['10:60']])('leaves the value as it is for %s', async (typed) => {
      const control = new Field<string | null>({ value: '10:00:00' });
      const wrapper = mountDateTime({ control, inputType: 'time' });

      await wrapper.find('input').setValue(typed);
      await wrapper.find('input').trigger('blur');
      await flushPromises();
      expect(control.value).toBe('10:00:00');
    });
  });

  describe('typed text', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 9, 15, 12, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('keeps the text as typed and the value as it is until the field loses focus', async () => {
      const control = new Field<string | null>({ value: '10:00:00' });
      const wrapper = mountDateTime({ control, inputType: 'time' });
      const input = wrapper.find('input');

      await input.setValue('184');
      await flushPromises();
      expect(control.value).toBe('10:00:00');
      expect((input.element as HTMLInputElement).value).toBe('184');

      await input.setValue('1843');
      await input.trigger('blur');
      await flushPromises();
      expect(control.value).toBe('18:43:00');
      expect((input.element as HTMLInputElement).value).toBe('18:43');
    });

    it('reads the text on Enter', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      const input = wrapper.find('input');

      await input.setValue('1206');
      await input.trigger('keydown', { key: 'Enter' });
      await flushPromises();
      expect(control.value).toBe('2026-06-12');
    });

    it('reads a date in the order of the locale', async () => {
      const control = new Field<string | null>({ value: null });
      const wrapper = mountDateTime({ control, inputType: 'date', locale: ja });
      const input = wrapper.find('input');

      await input.setValue('812');
      await input.trigger('blur');
      await flushPromises();
      expect(control.value).toBe('2026-08-12');
    });

    it('leaves text it cannot read and the value as they are and reports an error on the control', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      const input = wrapper.find('input');

      await input.setValue('131');
      await input.trigger('blur');
      await flushPromises();
      expect(control.value).toBe('2026-01-15');
      expect((input.element as HTMLInputElement).value).toBe('131');
      expect(control.errors.map((error) => error.code)).toEqual(['invalid_date']);
      expect(control.valid).toBe(false);

      await input.setValue('1301');
      await input.trigger('blur');
      await flushPromises();
      expect(control.value).toBe('2026-01-13');
      expect(control.errors).toEqual([]);
    });

    it('removes the error when the text is put back to the value it holds', async () => {
      const control = new Field<string | null>({ value: '10:00:00' });
      const wrapper = mountDateTime({ control, inputType: 'time' });
      const input = wrapper.find('input');

      await input.setValue('99:99');
      await input.trigger('blur');
      await flushPromises();
      expect(control.errors.map((error) => error.code)).toEqual(['invalid_time']);

      await input.setValue('10');
      await input.trigger('blur');
      await flushPromises();
      expect(control.value).toBe('10:00:00');
      expect(control.errors).toEqual([]);
      expect((input.element as HTMLInputElement).value).toBe('10:00');
    });

    it('shows the error of text it cannot read where no control is bound', async () => {
      const wrapper = mountDateTime({ modelValue: '10:00:00', inputType: 'time' });
      const input = wrapper.find('input');

      await input.trigger('focus');
      await input.setValue('abc');
      await input.trigger('blur');
      await flushPromises();
      expect(wrapper.text()).toContain('Not a valid time.');
    });

    it('clears the value when the text is removed', async () => {
      const control = new Field<string | null>({ value: '2026-01-15T10:00:00+01:00' });
      const wrapper = mountDateTime({ control });

      await wrapper.find('input').setValue('');
      await wrapper.find('input').trigger('blur');
      await flushPromises();
      expect(control.value).toBeNull();
    });

    it('shows a value set on the field in place of text it could not read', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      const input = wrapper.find('input');
      await input.setValue('131');
      await input.trigger('blur');
      await flushPromises();

      control.value = '2026-02-20';
      await flushPromises();
      expect((input.element as HTMLInputElement).value).toBe('20. 02. 26');
      expect(control.errors).toEqual([]);
    });
  });

  describe('a read-only field', () => {
    it('opens no menu on a click and shows no clear button', async () => {
      const control = new Field<string | null>({ value: '2026-01-15', access: 'readonly' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      await wrapper.find('input').trigger('click');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'VField' }).props('disabled')).toBe(false);
      expect(wrapper.findComponent({ name: 'VMenu' }).props('modelValue')).toBe(false);
      expect(wrapper.findComponent({ name: 'VField' }).props('clearable')).toBe(false);
    });
  });

  describe('the keyboard', () => {
    const menuShown = (wrapper: ReturnType<typeof mountDateTime>) =>
      wrapper.findComponent({ name: 'VMenu' }).props('modelValue');

    it('moves the day in an open picker with the arrows and writes it on Enter', async () => {
      const control = new Field<string | null>({ value: '2026-01-31' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      const input = wrapper.find('input');
      await input.trigger('click');
      await input.trigger('keydown', { key: 'ArrowRight' });
      await input.trigger('keydown', { key: 'ArrowDown' });
      await input.trigger('keydown', { key: 'ArrowLeft' });
      await flushPromises();

      expect(wrapper.findComponent({ name: 'VDatePicker' }).props('modelValue')).toEqual(new Date(2026, 1, 7));
      expect(control.value).toBe('2026-01-31');
      await input.trigger('keydown', { key: 'Enter' });
      await flushPromises();
      expect(control.value).toBe('2026-02-07');
      expect(menuShown(wrapper)).toBe(false);
    });

    it('moves the hour with left and right and the minute with up and down, across midnight', async () => {
      const control = new Field<string | null>({ value: '23:59:00' });
      const wrapper = mountDateTime({ control, inputType: 'time' });
      const input = wrapper.find('input');
      await input.trigger('click');
      await input.trigger('keydown', { key: 'ArrowUp' });
      await flushPromises();
      expect(wrapper.findComponent({ name: 'VTimePicker' }).props('viewMode')).toBe('minute');
      await input.trigger('keydown', { key: 'ArrowLeft' });
      await flushPromises();
      expect(wrapper.findComponent({ name: 'VTimePicker' }).props('viewMode')).toBe('hour');
      await input.trigger('keydown', { key: 'Enter' });
      await flushPromises();

      expect(control.value).toBe('23:00:00');
    });

    it('leaves the arrows to the text while no picker is open', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      const input = wrapper.find('input');
      await input.trigger('keydown', { key: 'ArrowRight' });
      await input.trigger('keydown', { key: 'Enter' });
      await flushPromises();

      expect(control.value).toBe('2026-01-15');
    });

    it('closes the picker on Escape and leaves the value', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      const input = wrapper.find('input');
      await input.trigger('click');
      await input.trigger('keydown', { key: 'ArrowRight' });
      await input.trigger('keydown', { key: 'Escape' });
      await flushPromises();

      expect(menuShown(wrapper)).toBe(false);
      expect(control.value).toBe('2026-01-15');
    });

    it('closes the picker when text is typed', async () => {
      const wrapper = mountDateTime({ control: new Field<string | null>({ value: '2026-01-15' }), inputType: 'date' });
      const input = wrapper.find('input');
      await input.trigger('click');
      expect(menuShown(wrapper)).toBe(true);
      await input.setValue('2');

      expect(menuShown(wrapper)).toBe(false);
    });

    it('opens the picker on space while the text shows the value, and types the space into edited text', async () => {
      const wrapper = mountDateTime({ control: new Field<string | null>({ value: '2026-01-15' }), inputType: 'date' });
      const input = wrapper.find('input');
      await input.trigger('keydown', { key: ' ' });
      expect(menuShown(wrapper)).toBe(true);

      await input.setValue('15.');
      await input.trigger('keydown', { key: ' ' });
      expect(menuShown(wrapper)).toBe(false);
    });

    it('closes the picker when the field loses focus', async () => {
      const wrapper = mountDateTime({ control: new Field<string | null>({ value: '2026-01-15' }), inputType: 'date' });
      const input = wrapper.find('input');
      await input.trigger('click');
      await input.trigger('blur');

      expect(menuShown(wrapper)).toBe(false);
    });
  });

  describe('concluding an edit', () => {
    const serverError = () => new ValidationError('taken', {}, 'This date is taken.', 'server');

    it('removes a server error when a date picked in the menu is saved', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      control.errors = [serverError()];
      const wrapper = mountDateTime({ control, inputType: 'date' });
      await wrapper.find('input').trigger('click');
      await flushPromises();

      wrapper.findComponent({ name: 'VDatePicker' }).vm.$emit('update:modelValue', new Date(2026, 0, 20));
      await flushPromises();
      const ok = wrapper.findAllComponents({ name: 'VBtn' }).find((button) => button.text() === 'OK')!;
      await ok.trigger('click');
      await flushPromises();

      expect(control.value).toBe('2026-01-20');
      expect(control.touched).toBe(true);
      expect(control.errors).toHaveLength(0);
    });

    it('saves a day on a double-click on it', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      await wrapper.find('input').trigger('click');
      await flushPromises();

      const month = wrapper.findComponent({ name: 'VDatePickerMonth' });
      const day = month.findAll('.v-date-picker-month__day button').find((button) => button.text() === '20')!;
      await day.trigger('click');
      expect(control.value).toBe('2026-01-15');
      await day.trigger('dblclick');
      await flushPromises();

      expect(control.value).toBe('2026-01-20');
      expect(control.touched).toBe(true);
    });

    it('does not save a day within viewSettleMs of a switch to another month', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      const control = new Field<string | null>({ value: '2026-01-15' });
      const wrapper = mountDateTime({ control, inputType: 'date' });
      await wrapper.find('input').trigger('click');
      await flushPromises();
      const picker = wrapper.findComponent({ name: 'VDatePicker' });

      // a click on a day of the adjacent month chooses it and shows that month
      picker.vm.$emit('update:modelValue', new Date(2026, 1, 1));
      picker.vm.$emit('update:month', 1);
      await flushPromises();
      const month = wrapper.findComponent({ name: 'VDatePickerMonth' });
      await month
        .findAll('.v-date-picker-month__day button')
        .find((button) => button.text() === '20')!
        .trigger('dblclick');
      await flushPromises();

      expect(control.value).toBe('2026-01-15');
      vi.useRealTimers();
    });

    describe('a double-click on the clock', () => {
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      async function chooseMinute() {
        const control = new Field<string | null>({ value: '10:00' });
        const wrapper = mountDateTime({ control, inputType: 'time' });
        await wrapper.find('input').trigger('click');
        await flushPromises();
        const picker = wrapper.findComponent({ name: 'VTimePicker' });
        // a click on an hour switches the clock to the minutes
        picker.vm.$emit('update:viewMode', 'minute');
        picker.vm.$emit('update:modelValue', '10:30');
        await flushPromises();
        return { control, clock: picker.find('.v-time-picker-clock') };
      }

      it('does not save within viewSettleMs of the switch to the minutes', async () => {
        const { control, clock } = await chooseMinute();

        vi.advanceTimersByTime(viewSettleMs - 100);
        await clock.trigger('dblclick');
        await flushPromises();

        expect(control.value).toBe('10:00');
      });

      it('saves after viewSettleMs', async () => {
        const { control, clock } = await chooseMinute();

        vi.advanceTimersByTime(viewSettleMs);
        await clock.trigger('dblclick');
        await flushPromises();

        expect(control.value).toBe('10:30:00');
      });
    });

    it('removes a server error when the field is cleared', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      control.errors = [serverError()];
      const wrapper = mountDateTime({ control, inputType: 'date', clearable: true });

      await wrapper.findComponent({ name: 'VField' }).vm.$emit('click:clear');

      expect(control.value).toBeNull();
      expect(control.errors).toHaveLength(0);
    });
  });
});
