import { Field, ValidationError } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
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
      await flushPromises();
      expect(control.value).toBe('2026-01-15T11:30:00+01:00');
      expect(inputs(wrapper)[1]).toBe('11:30');
    });

    it('writes an edited summer time with the summer offset', async () => {
      const control = new Field<string | null>({ value: '2026-07-15T10:00:00+02:00' });
      const wrapper = mountDateTime({ control });

      await wrapper.findAll('input')[1].setValue('11:30');
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
      await flushPromises();
      expect(control.value).toBe(expected);
    });

    it.each([['13:00 PM'], ['0:30 AM'], ['24:00'], ['10:60']])('leaves the value as it is for %s', async (typed) => {
      const control = new Field<string | null>({ value: '10:00:00' });
      const wrapper = mountDateTime({ control, inputType: 'time' });

      await wrapper.find('input').setValue(typed);
      await flushPromises();
      expect(control.value).toBe('10:00:00');
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

  describe('concluding an edit', () => {
    const serverError = () => new ValidationError('taken', {}, 'This date is taken.', 'server');

    it('removes a server error when a date picked in the menu is saved', async () => {
      const control = new Field<string | null>({ value: '2026-01-15' });
      control.errors = [serverError()];
      const wrapper = mountDateTime({ control, inputType: 'date' });
      await wrapper.find('input').trigger('click');
      await flushPromises();

      const confirm = wrapper.findComponent({ name: 'VConfirmEdit' });
      confirm.vm.$emit('update:modelValue', new Date(2026, 0, 20));
      confirm.vm.$emit('save', new Date(2026, 0, 20));
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

        expect(control.value).toBe('10:30');
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
