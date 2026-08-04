import type { AfghanDate, GregorianDate, MonthGridCell } from './types.js';

/**
 * Julian day number for 1403-01-01's arithmetic epoch.
 *
 * The modern civil model used here maps 1403-01-01 to 2024-03-20 and follows
 * the common 33-year Afghan Solar Hijri cycle for the supported modern range.
 */
export const AFGHAN_EPOCH_JDN = 1_948_320;
export const MIN_AFGHAN_YEAR = 1;
export const MAX_AFGHAN_YEAR = 3000;

const LEAP_YEARS_IN_CYCLE = [1, 5, 9, 13, 17, 22, 26, 30] as const;

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be an integer.`);
  }
}

export function isAfghanLeapYear(year: number): boolean {
  assertInteger(year, 'Year');
  if (year < MIN_AFGHAN_YEAR || year > MAX_AFGHAN_YEAR) {
    throw new RangeError(`Afghan year must be between ${MIN_AFGHAN_YEAR} and ${MAX_AFGHAN_YEAR}.`);
  }

  const yearInCycle = ((year - 1) % 33) + 1;
  return LEAP_YEARS_IN_CYCLE.includes(yearInCycle as (typeof LEAP_YEARS_IN_CYCLE)[number]);
}

export function getDaysInAfghanMonth(year: number, month: number): number {
  assertInteger(year, 'Year');
  assertInteger(month, 'Month');
  if (year < MIN_AFGHAN_YEAR || year > MAX_AFGHAN_YEAR) {
    throw new RangeError(`Afghan year must be between ${MIN_AFGHAN_YEAR} and ${MAX_AFGHAN_YEAR}.`);
  }
  if (month < 1 || month > 12) {
    throw new RangeError('Afghan month must be between 1 and 12.');
  }
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isAfghanLeapYear(year) ? 30 : 29;
}

export function validateAfghanDate(date: AfghanDate): void {
  assertInteger(date.year, 'Year');
  assertInteger(date.month, 'Month');
  assertInteger(date.day, 'Day');
  const daysInMonth = getDaysInAfghanMonth(date.year, date.month);
  if (date.day < 1 || date.day > daysInMonth) {
    throw new RangeError(`Afghan day must be between 1 and ${daysInMonth} for this month.`);
  }
}

function isGregorianLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInGregorianMonth(year: number, month: number): number {
  if (month === 2) return isGregorianLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function validateGregorianDate(date: GregorianDate): void {
  assertInteger(date.year, 'Year');
  assertInteger(date.month, 'Month');
  assertInteger(date.day, 'Day');
  if (date.year < 1 || date.year > 9999) {
    throw new RangeError('Gregorian year must be between 1 and 9999.');
  }
  if (date.month < 1 || date.month > 12) {
    throw new RangeError('Gregorian month must be between 1 and 12.');
  }
  const daysInMonth = getDaysInGregorianMonth(date.year, date.month);
  if (date.day < 1 || date.day > daysInMonth) {
    throw new RangeError(`Gregorian day must be between 1 and ${daysInMonth} for this month.`);
  }
}

function gregorianToJdn(date: GregorianDate): number {
  const a = Math.floor((14 - date.month) / 12);
  const year = date.year + 4800 - a;
  const month = date.month + 12 * a - 3;
  return date.day +
    Math.floor((153 * month + 2) / 5) +
    365 * year +
    Math.floor(year / 4) -
    Math.floor(year / 100) +
    Math.floor(year / 400) -
    32045;
}

function jdnToGregorian(jdn: number): GregorianDate {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const monthIndex = Math.floor((5 * e + 2) / 153);
  return {
    year: 100 * b + d - 4800 + Math.floor(monthIndex / 10),
    month: monthIndex + 3 - 12 * Math.floor(monthIndex / 10),
    day: e - Math.floor((153 * monthIndex + 2) / 5) + 1
  };
}

function daysBeforeAfghanYear(year: number): number {
  const completedYears = year - 1;
  const cycles = Math.floor(completedYears / 33);
  const remainder = completedYears % 33;
  const leapDays = LEAP_YEARS_IN_CYCLE.filter((leapYear) => leapYear <= remainder).length;
  return completedYears * 365 + cycles * LEAP_YEARS_IN_CYCLE.length + leapDays;
}

function daysBeforeAfghanMonth(year: number, month: number): number {
  if (month <= 1) return 0;
  if (month <= 7) return (month - 1) * 31;
  return 186 + (month - 7) * 30;
}

function afghanDateToDayNumber(date: AfghanDate): number {
  return AFGHAN_EPOCH_JDN + daysBeforeAfghanYear(date.year) + daysBeforeAfghanMonth(date.year, date.month) + date.day - 1;
}

function dayNumberToAfghanDate(dayNumber: number): AfghanDate {
  const daysSinceEpoch = dayNumber - AFGHAN_EPOCH_JDN;
  if (daysSinceEpoch < 0) {
    throw new RangeError('Date is before the supported Afghan calendar epoch.');
  }

  const daysPerCycle = 33 * 365 + LEAP_YEARS_IN_CYCLE.length;
  const cycles = Math.floor(daysSinceEpoch / daysPerCycle);
  let remaining = daysSinceEpoch - cycles * daysPerCycle;
  let year = cycles * 33 + 1;

  while (remaining >= getDaysInAfghanYear(year)) {
    remaining -= getDaysInAfghanYear(year);
    year += 1;
  }

  if (year > MAX_AFGHAN_YEAR) {
    throw new RangeError(`Afghan year must be between ${MIN_AFGHAN_YEAR} and ${MAX_AFGHAN_YEAR}.`);
  }

  const month = remaining < 186
    ? Math.floor(remaining / 31) + 1
    : Math.floor((remaining - 186) / 30) + 7;
  const firstDayOfMonth = daysBeforeAfghanMonth(year, month);
  return { year, month, day: remaining - firstDayOfMonth + 1 };
}

function getDaysInAfghanYear(year: number): number {
  return isAfghanLeapYear(year) ? 366 : 365;
}

export function fromGregorian(date: GregorianDate): AfghanDate {
  validateGregorianDate(date);
  return dayNumberToAfghanDate(gregorianToJdn(date));
}

export function toGregorian(date: AfghanDate): GregorianDate {
  validateAfghanDate(date);
  return jdnToGregorian(afghanDateToDayNumber(date));
}

export function parseGregorianISO(value: string): GregorianDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new RangeError('Gregorian date must use YYYY-MM-DD format.');
  }
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  validateGregorianDate(date);
  return date;
}

export function formatGregorianISO(date: GregorianDate): string {
  validateGregorianDate(date);
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function compareAfghanDates(left: AfghanDate, right: AfghanDate): number {
  return afghanDateToDayNumber(left) - afghanDateToDayNumber(right);
}

export function addAfghanDays(date: AfghanDate, days: number): AfghanDate {
  validateAfghanDate(date);
  assertInteger(days, 'Days');
  return dayNumberToAfghanDate(afghanDateToDayNumber(date) + days);
}

/** Returns 0 for Saturday through 6 for Friday. */
export function getAfghanWeekday(date: AfghanDate): number {
  validateAfghanDate(date);
  return ((afghanDateToDayNumber(date) + 2) % 7 + 7) % 7;
}

export function addAfghanMonths(date: AfghanDate, months: number): AfghanDate {
  validateAfghanDate(date);
  assertInteger(months, 'Months');
  const absoluteMonth = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(absoluteMonth / 12);
  const month = (absoluteMonth % 12) + 1;
  const daysInTargetMonth = getDaysInAfghanMonth(year, month);
  return { year, month, day: Math.min(date.day, daysInTargetMonth) };
}

export function addAfghanYears(date: AfghanDate, years: number): AfghanDate {
  validateAfghanDate(date);
  if (!Number.isInteger(years)) {
    throw new RangeError('Years must be an integer.');
  }
  return addAfghanMonths(date, years * 12);
}

export function getMonthGrid(year: number, month: number): MonthGridCell[] {
  const first = { year, month, day: 1 };
  validateAfghanDate(first);
  const firstWeekday = getAfghanWeekday(first);
  const gridStart = addAfghanDays(first, -firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addAfghanDays(gridStart, index);
    return {
      date,
      inCurrentMonth: date.month === month,
      weekday: index % 7
    };
  });
}

export function isAfghanDateInRange(date: AfghanDate, minDate?: AfghanDate, maxDate?: AfghanDate): boolean {
  validateAfghanDate(date);
  if (minDate && compareAfghanDates(date, minDate) < 0) return false;
  if (maxDate && compareAfghanDates(date, maxDate) > 0) return false;
  return true;
}
