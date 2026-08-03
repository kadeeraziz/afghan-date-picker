import { validateAfghanDate } from './calendar.js';
import { getLocale } from './locales.js';
import type { AfghanDate, Locale, NumeralSystem } from './types.js';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    return String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit));
  });
}

function formatNumber(value: number, length: number, numerals: NumeralSystem): string {
  const formatted = String(value).padStart(length, '0');
  return numerals === 'persian' ? toPersianDigits(formatted) : formatted;
}

export interface FormatOptions {
  locale?: Locale;
  numerals?: NumeralSystem;
  separator?: string;
}

export function formatAfghanDate(
  date: AfghanDate,
  { locale = 'dari', numerals = 'persian', separator = '/' }: FormatOptions = {}
): string {
  validateAfghanDate(date);
  return `${formatNumber(date.year, 4, numerals)}${separator}${formatNumber(date.month, 2, numerals)}${separator}${formatNumber(date.day, 2, numerals)}`;
}

export function formatMonthYear(
  date: Pick<AfghanDate, 'year' | 'month'>,
  { locale = 'dari', numerals = 'persian' }: Pick<FormatOptions, 'locale' | 'numerals'> = {}
): string {
  const localeData = getLocale(locale);
  const year = numerals === 'persian' ? toPersianDigits(date.year) : String(date.year);
  return `${localeData.months[date.month - 1]} ${year}`;
}

export function parseAfghanDate(value: string): AfghanDate {
  const normalized = toLatinDigits(value.trim());
  const match = /^(\d{1,4})\s*[\/-]\s*(\d{1,2})\s*[\/-]\s*(\d{1,2})$/.exec(normalized);
  if (!match) {
    throw new RangeError('Afghan date must use YYYY/MM/DD format.');
  }

  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  validateAfghanDate(date);
  return date;
}
