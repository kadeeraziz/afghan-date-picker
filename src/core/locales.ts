import type { Locale, LocaleData } from './types.js';

export const LOCALES: Readonly<Record<Locale, LocaleData>> = {
  dari: {
    months: [
      'حمل',
      'ثور',
      'جوزا',
      'سرطان',
      'اسد',
      'سنبله',
      'میزان',
      'عقرب',
      'قوس',
      'جدی',
      'دلو',
      'حوت'
    ],
    weekdays: ['شنبه', 'یک شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
    previousMonth: 'ماه قبلی',
    nextMonth: 'ماه بعدی',
    today: 'امروز',
    clear: 'پاک کردن',
    chooseDate: 'انتخاب تاریخ',
    invalidDate: 'تاریخ واردشده معتبر نیست.'
  },
  pashto: {
    months: ['وری', 'غویی', 'غبرګولی', 'چنګاښ', 'زمری', 'وږی', 'تله', 'لړم', 'لیندۍ', 'مرغومی', 'سلواغه', 'کب'],
    weekdays: ['شنبه', 'یک شنبه', 'دوشنبه', 'سه‌شنبه', 'څلورشنبه', 'پینځشنبه', 'جمعه'],
    previousMonth: 'تیره میاشت',
    nextMonth: 'راتلونکې میاشت',
    today: 'نن',
    clear: 'پاکول',
    chooseDate: 'نېټه وټاکئ',
    invalidDate: 'داخل شوې نېټه سمه نه ده.'
  },
  english: {
    months: ['Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sonbola', 'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalwa', 'Hut'],
    weekdays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
    clear: 'Clear',
    chooseDate: 'Choose date',
    invalidDate: 'The entered date is not valid.'
  }
};

export function getLocale(locale: Locale = 'dari'): LocaleData {
  return LOCALES[locale];
}
