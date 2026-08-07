import { describe, expect, it } from 'vitest';
import {
  addAfghanDays,
  addAfghanMonths,
  addAfghanYears,
  formatAfghanDate,
  formatGregorianISO,
  formatMonthYear,
  fromGregorian,
  getAfghanWeekday,
  getDaysInAfghanMonth,
  getLocale,
  isAfghanLeapYear,
  toGregorian,
  validateAfghanDate
} from '../src/index.js';

function iterateAfghanDates(start: { year: number; month: number; day: number }, count: number) {
  const dates: { year: number; month: number; day: number }[] = [];
  let date = start;
  for (let index = 0; index < count; index += 1) {
    dates.push(date);
    date = addAfghanDays(date, 1);
  }
  return dates;
}

describe('Afghan Solar Hijri core invariants', () => {
  it('round trips every day in a 20-year window', () => {
    const start = { year: 1393, month: 1, day: 1 };
    const window = iterateAfghanDates(start, 365 * 20 + 5);
    window.forEach((date) => {
      expect(fromGregorian(toGregorian(date))).toEqual(date);
    });
  });

  it('round trips every Gregorian date in the verified 1900-2100 range', () => {
    for (let year = 1900; year <= 2100; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        for (let day = 1; day <= daysInMonth; day += 1) {
          const gregorian = { year, month, day };
          const afghan = fromGregorian(gregorian);
          expect(toGregorian(afghan)).toEqual(gregorian);
          expect(fromGregorian(toGregorian(afghan))).toEqual(afghan);
        }
      }
    }
  });

  it('always produces a valid Afghan date after toGregorian', () => {
    const window = iterateAfghanDates({ year: 1400, month: 1, day: 1 }, 4000);
    window.forEach((date) => {
      expect(() => validateAfghanDate(date)).not.toThrow();
      const gregorian = toGregorian(date);
      expect(gregorian.year).toBeGreaterThanOrEqual(2020);
      expect(gregorian.month).toBeGreaterThanOrEqual(1);
      expect(gregorian.day).toBeGreaterThanOrEqual(1);
    });
  });

  it('keeps Gregorian dates monotonic across Afghan dates', () => {
    const window = iterateAfghanDates({ year: 1400, month: 1, day: 1 }, 5000);
    let previous = toGregorian(window[0]);
    window.slice(1).forEach((date) => {
      const current = toGregorian(date);
      const currentIso = formatGregorianISO(current);
      const previousIso = formatGregorianISO(previous);
      expect(currentIso > previousIso).toBe(true);
      previous = current;
    });
  });

  it('uses the established leap states in the modern range', () => {
    const leaps = [];
    for (let year = 1399; year <= 1431; year += 1) {
      if (isAfghanLeapYear(year)) leaps.push(year);
    }
    expect(leaps).toEqual([1399, 1403, 1408, 1412, 1416, 1420, 1424, 1428]);
  });

  it('supports the documented Afghan year range endpoints', () => {
    const first = { year: 1, month: 1, day: 1 };
    const last = { year: 3000, month: 12, day: 29 };
    expect(formatGregorianISO(toGregorian(first))).toBe('0622-03-22');
    expect(fromGregorian(toGregorian(first))).toEqual(first);
    expect(formatGregorianISO(toGregorian(last))).toBe('3622-03-19');
    expect(fromGregorian(toGregorian(last))).toEqual(last);
  });

  it('enforces month length consistency with the calendar', () => {
    const window = iterateAfghanDates({ year: 1403, month: 1, day: 1 }, 1500);
    window.forEach((date) => {
      const days = getDaysInAfghanMonth(date.year, date.month);
      expect(date.day).toBeGreaterThanOrEqual(1);
      expect(date.day).toBeLessThanOrEqual(days);
    });
  });

  it('anchors a known modern date range', () => {
    const samples: Array<[number, number, number, string]> = [
      [1402, 12, 29, '2024-03-19'],
      [1403, 1, 1, '2024-03-20'],
      [1403, 12, 30, '2025-03-20'],
      [1404, 1, 1, '2025-03-21']
    ];
    samples.forEach(([year, month, day, iso]) => {
      expect(formatGregorianISO(toGregorian({ year, month, day }))).toBe(iso);
      expect(fromGregorian({ year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)), day: Number(iso.slice(8, 10)) })).toEqual({ year, month, day });
    });
  });
});

