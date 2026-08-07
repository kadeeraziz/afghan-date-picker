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
    expect(picker.element.getAttribute('aria-modal')).toBe('true');
    expect(picker.element.dir).toBe('rtl');
    expect(picker.element.querySelector('[role="grid"]')).not.toBeNull();
    expect(picker.element.querySelectorAll('[role="columnheader"]')[0].textContent).toBe('ش');

    const changes: unknown[] = [];
    input.addEventListener('afghan-date-change', (event) => changes.push((event as CustomEvent).detail));
    picker.open();
    const day = picker.element.querySelector<HTMLButtonElement>('[data-date="1403-01-01"]');
    expect(day).not.toBeNull();
    expect(day!.getAttribute('aria-label')).toBe('۱۴۰۳/۰۱/۰۱');
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
    target.value = '1990-06-15';
    createAfghanDatePicker(input);
    input.value = '۱۴۰۳/۱۳/۰۱';
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(target.value).toBe('1990-06-15');
  });

  it('loads a historical Gregorian target into the visible Afghan input', () => {
    const { input, target } = setup();
    target.value = '1990-06-15';
    const picker = createAfghanDatePicker(input);

    expect(input.value).toBe('۱۳۶۹/۰۳/۲۵');
    expect(picker.getDate()).toEqual({ year: 1369, month: 3, day: 25 });
  });

  it('does not fall back to today for an unsupported Gregorian target', () => {
    const { input, target } = setup();
    target.value = '0001-01-01';

    expect(() => createAfghanDatePicker(input)).toThrow(RangeError);
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
    expect(picker.element.querySelector<HTMLButtonElement>('[data-date="1403-01-04"]')?.tabIndex).toBe(-1);
    expect(picker.element.querySelector('[data-date="1403-01-05"]')).toHaveProperty('disabled', false);
  });

  it('supports data-attribute activation', () => {
    const { input } = setup();
    const pickers = startWatch(document, { locale: 'attr' });
    expect(pickers).toHaveLength(1);
    expect(input.getAttribute('aria-controls')).toMatch(/^afghan-date-picker-/);
    pickers[0].destroy();
  });

  it('navigates days with RTL visual arrows and commits with Enter', () => {
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
    expect(focused().dataset.date).toBe('1403-01-02');

    focused().focus();
    press('ArrowRight');
    expect(focused().dataset.date).toBe('1403-01-01');

    focused().focus();
    press('Enter');
    expect(input.value).toBe('۱۴۰۳/۰۱/۰۱');
    expect(target.value).toBe('2024-03-20');
  });

  it('keeps focus while handling Home, End, PageUp, PageDown, and Space', () => {
    const { input, target } = setup();
    const picker = createAfghanDatePicker(input, {
      closeOnSelect: false,
      initialDate: { year: 1403, month: 1, day: 15 }
    });
    picker.open();
    const focused = () => picker.element.querySelector<HTMLButtonElement>('.afghan-date-picker__day[tabindex="0"]')!;
    const press = (key: string, shiftKey = false) => {
      const button = document.activeElement instanceof HTMLButtonElement ? document.activeElement : focused();
      button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, shiftKey }));
      expect(document.activeElement).toBe(focused());
    };

    focused().focus();
    press('Home');
    const homeIndex = [...picker.element.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day')].indexOf(focused());
    expect(homeIndex % 7).toBe(0);

    press('End');
    const endIndex = [...picker.element.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day')].indexOf(focused());
    expect(endIndex % 7).toBe(6);

    press('PageUp');
    expect(picker.element.querySelector('.afghan-date-picker__title')?.textContent).toBe('حوت ۱۴۰۲');
    press('PageDown');
    expect(picker.element.querySelector('.afghan-date-picker__title')?.textContent).toBe('حمل ۱۴۰۳');
    press('PageDown', true);
    expect(picker.element.querySelector('.afghan-date-picker__title')?.textContent).toBe('حمل ۱۴۰۴');
    press('PageUp', true);
    expect(picker.element.querySelector('.afghan-date-picker__title')?.textContent).toBe('حمل ۱۴۰۳');

    const day = picker.element.querySelector<HTMLButtonElement>('[data-date="1403-01-02"]')!;
    day.focus();
    press(' ');
    expect(input.value).toBe('۱۴۰۳/۰۱/۰۲');
    expect(target.value).toBe('2024-03-21');
  });

  it('closes on Escape from the grid and restores focus to the input', () => {
    const { input, target } = setup();
    const picker = createAfghanDatePicker(input, { initialDate: { year: 1403, month: 1, day: 1 } });
    input.focus();
    const focusedDay = picker.element.querySelector<HTMLButtonElement>('.afghan-date-picker__day[tabindex="0"]')!;
    focusedDay.focus();

    focusedDay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

    expect(picker.element.hidden).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('uses Kabul time by default with a deterministic clock', () => {
    const { input, target } = setup();
    let now = new Date('2024-03-20T19:29:59.000Z');
    const picker = createAfghanDatePicker(input, {
      initialDate: { year: 1403, month: 1, day: 1 },
      now: () => now
    });

    picker.open();
    expect(picker.element.querySelector('[data-date="1403-01-01"]')?.getAttribute('aria-current')).toBe('date');
    expect(picker.element.querySelector('[data-date="1403-01-02"]')?.getAttribute('aria-current')).toBeNull();

    now = new Date('2024-03-20T19:30:00.000Z');
    picker.close();
    picker.open();
    expect(picker.element.querySelector('[data-date="1403-01-02"]')?.getAttribute('aria-current')).toBe('date');
    picker.element.querySelector<HTMLButtonElement>('.afghan-date-picker__action')!.click();
    expect(target.value).toBe('2024-03-21');

    picker.destroy();
  });

  it('allows the host application to override the today timezone', () => {
    const { input } = setup();
    const picker = createAfghanDatePicker(input, {
      initialDate: { year: 1403, month: 1, day: 1 },
      now: () => new Date('2024-03-20T19:30:00.000Z'),
      timeZone: 'UTC'
    });

    picker.open();
    expect(picker.element.querySelector('[data-date="1403-01-01"]')?.getAttribute('aria-current')).toBe('date');
    expect(picker.element.querySelector('[data-date="1403-01-02"]')?.getAttribute('aria-current')).toBeNull();
    picker.destroy();
  });

  it('keeps the popup inside a small viewport', () => {
    const { input } = setup();
    const picker = createAfghanDatePicker(input, { initialDate: { year: 1403, month: 1, day: 1 } });
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 400 });
    Object.defineProperty(input, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ bottom: 380, left: 300, right: 320, top: 360 } as DOMRect)
    });
    let popupRect = { height: 500, width: 304 };
    Object.defineProperty(picker.element, 'getBoundingClientRect', {
      configurable: true,
      value: () => popupRect as DOMRect
    });

    picker.open();

    expect(picker.element.style.left).toBe('8px');
    expect(picker.element.style.top).toBe('8px');

    popupRect = { height: 200, width: 100 };
    Object.defineProperty(input, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ bottom: 40, left: 100, right: 120, top: 20 } as DOMRect)
    });
    window.dispatchEvent(new Event('resize'));
    expect(picker.element.style.left).toBe('100px');
    expect(picker.element.style.top).toBe('48px');

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight });
    picker.destroy();
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
