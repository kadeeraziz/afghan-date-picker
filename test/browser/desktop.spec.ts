import { expect } from '@playwright/test';
import { test } from './harness';

test.describe('Afghan date picker — desktop Chromium', () => {
  test('opens the picker from the input', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.open();

    const controls = await picker.input.getAttribute('aria-controls');
    await expect(picker.dialog).toBeVisible();
    await expect(picker.input).toHaveAttribute('aria-expanded', 'true');
    await expect(picker.dialog).toHaveAttribute('id', controls);
  });

  test('has RTL layout and dialog semantics', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.open();

    await expect(picker.dialog).toHaveAttribute('role', 'dialog');
    await expect(picker.dialog).toHaveAttribute('aria-modal', 'true');
    await expect(picker.dialog).toHaveAttribute('dir', 'rtl');
    await expect(picker.input).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(picker.grid).toHaveAttribute('role', 'grid');
  });

  test('shows Afghan month names and weekday labels', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.open();

    await expect(picker.title).toHaveText('حمل ۱۴۰۳');
    const weekdayLabels = await picker.weekdays.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')));
    expect(weekdayLabels).toEqual(['شنبه', 'یک شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']);
    await expect(picker.weekdays).toHaveCount(7);
  });

  test('selecting a date updates the visible Afghan input', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.open();

    await picker.day('1403-01-05').click();

    await expect(picker.input).toHaveValue('۱۴۰۳/۰۱/۰۵');
  });

  test('selecting a date updates the hidden ISO Gregorian input', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.open();

    await picker.day('1403-01-05').click();

    await expect(picker.input).toHaveValue('۱۴۰۳/۰۱/۰۵');
    await expect(picker.target).toHaveValue('2024-03-24');
  });

  test('invalid typed input does not overwrite the hidden value', async ({ picker }) => {
    await picker.mount({ targetValue: '1990-06-15' });
    await expect(picker.input).toHaveValue('۱۳۶۹/۰۳/۲۵');
    await expect(picker.target).toHaveValue('1990-06-15');

    await picker.input.fill('۱۴۰۳/۱۳/۰۱');
    await picker.input.blur();

    await expect(picker.input).toHaveAttribute('aria-invalid', 'true');
    await expect(picker.target).toHaveValue('1990-06-15');
  });

  test('Escape closes the picker and restores focus to the input', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.open();

    await expect(picker.dialog).toBeVisible();
    await picker.dialog.press('Escape');

    await expect(picker.dialog).toBeHidden();
    await expect(picker.input).toBeFocused();
    await expect(picker.input).toHaveAttribute('aria-expanded', 'false');
  });

  test('RTL ArrowRight and ArrowLeft move visually in the correct direction', async ({ picker }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 15 } });
    await picker.open();
    await picker.focusDay('1403-01-15');

    const beforeRight = await picker.focusedDayBox();
    await picker.page.keyboard.press('ArrowRight');
    const afterRight = await picker.focusedDayBox();
    expect(afterRight.x).toBeGreaterThan(beforeRight.x);

    const beforeLeft = await picker.focusedDayBox();
    await picker.page.keyboard.press('ArrowLeft');
    const afterLeft = await picker.focusedDayBox();
    expect(afterLeft.x).toBeLessThan(beforeLeft.x);
  });

  test('Home, End, PageUp, PageDown, Enter, and Space work', async ({ picker }) => {
    await picker.mount({
      initialDate: { year: 1403, month: 1, day: 15 },
      closeOnSelect: false
    });
    await picker.open();
    await picker.focusDay('1403-01-15');

    await picker.page.keyboard.press('Home');
    let focusedDay = await picker.page.evaluate(() => (document.activeElement as HTMLButtonElement).dataset.date);
    expect(await picker.dayIndex(focusedDay ?? '')).toBe(14);

    await picker.page.keyboard.press('End');
    focusedDay = await picker.page.evaluate(() => (document.activeElement as HTMLButtonElement).dataset.date);
    expect(await picker.dayIndex(focusedDay ?? '')).toBe(20);

    await picker.page.keyboard.press('PageUp');
    await expect(picker.title).toHaveText('حوت ۱۴۰۲');
    await picker.page.keyboard.press('PageDown');
    await expect(picker.title).toHaveText('حمل ۱۴۰۳');
    await picker.page.keyboard.press('Shift+PageDown');
    await expect(picker.title).toHaveText('حمل ۱۴۰۴');
    await picker.page.keyboard.press('Shift+PageUp');
    await expect(picker.title).toHaveText('حمل ۱۴۰۳');

    await picker.focusDay('1403-01-15');
    await picker.page.keyboard.press('Enter');
    await expect(picker.input).toHaveValue('۱۴۰۳/۰۱/۱۵');
    await expect(picker.target).toHaveValue('2024-04-03');

    await picker.focusDay('1403-01-02');
    await picker.page.keyboard.press(' ');
    await expect(picker.input).toHaveValue('۱۴۰۳/۰۱/۰۲');
    await expect(picker.target).toHaveValue('2024-03-21');
  });

  test('Today uses the configured Kabul timezone and deterministic clock', async ({ picker }) => {
    await picker.mount({
      initialDate: { year: 1403, month: 1, day: 1 },
      manualNow: '2024-03-20T19:29:59.000Z',
      now: '__manual'
    });
    await picker.open();
    await expect(picker.day('1403-01-01')).toHaveAttribute('aria-current', 'date');
    await expect(picker.day('1403-01-02')).not.toHaveAttribute('aria-current', 'date');

    await picker.close();
    await picker.setManualNow('2024-03-20T19:30:00.000Z');
    await picker.reopen();
    await expect(picker.day('1403-01-02')).toHaveAttribute('aria-current', 'date');
    await expect(picker.day('1403-01-01')).not.toHaveAttribute('aria-current', 'date');

    await picker.action('today').click();
    await expect(picker.target).toHaveValue('2024-03-21');
  });

  test('raises no console errors during a typical workflow', async ({ picker, consoleErrors }) => {
    await picker.mount({ initialDate: { year: 1403, month: 1, day: 1 } });
    await picker.open();
    await picker.day('1403-01-15').click();
    await picker.reopen();
    await picker.page.keyboard.press('ArrowRight');
    await picker.day('1403-01-10').click();
    await picker.reopen();
    await picker.action('clear').click();
    await picker.input.fill('1403/02/02');
    await picker.input.blur();

    expect(consoleErrors).toEqual([]);
  });
});