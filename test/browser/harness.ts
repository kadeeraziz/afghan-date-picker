import { test as base, expect, type Locator, type Page } from '@playwright/test';

export interface MountOptions {
  initialDate?: { year: number; month: number; day: number };
  locale?: string;
  numerals?: string;
  minDate?: string;
  maxDate?: string;
  timeZone?: string;
  now?: '__manual';
  closeOnSelect?: boolean;
  showTodayButton?: boolean;
  showClearButton?: boolean;
  targetValue?: string;
  manualNow?: string;
}

const APP = '#app';

export const test = base.extend<{
  consoleErrors: string[];
  picker: PickerHarness;
}>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    const onConsole = (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') errors.push(msg.text());
    };
    const onPageError = (error: Error) => errors.push(`pageerror: ${error.message}`);
    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    await use(errors);
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  },
  picker: async ({ page }, use) => {
    await page.goto('/test/browser/fixtures/picker.html');
    await use(new PickerHarness(page));
  }
});

export class PickerHarness {
  constructor(readonly page: Page) {}

  get input(): Locator {
    return this.page.locator('input[data-afghan-date-picker]');
  }

  get target(): Locator {
    return this.page.locator('input#gregorian-date');
  }

  get dialog(): Locator {
    return this.page.locator('[role="dialog"].afghan-date-picker');
  }

  get grid(): Locator {
    return this.page.locator('[role="grid"]');
  }

  get title(): Locator {
    return this.page.locator('.afghan-date-picker__title');
  }

  get weekdays(): Locator {
    return this.page.locator('[role="columnheader"]');
  }

  get days(): Locator {
    return this.dialog.locator('.afghan-date-picker__day');
  }

  day(date: string): Locator {
    return this.dialog.locator(`.afghan-date-picker__day[data-date="${date}"]`);
  }

  action(name: 'today' | 'clear'): Locator {
    const selector = name === 'today'
      ? '.afghan-date-picker__action:not(.afghan-date-picker__action--quiet)'
      : '.afghan-date-picker__action.afghan-date-picker__action--quiet';
    return this.dialog.locator(selector);
  }

  async setManualNow(value: string): Promise<void> {
    await this.page.evaluate((iso) => {
      window.__manualNow = iso;
    }, value);
  }

  async mount(options: MountOptions = {}): Promise<void> {
    const { manualNow, targetValue, ...pickerOptions } = options;
    if (manualNow) await this.setManualNow(manualNow);
    await this.page.evaluate(
      ({ appSelector, pickerOptions, targetValue }) => {
        const app = document.querySelector<HTMLElement>(appSelector)!;
        app.replaceChildren();

        const display = document.createElement('input');
        display.type = 'text';
        display.dataset.afghanDatePicker = '';
        display.dataset.afghanTarget = '#gregorian-date';
        display.id = 'display';
        display.setAttribute('aria-label', 'Appointment date');
        display.autocomplete = 'off';

        const target = document.createElement('input');
        target.type = 'hidden';
        target.id = 'gregorian-date';
        target.name = 'appointment_date';

        app.append(display, target);
        if (targetValue) target.value = targetValue;

        window.__pickers = [window.__createPicker(display, pickerOptions)];
      },
      { appSelector: APP, pickerOptions, targetValue }
    );
  }

  async placeInputNearBottomRight(): Promise<void> {
    await this.page.evaluate(() => {
      const input = document.getElementById('display')!;
      input.style.position = 'fixed';
      input.style.right = '4px';
      input.style.bottom = '4px';
      input.style.width = '160px';
    });
  }

  async open(): Promise<void> {
    await this.input.focus();
    await expect(this.dialog).toBeVisible();
    await this.waitForPopupSettled();
  }

  async close(): Promise<void> {
    await this.page.evaluate(() => {
      const pickers = window.__pickers as Array<{ close?: () => void }>;
      pickers[0]?.close?.();
    });
    await expect(this.dialog).toBeHidden();
  }

  async reopen(): Promise<void> {
    await this.page.evaluate(() => {
      const pickers = window.__pickers as Array<{ open?: () => void }>;
      pickers[0]?.open?.();
    });
    await expect(this.dialog).toBeVisible();
    await this.waitForPopupSettled();
  }

  async waitForPopupSettled(): Promise<void> {
    await this.dialog.waitForFunction((element) => {
      const animation = getComputedStyle(element).animationName;
      if (!animation || animation === 'none') return true;
      return getComputedStyle(element).transform === 'none';
    });
  }

  async focusDay(date: string): Promise<void> {
    await this.day(date).focus();
  }

  async focusedDayBox(): Promise<{ x: number; y: number; width: number; height: number }> {
    const box = await this.dialog.locator('.afghan-date-picker__day:focus').boundingBox();
    if (!box) throw new Error('No focused day button');
    return box;
  }

  async dayIndex(date: string): Promise<number> {
    return this.page.evaluate(
      ({ date: targetDate }) => {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"].afghan-date-picker')!;
        const all = [...dialog.querySelectorAll<HTMLButtonElement>('.afghan-date-picker__day')];
        return all.indexOf(all.find((day) => day.dataset.date === targetDate) as HTMLButtonElement);
      },
      { date }
    );
  }
}