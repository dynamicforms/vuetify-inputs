import { Field } from '@dynamicforms/vue-forms';
import { DOMWrapper, flushPromises, mount } from '@vue/test-utils';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import DfDateTime from '@/df-datetime.vue';
import { vuetifyInputsSettingsKey } from '@/helpers/settings';

// Europe/Ljubljana skips 02:00-03:00 on 2026-03-29 and repeats 02:00-03:00 on 2026-10-25.
// America/New_York skips 02:00-03:00 on 2026-03-08 and repeats 01:00-02:00 on 2026-11-01.
// America/Santiago skips 00:00-01:00 on 2026-09-06.
describe('DfDateTime timeZone', () => {
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const browserZone = (zone: string) => vi.stubEnv('TZ', zone);

  const useFakeDate = (at: Date) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(at);
  };

  const mountDateTime = (props: Record<string, any>, settings?: Record<string, any>) =>
    mount(DfDateTime, {
      props: { label: 'When', displayFormatDate: 'yyyy-MM-dd', ...props },
      ...(settings ? { global: { provide: { [vuetifyInputsSettingsKey]: settings } } } : {}),
    });

  type Wrapper = ReturnType<typeof mountDateTime>;

  const inputs = (wrapper: Wrapper) =>
    wrapper.findAll('input').map((input) => (input.element as HTMLInputElement).value);

  const typeAndLeave = async (input: DOMWrapper<HTMLInputElement>, text: string) => {
    await input.setValue(text);
    await input.trigger('blur');
    await flushPromises();
  };

  const typeTime = (wrapper: Wrapper, text: string) => typeAndLeave(wrapper.findAll('input')[1], text);
  const typeDate = (wrapper: Wrapper, text: string) => typeAndLeave(wrapper.findAll('input')[0], text);

  const pad = (n: number) => String(n).padStart(2, '0');
  // the calendar day a picker value stands for, as the picker reads it (browser-local for a Date)
  const pickerDay = (value: unknown) =>
    value instanceof Date
      ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
      : String(value).slice(0, 10);
  const pickerTime = (value: unknown) =>
    value instanceof Date ? `${pad(value.getHours())}:${pad(value.getMinutes())}` : String(value).slice(0, 5);

  describe('unset, in the browser zone', () => {
    it('writes an edited winter time with the winter offset of the browser zone', async () => {
      browserZone('Europe/Ljubljana');
      const control = new Field<string | null>({ value: '2026-01-15T10:00:00+01:00' });
      const wrapper = mountDateTime({ control });

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-01-15T11:30:00+01:00');
    });

    it('writes an edited summer time with the summer offset of the browser zone', async () => {
      browserZone('Europe/Ljubljana');
      const control = new Field<string | null>({ value: '2026-07-15T10:00:00+02:00' });
      const wrapper = mountDateTime({ control });

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00+02:00');
    });

    it('shows a value with another offset in the browser zone', async () => {
      browserZone('Europe/Ljubljana');
      const control = new Field<string | null>({ value: '2026-07-15T16:00:00-04:00' });
      const wrapper = mountDateTime({ control });

      await flushPromises();
      expect(inputs(wrapper)).toEqual(['2026-07-15', '22:00']);
    });

    it('writes a zero offset as Z', async () => {
      browserZone('Europe/London');
      const control = new Field<string | null>({ value: '2026-01-15T10:00:00Z' });
      const wrapper = mountDateTime({ control });

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-01-15T11:30:00Z');
    });
  });

  describe.each(['Asia/Tokyo', 'America/Santiago'])('an IANA zone, with the browser in %s', (browser) => {
    const mountIn = (timeZone: string, value: string | null, props: Record<string, any> = {}) => {
      browserZone(browser);
      const control = new Field<string | null>({ value });
      return { control, wrapper: mountDateTime({ control, timeZone, ...props }) };
    };

    it('shows a value with another offset in the zone', async () => {
      const { wrapper } = mountIn('America/New_York', '2026-07-15T16:00:00+02:00');

      await flushPromises();
      expect(inputs(wrapper)).toEqual(['2026-07-15', '10:00']);
    });

    it('shows a value in Z on the day it falls on in the zone', async () => {
      const { wrapper } = mountIn('America/New_York', '2026-01-15T03:00:00Z');

      await flushPromises();
      expect(inputs(wrapper)).toEqual(['2026-01-14', '22:00']);
    });

    it('shows a value without an offset as wall-clock time in the zone', async () => {
      const { wrapper } = mountIn('America/New_York', '2026-07-15T10:00:00');

      await flushPromises();
      expect(inputs(wrapper)).toEqual(['2026-07-15', '10:00']);
    });

    it('writes a value without an offset with the zone offset once it is edited', async () => {
      const { control, wrapper } = mountIn('America/New_York', '2026-07-15T10:00:00');

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00-04:00');
    });

    it('writes an edited winter time with the winter offset of the zone', async () => {
      const { control, wrapper } = mountIn('America/New_York', '2026-01-15T10:00:00-05:00');

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-01-15T11:30:00-05:00');
      expect(inputs(wrapper)).toEqual(['2026-01-15', '11:30']);
    });

    it('writes an edited summer time with the summer offset of the zone', async () => {
      const { control, wrapper } = mountIn('America/New_York', '2026-07-15T10:00:00-04:00');

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00-04:00');
    });

    it('writes the winter offset when the date is moved from summer into winter', async () => {
      const { control, wrapper } = mountIn('America/New_York', '2026-07-15T10:00:00-04:00');

      await typeDate(wrapper, '2026-01-15');
      expect(control.value).toBe('2026-01-15T10:00:00-05:00');
      expect(inputs(wrapper)).toEqual(['2026-01-15', '10:00']);
    });

    it('writes an edited value given in another offset with the zone offset', async () => {
      const { control, wrapper } = mountIn('America/New_York', '2026-07-15T16:00:00+02:00');

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00-04:00');
    });

    it('moves a wall time the zone skips forward by the gap', async () => {
      const { control, wrapper } = mountIn('Europe/Ljubljana', '2026-03-29T01:00:00+01:00');

      await typeTime(wrapper, '02:30');
      expect(control.value).toBe('2026-03-29T03:30:00+02:00');
    });

    it('moves a skipped wall time forward when the date is moved onto the day of the gap', async () => {
      const { control, wrapper } = mountIn('Europe/Ljubljana', '2026-03-28T02:30:00+01:00');

      await typeDate(wrapper, '2026-03-29');
      expect(control.value).toBe('2026-03-29T03:30:00+02:00');
    });

    it('takes the first occurrence of a wall time the zone repeats', async () => {
      const { control, wrapper } = mountIn('Europe/Ljubljana', '2026-10-25T00:30:00+02:00');

      await typeTime(wrapper, '02:30');
      expect(control.value).toBe('2026-10-25T02:30:00+02:00');
    });

    it('takes the first occurrence of a repeated wall time in a zone west of Greenwich', async () => {
      const { control, wrapper } = mountIn('America/New_York', '2026-11-01T00:30:00-04:00');

      await typeTime(wrapper, '01:45');
      expect(control.value).toBe('2026-11-01T01:45:00-04:00');
    });

    it('writes a zero offset of the zone as Z', async () => {
      const { control, wrapper } = mountIn('UTC', '2026-07-15T09:00:00Z');

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00Z');
    });

    it('writes Z for a winter time and an offset for a summer time in a zone at Greenwich', async () => {
      const { control, wrapper } = mountIn('Europe/London', '2026-01-15T10:00:00Z');

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-01-15T11:30:00Z');
      await typeDate(wrapper, '2026-07-15');
      expect(control.value).toBe('2026-07-15T11:30:00+01:00');
    });

    it.each([
      ['2026-07-15T16:00:00+02:00'],
      ['2026-01-15T03:00:00Z'],
      ['2026-07-15T10:00:00'],
      ['2026-03-29T02:30:00'],
    ])('shows %s without writing into the field', async (value) => {
      const { control } = mountIn('America/New_York', value);

      await flushPromises();
      expect(control.value).toBe(value);
      expect(control.isChanged).toBe(false);
    });

    it('opens the date picker on the day of the value in the zone', async () => {
      const { wrapper } = mountIn('America/New_York', '2026-01-15T03:00:00Z');
      await wrapper.findAll('input')[0].trigger('click');
      await flushPromises();

      expect(pickerDay(wrapper.findComponent({ name: 'VDatePicker' }).props('modelValue'))).toBe('2026-01-14');
    });

    it('opens the time picker on the time of the value in the zone', async () => {
      const { wrapper } = mountIn('America/New_York', '2026-07-15T16:00:00+02:00');
      await wrapper.findAll('input')[1].trigger('click');
      await flushPromises();

      expect(pickerTime(wrapper.findComponent({ name: 'VTimePicker' }).props('modelValue'))).toBe('10:00');
    });
  });

  describe('pickers on a day the browser zone changes its offset', () => {
    it('opens the date picker on a day the browser zone skips midnight', async () => {
      browserZone('America/Santiago');
      const control = new Field<string | null>({ value: '2026-09-06T00:30:00+02:00' });
      const wrapper = mountDateTime({ control, timeZone: 'Europe/Ljubljana' });
      await flushPromises();
      expect(inputs(wrapper)).toEqual(['2026-09-06', '00:30']);

      await wrapper.findAll('input')[0].trigger('click');
      await flushPromises();
      expect(pickerDay(wrapper.findComponent({ name: 'VDatePicker' }).props('modelValue'))).toBe('2026-09-06');
    });

    it('opens the time picker on a time the browser zone skips', async () => {
      browserZone('America/New_York');
      const control = new Field<string | null>({ value: '2026-03-08T02:30:00+01:00' });
      const wrapper = mountDateTime({ control, timeZone: 'Europe/Ljubljana' });
      await flushPromises();
      expect(inputs(wrapper)).toEqual(['2026-03-08', '02:30']);

      await wrapper.findAll('input')[1].trigger('click');
      await flushPromises();
      expect(pickerTime(wrapper.findComponent({ name: 'VTimePicker' }).props('modelValue'))).toBe('02:30');
    });

    it('writes a time the browser zone skips with the offset of the chosen zone', async () => {
      browserZone('America/New_York');
      const control = new Field<string | null>({ value: '2026-03-08T01:00:00+01:00' });
      const wrapper = mountDateTime({ control, timeZone: 'Europe/Ljubljana' });

      await typeTime(wrapper, '02:30');
      expect(control.value).toBe('2026-03-08T02:30:00+01:00');
    });
  });

  describe('the timeZone setting', () => {
    it('applies the setting where the prop is not given', async () => {
      browserZone('Europe/Ljubljana');
      const control = new Field<string | null>({ value: '2026-07-15T16:00:00+02:00' });
      const wrapper = mountDateTime({ control }, { timeZone: 'America/New_York' });

      await flushPromises();
      expect(inputs(wrapper)[1]).toBe('10:00');
      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00-04:00');
    });

    it('lets the prop override the setting', async () => {
      browserZone('Europe/Ljubljana');
      const control = new Field<string | null>({ value: '2026-07-15T16:00:00+02:00' });
      const wrapper = mountDateTime({ control, timeZone: 'Asia/Tokyo' }, { timeZone: 'America/New_York' });

      await flushPromises();
      expect(inputs(wrapper)).toEqual(['2026-07-15', '23:00']);
      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00+09:00');
    });

    it('applies the wall setting where the prop is not given', async () => {
      browserZone('America/New_York');
      const control = new Field<string | null>({ value: '2026-03-08T01:00:00' });
      const wrapper = mountDateTime({ control }, { timeZone: 'wall' });

      await typeTime(wrapper, '02:30');
      expect(control.value).toBe('2026-03-08T02:30:00');
    });

    it('lets an IANA prop override the wall setting', async () => {
      browserZone('Europe/Ljubljana');
      const control = new Field<string | null>({ value: '2026-07-15T10:00:00-04:00' });
      const wrapper = mountDateTime({ control, timeZone: 'America/New_York' }, { timeZone: 'wall' });

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00-04:00');
    });
  });

  describe('wall', () => {
    const mountWall = (value: string | null, props: Record<string, any> = {}) => {
      browserZone('America/New_York');
      const control = new Field<string | null>({ value });
      return { control, wrapper: mountDateTime({ control, timeZone: 'wall', ...props }) };
    };

    it.each([
      ['2026-03-08T02:30:00', '2026-03-08', '02:30'],
      ['2026-03-08T02:30', '2026-03-08', '02:30'],
      ['2026-03-08 02:30:00', '2026-03-08', '02:30'],
      ['2026-11-01T01:30:00', '2026-11-01', '01:30'],
      ['2026-07-15T10:00:00+02:00', '2026-07-15', '10:00'],
      ['2026-01-15T23:00:00Z', '2026-01-15', '23:00'],
      ['2026-01-15T09:00:00.250-08:00', '2026-01-15', '09:00'],
    ])('shows %s by its date and time as written, without writing into the field', async (value, day, time) => {
      const { control, wrapper } = mountWall(value);

      await flushPromises();
      expect(inputs(wrapper)).toEqual([day, time]);
      expect(control.value).toBe(value);
      expect(control.isChanged).toBe(false);
    });

    it('shows an empty field for a value it cannot read and leaves the value', async () => {
      const { control, wrapper } = mountWall('not a date');

      await flushPromises();
      expect(inputs(wrapper)).toEqual(['', '']);
      expect(control.value).toBe('not a date');
    });

    it('writes a time the browser zone skips as typed, without an offset', async () => {
      const { control, wrapper } = mountWall('2026-03-08T01:00:00');

      await typeTime(wrapper, '02:30');
      expect(control.value).toBe('2026-03-08T02:30:00');
      expect(inputs(wrapper)[1]).toBe('02:30');
    });

    it('writes a time the browser zone repeats as typed, without an offset', async () => {
      const { control, wrapper } = mountWall('2026-11-01T00:30:00');

      await typeTime(wrapper, '01:45');
      expect(control.value).toBe('2026-11-01T01:45:00');
    });

    it('writes the date and time of a value given with an offset once it is edited', async () => {
      const { control, wrapper } = mountWall('2026-07-15T10:00:00+02:00');

      await typeTime(wrapper, '11:30');
      expect(control.value).toBe('2026-07-15T11:30:00');
    });

    it('keeps the time when the date is moved onto a day the browser zone skips it', async () => {
      const { control, wrapper } = mountWall('2026-03-07T02:30:00');

      await typeDate(wrapper, '2026-03-08');
      expect(control.value).toBe('2026-03-08T02:30:00');
      expect(inputs(wrapper)).toEqual(['2026-03-08', '02:30']);
    });

    it('opens the time picker on a time the browser zone skips', async () => {
      const { wrapper } = mountWall('2026-03-08T02:30:00');
      await wrapper.findAll('input')[1].trigger('click');
      await flushPromises();

      expect(pickerTime(wrapper.findComponent({ name: 'VTimePicker' }).props('modelValue'))).toBe('02:30');
    });
  });

  describe('an unknown zone', () => {
    it('warns once per name and behaves as the browser zone', async () => {
      browserZone('Europe/Ljubljana');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const first = new Field<string | null>({ value: '2026-01-15T09:00:00Z' });
      const wrapper = mountDateTime({ control: first, timeZone: 'Mars/Olympus_Mons' });
      await flushPromises();
      expect(inputs(wrapper)).toEqual(['2026-01-15', '10:00']);
      expect(first.isChanged).toBe(false);

      await typeTime(wrapper, '11:30');
      expect(first.value).toBe('2026-01-15T11:30:00+01:00');

      const second = new Field<string | null>({ value: '2026-07-15T09:00:00Z' });
      mountDateTime({ control: second, timeZone: 'Mars/Olympus_Mons' });
      await flushPromises();

      const mentions = (name: string) =>
        warn.mock.calls.filter((args) => args.some((arg) => String(arg).includes(name))).length;
      expect(mentions('Mars/Olympus_Mons')).toBe(1);

      mountDateTime({ control: new Field<string | null>({ value: null }), timeZone: 'Venus/Maxwell' });
      await flushPromises();
      expect(mentions('Venus/Maxwell')).toBe(1);
    });
  });

  describe.each([[undefined], ['Europe/Ljubljana'], ['Pacific/Kiritimati'], ['wall'], ['Mars/Nowhere']])(
    'modes without a zone, with timeZone %s',
    (timeZone) => {
      it('shows and writes a time the browser zone skips today in time mode', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        browserZone('America/New_York');
        useFakeDate(new Date('2026-03-08T12:00:00-04:00'));
        const control = new Field<string | null>({ value: '02:30:00' });
        const wrapper = mountDateTime({ control, inputType: 'time', timeZone });

        await flushPromises();
        expect(inputs(wrapper)).toEqual(['02:30']);
        expect(control.isChanged).toBe(false);
        await typeAndLeave(wrapper.find('input'), '02:15');
        expect(control.value).toBe('02:15:00');
      });

      it('keeps a time on the day the browser zone in Europe changes its offset in time mode', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        browserZone('Europe/Ljubljana');
        useFakeDate(new Date('2026-03-29T12:00:00+02:00'));
        const control = new Field<string | null>({ value: '02:30:00' });
        const wrapper = mountDateTime({ control, inputType: 'time', timeZone });

        await flushPromises();
        expect(inputs(wrapper)).toEqual(['02:30']);
        await wrapper.find('input').trigger('click');
        await flushPromises();
        expect(pickerTime(wrapper.findComponent({ name: 'VTimePicker' }).props('modelValue'))).toBe('02:30');
      });

      it('shows and writes a date without an offset in date mode', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        browserZone('America/New_York');
        const control = new Field<string | null>({ value: '2026-03-08' });
        const wrapper = mountDateTime({ control, inputType: 'date', timeZone });

        await flushPromises();
        expect(inputs(wrapper)).toEqual(['2026-03-08']);
        expect(control.isChanged).toBe(false);
        await typeAndLeave(wrapper.find('input'), '2026-11-01');
        expect(control.value).toBe('2026-11-01');
      });
    },
  );
});
