import Form, { ValidationError } from '@dynamicforms/vue-forms';
import { format } from 'date-fns';
import { enUS, ja, sl } from 'date-fns/locale';
import { describe, expect, it } from 'vitest';

import { datePartOrder, parseDateInput, parseTimeInput, setInputError } from './date-time-input';

const time = (text: string, displayFormat = 'p', locale = sl) => {
  const parsed = parseTimeInput(text, displayFormat, locale);
  return parsed ? `${parsed.hours}:${parsed.minutes.toString().padStart(2, '0')}` : null;
};

const today = new Date(2026, 9, 15);
const date = (text: string, locale = sl, displayFormat = 'P') => {
  const parsed = parseDateInput(text, displayFormat, locale, today);
  return parsed ? format(parsed, 'yyyy-MM-dd') : null;
};

describe('parseTimeInput', () => {
  it.each([
    ['9', '9:00'],
    ['18', '18:00'],
    ['23', '23:00'],
    ['24', '2:04'],
    ['65', '6:05'],
    ['130', '1:30'],
    ['153', '1:53'],
    ['930', '9:30'],
    ['1843', '18:43'],
    ['0005', '0:05'],
    ['18:43', '18:43'],
    ['18.43', '18:43'],
    ['9 30', '9:30'],
    ['18:43:20', '18:43'],
    ['12:30 AM', '0:30'],
    ['12:30 PM', '12:30'],
    ['1:05 am', '1:05'],
    ['130pm', '13:30'],
    ['12a', '0:00'],
  ])('reads %s as %s', (text, expected) => {
    expect(time(text)).toBe(expected);
  });

  it.each([
    ['', ''],
    ['175', ''],
    ['2400', ''],
    ['10:60', ''],
    ['13:00 PM', ''],
    ['12345', ''],
    ['ab', ''],
    ['1:2:3:4', ''],
  ])('reads nothing from %j', (text) => {
    expect(time(text)).toBeNull();
  });

  it('reads a time in the display format of the locale', () => {
    expect(time('6:05 PM', 'p', enUS)).toBe('18:05');
  });
});

describe('datePartOrder', () => {
  it.each([
    [sl, ['day', 'month', 'year']],
    [enUS, ['month', 'day', 'year']],
    [ja, ['year', 'month', 'day']],
  ])('reads the order of the short date format of %s', (locale, order) => {
    expect(datePartOrder('P', locale)).toEqual(order);
  });

  it("takes the short date format's order for a format without a numeric month", () => {
    expect(datePartOrder('PPP', enUS)).toEqual(['month', 'day', 'year']);
  });
});

describe('parseDateInput', () => {
  it.each([
    ['7', '2026-10-07'],
    ['12', '2026-10-12'],
    ['812', '2026-12-08'],
    ['1206', '2026-06-12'],
    ['120627', '2027-06-12'],
    ['120685', '1985-06-12'],
    ['12062027', '2027-06-12'],
    ['12.6', '2026-06-12'],
    ['12.6.', '2026-06-12'],
    ['12. 6. 27', '2027-06-12'],
    ['12/6/2027', '2027-06-12'],
    ['12. 06. 2027', '2027-06-12'],
  ])('reads %s in sl as %s', (text, expected) => {
    expect(date(text)).toBe(expected);
  });

  it.each([
    ['812', '2026-08-12'],
    ['0812', '2026-08-12'],
    ['270812', '2027-08-12'],
    ['20270812', '2027-08-12'],
    ['8/12', '2026-08-12'],
    ['2027/8/12', '2027-08-12'],
  ])('reads %s in ja as %s', (text, expected) => {
    expect(date(text, ja)).toBe(expected);
  });

  it.each([
    ['812', '2026-08-12'],
    ['8/12/27', '2027-08-12'],
    ['08/12/2027', '2027-08-12'],
  ])('reads %s in en-US as %s', (text, expected) => {
    expect(date(text, enUS)).toBe(expected);
  });

  it.each([[''], ['131'], ['3102'], ['12345'], ['1234567'], ['123456789'], ['32'], ['12.6.123'], ['abc'], ['1.2.3.4']])(
    'reads nothing from %j in sl',
    (text) => {
      expect(date(text)).toBeNull();
    },
  );

  it.each([
    ['120675', '2075-06-12'],
    ['120676', '1976-06-12'],
    ['12.6.50', '2050-06-12'],
    ['12. 06. 50', '2050-06-12'],
  ])('reads the two-digit year of %s as date-fns does: %s', (text, expected) => {
    expect(date(text)).toBe(expected);
  });

  it('reads a 29 February only in a leap year', () => {
    expect(date('290228')).toBe('2028-02-29');
    expect(date('290227')).toBeNull();
  });
});

describe('setInputError', () => {
  const error = new ValidationError('vuetify-inputs.invalid_date', {}, 'Not a valid date.', 'application');

  it('adds the error beside the errors the control holds and removes only it', () => {
    const control = new Form.Field<string | null>({ value: null });
    const server = new ValidationError('taken', {}, 'Taken.', 'server');
    control.errors = [server];

    setInputError(control, 'vuetify-inputs.invalid_date', error);
    expect(control.errors).toEqual([server, error]);

    setInputError(control, 'vuetify-inputs.invalid_date', null);
    expect(control.errors).toEqual([server]);
  });

  it('writes nothing when there is no error to remove', () => {
    const control = new Form.Field<string | null>({ value: null });
    const errors = control.errors;

    setInputError(control, 'vuetify-inputs.invalid_date', null);
    expect(control.errors).toBe(errors);
  });
});
