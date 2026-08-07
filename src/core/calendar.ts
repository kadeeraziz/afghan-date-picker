import type { AfghanDate, GregorianDate, MonthGridCell } from './types.js';

/** Julian day number for Afghan 1-01-01 in the supported arithmetic model. */
export const AFGHAN_EPOCH_JDN = 1_948_321;
export const MIN_AFGHAN_YEAR = 1;
export const MAX_AFGHAN_YEAR = 3000;

// Borkowski's break-point algorithm is used by established Solar Hijri
// implementations, including jalaali-js. It agrees with the modern Afghan
// conformance dates while keeping the historical range internally consistent.
const BORKOWSKI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
  1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
] as const;
const BORKOWSKI_MIN_YEAR = BORKOWSKI_BREAKS[0];
const BORKOWSKI_MAX_YEAR = BORKOWSKI_BREAKS[BORKOWSKI_BREAKS.length - 1] - 1;

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be an integer.`);
  }
}

function integerDivide(value: number, divisor: number): number {
  return Math.trunc(value / divisor);
}

function borkowskiModulo(value: number, divisor: number): number {
  return value - integerDivide(value, divisor) * divisor;
}

interface SolarYearCalculation {
  leap: number;
  year: number;
  march: number;
}

function assertBorkowskiYear(year: number): void {
  if (!Number.isFinite(year) || year < BORKOWSKI_MIN_YEAR || year > BORKOWSKI_MAX_YEAR) {
    throw new RangeError(`Solar Hijri conversion requires a year between ${BORKOWSKI_MIN_YEAR} and ${BORKOWSKI_MAX_YEAR}.`);
  }
}

function solarYearCalculation(year: number): SolarYearCalculation {
  assertBorkowskiYear(year);
  let leapYears = -14;
  let previousBreak: number = BORKOWSKI_BREAKS[0];
  let jump = 0;

  for (let index = 1; index < BORKOWSKI_BREAKS.length; index += 1) {
    const currentBreak = BORKOWSKI_BREAKS[index];
    jump = currentBreak - previousBreak;
    if (year < currentBreak) break;
    leapYears += integerDivide(jump, 33) * 8 + integerDivide(borkowskiModulo(jump, 33), 4);
    previousBreak = currentBreak;
  }

  const yearOffset = year - previousBreak;
  leapYears += integerDivide(yearOffset, 33) * 8 + integerDivide(borkowskiModulo(yearOffset, 33) + 3, 4);
  if (borkowskiModulo(jump, 33) === 4 && jump - yearOffset === 4) leapYears += 1;

  const gregorianYear = year + 621;
  const gregorianLeapYears = integerDivide(gregorianYear, 4) -
    integerDivide((integerDivide(gregorianYear, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapYears - gregorianLeapYears;
  const leap = borkowskiModulo(borkowskiModulo(yearOffset + 1, 33) - 1, 4) === -1
    ? 4
    : borkowskiModulo(borkowskiModulo(yearOffset + 1, 33) - 1, 4);

  return { leap, year: gregorianYear, march };
}

export function isAfghanLeapYear(year: number): boolean {
  assertInteger(year, 'Year');
  if (year < MIN_AFGHAN_YEAR || year > MAX_AFGHAN_YEAR) {
    throw new RangeError(`Afghan year must be between ${MIN_AFGHAN_YEAR} and ${MAX_AFGHAN_YEAR}.`);
  }

  return solarYearCalculation(year).leap === 0;
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

function daysBeforeAfghanMonth(month: number): number {
  if (month <= 1) return 0;
  if (month <= 7) return (month - 1) * 31;
  return 186 + (month - 7) * 30;
}

function afghanDateToDayNumber(date: AfghanDate): number {
  validateAfghanDate(date);
  const solarYear = solarYearCalculation(date.year);
  return gregorianToJdn({ year: solarYear.year, month: 3, day: solarYear.march }) +
    daysBeforeAfghanMonth(date.month) + date.day - 1;
}

function dayNumberToAfghanDate(dayNumber: number): AfghanDate {
  const gregorian = jdnToGregorian(dayNumber);
  let year = gregorian.year - 621;
  assertBorkowskiYear(year);
  let solarYear = solarYearCalculation(year);
  let firstDayOfYear = gregorianToJdn({ year: solarYear.year, month: 3, day: solarYear.march });

  if (dayNumber < firstDayOfYear) {
    year -= 1;
    assertBorkowskiYear(year);
    solarYear = solarYearCalculation(year);
    firstDayOfYear = gregorianToJdn({ year: solarYear.year, month: 3, day: solarYear.march });
  }

  if (year < MIN_AFGHAN_YEAR || year > MAX_AFGHAN_YEAR) {
    throw new RangeError(`Afghan date conversion supports years ${MIN_AFGHAN_YEAR} through ${MAX_AFGHAN_YEAR}.`);
  }

  const daysSinceYearStart = dayNumber - firstDayOfYear;
  const month = daysSinceYearStart <= 185
    ? Math.floor(daysSinceYearStart / 31) + 1
    : Math.floor((daysSinceYearStart - 186) / 30) + 7;
  return {
    year,
    month,
    day: daysSinceYearStart - daysBeforeAfghanMonth(month) + 1
  };
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
