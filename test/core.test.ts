import { describe, expect, it } from 'vitest';
import {
  addAfghanDays,
  formatAfghanDate,
  formatGregorianISO,
  fromGregorian,
  getAfghanWeekday,
  getDaysInAfghanMonth,
  getMonthGrid,
  isAfghanLeapYear,
  parseAfghanDate,
  toGregorian,
  validateAfghanDate
} from '../src/index.js';

// The expected values below were generated independently with jalaali-js 2.0.0,
// which implements Borkowski's published Solar Hijri conversion algorithm:
// https://github.com/jalaali/jalaali-js
describe('Afghan Solar Hijri core', () => {
  it('converts the modern New Year anchor', () => {
    expect(formatGregorianISO(toGregorian({ year: 1403, month: 1, day: 1 }))).toBe('2024-03-20');
    expect(fromGregorian({ year: 2024, month: 3, day: 20 })).toEqual({ year: 1403, month: 1, day: 1 });
  });

  it('handles the 1403 leap-year boundary', () => {
    expect(isAfghanLeapYear(1403)).toBe(true);
    expect(toGregorian({ year: 1403, month: 12, day: 30 })).toEqual({ year: 2025, month: 3, day: 20 });
    expect(fromGregorian({ year: 2025, month: 3, day: 20 })).toEqual({ year: 1403, month: 12, day: 30 });
    expect(toGregorian({ year: 1404, month: 1, day: 1 })).toEqual({ year: 2025, month: 3, day: 21 });
  });

  it('matches established Solar Hijri reference vectors before and after 2024', () => {
    const gregorianVectors = [
      [{ year: 1900, month: 1, day: 1 }, { year: 1278, month: 10, day: 11 }],
      [{ year: 1900, month: 6, day: 15 }, { year: 1279, month: 3, day: 25 }],
      [{ year: 1950, month: 2, day: 28 }, { year: 1328, month: 12, day: 9 }],
      [{ year: 2000, month: 2, day: 29 }, { year: 1378, month: 12, day: 10 }],
      [{ year: 2024, month: 9, day: 21 }, { year: 1403, month: 6, day: 31 }],
      [{ year: 2024, month: 9, day: 22 }, { year: 1403, month: 7, day: 1 }],
      [{ year: 2021, month: 3, day: 20 }, { year: 1399, month: 12, day: 30 }],
      [{ year: 2022, month: 3, day: 20 }, { year: 1400, month: 12, day: 29 }],
      [{ year: 2024, month: 3, day: 19 }, { year: 1402, month: 12, day: 29 }]
    ] as const;

    gregorianVectors.forEach(([gregorian, afghan]) => {
      expect(fromGregorian(gregorian)).toEqual(afghan);
      expect(toGregorian(afghan)).toEqual(gregorian);
    });
  });

  it('covers the Afghan leap day and year boundaries', () => {
    const vectors = [
      [{ year: 1399, month: 12, day: 30 }, { year: 2021, month: 3, day: 20 }],
      [{ year: 1400, month: 1, day: 1 }, { year: 2021, month: 3, day: 21 }],
      [{ year: 1402, month: 12, day: 29 }, { year: 2024, month: 3, day: 19 }],
      [{ year: 1403, month: 1, day: 1 }, { year: 2024, month: 3, day: 20 }],
      [{ year: 1403, month: 12, day: 30 }, { year: 2025, month: 3, day: 20 }],
      [{ year: 1404, month: 1, day: 1 }, { year: 2025, month: 3, day: 21 }]
    ] as const;

    vectors.forEach(([afghan, gregorian]) => {
      expect(toGregorian(afghan)).toEqual(gregorian);
      expect(fromGregorian(gregorian)).toEqual(afghan);
    });
  });

  it('matches the modern leap-year positions', () => {
    [1403, 1408, 1412].forEach((year) => expect(isAfghanLeapYear(year)).toBe(true));
    [1404, 1405, 1406, 1407].forEach((year) => expect(isAfghanLeapYear(year)).toBe(false));
  });

  it('round trips dates around month and year boundaries', () => {
    const dates = [
      { year: 1402, month: 12, day: 29 },
      { year: 1403, month: 1, day: 1 },
      { year: 1403, month: 6, day: 31 },
      { year: 1403, month: 7, day: 1 },
      { year: 1403, month: 12, day: 30 },
      { year: 1404, month: 1, day: 1 }
    ];

    dates.forEach((date) => expect(fromGregorian(toGregorian(date))).toEqual(date));
  });

  it('uses Saturday as weekday zero', () => {
    expect(getAfghanWeekday({ year: 1403, month: 1, day: 1 })).toBe(4);
    expect(getAfghanWeekday({ year: 1403, month: 1, day: 5 })).toBe(1);
  });

  it('parses Persian digits and formats them by default', () => {
    const date = parseAfghanDate('۱۴۰۳/۰۱/۰۱');
    expect(date).toEqual({ year: 1403, month: 1, day: 1 });
    expect(formatAfghanDate(date)).toBe('۱۴۰۳/۰۱/۰۱');
    expect(formatAfghanDate(date, { numerals: 'latin', separator: '-' })).toBe('1403-01-01');
  });

  it('rejects invalid month and day values', () => {
    expect(() => validateAfghanDate({ year: 1403, month: 13, day: 1 })).toThrow();
    expect(() => validateAfghanDate({ year: 1403, month: 7, day: 31 })).toThrow();
    expect(() => validateAfghanDate({ year: 1404, month: 12, day: 30 })).toThrow();
    expect(getDaysInAfghanMonth(1403, 12)).toBe(30);
    expect(getDaysInAfghanMonth(1404, 12)).toBe(29);
  });

  it('creates a Saturday-first six-week month grid', () => {
    const grid = getMonthGrid(1403, 1);
    expect(grid).toHaveLength(42);
    expect(grid[0].weekday).toBe(0);
    expect(grid.some((cell) => cell.inCurrentMonth && cell.date.day === 1)).toBe(true);
    expect(addAfghanDays({ year: 1403, month: 1, day: 1 }, -1)).toEqual({ year: 1402, month: 12, day: 29 });
  });
});
