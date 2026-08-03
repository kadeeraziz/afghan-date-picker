export type Locale = 'dari' | 'pashto' | 'english';

export type NumeralSystem = 'latin' | 'persian';

export interface AfghanDate {
  year: number;
  month: number;
  day: number;
}

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export interface LocaleData {
  months: readonly string[];
  weekdays: readonly string[];
  previousMonth: string;
  nextMonth: string;
  today: string;
  clear: string;
  chooseDate: string;
  invalidDate: string;
}

export interface MonthGridCell {
  date: AfghanDate;
  inCurrentMonth: boolean;
  weekday: number;
}
