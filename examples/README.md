# Examples

Live examples for the Afghan Date Picker.

## plain-html

A single-file demo you can open after building the package:

```bash
npm run build
open examples/plain-html/index.html
```

The demo shows the Dari default, a Pashto picker with Latin numerals, a hidden
Gregorian target, and live `afghan-date-change` events.

## django-htmx

A Django template (`templates/appointments/appointment_form.html`) that posts a
normal Django `DateField` to an htmx endpoint. The visible picker input writes a
Gregorian ISO date (for example `2026-03-20`) into the hidden Django field.

Copy the template into your own project, point `data-afghan-target` at the id
Django renders for your `DateField` (commonly `#id_appointment_date`), and load
the picker plus `startWatch()` from your base template.