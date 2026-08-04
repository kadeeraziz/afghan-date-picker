import { afterEach, describe, expect, it } from 'vitest';
import { createAfghanDatePicker, startWatch } from '../src/index.js';

afterEach(() => {
  document.body.replaceChildren();
});

function setup() {
  const input = document.createElement('input');
  input.type = 'text';
  input.dataset.afghanDatePicker = '';
  input.dataset.afghanTarget = '#gregorian-date';
  const target = document.createElement('input');
  target.id = 'gregorian-date';
  target.name = 'appointment_date';
  target.type = 'hidden';
  document.body.append(input, target);
  return { input, target };
}

describe('Afghan date picker', () => {
  it('creates an accessible RTL picker and synchronizes an ISO target', () => {
    const { input, target } = setup();
    const picker = createAfghanDatePicker(input, { initialDate: { year: 1403, month: 1, day: 1 } });

    expect(picker.element.getAttribute('role')).toBe('dialog');
    expect(picker.element.dir).toBe('rtl');
    expect(picker.element.querySelector('[role="grid"]')).not.toBeNull();
    expect(picker.element.querySelectorAll('[role="columnheader"]')[0].textContent).toBe('ش');

    const changes: unknown[] = [];
    input.addEventListener('afghan-date-change', (event) => changes.push((event as CustomEvent).detail));
    picker.open();
    const day = picker.element.querySelector<HTMLButtonElement>('[data-date="1403-01-01"]');
    expect(day).not.toBeNull();
    day!.click();

    expect(input.value).toBe('۱۴۰۳/۰۱/۰۱');
    expect(target.value).toBe('2024-03-20');
    expect(changes).toEqual([{ afghanDate: { year: 1403, month: 1, day: 1 }, gregorianDate: '2024-03-20' }]);
    expect(picker.getDate()).toEqual({ year: 1403, month: 1, day: 1 });
  });

  it('accepts typed Persian-digit values', () => {
    const { input, target } = setup();
    createAfghanDatePicker(input);
    input.value = '۱۴۰۳/۰۱/۰۱';
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(target.value).toBe('2024-03-20');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('marks malformed typed values invalid without changing the target', () => {
    const { input, target } = setup();
    createAfghanDatePicker(input);
    input.value = '۱۴۰۳/۱۳/۰۱';
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(target.value).toBe('');
  });

  it('disables dates outside configured bounds', () => {
    const { input } = setup();
    const picker = createAfghanDatePicker(input, {
      initialDate: { year: 1403, month: 1, day: 1 },
      minDate: { year: 1403, month: 1, day: 5 },
      maxDate: { year: 1403, month: 1, day: 10 }
    });
    picker.open();

    expect(picker.element.querySelector('[data-date="1403-01-04"]')).toHaveProperty('disabled', true);
    expect(picker.element.querySelector('[data-date="1403-01-05"]')).toHaveProperty('disabled', false);
  });

  it('supports data-attribute activation', () => {
    const { input } = setup();
    const pickers = startWatch(document, { locale: 'attr' });
    expect(pickers).toHaveLength(1);
    expect(input.getAttribute('aria-controls')).toMatch(/^afghan-date-picker-/);
    pickers[0].destroy();
  });

  it('navigates days with the keyboard and commits with Enter', () => {
    const { input, target } = setup();
    const picker = createAfghanDatePicker(input, { initialDate: { year: 1403, month: 1, day: 1 } });
    picker.open();
    const focused = () => picker.element.querySelector<HTMLButtonElement>('.afghan-date-picker__day[tabindex="0"]')!;
    const press = (key: string) => {
      const button = document.activeElement instanceof HTMLButtonElement ? document.activeElement : focused();
      button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    };

    expect(focused().dataset.date).toBe('1403-01-01');
    focused().focus();
    press('ArrowLeft');
    expect(focused().dataset.date).toBe('1402-12-29');

    focused().focus();
    press('Enter');
    expect(input.value).toBe('۱۴۰۲/۱۲/۲۹');
    expect(target.value).toBe('2024-03-19');
  });

it('clears the value and dispatches afghan-date-clear', () => {
    const { input, target } = setup();
    createAfghanDatePicker(input, { initialDate: { year: 1403, month: 1, day: 1 } });
    const clears: unknown[] = [];
    input.addEventListener('afghan-date-clear', (event) => clears.push((event as CustomEvent).detail));

    input.value = '۱۴۰۳/۰۱/۰۱';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(target.value).toBe('2024-03-20');

    input.value = '';
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(input.value).toBe('');
    expect(target.value).toBe('');
    expect(clears.length).toBe(1);
  });

  it('supports the programmatic setDate, getDate, and clear API', () => {
    const { input, target } = setup();
    const picker = createAfghanDatePicker(input, { initialDate: { year: 1403, month: 1, day: 1 } });

    picker.setDate({ year: 1403, month: 2, day: 15 });
    expect(picker.getDate()).toEqual({ year: 1403, month: 2, day: 15 });
    expect(target.value).toBe('2024-05-04');

    picker.clear();
    expect(picker.getDate()).toBeUndefined();
    expect(input.value).toBe('');
    expect(target.value).toBe('');
  });

  it('submits a Gregorian ISO value into a named hidden field', () => {
    const { input, target } = setup();
    const form = document.createElement('form');
    form.name = 'appointment';
    document.body.append(form);
    form.append(input, target);

    createAfghanDatePicker(input, { initialDate: { year: 1403, month: 1, day: 1 } });
    input.value = '۱۴۰۳/۰۱/۰۱';
    input.dispatchEvent(new Event('change', { bubbles: true }));

    const data = new FormData(form);
    expect(data.get('appointment_date')).toBe('2024-03-20');
  });

  it('respects min and max dates from input data attributes', () => {
    const { input } = setup();
    input.dataset.afghanMinDate = '۱۴۰۳/۰۱/۰۵';
    input.dataset.afghanMaxDate = '۱۴۰۳/۰۱/۱۰';
    input.dataset.afghanInitialDate = '۱۴۰۳/۰۱/۰۱';
    const pickers = startWatch(document);
    const picker = pickers[0];
    picker.open();

    const days = [...picker.element.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day')];
    const beforeMin = days.find((day) => day.dataset.date === '1403-01-04');
    const firstAllowed = days.find((day) => day.dataset.date === '1403-01-05');
    expect(beforeMin).toHaveProperty('disabled', true);
    expect(firstAllowed).toHaveProperty('disabled', false);
    picker.destroy();
  });
});