describe('addAfghanMonths and addAfghanYears', () => {
  it('adds months across year boundaries', () => {
    expect(addAfghanMonths({ year: 1403, month: 11, day: 5 }, 2)).toEqual({ year: 1404, month: 1, day: 5 });
    expect(addAfghanMonths({ year: 1403, month: 1, day: 1 }, -1)).toEqual({ year: 1402, month: 12, day: 1 });
  });

  it('clamps the day to the target month length', () => {
    expect(addAfghanMonths({ year: 1403, month: 6, day: 31 }, 1)).toEqual({ year: 1403, month: 7, day: 30 });
    expect(addAfghanMonths({ year: 1403, month: 11, day: 30 }, 1)).toEqual({ year: 1403, month: 12, day: 30 });
    expect(addAfghanMonths({ year: 1404, month: 11, day: 30 }, 1)).toEqual({ year: 1404, month: 12, day: 29 });
    expect(addAfghanMonths({ year: 1403, month: 1, day: 31 }, 1)).toEqual({ year: 1403, month: 2, day: 31 });
  });

  it('adds years', () => {
    expect(addAfghanYears({ year: 1403, month: 2, day: 29 }, 1)).toEqual({ year: 1404, month: 2, day: 29 });
    expect(addAfghanYears({ year: 1403, month: 12, day: 30 }, 1)).toEqual({ year: 1404, month: 12, day: 29 });
  });

  it('round trips with subtractive arguments', () => {
    const start = { year: 1403, month: 6, day: 15 };
    expect(addAfghanYears(addAfghanYears(start, 5), -5)).toEqual(start);
    expect(addAfghanMonths(addAfghanMonths(start, 7), -7)).toEqual(start);
  });
});

describe('locale names', () => {
  it('exposes the canonical Dari months', () => {
    const dari = getLocale('dari');
    expect(dari.months).toEqual(['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت']);
    expect(dari.weekdays).toEqual(['شنبه', 'یک شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']);
  });

  it('exposes the Pashto months and weekdays', () => {
    const pashto = getLocale('pashto');
    expect(pashto.months[0]).toBe('وری');
    expect(pashto.months[11]).toBe('کب');
    expect(pashto.weekdays).toEqual(['شنبه', 'یک شنبه', 'دوشنبه', 'سه‌شنبه', 'څلورشنبه', 'پینځشنبه', 'جمعه']);
  });

  it('exposes English months and weekdays', () => {
    const english = getLocale('english');
    expect(english.months[0]).toBe('Hamal');
    expect(english.weekdays[0]).toBe('Saturday');
    expect(english.weekdays[6]).toBe('Friday');
  });

  it('formats month and year with the month name', () => {
    expect(formatMonthYear({ year: 1403, month: 1 }, { locale: 'dari' })).toBe('حمل ۱۴۰۳');
    expect(formatMonthYear({ year: 1403, month: 1 }, { locale: 'english', numerals: 'latin' })).toBe('Hamal 1403');
  });
});

describe('weekday consistency', () => {
  it('is Saturday on the anchor date', () => {
    expect(getAfghanWeekday({ year: 1403, month: 1, day: 1 })).toBe(4);
    expect(getAfghanWeekday({ year: 1403, month: 1, day: 7 })).toBe(3);
  });

  it('matches the Gregorian weekday for a wide window', () => {
    const window = iterateAfghanDates({ year: 1400, month: 1, day: 1 }, 1000);
    window.forEach((date) => {
      const gregorian = toGregorian(date);
      const jsWeekday = new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day)).getUTCDay();
      const expected = (jsWeekday + 1) % 7;
      expect(getAfghanWeekday(date)).toBe(expected);
    });
  });
});
