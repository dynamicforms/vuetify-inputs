import Form, { ValidationError } from '@dynamicforms/vue-forms';
import { format, isValid, Locale, parse } from 'date-fns';

export interface TimeOfDay {
  hours: number;
  minutes: number;
}

type DatePart = 'day' | 'month' | 'year';

const meridiemSuffix = /\s*([ap])\.?\s*m?\.?\s*$/i;

function timeOf(hours: number, minutes: number, meridiem?: 'a' | 'p'): TimeOfDay | null {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    return { hours: (hours % 12) + (meridiem === 'p' ? 12 : 0), minutes };
  }
  return hours > 23 ? null : { hours, minutes };
}

/** A time written as digits only: `9`, `18` (whole hours), `65` (6:05), `130` (1:30), `1843` (18:43). */
function timeFromDigits(digits: string, meridiem?: 'a' | 'p'): TimeOfDay | null {
  const n = (s: string) => Number.parseInt(s, 10);
  switch (digits.length) {
    case 1:
      return timeOf(n(digits), 0, meridiem);
    case 2:
      return n(digits) <= (meridiem ? 12 : 23)
        ? timeOf(n(digits), 0, meridiem)
        : timeOf(n(digits[0]), n(digits[1]), meridiem);
    case 3:
      return timeOf(n(digits[0]), n(digits.slice(1)), meridiem);
    case 4:
      return timeOf(n(digits.slice(0, 2)), n(digits.slice(2)), meridiem);
    default:
      return null;
  }
}

/**
 * Reads a time typed into `<df-date-time>`. Text in `displayFormat` is read with date-fns against `locale`. Any other
 * text is read as a 24-hour time, optionally followed by `am`/`pm`:
 *
 * - digits only: 1–2 digits up to 23 are whole hours, 2 digits above 23 are H:0M, 3 digits H:MM and 4 digits HH:MM;
 * - digits split by any other characters: hours, minutes and optional seconds, which are dropped.
 *
 * Returns null for any other text and for an hour or a minute out of range.
 */
export function parseTimeInput(text: string, displayFormat: string, locale: Locale): TimeOfDay | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const formatted = parse(trimmed, displayFormat, new Date(2000, 0, 1), { locale });
  if (isValid(formatted)) return { hours: formatted.getHours(), minutes: formatted.getMinutes() };

  const suffix = trimmed.match(meridiemSuffix);
  const meridiem = suffix ? (suffix[1].toLowerCase() as 'a' | 'p') : undefined;
  const body = suffix ? trimmed.slice(0, suffix.index) : trimmed;
  if (!/^[\d\s:.,-]+$/.test(body)) return null;

  const parts = body.split(/\D+/).filter(Boolean);
  if (parts.length === 1) return timeFromDigits(parts[0], meridiem);
  if ((parts.length === 2 || parts.length === 3) && parts.every((part) => part.length <= 2)) {
    return timeOf(Number.parseInt(parts[0], 10), Number.parseInt(parts[1], 10), meridiem);
  }
  return null;
}

/**
 * The order of day, month and year in dates `displayFormat` writes for `locale`, read from a formatted date. A format
 * without a numeric day, month and year takes the order of the locale's short date format (`P`).
 */
export function datePartOrder(displayFormat: string, locale: Locale): DatePart[] {
  const sample = new Date(2033, 10, 22);
  const positions = (formatted: string) => {
    const year = formatted.indexOf('2033');
    const rest = year >= 0 ? formatted.replace('2033', '####') : formatted;
    return { day: rest.indexOf('22'), month: rest.indexOf('11'), year };
  };
  let found = positions(format(sample, displayFormat, { locale }));
  if (Object.values(found).some((position) => position < 0)) found = positions(format(sample, 'P', { locale }));
  if (Object.values(found).some((position) => position < 0)) return ['day', 'month', 'year'];
  return (['day', 'month', 'year'] as DatePart[]).sort((a, b) => found[a] - found[b]);
}

/** A two-digit year is the year ending in those digits that lies at most 20 years after `today`'s year. */
function fullYear(twoDigits: number, today: Date) {
  const year = 2000 + twoDigits;
  return year > today.getFullYear() + 20 ? year - 100 : year;
}

function dateOf(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  date.setFullYear(year);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

/**
 * Reads a date typed into `<df-date-time>`. Text in `displayFormat` with a four-digit year is read with date-fns
 * against `locale`. Any other text is read in the order of day, month and year `displayFormat` writes for `locale`;
 * without a year the order of the day and the month stays and the year is `today`'s:
 *
 * - digits only: 1–2 digits are a day of `today`'s month, 3 digits a one-digit first part and a two-digit second part,
 *   4 digits two two-digit parts, 6 digits three two-digit parts and 8 digits a full date with a four-digit year;
 * - digits split by any other characters: two parts are a day and a month, three parts a full date.
 *
 * A two-digit year is the year ending in those digits at most 20 years after `today`'s. Returns null for any other
 * text and for a date that does not exist.
 */
export function parseDateInput(text: string, displayFormat: string, locale: Locale, today: Date): Date | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const formatted = parse(trimmed, displayFormat, today, { locale });
  if (isValid(formatted) && formatted.getFullYear() >= 1000) {
    return dateOf(formatted.getFullYear(), formatted.getMonth() + 1, formatted.getDate());
  }

  if (!/^[\d\s./,-]+$/.test(trimmed)) return null;
  const order = datePartOrder(displayFormat, locale);
  const dayMonth = order.filter((part) => part !== 'year');
  const n = (s: string) => Number.parseInt(s, 10);

  const fromParts = (parts: string[], partOrder: DatePart[]) => {
    const values: Record<DatePart, number> = { day: 0, month: today.getMonth() + 1, year: today.getFullYear() };
    for (let i = 0; i < partOrder.length; i++) {
      const part = parts[i];
      if (partOrder[i] === 'year') {
        if (part.length === 2) values.year = fullYear(n(part), today);
        else if (part.length === 4) values.year = n(part);
        else return null;
      } else {
        if (part.length > 2) return null;
        values[partOrder[i]] = n(part);
      }
    }
    return dateOf(values.year, values.month, values.day);
  };

  const parts = trimmed.split(/\D+/).filter(Boolean);
  if (parts.length === 2) return fromParts(parts, dayMonth);
  if (parts.length === 3) return fromParts(parts, order);
  if (parts.length !== 1) return null;

  const digits = parts[0];
  switch (digits.length) {
    case 1:
    case 2:
      return fromParts([digits], ['day']);
    case 3:
      return fromParts([digits.slice(0, 1), digits.slice(1)], dayMonth);
    case 4:
      return fromParts([digits.slice(0, 2), digits.slice(2)], dayMonth);
    case 6:
      return fromParts([digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)], order);
    case 8: {
      const split: string[] = [];
      let at = 0;
      order.forEach((part) => {
        const length = part === 'year' ? 4 : 2;
        split.push(digits.slice(at, at + length));
        at += length;
      });
      return fromParts(split, order);
    }
    default:
      return null;
  }
}

/**
 * Writes `error` as the control's error of `code` with origin `'application'`, or removes that error where `error` is
 * null. Kept outside the component's own script so the write to `control.errors` isn't seen as a `.vue` component
 * mutating its own prop.
 */
export function setInputError(control: Form.FieldBase, code: string, error: ValidationError | null) {
  const others = control.errors.filter((e) => !(e.code === code && e.origin === 'application'));
  if (!error && others.length === control.errors.length) return;
  control.errors = error ? [...others, error] : others;
}
