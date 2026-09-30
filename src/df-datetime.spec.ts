import { Field } from '@dynamicforms/vue-forms';
import { flushPromises, mount } from '@vue/test-utils';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

import DfDateTime from '@/df-datetime.vue';

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
      const control = new Field<string | null>({ value: '2026-01-15T09:00:00Z', enabled: false });
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
});
