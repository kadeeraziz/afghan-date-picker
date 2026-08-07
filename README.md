# Afghan Date Picker

An accessible, dependency-free Afghan Solar Hijri date picker for ordinary web
pages, Django forms, and htmx applications.

## Afghan Locale Data

The calendar uses the Afghan month and weekday names in Dari, Pashto, and
English, so the picker reads naturally to Afghan users:

- **Dari months:** حمل، ثور، جوزا، سرطان، اسد، سنبله، میزان، عقرب، قوس، جدی، دلو، حوت
- **Pashto months:** وری، غویی، غبرګولی، چنګاښ، زمری، وږی، تله، لړم، لیندۍ، مرغومی، سلواغه، کب
- **Weekdays:** the week starts on Saturday (شنبه) and runs through Friday (جمعه) in both Dari and Pashto.

Display default is Dari, with Pashto and English available; see
[Locales And Options](#locales-and-options).

## Status

This is an early `0.1.0` release. The first version focuses on single-date
selection, Afghan locale data, typed input, and Gregorian form submission.

The calendar core currently uses a documented arithmetic civil model with a
published Solar Hijri break-point algorithm based on Kazimierz M. Borkowski's
work. Afghan locale names remain separate from the conversion arithmetic. The
implementation supports Afghan years `1` through `3000`, corresponding to
Gregorian dates from `0622-03-22` through `3622-03-19`. The modern conversion
range from 1900 through 2100 has been checked against the established
[jalaali-js reference implementation](https://github.com/jalaali/jalaali-js),
which uses the same Borkowski algorithm.

These are the conformance vectors used by the package:

| Afghan date | Gregorian date |
| --- | --- |
| `1399/12/30` | `2021-03-20` |
| `1400/01/01` | `2021-03-21` |
| `1402/12/29` | `2024-03-19` |
| `1403/01/01` | `2024-03-20` |
| `1403/12/30` | `2025-03-20` |
| `1404/01/01` | `2025-03-21` |

The astronomical and historical boundaries of Solar Hijri calendars need more
research before the calendar model should be treated as a stable `1.0` contract.

The suite runs 45 tests covering historical and modern conversion vectors,
round trips, Afghan range endpoints, leap days, month-boundary arithmetic,
locale names, weekday consistency against the Gregorian calendar, keyboard
navigation including RTL arrows and paging, Kabul midnight behavior, popup
positioning, clear behavior, min/max bounds, and form submission.

## Install

```bash
npm install afghan-date-picker
```

Git-based installation is also supported while the package is under active
development:

```bash
npm install https://github.com/kadeeraziz/afghan-date-picker.git
```

The Git install runs the package `prepare` script to compile `dist`. Published
npm packages include the compiled `dist` directory, styles, declarations,
README, and license, so consumers do not need to build the package themselves.

Import the picker and its default styles:

```ts
import { startWatch } from 'afghan-date-picker';
import 'afghan-date-picker/styles.css';

startWatch();
```

## HTML Input

The visible input displays an Afghan date. A target hidden input receives a
Gregorian ISO date suitable for a Django `DateField`.

```html
<label for="appointment-date-display">Appointment date</label>
<input
  id="appointment-date-display"
  name="appointment_date_display"
  data-afghan-date-picker
  data-afghan-target="#appointment-date"
  autocomplete="off"
>
<input id="appointment-date" name="appointment_date" type="hidden">
```

```ts
import { startWatch } from 'afghan-date-picker';

startWatch();
```

By default, the display uses Dari labels, Persian digits, right-to-left layout,
and Saturday as the first day of the week. The user can also type values such as
`۱۴۰۳/۰۱/۰۱` or `1403/01/01`.

## Locales And Options

```html
<input
  data-afghan-date-picker
  data-afghan-locale="pashto"
  data-afghan-numerals="latin"
  data-afghan-min-date="۱۴۰۵/۰۱/۰۱"
  data-afghan-max-date="۱۴۰۵/۱۲/۲۹"
>
```

The core also exposes locale and calendar functions:

```ts
import {
  addAfghanDays,
  addAfghanMonths,
  addAfghanYears,
  formatAfghanDate,
  fromGregorian,
  isAfghanLeapYear,
  toGregorian
} from 'afghan-date-picker';

const date = fromGregorian({ year: 2024, month: 3, day: 20 });

formatAfghanDate(date); // ۱۴۰۳/۰۱/۰۱
toGregorian(date); // { year: 2024, month: 3, day: 20 }
isAfghanLeapYear(1403); // true
addAfghanDays(date, 30); // { year: 1403, month: 1, day: 31 }
addAfghanMonths(date, 12); // { year: 1404, month: 1, day: 1 }
addAfghanYears(date, 1); // { year: 1404, month: 1, day: 1 }
```

The picker uses `Asia/Kabul` when highlighting or selecting today, rather than
the browser's local timezone. Applications can provide another IANA timezone
and a deterministic clock for tests:

```ts
createAfghanDatePicker(input, {
  timeZone: 'Asia/Kabul',
  now: () => new Date('2024-03-20T19:30:00.000Z')
});
```

## Events

The enhanced input dispatches `afghan-date-change` with both values:

```ts
input.addEventListener('afghan-date-change', (event) => {
  const { afghanDate, gregorianDate } = event.detail;
  console.log(afghanDate); // { year: 1403, month: 1, day: 1 }
  console.log(gregorianDate); // 2024-03-20
});
```

It also dispatches `afghan-date-clear` and `afghan-date-invalid`.

## Django And htmx

Use a normal Django `DateField` for the hidden ISO input. The date picker does
not send dates to the server by itself, so it works with ordinary form submits
and htmx requests:

```html
<form method="post" hx-post="{% url 'appointments:create' %}" hx-target="#appointment-form">
  {% csrf_token %}
  <input data-afghan-date-picker data-afghan-target="#id_appointment_date">
  {{ form.appointment_date }}
  <button type="submit">Save</button>
</form>
```

The target input should be the rendered Django field, and the picker writes a
date such as `2024-03-20` to it. Existing valid Gregorian values, including
historical values such as `1990-06-15`, are loaded into the visible Afghan input
when the picker starts. Invalid typed values do not overwrite the target.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

The project deliberately keeps the calendar core separate from DOM behavior.
Framework adapters, time selection, ranges, multiple dates, and a Python
package are not part of the first release.

## License

MIT
