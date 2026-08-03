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
});
