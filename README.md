# Afghan Date Picker

An accessible, dependency-free Afghan Solar Hijri date picker for ordinary web
pages, Django forms, and htmx applications.

This project is inspired by the usability of
[JalaliDatePicker](https://github.com/majidh1/jalaliDatePicker), but it has an
independent implementation and API.

## Status

This is an early `0.1.0` release. The first version focuses on single-date
selection, Afghan locale data, typed input, and Gregorian form submission.

The calendar core currently uses a documented arithmetic civil model with a
common 33-year leap cycle. It is anchored by these modern conformance vectors:

| Afghan date | Gregorian date |
| --- | --- |
| `1402/12/29` | `2024-03-19` |
| `1403/01/01` | `2024-03-20` |
| `1403/12/30` | `2025-03-20` |
| `1404/01/01` | `2025-03-21` |

The astronomical and historical boundaries of Solar Hijri calendars need more
research before the calendar model should be treated as a stable `1.0` contract.

## Install

```bash
npm install afghan-date-picker
```

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
  formatAfghanDate,
  fromGregorian,
  isAfghanLeapYear,
  toGregorian
} from 'afghan-date-picker';

const date = fromGregorian({ year: 2024, month: 3, day: 20 });

formatAfghanDate(date); // ۱۴۰۳/۰۱/۰۱
toGregorian(date); // { year: 2024, month: 3, day: 20 }
isAfghanLeapYear(1403); // true
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
date such as `2024-03-20` to it.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

The project deliberately keeps the calendar core separate from DOM behavior.
Framework adapters, time selection, ranges, multiple dates, and a Python
package are not part of the first release.

## License

MIT
