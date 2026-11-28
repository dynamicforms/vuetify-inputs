const formatters = new Map<string, Intl.DateTimeFormat>();
const warnedZones = new Set<string>();
const hourMs = 3_600_000;
const dayMs = 24 * hourMs;

function formatterOf(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Whether `timeZone` is an IANA time zone name the runtime knows; an unknown name is reported once (console.warn). */
export function isKnownTimeZone(timeZone: string): boolean {
  try {
    formatterOf(timeZone);
    return true;
  } catch {
    if (!warnedZones.has(timeZone)) {
      warnedZones.add(timeZone);
      console.warn(`Unknown time zone "${timeZone}": the browser's time zone is used.`);
    }
    return false;
  }
}

// year, month, day, hours, minutes, seconds of an instant's wall clock in `timeZone`
function wallClockFields(instant: number, timeZone: string) {
  const parts: Record<string, number> = {};
  formatterOf(timeZone)
    .formatToParts(new Date(instant))
    .forEach((part) => {
      if (part.type !== 'literal') parts[part.type] = Number(part.value);
    });
  return [parts.year, parts.month, parts.day, parts.hour % 24, parts.minute, parts.second];
}

// the offset of `timeZone` from UTC at an instant, in milliseconds
function offsetAt(instant: number, timeZone: string) {
  const [year, month, day, hours, minutes, seconds] = wallClockFields(instant, timeZone);
  return Date.UTC(year, month - 1, day, hours, minutes, seconds) - Math.floor(instant / 1000) * 1000;
}

const pad = (n: number, length = 2) => Math.abs(n).toString().padStart(length, '0');

/** The wall-clock date and time (`YYYY-MM-DDTHH:mm:ss`) of an instant in `timeZone`. */
export function wallClockIn(instant: number, timeZone: string): string {
  const [year, month, day, hours, minutes, seconds] = wallClockFields(instant, timeZone);
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** An offset in milliseconds as date-fns `XXX` writes it: `Z` for zero, else `±HH:mm`. */
export function formatOffset(offset: number): string {
  if (offset === 0) return 'Z';
  const minutes = Math.round(Math.abs(offset) / 60_000);
  return `${offset < 0 ? '-' : '+'}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/**
 * The instant of a wall-clock date and time (`YYYY-MM-DDTHH:mm:ss`) in `timeZone`, with that time and the offset in
 * force at it. A time the zone skips moves forward by the gap; a repeated time takes its first occurrence.
 */
export function fromWallClock(naive: string, timeZone: string): { naive: string; offset: string } {
  const [year, month, day, hours, minutes, seconds] = naive.split(/[-T:]/).map(Number);
  const wall = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  const before = offsetAt(wall - dayMs, timeZone);
  const after = offsetAt(wall + dayMs, timeZone);
  const matching = [wall - before, wall - after].filter((instant) => instant + offsetAt(instant, timeZone) === wall);
  // no match: the time falls into a gap, read with the offset before it
  const instant = matching.length ? Math.min(...matching) : wall - before;
  return { naive: wallClockIn(instant, timeZone), offset: formatOffset(offsetAt(instant, timeZone)) };
}
